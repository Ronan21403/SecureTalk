const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: String,
    password: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', messageSchema);
