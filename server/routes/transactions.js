const express = require('express');
const router = express.Router();
const { transactions } = require('../mockData');
const findById = (arr, key, val) => arr.find(item => item[key] === val);
const findIndexById = (arr, key, val) => arr.findIndex(item => item[key] === val);

router.get('/', (req, res) => res.json(transactions));
router.get('/:id', (req, res) => {
  const tx = findById(transactions, 'transaction_id', req.params.id);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  res.json(tx);
});
router.post('/', (req, res) => {
  const newTx = { ...req.body, transaction_id: `tx-${Date.now()}` };
  transactions.push(newTx);
  res.status(201).json(newTx);
});
router.put('/:id', (req, res) => {
  const idx = findIndexById(transactions, 'transaction_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  transactions[idx] = { ...transactions[idx], ...req.body };
  res.json(transactions[idx]);
});
router.delete('/:id', (req, res) => {
  const idx = findIndexById(transactions, 'transaction_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = transactions.splice(idx, 1);
  res.json(deleted[0]);
});

module.exports = router; 