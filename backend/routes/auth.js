const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mongoose = require('mongoose');
const User = require('../models/User.js');
// const faceRecognition = require('../config/faceRecognition.js'); // Disabled for now

const router = express.Router();

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Check if database is available
const isDatabaseAvailable = () => {
    try {
        return mongoose.connection.readyState === 1;
    } catch (error) {
        return false;
    }
};

// Face verification endpoint
router.post('/verify-face', upload.single('faceImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No face image provided' });
        }

        console.log('Processing face verification...');

        // Face recognition disabled - create demo user
        console.log('Running in demo mode - face recognition disabled');
        const token = jwt.sign(
            { userId: 'demo-user-123' },
            process.env.JWT_SECRET || 'demo-secret-key',
            { expiresIn: '7d' }
        );

        return res.json({
            verified: true,
            token,
            user: {
                id: 'demo-user-123',
                name: 'Demo User',
                email: 'demo@skyhi.app',
                avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=7f0df2&color=fff'
            }
        });

    } catch (error) {
        console.error('Face verification error:', error);

        if (error.message.includes('No face detected') || error.message.includes('Multiple faces')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Face verification failed' });
    }
});

// Register new user with face
router.post('/register-face', upload.single('faceImage'), async (req, res) => {
    try {
        const { name, email, unknownFaceId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No face image provided' });
        }

        console.log(`Registering new user: ${name} (${email})`);

        // Check if database is available
        if (!isDatabaseAvailable()) {
            // Demo mode - create a mock user response
            console.log('Running in demo mode - no database connection');
            const token = jwt.sign(
                { userId: 'demo-user-123' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: 'demo-user-123',
                    name: name || 'Demo User',
                    email: email || 'demo@skyhi.app',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Demo User')}&background=7f0df2&color=fff`
                }
            });
        }

        // Extract face descriptor
        const faceDescriptor = await faceRecognition.detectFace(req.file.buffer);

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { 'faceDescriptor': { $exists: true } }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email or face' });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            faceDescriptor,
            role: 'user',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7f0df2&color=fff`,
            loginAttempts: [{
                timestamp: new Date(),
                successful: true,
                faceDescriptor: faceDescriptor
            }]
        });

        await newUser.save();

        // If this was previously an unknown face, delete the unknown record
        if (unknownFaceId) {
            await User.findByIdAndDelete(unknownFaceId);
        }

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get unknown faces (for admin purposes)
router.get('/unknown-faces', async (req, res) => {
    try {
        const unknownUsers = await User.find({ role: 'unknown' })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(unknownUsers);
    } catch (error) {
        console.error('Error fetching unknown faces:', error);
        res.status(500).json({ error: 'Failed to fetch unknown faces' });
    }
});

module.exports = router;