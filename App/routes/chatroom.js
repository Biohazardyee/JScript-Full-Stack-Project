const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

var router = express.Router();

var previousMessages = [];

/**
 * Web authentication middleware for chat page
 */
function authenticateWebToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token
    
    if (!token) {
        return res.redirect('/login-page');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.redirect('/login-page');
    }
}

// Serve the chat page (protected)
router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../views/chat.html'));
});

function setupChat(server) {
    const { Server } = require('socket.io');
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    
    // Socket.io authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication required'));
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });
    
    io.on('connection', (socket) => {
        console.log(`User ${socket.user.email} connected to chat`);
        
        // Handle chat history request
        socket.on('request history', () => {
            console.log(`User ${socket.user.email} requested chat history`);
            socket.emit('chat history', previousMessages);
        });
        
        socket.on('disconnect', () => {
            console.log(`User ${socket.user.email} disconnected from chat`);
        });
        
        socket.on('chat message', (msg) => {
            console.log(`Message from ${socket.user.email}: ${msg}`);
            
            // Create enhanced message object
            const messageObj = {
                id: Date.now(),
                content: msg,
                username: socket.user.email,
                timestamp: new Date().toISOString(),
                userId: socket.user.id
            };
            
            // Add message to history
            previousMessages.push(messageObj);
            
            // Broadcast to all connected users
            io.emit('chat message', messageObj);
            
            // Keep only the last 50 messages
            clearMessages();
        });
    });
    return io;
}

function clearMessages() {
    if (previousMessages.length > 50) {
        // Remove oldest messages, keep only the last 50
        previousMessages.splice(0, previousMessages.length - 50);
    }
}

module.exports = { router, setupChat, authenticateWebToken };