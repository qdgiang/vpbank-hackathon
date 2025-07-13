const express = require('express');
const router = express.Router();
const { users } = require('../mockData');
const findById = (arr, key, val) => arr.find(item => item[key] === val);
const findIndexById = (arr, key, val) => arr.findIndex(item => item[key] === val);

router.get('/', (req, res) => res.json(users));
router.get('/:id', (req, res) => {
  const user = findById(users, 'user_id', req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});
router.post('/', (req, res) => {
  const newUser = { ...req.body, user_id: `user-${Date.now()}` };
  users.push(newUser);
  res.status(201).json(newUser);
});
router.put('/:id', (req, res) => {
  const idx = findIndexById(users, 'user_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});
router.delete('/:id', (req, res) => {
  const idx = findIndexById(users, 'user_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = users.splice(idx, 1);
  res.json(deleted[0]);
});

module.exports = router; 