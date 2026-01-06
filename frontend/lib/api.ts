import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token and redirect if not already on login page
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      
      if (currentPath !== '/' && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        console.log('401 error: Token expired or invalid, redirecting to login');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
};

export const usersAPI = {
  list: () => api.get('/auth/users'),
  create: (username: string, email: string, password: string, name: string, isAdmin: boolean) =>
    api.post('/auth/users', { username, email, password, name, isAdmin }),
  update: (id: string, data: { username?: string; email?: string; name?: string; isAdmin?: boolean; password?: string }) =>
    api.put(`/auth/users/${id}`, data),
  delete: (id: string) => api.delete(`/auth/users/${id}`),
};

export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (name: string, description: string, prompt: string) =>
    api.post('/projects', { name, description, prompt }),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const filesAPI = {
  list: (projectId: string) => api.get(`/projects/${projectId}/files`),
  get: (projectId: string, path: string) =>
    api.get(`/projects/${projectId}/files/${path}`),
  create: (projectId: string, path: string, content: string) =>
    api.post(`/projects/${projectId}/files`, { path, content }),
  update: (projectId: string, path: string, content: string) =>
    api.put(`/projects/${projectId}/files`, { path, content }),
  delete: (projectId: string, path: string) =>
    api.delete(`/projects/${projectId}/files`, { data: { path } }),
};