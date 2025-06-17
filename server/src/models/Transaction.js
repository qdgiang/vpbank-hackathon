const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['necessities', 'financialFreedom', 'longTermSavings', 'education', 'play', 'give']
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    isAutoClassified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Transaction', transactionSchema); 