import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const JAR_LIST = [
  'Necessities',
  'Financial Freedom',
  'Long-term Savings',
  'Education',
  'Play',
  'Give'
];

// Fake AI phân loại giao dịch
function fakeClassifyTransaction({ description, amount }) {
  // Quy tắc đơn giản: nếu có từ "ăn", "food" => Necessities, "học" => Education, ...
  const desc = description.toLowerCase();
  if (desc.includes('ăn') || desc.includes('food')) return 'Necessities';
  if (desc.includes('học') || desc.includes('edu')) return 'Education';
  if (desc.includes('chơi') || desc.includes('play')) return 'Play';
  if (desc.includes('cho') || desc.includes('give')) return 'Give';
  if (desc.includes('tự do') || desc.includes('freedom')) return 'Financial Freedom';
  if (desc.includes('tiết kiệm') || desc.includes('saving')) return 'Long-term Savings';
  // Nếu không match, random
  return JAR_LIST[Math.floor(Math.random() * JAR_LIST.length)];
}

export const TransactionInputForm = ({ onAddTransaction, onClose }) => {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    jar: ''
  });
  const [classifiedJar, setClassifiedJar] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClassify = () => {
    const jar = fakeClassifyTransaction(form);
    setClassifiedJar(jar);
    setForm({ ...form, jar });
    setShowResult(true);
  };

  const handleJarChange = (e) => {
    setForm({ ...form, jar: e.target.value });
    setClassifiedJar(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.jar) return;
    onAddTransaction({ ...form, amount: Number(form.amount) });
    setForm({ description: '', amount: '', date: new Date().toISOString().slice(0, 10), jar: '' });
    setClassifiedJar('');
    setShowResult(false);
    if (onClose) onClose();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        required
      />
      <TextField
        label="Amount"
        name="amount"
        type="number"
        value={form.amount}
        onChange={handleChange}
        required
      />
      <TextField
        label="Date"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
      />
      <Button variant="outlined" color="primary" onClick={handleClassify} disabled={!form.description || !form.amount} sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}>
        Category (AI)
      </Button>
      {showResult && (
        <FormControl>
          <InputLabel>Jar</InputLabel>
          <Select
            value={classifiedJar}
            label="Jar"
            onChange={handleJarChange}
            required
          >
            {JAR_LIST.map(jar => (
              <MenuItem key={jar} value={jar}>{jar}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <Button type="submit" variant="contained" color="success" disabled={!form.description || !form.amount || !form.jar} sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}>
        Add transaction
      </Button>
      {showResult && classifiedJar && (
        <Chip label={`AI phân loại: ${classifiedJar}`} color="info" />
      )}
    </Box>
  );
};

const TransactionInputButton = ({ onAddTransaction }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/*<Button*/}
      {/*  variant="outlined"*/}
      {/*  color="primary"*/}
      {/*  startIcon={<AddCircleIcon />}*/}
      {/*  sx={{ borderRadius: 2, fontWeight: 'bold', px: 2, py: 0.5, minWidth: 0 }}*/}
      {/*  onClick={() => setOpen(true)}*/}
      {/*>*/}
      {/*  Add new transaction*/}
      {/*</Button>*/}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add new transaction</DialogTitle>
        <DialogContent>
          <TransactionInputForm onAddTransaction={onAddTransaction} onClose={() => setOpen(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionInputButton; 