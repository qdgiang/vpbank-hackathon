import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchJars, createJar, updateJar, deleteJar } from '../services/api';

export const fetchJarsData = createAsyncThunk(
  'jars/fetchJars',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchJars();
      console.log(response.data.jars)
      return response.data.jars;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateJarData = createAsyncThunk(
  'jars/updateJar',
  async (data, { rejectWithValue }) => {
    try {
      const response = await updateJar(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteJarData = createAsyncThunk(
  'jars/deleteJar',
  async (id, { rejectWithValue }) => {
    try {
      await deleteJar(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const jarsSlice = createSlice({
  name: 'jars',
  initialState: {
    jars: [],
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
        state.error = action.payload;
      })
      .addCase(createJarData.fulfilled, (state, action) => {
        state.jars.unshift(action.payload);
      })
      .addCase(updateJarData.fulfilled, (state, action) => {
        const idx = state.jars.findIndex(j => j.jar_code === action.payload.jar_code);
        if (idx !== -1) state.jars[idx] = action.payload;
      })
      .addCase(deleteJarData.fulfilled, (state, action) => {
        state.jars = state.jars.filter(j => j.jar_code !== action.payload);
      });
  },
});

export const { clearError } = jarsSlice.actions;
export default jarsSlice.reducer; 