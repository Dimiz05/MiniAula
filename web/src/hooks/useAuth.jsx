import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchCurrentUser,
  loginRequest,
  registerRequest,
  updateCurrentUser,
} from '../services/auth.service.js';
import { clearSession, readSession, writeSession } from '../services/session.js';
import {
  setAccessToken,
  setUnauthorizedHandler,
} from '../config/http.js';

const AuthContext = createContext(null);

const EXPIRED_SESSION_MESSAGE =
  'Inicia sesión nuevamente para continuar donde lo dejaste.';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = readSession();
    setAccessToken(stored?.token ?? null);
    return stored;
  });
  const [notice, setNotice] = useState(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const clear = useCallback((message = null) => {
    clearSession();
    setAccessToken(null);
    setSession(null);
    setNotice(message);
  }, []);

  const startSession = useCallback(({ token, usuario }) => {
    const next = { token, usuario };
    writeSession(next);
    setAccessToken(token);
    setSession(next);
    setNotice(null);
    return usuario;
  }, []);

  useEffect(() => {
    setAccessToken(session?.token ?? null);
  }, [session?.token]);

  useEffect(() => {
    setUnauthorizedHandler((token) => {
      if (sessionRef.current?.token === token) {
        clear(EXPIRED_SESSION_MESSAGE);
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [clear]);

  useEffect(() => {
    const stored = sessionRef.current;
    if (!stored?.token) {
      return undefined;
    }

    let active = true;

    fetchCurrentUser()
      .then((data) => {
        if (
          !active
          || !data?.usuario
          || sessionRef.current?.token !== stored.token
        ) {
          return;
        }

        const next = { token: stored.token, usuario: data.usuario };
        writeSession(next);
        setSession((current) => (
          current ? { ...current, usuario: data.usuario } : current
        ));
      })
      .catch(() => {
        // A 401 already clears the session through the HTTP client.
        // A network failure keeps the cached session so a reload still works offline.
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await loginRequest(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (registration) => startSession(await registerRequest(registration)),
    [startSession],
  );

  const logout = useCallback(() => clear(null), [clear]);

  const updateProfile = useCallback(async (changes) => {
    const data = await updateCurrentUser(changes);

    setSession((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, usuario: data.usuario };
      writeSession(next);
      return next;
    });

    return data.usuario;
  }, []);

  const value = useMemo(
    () => ({
      usuario: session?.usuario ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      notice,
      clearNotice: () => setNotice(null),
      login,
      register,
      logout,
      updateProfile,
    }),
    [session, notice, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
