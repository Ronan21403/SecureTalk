const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: { type: String, required: true },
    to: { type: String, required : true}, // optional: null means public
    encryptedMessage: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Message', messageSchema);
