import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import transactionsReducer from './transactionsSlice';
import jarsReducer from './jarsSlice';
import notificationsReducer from './notificationsSlice';
import goalsReducer from './goalsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    transactions: transactionsReducer,
    jars: jarsReducer,
    notifications: notificationsReducer,
    goals: goalsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store; 