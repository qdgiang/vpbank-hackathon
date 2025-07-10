import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, TextField, MenuItem, Select, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Pagination
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const ROW_OPTIONS = [10, 20, 50];

const TransactionManagementCard = ({ transactions, setTransactions, classifyTransaction, jarList }) => {
  const [filterText, setFilterText] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Track edited jars: { idx: newJar }
  const [editedJars, setEditedJars] = useState({});
  const [saving, setSaving] = useState(false);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchText =
        filterText === '' ||
        tx.description.toLowerCase().includes(filterText.toLowerCase());
      const matchFrom =
        !filterFrom || dayjs(tx.date).isSameOrAfter(dayjs(filterFrom), 'day');
      const matchTo =
        !filterTo || dayjs(tx.date).isSameOrBefore(dayjs(filterTo), 'day');
      return matchText && matchFrom && matchTo;
    });
  }, [transactions, filterText, filterFrom, filterTo]);

  // Paging
  const pageCount = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Check if there are edits
  const hasEdits = Object.keys(editedJars).length > 0;

  const handleJarChange = (idx, newJar) => {
    setEditedJars(prev => ({ ...prev, [idx]: newJar }));
  };

  const handleSave = () => {
    setSaving(true);
    setTransactions(prev =>
      prev.map((tx, i) =>
        editedJars[i] ? { ...tx, jar: editedJars[i] } : tx
      )
    );
    setEditedJars({});
    setTimeout(() => setSaving(false), 500); // Simulate save
  };

  const handleCancel = () => {
    setEditedJars({});
  };

  const handlePageChange = (_, value) => setPage(value);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 2px 12px #0001', mb: 3, mt: 3 }}>
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
                <TableCell>Jar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No transactions found.</TableCell>
                </TableRow>
              ) : (
                paged.map((tx, idx) => {
                  const globalIdx = (page - 1) * rowsPerPage + idx;
                  return (
                    <TableRow key={globalIdx} hover>
                      <TableCell>{dayjs(tx.date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell align="right" style={{ color: tx.amount > 0 ? '#388e3c' : '#d32f2f', fontWeight: 'bold' }}>
                        {tx.amount > 0 ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={editedJars[globalIdx] || tx.jar || classifyTransaction(tx)}
                            onChange={e => handleJarChange(globalIdx, e.target.value)}
                          >
                            {jarList.map(jar => (
                              <MenuItem key={jar.key} value={jar.key}>{jar.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={2} gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            {hasEdits && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ minWidth: 100, fontWeight: 'bold' }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{ minWidth: 100, fontWeight: 'bold' }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
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
    </Card>
  );
};

export default TransactionManagementCard; 