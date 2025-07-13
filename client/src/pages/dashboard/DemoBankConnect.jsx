import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Chip
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { banks, mockTransactions } from './mockBankData';
import { useBank } from '../../contexts/BankContext';
import { useNavigate } from 'react-router-dom';

const DemoBankConnect = () => {
  const [open, setOpen] = useState(false);
  const [connectedBank, setConnectedBank] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const { connectBank } = useBank();
  const navigate = useNavigate();

  const handleConnectClick = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSelectBank = (bank) => {
    setConnectedBank(bank);
    setTransactions(mockTransactions[bank.code] || []);
    connectBank(bank);
    setOpen(false);
  };

  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <AccountBalanceIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Connect to your bank account
        </Typography>
        {!connectedBank ? (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              To experience the demo, please connect your (simulated) bank account
            </Typography>
            <Button variant="contained" color="primary" onClick={handleConnectClick}>
             Connect
            </Button>
          </>
        ) : (
          <>
            <Chip
              icon={<CheckCircleIcon color="success" />}
              label={`Đã kết nối: ${connectedBank.name}`}
              color="success"
              sx={{ mb: 2 }}
            />
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              Giao dịch gần đây
            </Typography>
            <List>
              {transactions.map((tx, idx) => (
                <ListItem key={idx}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: tx.amount > 0 ? 'success.main' : 'error.main' }}>
                      <CreditCardIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={tx.description}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color={tx.amount > 0 ? 'success.main' : 'error.main'}>
                          {tx.amount > 0 ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('vi-VN')} ₫
                        </Typography>
                        {` • ${tx.date}`}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleGoDashboard}>
              Vào Dashboard
            </Button>
          </>
        )}
      </Paper>

      {/* Modal chọn ngân hàng */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Choose bank</DialogTitle>
        <DialogContent>
          <List>
            {banks.map((bank) => (
              <ListItem button key={bank.code} onClick={() => handleSelectBank(bank)}>
                <ListItemAvatar>
                  <Avatar src={bank.logo}>
                    <AccountBalanceIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={bank.name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DemoBankConnect; 