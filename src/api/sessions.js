import { apiClient } from './client';

export const sessionsApi = {
  create: (data) => apiClient.post('/debug/sessions', data),
  get: (id) => apiClient.get(`/debug/sessions/${id}`),
  run: (id) => apiClient.post(`/debug/sessions/${id}/run`),
  cancel: (id) => apiClient.post(`/debug/sessions/${id}/cancel`),
  getEvents: (id) => apiClient.get(`/debug/sessions/${id}/events`),
  getWebSocketUrl: (id) => {
    const base = apiClient.getBaseUrl().replace(/^http/, 'ws');
    return `${base}/debug/sessions/${id}/ws`;
  },
};
