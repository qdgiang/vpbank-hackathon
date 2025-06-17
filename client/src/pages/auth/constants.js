export const AUTH_TYPES = {
  LOGIN_REQUEST: 'auth/login/request',
  LOGIN_SUCCESS: 'auth/login/success',
  LOGIN_FAILURE: 'auth/login/failure',
  REGISTER_REQUEST: 'auth/register/request',
  REGISTER_SUCCESS: 'auth/register/success',
  REGISTER_FAILURE: 'auth/register/failure',
  LOGOUT: 'auth/logout',
  CLEAR_ERROR: 'auth/clearError',
};

export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
};

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  REGISTER_SUCCESS: 'Successfully registered',
  LOGOUT_SUCCESS: 'Successfully logged out',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  SERVER_ERROR: 'Server error occurred',
}; 