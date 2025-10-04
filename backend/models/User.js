const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // Store face descriptors for recognition
    faceDescriptor: {
        type: [Number], // Array of 128 numbers (face embedding)
        required: true
    },
    avatar: {
        type: String,
        default: ''
    },
    preferences: {
        theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'auto' },
        wakeWord: { type: String, default: 'Hey SkyHi' },
        voice: { type: String, default: 'default' }
    },
    role: {
        type: String,
        enum: ['user', 'unknown'],
        default: 'user'
    },
    loginAttempts: [{
        timestamp: { type: Date, default: Date.now },
        successful: Boolean,
        faceDescriptor: [Number] // Store unknown face data
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

// Index for faster face searches
userSchema.index({ role: 1 });
userSchema.index({ 'faceDescriptor': 1 });

module.exports = mongoose.model('User', userSchema);