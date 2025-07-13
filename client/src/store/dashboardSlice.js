import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchJars, updateJar } from '../services/api';

export const fetchJarsData = createAsyncThunk(
  'dashboard/fetchJars',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchJars();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateJarData = createAsyncThunk(
  'dashboard/updateJar',
  async ({ jarId, data }, { rejectWithValue }) => {
    try {
      const response = await updateJar(jarId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  jars: [],
  loading: false,
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJarsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJarsData.fulfilled, (state, action) => {
        state.loading = false;
        state.jars = action.payload;
      })
      .addCase(fetchJarsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch jars';
      })
      .addCase(updateJarData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJarData.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.jars.findIndex(jar => jar.id === action.payload.id);
        if (index !== -1) {
          state.jars[index] = action.payload;
        }
      })
      .addCase(updateJarData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update jar';
      });
  }
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 