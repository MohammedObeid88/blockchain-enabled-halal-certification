const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    org: { type: String, enum: ['org1', 'org2'], required: true },
    identity: { type: String, required: true },
});

module.exports = mongoose.model('User', userSchema);