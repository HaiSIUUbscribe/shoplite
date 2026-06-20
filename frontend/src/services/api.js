import axiosClient from '../api/axiosClient';

export const authService = {
  login: (email, password) => axiosClient.post('/auth/login', { email, password }).then((response) => response.data),
  register: (name, email, password) => axiosClient.post('/auth/register', { name, email, password }).then((response) => response.data),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }).then((response) => response.data),
  resetPassword: (token, password) => axiosClient.post('/auth/reset-password', { token, password }).then((response) => response.data),
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
  create: (product) => axiosClient.post('/products', product).then((response) => response.data),
  update: (id, product) => axiosClient.put(`/products/${id}`, product).then((response) => response.data),
  remove: (id) => axiosClient.delete(`/products/${id}`).then((response) => response.data),
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
  send: (message) => axiosClient.post('/contact', message).then((response) => response.data),
};

export const adminService = {
  getDashboard: () => axiosClient.get('/admin/dashboard').then((response) => response.data),
  getUsers: () => axiosClient.get('/admin/users').then((response) => response.data),
  updateUser: (id, user) => axiosClient.put(`/admin/users/${id}`, user).then((response) => response.data),
  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`).then((response) => response.data),
};
