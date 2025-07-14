import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, user } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      user.getProfile()
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await auth.login(credentials);
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    setCurrentUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await auth.register(userData);
    const { token, user: newUser } = response.data;
    localStorage.setItem('token', token);
    setCurrentUser(newUser);
    return newUser;
  };

  const logout = () => {
    auth.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 