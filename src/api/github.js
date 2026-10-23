import { apiClient } from './client';

export const githubApi = {
  importRepo: (data) => apiClient.post('/github/import', data),
  getImportStatus: (jobId) => apiClient.get(`/github/imports/${jobId}`),
  getRepoMetadata: (projectId) => apiClient.get(`/projects/${projectId}/repository`),
  refreshRepo: (projectId) => apiClient.post(`/projects/${projectId}/repository/refresh`),
  disconnectRepo: (projectId) => apiClient.delete(`/projects/${projectId}/repository`),
};
