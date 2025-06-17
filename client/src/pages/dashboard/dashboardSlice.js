import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jars } from '../../services/api';

export const fetchJars = createAsyncThunk(
  'dashboard/fetchJars',
  async (_, { rejectWithValue }) => {
    try {
      const response = await jars.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  jars: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJars.fulfilled, (state, action) => {
        state.loading = false;
        state.jars = action.payload;
      })
      .addCase(fetchJars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch jars';
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 