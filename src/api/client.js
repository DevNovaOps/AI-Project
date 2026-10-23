/**
 * AutonomusAI Centralized API Client
 * Configured via Vite environment variable VITE_API_BASE_URL or proxied /api/v1.
 * Handles timeouts, normalized errors, standard JSON headers, and cancellations.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Normalizes backend error responses into a human-readable string.
 */
export function normalizeError(error) {
  if (error instanceof ApiError) {
    if (error.data?.detail) {
      if (typeof error.data.detail === 'string') {
        return error.data.detail;
      }
      if (Array.isArray(error.data.detail)) {
        return error.data.detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ');
      }
    }
    return error.message;
  }
  if (error instanceof Error) {
    if (error.message === 'Failed to fetch') {
      return 'Cannot connect to the backend server. Please verify the FastAPI backend is running on port 8000.';
    }
    return error.message;
  }
  return 'An unexpected network error occurred';
}

/**
 * Base HTTP request wrapper with timeout support.
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeoutMs = 60000,
    signal = null,
    isFormData = false,
  } = options;

  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  const finalHeaders = { ...headers };
  if (!isFormData && body && typeof body === 'object') {
    finalHeaders['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isFormData ? body : (body && typeof body === 'object' ? JSON.stringify(body) : body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return null;
    }

    let responseData = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (err) {
        responseData = null;
      }
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const message = (responseData && typeof responseData === 'object' && responseData.detail)
        ? (typeof responseData.detail === 'string' ? responseData.detail : JSON.stringify(responseData.detail))
        : `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, responseData);
    }

    return responseData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out or was cancelled', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    if (err.message === 'Failed to fetch') {
      throw new ApiError('Cannot connect to the backend server. Please ensure the FastAPI backend is running on port 8000.', 0);
    }
    throw new ApiError(err.message || 'Network connection failed.', 0);
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  getBaseUrl: () => {
    if (BASE_URL.startsWith('http')) return BASE_URL;
    return `${window.location.protocol}//${window.location.host}${BASE_URL}`;
  },
};
