const configuredUrl = import.meta.env?.VITE_API_URL;
export const API_URL = (configuredUrl || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'ERROR_DESCONOCIDO', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken = null;
let unauthorizedHandler = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

function notifyUnauthorized(token) {
  if (!unauthorizedHandler) {
    return;
  }

  try {
    unauthorizedHandler(token);
  } catch {
    // The API response remains the source of truth when the hook itself fails.
  }
}

async function readPayload(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    rawBody,
    headers: extraHeaders,
    auth = false,
    signal,
  } = {},
) {
  const headers = { Accept: 'application/json', ...extraHeaders };
  let cuerpo;

  if (rawBody !== undefined) {
    cuerpo = rawBody;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(body);
  }

  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const requestToken = auth ? accessToken : null;

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: cuerpo,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      { code: 'ERROR_DE_RED' },
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    const details = payload?.error?.details ?? null;
    const apiError = new ApiError(
      payload?.error?.message ?? 'No se pudo completar la solicitud.',
      {
        status: response.status,
        code: payload?.error?.code ?? 'ERROR_HTTP',
        details,
      },
    );

    if (auth && response.status === 401 && requestToken && requestToken === accessToken) {
      notifyUnauthorized(requestToken);
    }

    throw apiError;
  }

  return payload;
}
