import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../services/api';

export const fetchTransactionsData = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchTransactions(params);
      // response.data.transactions, response.data.total
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
      console.log(transactionId)
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
  total: 0,
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
        state.transactions = action.payload.transactions || action.payload.data || [];
        state.total = action.payload.total || 0;
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
        // Nếu đang phân trang, có thể cần refetch thay vì push, nhưng tạm thời cứ push
        state.transactions.unshift(action.payload); // Thêm vào đầu danh sách
        state.total += 1;
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
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteTransactionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete transaction';
      });
  }
});

export const { clearError } = transactionsSlice.actions;
export default transactionsSlice.reducer; 