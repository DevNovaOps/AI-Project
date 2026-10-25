import { apiClient } from './client';

export const chatApi = {
  sendMessage: (data) => apiClient.post('/chat', data),
};
