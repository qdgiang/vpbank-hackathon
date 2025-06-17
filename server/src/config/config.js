require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5001,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/jar-budget',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key'
}; 