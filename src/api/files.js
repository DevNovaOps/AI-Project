import { apiClient } from './client';

export const filesApi = {
  getTree: (projectId) => apiClient.get(`/projects/${projectId}/files`),
  getContent: (projectId, path) => apiClient.get(`/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`),
  createFile: (projectId, path, content = '') => apiClient.post(`/projects/${projectId}/files`, { path, content }),
  createFolder: (projectId, path) => apiClient.post(`/projects/${projectId}/folders`, { path }),
  saveContent: (projectId, path, content, version = null) => apiClient.put(`/projects/${projectId}/files/content`, { path, content, version }),
  rename: (projectId, oldPath, newPath) => apiClient.patch(`/projects/${projectId}/files/rename`, { old_path: oldPath, new_path: newPath }),
  delete: (projectId, path) => apiClient.delete(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`),
  uploadFiles: (projectId, formData) => apiClient.post(`/projects/${projectId}/uploads`, formData, { isFormData: true }),
};
