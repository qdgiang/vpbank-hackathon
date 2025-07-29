import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, TextField, MenuItem, Select, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Pagination, CircularProgress, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { useSelector, useDispatch } from 'react-redux';
import { fetchTransactionsData, createTransactionData, updateTransactionData, deleteTransactionData } from '../store/transactionsSlice';
import { fetchJarsData } from '../store/jarsSlice';
import Snackbar from '@mui/material/Snackbar';

const ROW_OPTIONS = [10, 20, 50];

const TransactionManagementCard = ({ classifyTransaction, jarList }) => {
  const dispatch = useDispatch();
  const { transactions, loading, total } = useSelector(state => state.transactions);
  const user = useSelector(state => state.auth.user);
  // Ensure transactions is always an array
  const safeTransactions = Array.isArray(transactions) ? transactions : (transactions?.transactions || []);
  const [filterText, setFilterText] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Track edited jars: { idx: newJar }
  const [editedJars, setEditedJars] = useState({});
  const [saving, setSaving] = useState(false);
  // State for transaction creation dialog
  const [openTxForm, setOpenTxForm] = useState(false);
  const [txForm, setTxForm] = useState({
    amount: '',
    txn_time: '',
    msg_content: '',
    merchant: '',
    location: '',
    channel: '',
    tranx_type: 'transfer_out',
  });
  const [formError, setFormError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    dispatch(fetchTransactionsData({
      pagination: { page_size: rowsPerPage, current: page },
      filters: {
        ...(filterText ? { search_text: filterText } : {}),
        ...(filterFrom ? { from_date: filterFrom } : {}),
        ...(filterTo ? { to_date: filterTo } : {})
      }
    }));
  }, [dispatch, page, rowsPerPage, filterText, filterFrom, filterTo]);

  const pageCount = Math.ceil(total / rowsPerPage) || 1;

  const handleJarChange = (idx, newJar) => {
    setEditedJars(prev => ({ ...prev, [idx]: newJar }));
  };

  const handlePageChange = (_, value) => setPage(value);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const handleTxFormChange = (e) => {
    setTxForm({ ...txForm, [e.target.name]: e.target.value });
  };

  // Income types (+)
  const IN_TYPES = [
    'transfer_in',
    'cashback',
    'refund',
    'opensaving',
    'opendeposit',
    'openaccumulation'
  ];
  // Expense types (-)
  const OUT_TYPES = [
    'transfer_out',
    'qrcode_payment',
    'atm_withdrawal',
    'service_fee',
    'loan_repayment',
    'stock',
    'bill_payment',
    'mobile_topup'
  ];
  function getTransactionSign(tranx_type) {
    if (IN_TYPES.includes(tranx_type)) return 1;
    if (OUT_TYPES.includes(tranx_type)) return -1;
    return 0;
  }

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001', mb: 3, mt: 3, position: 'relative' }}>
      {loading && (
        <Box position="absolute" top={0} left={0} width="100%" height="100%" zIndex={10} display="flex" alignItems="center" justifyContent="center" bgcolor="rgba(255,255,255,0.6)">
          <CircularProgress />
        </Box>
      )}
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
          <Typography
              variant="h6"
              sx={{
                background: '-webkit-linear-gradient(0,#e00200,#015aad,#00b74f)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'black',
                flex: 1,
                fontWeight: 'bold'
              }}
          >
            Transaction Management
          </Typography>
          <TextField
            label="Search"
            size="small"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="From"
            type="date"
            size="small"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Jar Type</TableCell>
                <TableCell>Recipient/Sender</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No transactions found.</TableCell>
                </TableRow>
              ) : (
                safeTransactions.map((tx, idx) => {
                  const globalIdx = idx;
                  const isExpense = OUT_TYPES.includes(tx.tranx_type);
                  return (
                    <TableRow key={globalIdx} hover>
                      <TableCell>{dayjs(tx.txn_time).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{tx.msg_content}</TableCell>
                      <TableCell align="right" style={{ color: getTransactionSign(tx.tranx_type) > 0 ? '#388e3c' : '#d32f2f', fontWeight: 'bold' }}>
                        {getTransactionSign(tx.tranx_type) > 0 ? '+' : '-'}
                        {Math.abs(Number(tx.amount)).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        {isExpense && (
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editedJars[globalIdx] || tx.category_label || classifyTransaction(tx)}
                              onChange={e => handleJarChange(globalIdx, e.target.value)}
                             variant={'outlined'}>
                              {jarList.map(jar => (
                                <MenuItem key={jar.key} value={jar.key}>{jar.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>
                      <TableCell>{tx.to_account_name}</TableCell>
                      <TableCell>{tx.location}</TableCell>
                      <TableCell>{tx.merchant}</TableCell>
                      <TableCell>
                        {isExpense && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={editedJars[globalIdx] === undefined || editedJars[globalIdx] === (tx.category_label || classifyTransaction(tx))}
                            onClick={async () => {
                              if (tx && tx.transaction_id && editedJars[globalIdx] !== undefined) {
                                await dispatch(updateTransactionData({ transactionId: tx.transaction_id, data: { jar: editedJars[globalIdx] } }));
                                await dispatch(fetchTransactionsData());
                                dispatch(fetchJarsData());
                                setEditedJars(prev => ({ ...prev, [globalIdx]: undefined }));
                              }
                            }}
                            sx={{ minWidth: 0, px: 1, mr: 1 }}
                          >
                            Save
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={2} gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenTxForm(true)}
            >
              + Add transaction
            </Button>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                  variant={'outlined'}
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
              >
                {ROW_OPTIONS.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt} rows</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Pagination
              count={pageCount}
              page={page}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              size="medium"
            />
          </Box>
        </Box>
      </CardContent>
      <Dialog open={openTxForm} onClose={() => setOpenTxForm(false)}>
        <DialogTitle>Add new transaction</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth={350}>
            {formError && (
              <Typography color="error" variant="body2">{formError}</Typography>
            )}
            <TextField label="Amount" name="amount" value={txForm.amount} onChange={handleTxFormChange} type="number" fullWidth />
            <TextField label="Time" name="txn_time" value={txForm.txn_time} onChange={handleTxFormChange} type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Content" name="msg_content" value={txForm.msg_content} onChange={handleTxFormChange} fullWidth />
            <TextField label="Merchant" name="merchant" value={txForm.merchant} onChange={handleTxFormChange} fullWidth />
            <TextField label="Location" name="location" value={txForm.location} onChange={handleTxFormChange} fullWidth />
            <TextField label="Channel" name="channel" value={txForm.channel} onChange={handleTxFormChange} fullWidth />
            <TextField label="Recipient/Sender" name="to_account_name" value={txForm.to_account_name || ''} onChange={handleTxFormChange} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="tranx-type-label">Transaction type</InputLabel>
              <Select
                  variant={'outlined'}
                labelId="tranx-type-label"
                name="tranx_type"
                value={txForm.tranx_type}
                label="Transaction type"
                onChange={handleTxFormChange}
              >
                <MenuItem value="transfer_in">transfer_in</MenuItem>
                <MenuItem value="transfer_out">transfer_out</MenuItem>
                <MenuItem value="qrcode_payment">qrcode_payment</MenuItem>
                <MenuItem value="atm_withdrawal">atm_withdrawal</MenuItem>
                <MenuItem value="service_fee">service_fee</MenuItem>
                <MenuItem value="loan_repayment">loan_repayment</MenuItem>
                <MenuItem value="stock">stock</MenuItem>
                <MenuItem value="bill_payment">bill_payment</MenuItem>
                <MenuItem value="opensaving">opensaving</MenuItem>
                <MenuItem value="opendeposit">opendeposit</MenuItem>
                <MenuItem value="openaccumulation">openaccumulation</MenuItem>
                <MenuItem value="mobile_topup">mobile_topup</MenuItem>
                <MenuItem value="cashback">cashback</MenuItem>
                <MenuItem value="refund">refund</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => {
                // Validate form fields
                if (!txForm.amount || Number(txForm.amount) <= 0) {
                  setFormError('Amount must be greater than 0');
                  return;
                }
                if (!txForm.txn_time) {
                  setFormError('Please select transaction time');
                  return;
                }
                if (!txForm.msg_content) {
                  setFormError('Please enter transaction content');
                  return;
                }
                if (!txForm.merchant) {
                  setFormError('Please enter merchant');
                  return;
                }
                if (!txForm.location) {
                  setFormError('Please enter location');
                  return;
                }
                if (!txForm.channel) {
                  setFormError('Please enter transaction channel');
                  return;
                }
                if (!txForm.tranx_type) {
                  setFormError('Please select transaction type');
                  return;
                }
                setFormError('');
                dispatch(createTransactionData({
                  ...txForm,
                  user_id: user.user_id
                }));
                setOpenTxForm(false);
                setTxForm({
                  amount: '',
                  txn_time: '',
                  msg_content: '',
                  merchant: '',
                  location: '',
                  channel: '',
                  tranx_type: 'transfer_out',
                });
                setOpenSnackbar(true);
              }}
              sx={{ mt: 1 }}
            >
              Create transaction
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message="Transaction is being processed"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Card>
  );
};

export default TransactionManagementCard; 