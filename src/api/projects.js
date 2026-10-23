import { apiClient } from './client';

export const projectsApi = {
  list: () => apiClient.get('/projects'),
  get: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post('/projects', data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
};
