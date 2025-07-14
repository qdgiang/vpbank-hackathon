const express = require('express');
const router = express.Router();
const { goals } = require('../mockData');
const findById = (arr, key, val) => arr.find(item => item[key] === val);
const findIndexById = (arr, key, val) => arr.findIndex(item => item[key] === val);

router.get('/', (req, res) => res.json(goals));
router.get('/:id', (req, res) => {
  const goal = findById(goals, 'goal_id', req.params.id);
  if (!goal) return res.status(404).json({ error: 'Not found' });
  res.json(goal);
});
router.post('/', (req, res) => {
  const newGoal = { ...req.body, goal_id: `goal-${Date.now()}` };
  goals.push(newGoal);
  res.status(201).json(newGoal);
});
router.put('/:id', (req, res) => {
  const idx = findIndexById(goals, 'goal_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  goals[idx] = { ...goals[idx], ...req.body };
  res.json(goals[idx]);
});
router.delete('/:id', (req, res) => {
  const idx = findIndexById(goals, 'goal_id', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = goals.splice(idx, 1);
  res.json(deleted[0]);
});

module.exports = router; 