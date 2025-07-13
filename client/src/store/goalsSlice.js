import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchGoals, fetchGoal, createGoal, updateGoal, deleteGoal } from '../services/api';

export const fetchGoalsData = createAsyncThunk(
  'goals/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchGoals();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createGoalData = createAsyncThunk(
  'goals/createGoal',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createGoal(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateGoalData = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateGoal(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteGoalData = createAsyncThunk(
  'goals/deleteGoal',
  async (id, { rejectWithValue }) => {
    try {
      await deleteGoal(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const goalsSlice = createSlice({
  name: 'goals',
  initialState: {
    goals: [],
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
      .addCase(fetchGoalsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoalsData.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoalsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createGoalData.fulfilled, (state, action) => {
        state.goals.unshift(action.payload);
      })
      .addCase(updateGoalData.fulfilled, (state, action) => {
        const idx = state.goals.findIndex(g => g.goal_id === action.payload.goal_id);
        if (idx !== -1) state.goals[idx] = action.payload;
      })
      .addCase(deleteGoalData.fulfilled, (state, action) => {
        state.goals = state.goals.filter(g => g.goal_id !== action.payload);
      });
  },
});

export const { clearError } = goalsSlice.actions;
export default goalsSlice.reducer; 