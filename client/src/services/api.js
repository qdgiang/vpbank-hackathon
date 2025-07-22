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
export const fetchTransactions = async (params = {}) => api.post(`${apiConfig.transactions}/search`, params);
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

export const fetchGoals = async () =>
    api.post(`${apiConfig.goals}/search`, {
      pagination: { current: 1, page_size: 100 }
    });

export const createGoalsBatch = async ( total_monthly_amount, goals) =>
    api.post(`${apiConfig.goals}/set`, {
      data: { total_monthly_amount, goals }
    });

export const allocateSaving = async (sent_amount) =>
    api.post(`${apiConfig.goals}/allocate`, {
      sent_amount
    });

export const pauseGoal = async (goal_id) =>
    api.put(`${apiConfig.goals}/pause/${goal_id}`);

export const deleteGoal = async (goal_id) =>
    api.delete(`${apiConfig.goals}/delete/${goal_id}`);
// Jars
export const fetchJars = async () => api.get(apiConfig.jars);
export const createJar = async (data) => api.post(apiConfig.jars, data);
export const updateJar = async (data) => api.put(`${apiConfig.jars}/percent`, data);
export const deleteJar = async (id) => api.delete(`${apiConfig.jars}/${id}`);

// Auth
export const loginUser = async (credentials) => api.post(apiConfig.login, credentials);

export default api; 