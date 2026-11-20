import { apiRequest } from '../config/http.js';

export function loginRequest(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export function registerRequest(registration) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: registration,
  });
}

export function fetchCurrentUser() {
  return apiRequest('/users/me', { auth: true });
}

export function updateCurrentUser(changes) {
  return apiRequest('/users/me', {
    method: 'PUT',
    auth: true,
    body: changes,
  });
}
