import { apiClient } from './client';

export const repairsApi = {
  getForSession: (sessionId) => apiClient.get(`/debug/sessions/${sessionId}/repairs`),
  apply: (repairId) => apiClient.post(`/repairs/${repairId}/apply`),
};

export const testsApi = {
  getForSession: (sessionId) => apiClient.get(`/debug/sessions/${sessionId}/tests`),
  run: (sessionId, payload = {}) => apiClient.post(`/debug/sessions/${sessionId}/tests/run`, payload),
};

export const reportsApi = {
  getForSession: (sessionId) => apiClient.get(`/debug/sessions/${sessionId}/report`),
};
