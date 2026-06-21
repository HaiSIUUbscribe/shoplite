import axiosClient from '../api/axiosClient';

export const authService = {
  login: (email, password) => axiosClient.post('/auth/login', { email, password }).then((response) => response.data),
  socialLogin: (token, provider) => axiosClient.post('/auth/social', { token, provider }).then((response) => response.data),
  register: (name, email, password) => axiosClient.post('/auth/register', { name, email, password }).then((response) => response.data),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }).then((response) => response.data),
  resetPassword: (token, password) => axiosClient.post('/auth/reset-password', { token, password }).then((response) => response.data),
  refresh: () => axiosClient.post('/auth/refresh').then((response) => response.data),
  logout: () => axiosClient.post('/auth/logout').then((response) => response.data),
};
export const cartService = {
  getCart: () => axiosClient.get('/cart').then((res) => res.data),
  addToCart: (productId, quantity, size, color) => axiosClient.post('/cart', { productId, quantity, size, color }).then((res) => res.data),
  updateQty: (id, quantity) => axiosClient.put(`/cart/${id}`, { quantity }).then((res) => res.data),
  removeItem: (id) => axiosClient.delete(`/cart/${id}`).then((res) => res.data),
  clearCart: () => axiosClient.delete('/cart').then((res) => res.data),
};

export const userService = {
  getProfile: () => axiosClient.get('/users/profile').then((response) => response.data),
  updateProfile: (profile) => axiosClient.put('/users/profile', profile).then((response) => response.data),
  changePassword: (currentPassword, newPassword) => axiosClient.put('/users/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  }).then((response) => response.data),
};

export const productService = {
  list: (params = {}) => axiosClient.get('/products', { params }).then((response) => response.data),
  categories: () => axiosClient.get('/products/categories').then((response) => response.data),
  getById: (id) => axiosClient.get(`/products/${id}`).then((response) => response.data),
  create: (data) => axiosClient.post('/products', data).then((response) => response.data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data).then((response) => response.data),
  remove: (id) => axiosClient.delete(`/products/${id}`).then((response) => response.data),
  getReviews: (id) => axiosClient.get(`/products/${id}/reviews`).then((res) => res.data),
  addReview: (id, rating, comment) => axiosClient.post(`/products/${id}/reviews`, { rating, comment }).then((res) => res.data),
  getMyReviewedProductIds: () => axiosClient.get('/products/reviews/mine').then((res) => res.data),
  downloadImportTemplate: () => axiosClient.get('/products/import-template', { responseType: 'blob' }).then((response) => response.data),
  importExcel: (file) => {
    const data = new FormData();
    data.append('file', file);
    return axiosClient.post('/products/import', data).then((response) => response.data);
  },
  uploadImages: (files) => {
    const data = new FormData();
    Array.from(files).forEach((file) => data.append('images', file));
    return axiosClient.post('/products/images/upload', data).then((response) => response.data);
  },
};

export const orderService = {
  create: (order) => axiosClient.post('/orders', order).then((response) => response.data),
  getMine: () => axiosClient.get('/orders/my').then((response) => response.data),
  getById: (id) => axiosClient.get(`/orders/${id}`).then((response) => response.data),
  getAll: () => axiosClient.get('/orders').then((response) => response.data),
  updateStatus: (id, status) => axiosClient.put(`/orders/${id}/status`, { status }).then((response) => response.data),
};

export const contactService = {
  send: (message, attachments = []) => {
    const data = new FormData();
    Object.entries(message).forEach(([key, value]) => {
      data.append(key === 'orderId' ? 'order_id' : key, value || '');
    });
    attachments.forEach((file) => data.append('attachments', file));
    return axiosClient.post('/contact', data).then((response) => response.data);
  },
};

export const newsletterService = {
  subscribe: (email) => axiosClient.post('/newsletter/subscribe', { email }).then((response) => response.data),
};

export const voucherService = {
  claim: () => axiosClient.post('/vouchers/claim').then((response) => response.data),
  validate: (code, email, subtotal) => axiosClient.post('/vouchers/validate', {
    code,
    email,
    subtotal,
  }).then((response) => response.data),
};

export const locationService = {
  getVietnamLocations: () => axiosClient.get('/locations/vietnam').then((response) => response.data),
};

export const adminService = {
  getDashboard: () => axiosClient.get('/admin/dashboard').then((response) => response.data),
  getUsers: (params = {}) => axiosClient.get('/admin/users', { params }).then((response) => response.data),
  getUserById: (id) => axiosClient.get(`/admin/users/${id}`).then((response) => response.data),
  updateUser: (id, user) => axiosClient.put(`/admin/users/${id}`, user).then((response) => response.data),
  updateUserStatus: (id, status) => axiosClient.patch(`/admin/users/${id}/status`, { status }).then((response) => response.data),
  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`).then((response) => response.data),
};

export const addressService = {
  list: () => axiosClient.get('/addresses').then((res) => res.data),
  create: (data) => axiosClient.post('/addresses', data).then((res) => res.data),
  update: (id, data) => axiosClient.put(`/addresses/${id}`, data).then((res) => res.data),
  remove: (id) => axiosClient.delete(`/addresses/${id}`).then((res) => res.data),
  setDefault: (id) => axiosClient.patch(`/addresses/${id}/default`).then((res) => res.data),
};

export const notificationService = {
  list: (params) => axiosClient.get('/notifications', { params }).then((res) => res.data),
  count: () => axiosClient.get('/notifications/count').then((res) => res.data),
  markRead: (id) => axiosClient.patch(`/notifications/${id}/read`).then((res) => res.data),
  markAllRead: () => axiosClient.patch('/notifications/read-all').then((res) => res.data),
  deleteOne: (id) => axiosClient.delete(`/notifications/${id}`).then((res) => res.data),
  getPreferences: () => axiosClient.get('/notifications/preferences').then((res) => res.data),
  setPreferences: (data) => axiosClient.put('/notifications/preferences', data).then((res) => res.data),
  getSettings: () => axiosClient.get('/notifications/settings').then((res) => res.data),
  setSettings: (data) => axiosClient.put('/notifications/settings', data).then((res) => res.data),
};

export const favoriteService = {
  getMine: () => axiosClient.get('/favorites').then((res) => res.data),
  getMineIds: () => axiosClient.get('/favorites/ids').then((res) => res.data),
  add: (productId) => axiosClient.post('/favorites', { productId }).then((res) => res.data),
  remove: (productId) => axiosClient.delete(`/favorites/${productId}`).then((res) => res.data),
};
