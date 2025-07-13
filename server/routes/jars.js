const express = require('express');
const router = express.Router();
const { jars } = require('../mockData');
const findById = (arr, key, val) => arr.find(item => item[key] === val);
const findIndexById = (arr, key, val) => arr.findIndex(item => item[key] === val);

router.get('/', (req, res) => res.json(jars));
router.get('/:id', (req, res) => {
  const jar = findById(jars, 'jar_code', req.params.id);
  if (!jar) return res.status(404).json({ error: 'Not found' });
  res.json(jar);
});
router.post('/', (req, res) => {
  const newJar = { ...req.body, jar_code: `jar-${Date.now()}` };
  jars.push(newJar);
  res.status(201).json(newJar);
});
router.put('/:id', (req, res) => {
  const idx = findIndexById(jars, 'jar_code', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  jars[idx] = { ...jars[idx], ...req.body };
  res.json(jars[idx]);
});
router.delete('/:id', (req, res) => {
  const idx = findIndexById(jars, 'jar_code', req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = jars.splice(idx, 1);
  res.json(deleted[0]);
});

module.exports = router; 