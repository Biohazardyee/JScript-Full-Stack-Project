const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(
    process.env.MongoDBConnection
);

const db = mongoose.connection;

db.on('error', (err) => {
    console.log(err);
});

db.once('open', () => {
    console.log('connected');
});


const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
    },
    roles: {
        type: Array,
        default: ['user'],
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
