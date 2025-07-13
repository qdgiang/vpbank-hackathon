import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../services/api';

export const fetchTransactionsData = createAsyncThunk(
  'transactions/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchTransactions();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createTransactionData = createAsyncThunk(
  'transactions/createTransaction',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createTransaction(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTransactionData = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, data }, { rejectWithValue }) => {
    try {
      const response = await updateTransaction(transactionId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteTransactionData = createAsyncThunk(
  'transactions/deleteTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await deleteTransaction(transactionId);
      return transactionId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  transactions: [],
  loading: false,
  error: null
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Transactions
      .addCase(fetchTransactionsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionsData.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactionsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch transactions';
      })
      // Create Transaction
      .addCase(createTransactionData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransactionData.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.push(action.payload);
      })
      .addCase(createTransactionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create transaction';
      })
      // Update Transaction
      .addCase(updateTransactionData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransactionData.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransactionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update transaction';
      })
      // Delete Transaction
      .addCase(deleteTransactionData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransactionData.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTransactionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete transaction';
      });
  }
});

export const { clearError } = transactionsSlice.actions;
export default transactionsSlice.reducer; 