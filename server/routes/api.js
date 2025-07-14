const express = require('express');
const router = express.Router();
const { users, transactions, notifications, goals, jars } = require('../mockData');

// Helper to find by id
const findById = (arr, key, val) => arr.find(item => item[key] === val);
const findIndexById = (arr, key, val) => arr.findIndex(item => item[key] === val);

// USERS
router.get('/users', (req, res) => res.json(users));
router.get('/users/:id', (req, res) => {
  const user = findById(users, 'user_id', req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});
router.post('/users', (req, res) => {
  const newUser = { ...req.body, user_id: `user-${Date.now()}` };
  users.push(newUser);
  res.status(201).json(newUser);
});
router.put('/users/:id', (req, res) => {
  const idx = findIndexById(users, 'user_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});
router.delete('/users/:id', (req, res) => {
  const idx = findIndexById(users, 'user_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = users.splice(idx, 1);
  res.json(deleted[0]);
});

// TRANSACTIONS
router.get('/transactions', (req, res) => res.json(transactions));
router.get('/transactions/:id', (req, res) => {
  const tx = findById(transactions, 'transaction_id', req.params.id);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  res.json(tx);
});
router.post('/transactions', (req, res) => {
  const newTx = { ...req.body, transaction_id: `tx-${Date.now()}` };
  transactions.push(newTx);
  res.status(201).json(newTx);
});
router.put('/transactions/:id', (req, res) => {
  const idx = findIndexById(transactions, 'transaction_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  transactions[idx] = { ...transactions[idx], ...req.body };
  res.json(transactions[idx]);
});
router.delete('/transactions/:id', (req, res) => {
  const idx = findIndexById(transactions, 'transaction_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = transactions.splice(idx, 1);
  res.json(deleted[0]);
});

// NOTIFICATIONS
router.get('/notifications', (req, res) => res.json(notifications));
router.get('/notifications/:id', (req, res) => {
  const noti = findById(notifications, 'notification_id', req.params.id);
  if (!noti) return res.status(404).json({ error: 'Not found' });
  res.json(noti);
});
router.post('/notifications', (req, res) => {
  const newNoti = { ...req.body, notification_id: `noti-${Date.now()}` };
  notifications.push(newNoti);
  res.status(201).json(newNoti);
});
router.put('/notifications/:id', (req, res) => {
  const idx = findIndexById(notifications, 'notification_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  notifications[idx] = { ...notifications[idx], ...req.body };
  res.json(notifications[idx]);
});
router.delete('/notifications/:id', (req, res) => {
  const idx = findIndexById(notifications, 'notification_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = notifications.splice(idx, 1);
  res.json(deleted[0]);
});

// GOALS
router.get('/goals', (req, res) => res.json(goals));
router.get('/goals/:id', (req, res) => {
  const goal = findById(goals, 'goal_id', req.params.id);
  if (!goal) return res.status(404).json({ error: 'Not found' });
  res.json(goal);
});
router.post('/goals', (req, res) => {
  const newGoal = { ...req.body, goal_id: `goal-${Date.now()}` };
  goals.push(newGoal);
  res.status(201).json(newGoal);
});
router.put('/goals/:id', (req, res) => {
  const idx = findIndexById(goals, 'goal_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  goals[idx] = { ...goals[idx], ...req.body };
  res.json(goals[idx]);
});
router.delete('/goals/:id', (req, res) => {
  const idx = findIndexById(goals, 'goal_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = goals.splice(idx, 1);
  res.json(deleted[0]);
});

// JARS
router.get('/jars', (req, res) => res.json(jars));
router.get('/jars/:id', (req, res) => {
  const jar = findById(jars, 'jar_code', req.params.id);
  if (!jar) return res.status(404).json({ error: 'Not found' });
  res.json(jar);
});
router.post('/jars', (req, res) => {
  const newJar = { ...req.body, jar_code: `jar-${Date.now()}` };
  jars.push(newJar);
  res.status(201).json(newJar);
});
router.put('/jars/:id', (req, res) => {
  const idx = findIndexById(jars, 'jar_code', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  jars[idx] = { ...jars[idx], ...req.body };
  res.json(jars[idx]);
});
router.delete('/jars/:id', (req, res) => {
  const idx = findIndexById(jars, 'jar_code', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = jars.splice(idx, 1);
  res.json(deleted[0]);
});

module.exports = router; 