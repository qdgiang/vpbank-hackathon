// src/features/goals/goalsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    fetchGoals,
    createGoalsBatch,
    allocateSaving,
    pauseGoal,
    deleteGoal
} from '../services/api';

export const fetchGoalsData = createAsyncThunk('goals/fetchGoalsData', async ({ rejectWithValue }) => {
    try {
        const res = await fetchGoals();
        return res.data.goals;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const createGoalsBatchThunk = createAsyncThunk('goals/createGoalsBatch', async ({ user_id, total_monthly_amount, goals }, { rejectWithValue }) => {
    try {
        const res = await createGoalsBatch(total_monthly_amount, goals);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const allocateSavingThunk = createAsyncThunk('goals/allocateSaving', async ({sent_amount }, { rejectWithValue }) => {
    try {
        const res = await allocateSaving(sent_amount);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const pauseGoalThunk = createAsyncThunk('goals/pauseGoal', async ({goal_id }, { rejectWithValue }) => {
    try {
        const res = await pauseGoal(goal_id);
        return { goal_id, data: res.data };
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

export const deleteGoalThunk = createAsyncThunk('goals/deleteGoal', async ({ goal_id }, { rejectWithValue }) => {
    try {
        await deleteGoal(goal_id);
        return goal_id;
    } catch (err) {
        return rejectWithValue(err.response?.data || err.message);
    }
});

const goalsSlice = createSlice({
    name: 'goals',
    initialState: {
        goals: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGoalsData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGoalsData.fulfilled, (state, action) => {
                state.goals = action.payload;
                state.loading = false;
            })
            .addCase(fetchGoalsData.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            .addCase(createGoalsBatchThunk.fulfilled, (state, action) => {
                state.goals.unshift(...(action.payload?.goals || []));
            })
            .addCase(deleteGoalThunk.fulfilled, (state, action) => {
                state.goals = state.goals.filter(g => g.goal_id !== action.payload);
            })
            .addCase(pauseGoalThunk.fulfilled, (state, action) => {
                const idx = state.goals.findIndex(g => g.goal_id === action.payload.goal_id);
                if (idx !== -1) {
                    state.goals[idx].status = 'paused';
                }
            });
    }
});

export default goalsSlice.reducer;
