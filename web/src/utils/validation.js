export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function passwordBytes(value) {
  return new TextEncoder().encode(value).length;
}

export function validateEmail(email) {
  const value = normalizeEmail(email);

  if (!value) {
    return 'Ingresa tu correo electrónico.';
  }

  if (value.length > 180) {
    return 'El correo no puede superar los 180 caracteres.';
  }

  if (!EMAIL_PATTERN.test(value)) {
    return 'Ingresa un correo electrónico válido.';
  }

  return null;
}

export function validatePassword(password, { required = true } = {}) {
  if (!password) {
    return required ? 'Ingresa tu contraseña.' : null;
  }

  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (passwordBytes(password) > 72) {
    return 'La contraseña no puede superar los 72 bytes.';
  }

  return null;
}

export function validateName(nombre) {
  const value = nombre.trim();

  if (!value) {
    return 'Ingresa tu nombre completo.';
  }

  if (value.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres.';
  }

  if (value.length > 120) {
    return 'El nombre no puede superar los 120 caracteres.';
  }

  return null;
}

export function toFieldErrors(details, allowedFields) {
  if (!Array.isArray(details)) {
    return {};
  }

  const errors = {};

  for (const detail of details) {
    const field = detail?.campo;
    if (
      typeof field === 'string'
      && allowedFields.includes(field)
      && typeof detail?.mensaje === 'string'
      && !errors[field]
    ) {
      errors[field] = detail.mensaje;
    }
  }

  return errors;
}
