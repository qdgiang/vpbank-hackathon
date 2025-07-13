import axios from 'axios';
import apiConfig from './api.config';

const api = axios.create({
  baseURL: apiConfig.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Users
export const fetchUsers = async () => api.get(apiConfig.users);
export const fetchUser = async (id) => api.get(`${apiConfig.users}/${id}`);
export const createUser = async (data) => api.post(apiConfig.users, data);
export const updateUser = async (id, data) => api.put(`${apiConfig.users}/${id}`, data);
export const deleteUser = async (id) => api.delete(`${apiConfig.users}/${id}`);

// Transactions
export const fetchTransactions = async () => api.get(apiConfig.transactions);
export const fetchTransaction = async (id) => api.get(`${apiConfig.transactions}/${id}`);
export const createTransaction = async (data) => api.post(apiConfig.transactions, data);
export const updateTransaction = async (id, data) => api.put(`${apiConfig.transactions}/${id}`, data);
export const deleteTransaction = async (id) => api.delete(`${apiConfig.transactions}/${id}`);

// Notifications
export const fetchNotifications = async () => api.get(apiConfig.notifications);
export const fetchNotification = async (id) => api.get(`${apiConfig.notifications}/${id}`);
export const createNotification = async (data) => api.post(apiConfig.notifications, data);
export const updateNotification = async (id, data) => api.put(`${apiConfig.notifications}/${id}`, data);
export const deleteNotification = async (id) => api.delete(`${apiConfig.notifications}/${id}`);

// Goals
export const fetchGoals = async () => api.get(apiConfig.goals);
export const fetchGoal = async (id) => api.get(`${apiConfig.goals}/${id}`);
export const createGoal = async (data) => api.post(apiConfig.goals, data);
export const updateGoal = async (id, data) => api.put(`${apiConfig.goals}/${id}`, data);
export const deleteGoal = async (id) => api.delete(`${apiConfig.goals}/${id}`);

// Jars
export const fetchJars = async () => api.get(apiConfig.jars);
export const fetchJar = async (id) => api.get(`${apiConfig.jars}/${id}`);
export const createJar = async (data) => api.post(apiConfig.jars, data);
export const updateJar = async (id, data) => api.put(`${apiConfig.jars}/${id}`, data);
export const deleteJar = async (id) => api.delete(`${apiConfig.jars}/${id}`);

// Auth
export const loginUser = async (credentials) => api.post(apiConfig.login, credentials);
export const registerUser = async (data) => api.post(apiConfig.register, data);

export default api; 