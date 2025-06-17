import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchJars, updateJar, createJar, deleteJar } from '../../services/api';

export const fetchJarsData = createAsyncThunk(
  'jars/fetchJars',
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
  'jars/updateJar',
  async ({ jarId, data }, { rejectWithValue }) => {
    try {
      const response = await updateJar(jarId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createJarData = createAsyncThunk(
  'jars/createJar',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createJar(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteJarData = createAsyncThunk(
  'jars/deleteJar',
  async (jarId, { rejectWithValue }) => {
    try {
      const response = await deleteJar(jarId);
      return jarId;
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

const jarsSlice = createSlice({
  name: 'jars',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jars
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
      // Update Jar
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
      })
      // Create Jar
      .addCase(createJarData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJarData.fulfilled, (state, action) => {
        state.loading = false;
        state.jars.push(action.payload);
      })
      .addCase(createJarData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create jar';
      })
      // Delete Jar
      .addCase(deleteJarData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJarData.fulfilled, (state, action) => {
        state.loading = false;
        state.jars = state.jars.filter(jar => jar.id !== action.payload);
      })
      .addCase(deleteJarData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete jar';
      });
  }
});

export const { clearError } = jarsSlice.actions;
export default jarsSlice.reducer; 