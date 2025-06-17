const express = require('express');
const router = express.Router();
const jarController = require('../controllers/jarController');
const auth = require('../middleware/auth');

// All routes are protected with auth middleware
router.use(auth);

// Get all jars for the authenticated user
router.get('/', jarController.getJars);

// Get a single jar
router.get('/:id', jarController.getJar);

// Create a new jar
router.post('/', jarController.createJar);

// Update a jar
router.put('/:id', jarController.updateJar);

// Delete a jar
router.delete('/:id', jarController.deleteJar);

module.exports = router; 