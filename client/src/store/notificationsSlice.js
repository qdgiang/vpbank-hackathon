import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNotifications, fetchNotification, createNotification, updateNotification, deleteNotification } from '../services/api';

export const fetchNotificationsData = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchNotifications();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createNotificationData = createAsyncThunk(
  'notifications/createNotification',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createNotification(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateNotificationData = createAsyncThunk(
  'notifications/updateNotification',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateNotification(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteNotificationData = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsData.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotificationsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNotificationData.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
      })
      .addCase(updateNotificationData.fulfilled, (state, action) => {
        const idx = state.notifications.findIndex(n => n.notification_id === action.payload.notification_id);
        if (idx !== -1) state.notifications[idx] = action.payload;
      })
      .addCase(deleteNotificationData.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(n => n.notification_id !== action.payload);
      });
  },
});

export const { clearError } = notificationsSlice.actions;
export default notificationsSlice.reducer; 