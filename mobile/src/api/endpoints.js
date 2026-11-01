import { api } from './client.js';

export const authApi = {
  requestOtp: (phone, referralCode) => api.post('/auth/request-otp', { phone, referralCode: referralCode || undefined }),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload),
  google: (payload) => api.post('/auth/google', payload),
  apple: (payload) => api.post('/auth/apple', payload),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  updateProfile: (patch) => api.patch('/users/me', patch),
  summary: () => api.get('/users/me/summary'),
};

export const productApi = {
  list: (filters) => api.get('/products', filters),
  get: (id) => api.get(`/products/${id}`),
  categories: () => api.get('/products/meta/categories'),
};

export const postApi = {
  list: (page = 1) => api.get('/posts', { page }),
  get: (id) => api.get(`/posts/${id}`),
  create: (payload) => api.post('/posts', payload),
  like: (id) => api.post(`/posts/${id}/like`),
  comment: (id, text) => api.post(`/posts/${id}/comment`, { text }),
  share: (id) => api.post(`/posts/${id}/share`),
};

export const walletApi = {
  summary: () => api.get('/transactions/wallet'),
  history: (page = 1, type) => api.get('/transactions', { page, type }),
  purchase: (productId, quantity = 1) => api.post('/transactions/purchase', { productId, quantity }),
  topup: (amount) => api.post('/transactions/topup', { amount }),
};

export const poolApi = {
  get: () => api.get('/pool'),
  me: () => api.get('/pool/me'),
};
