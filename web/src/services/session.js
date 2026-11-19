export const SESSION_STORAGE_KEY = 'miniaula.session.v1';

const ROLES = new Set(['estudiante', 'instructor']);

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isValidUsuario(usuario) {
  return (
    usuario !== null
    && typeof usuario === 'object'
    && typeof usuario.nombre === 'string'
    && typeof usuario.email === 'string'
    && ROLES.has(usuario.rol)
  );
}

export function readSession() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      parsed === null
      || typeof parsed !== 'object'
      || typeof parsed.token !== 'string'
      || parsed.token.length === 0
      || !isValidUsuario(parsed.usuario)
    ) {
      return null;
    }

    return { token: parsed.token, usuario: parsed.usuario };
  } catch {
    return null;
  }
}

export function writeSession({ token, usuario }) {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, usuario }));
    return true;
  } catch {
    return false;
  }
}

export function clearSession() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // A blocked storage still leaves the in-memory session cleared by the caller.
  }
}
