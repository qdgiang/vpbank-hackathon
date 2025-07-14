import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const AlertNotification = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%', borderRadius: 3 }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertNotification;