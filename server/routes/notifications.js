const express = require('express');
const router = express.Router();
const { notifications } = require('../mockData');
const findById = (arr, key, val) => arr.find(item => item[key] === val);
const findIndexById = (arr, key, val) => arr.findIndex(item => item[key] === val);

router.get('/', (req, res) => res.json(notifications));
router.get('/:id', (req, res) => {
  const noti = findById(notifications, 'notification_id', req.params.id);
  if (!noti) return res.status(404).json({ error: 'Not found' });
  res.json(noti);
});
router.post('/', (req, res) => {
  const newNoti = { ...req.body, notification_id: `noti-${Date.now()}` };
  notifications.push(newNoti);
  res.status(201).json(newNoti);
});
router.put('/:id', (req, res) => {
  const idx = findIndexById(notifications, 'notification_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  notifications[idx] = { ...notifications[idx], ...req.body };
  res.json(notifications[idx]);
});
router.delete('/:id', (req, res) => {
  const idx = findIndexById(notifications, 'notification_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = notifications.splice(idx, 1);
  res.json(deleted[0]);
});

module.exports = router; 