// The one way the SPA talks to the API. Adds the token and workspace headers,
// unwraps the { data, meta } envelope and turns failures into ApiRequestError.

import { API_PREFIX, ErrorCode, WORKSPACE_HEADER } from '@folio/shared';
import { auth } from './auth.js';
import { copy } from './copy.js';

export class ApiRequestError extends Error {
  /** @param {{ code: string, message: string, details?: unknown, requestId?: string }} error @param {number} status */
  constructor({ code, message, details, requestId }, status) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

let workspaceId = null;
let onUnauthorized = () => {};

export const apiConfig = {
  setWorkspace(id) {
    workspaceId = id;
  },
  /** Called when the API says the session is no longer valid. */
  onUnauthorized(handler) {
    onUnauthorized = handler;
  },
};

function toQueryString(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** @param {string} method @param {string} path @param {{ query?: Record<string, unknown>, body?: unknown }} [options] */
async function request(method, path, { query, body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = await auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (workspaceId) headers[WORKSPACE_HEADER] = workspaceId;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError({ code: ErrorCode.INTERNAL_ERROR, message: copy.errors.network }, 0);
  }

  if (response.status === 204) return { data: null };
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload?.error ?? { code: ErrorCode.INTERNAL_ERROR, message: copy.errors.generic };
    if (response.status === 401 && token) onUnauthorized();
    throw new ApiRequestError(error, response.status);
  }
  return payload;
}

/** Each call resolves to { data, meta? }. */
export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body: body ?? {} }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};
