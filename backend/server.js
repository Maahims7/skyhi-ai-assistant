const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files with proper MIME types
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }

        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Database connection with fallback
const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
        });
        console.log('✅ Connected to MongoDB');

        // Face recognition disabled for now - requires Visual Studio build tools
        console.log('ℹ️  Face recognition disabled - install Visual Studio build tools to enable');
    } catch (error) {
        console.log('⚠️  MongoDB connection failed, running in demo mode');
        console.log('   To enable full functionality, install MongoDB locally or update MONGODB_URI');

        // Face recognition disabled for now - requires Visual Studio build tools
        console.log('ℹ️  Face recognition disabled - install Visual Studio build tools to enable');
    }
};

connectToDatabase();

// Routes
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/ai', require('./routes/ai.js'));
app.use('/api/integrations', require('./routes/integrations.js'));
app.use('/api/tasks', require('./routes/tasks.js'));
app.use('/api/schedule', require('./routes/schedule.js'));

// API route
app.get('/api', (req, res) => {
    res.json({
        message: '🚀 SkyHi AI Assistant API is running!',
        version: '2.0',
        features: ['Face Recognition', 'AI Chat', 'Voice Control']
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 SkyHi server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}`);
    console.log(`📚 Docs: http://localhost:${PORT}/api`);
});