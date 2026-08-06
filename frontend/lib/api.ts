import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error('Koneksi ke server gagal. Pastikan backend berjalan.');
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan';
    toast.error(message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) =>
    api.post('/auth/register', data),
  getProfile: () =>
    api.get('/auth/profile'),
  logout: () =>
    api.post('/auth/logout'),
};

export const userAPI = {
  getProfile: () =>
    api.get('/users/profile'),
  updateProfile: (data: any) =>
    api.put('/users/profile', data),
  updateProfileImage: (data: { profile_image: string }) =>
    api.put('/users/profile-image', data),
  updateSignature: (data: { digital_signature: string }) =>
    api.put('/users/signature', data),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put('/users/change-password', data),
  getUsersByDivision: (division: string) =>
    api.get(`/users/division/${division}`),
  getUserById: (id: string) =>
    api.get(`/users/${id}`),
  deactivateUser: (id: string) =>
    api.put(`/users/${id}/deactivate`),
  activateUser: (id: string) =>
    api.put(`/users/${id}/activate`),
};

export const memoAPI = {
  create: (data: { title: string; content: string; division: string }) =>
    api.post('/memos/', data),
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/memos/', { params }),
  getById: (id: string) =>
    api.get(`/memos/${id}`),
  delete: (id: string) =>
    api.delete(`/memos/${id}`),
  approve: (id: string, data: { signature: string; comments: string }) =>
    api.put(`/memos/${id}/approve`, data),
  reject: (id: string, data: { comments: string }) =>
    api.put(`/memos/${id}/reject`, data),
  getPending: () =>
    api.get('/memos/pending'),
  verify: (id: string) =>
    api.get(`/memos/verify/${id}`),
  scanQR: (qrData: string) =>
    api.get('/memos/scan-qr', { params: { qr_data: qrData } }),
  exportPDF: (id: string) =>
    api.get(`/memos/${id}/export`, { responseType: 'blob' }),
};

export default api;
