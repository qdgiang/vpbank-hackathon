import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response;
};

// Jar APIs
export const fetchJars = async () => {
  const response = await api.get('/jars');
  return response;
};

export const updateJar = async (jarId, data) => {
  const response = await api.put(`/jars/${jarId}`, data);
  return response;
};

export const createJar = async (data) => {
  const response = await api.post('/jars', data);
  return response;
};

export const deleteJar = async (jarId) => {
  const response = await api.delete(`/jars/${jarId}`);
  return response;
};

// Transaction APIs
export const fetchTransactions = async () => {
  const response = await api.get('/transactions');
  return response;
};

export const fetchJarTransactions = async (jarId) => {
  const response = await api.get(`/transactions/jar/${jarId}`);
  return response;
};

export const createTransaction = async (data) => {
  const response = await api.post('/transactions', data);
  return response;
};

export const updateTransaction = async (transactionId, data) => {
  const response = await api.put(`/transactions/${transactionId}`, data);
  return response;
};

export const deleteTransaction = async (transactionId) => {
  const response = await api.delete(`/transactions/${transactionId}`);
  return response;
};

// Category APIs
export const fetchCategories = async () => {
  const response = await api.get('/categories');
  return response;
};

export const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  return response;
};

export const updateCategory = async (categoryId, data) => {
  const response = await api.put(`/categories/${categoryId}`, data);
  return response;
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response;
};

export default api; 