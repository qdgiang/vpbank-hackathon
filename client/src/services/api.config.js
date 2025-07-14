const baseURL = '/api';

const apiConfig = {
  baseURL,
  users: `${baseURL}/users`,
  transactions: `${baseURL}/transactions`,
  notifications: `${baseURL}/notifications`,
  goals: `${baseURL}/goals`,
  jars: `${baseURL}/jars`,
  login: `${baseURL}/auth/login`,
  register: `${baseURL}/auth/register`,
};

export default apiConfig; 