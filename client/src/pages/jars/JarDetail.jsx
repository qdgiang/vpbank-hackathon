import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchTransactionsData, createTransactionData, updateTransactionData, deleteTransactionData } from '../../store/transactionsSlice';
import { updateJarData } from '../../store/jarsSlice';

const JarDetail = () => {
  const { jarId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jars, loading: jarsLoading } = useSelector(state => state.jars);
  const { transactions, loading: txLoading } = useSelector(state => state.transactions);
  const jar = jars.find(j => j.id === jarId);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category: ''
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    dispatch(fetchTransactionsData());
  }, [dispatch]);

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        type: transaction.type,
        category: transaction.category
      });
    } else {
      setSelectedTransaction(null);
      setFormData({
        amount: '',
        description: '',
        type: 'expense',
        category: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
    setFormData({
      amount: '',
      description: '',
      type: 'expense',
      category: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      jarId
    };

    try {
      if (selectedTransaction) {
        await dispatch(updateTransactionData({
          transactionId: selectedTransaction.id,
          data: transactionData
        })).unwrap();
      } else {
        await dispatch(createTransactionData(transactionData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await dispatch(deleteTransactionData(transactionId)).unwrap();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!startDate && !endDate) return true;
    const transactionDate = new Date(transaction.date);
    if (startDate && endDate) {
      return transactionDate >= startDate && transactionDate <= endDate;
    }
    if (startDate) {
      return transactionDate >= startDate;
    }
    if (endDate) {
      return transactionDate <= endDate;
    }
    return true;
  });

  if (!jar) {
    return (
      <Container>
        <Alert severity="error">Jar not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {jar.name}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Current Balance</Typography>
            <Typography variant="h4" color="primary">
              ${jar.balance.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Target Amount</Typography>
            <Typography variant="h4" color="secondary">
              ${jar.targetAmount.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Progress</Typography>
            <Typography variant="h4">
              {((jar.balance / jar.targetAmount) * 100).toFixed(1)}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Transactions</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}
          >
            Add Transaction
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Box>

        {txLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Chip label={transaction.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        color={transaction.type === 'income' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(transaction)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Amount"
                  type="number"
                  fullWidth
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Category"
                  fullWidth
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Type"
                  fullWidth
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedTransaction ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default JarDetail; 