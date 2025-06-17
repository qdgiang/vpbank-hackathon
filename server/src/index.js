const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose');
const config = require('./config/config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// mongoose.connect(config.MONGODB_URI)
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(err => console.error('MongoDB connection error:', err));

// Routes will be added here
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Jar Budget API' });
});

// Start server
app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
}); 