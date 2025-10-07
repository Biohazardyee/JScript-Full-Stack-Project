/**
 * @fileoverview Main Express application configuration
 * @description Express.js application with JWT authentication, MongoDB integration, and API routes
 * @author GitHub Copilot
 * @version 1.0.0
 */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Load environment variables
require('dotenv').config();

// Initialize database connection
require('./config/database');

// Import route handlers
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const articlesRouter = require('./routes/articles');
const cartRouter = require('./routes/cart');
const documentsRouter = require('./routes/documents');
const { router: chatRouter } = require('./routes/chatroom');
const authPagesRouter = require('./routes/auth-pages');

// Import middleware
const authMiddleware = require('./middleware/auth');

/**
 * Create Express application instance
 */
const app = express();

/**
 * Configure view engine
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/**
 * Configure middleware stack
 */
// Development logging
if (process.env.NODE_ENV !== 'production') {
    app.use(logger('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Cookie parsing
app.use(cookieParser());

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Configure public routes (no authentication required)
 */
app.use('/', authPagesRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/chat', chatRouter);

/**
 * Apply authentication middleware to all subsequent routes
 */
app.use(authMiddleware);

/**
 * Configure protected routes (authentication required)
 */
app.use('/articles', articlesRouter);
app.use('/cart', cartRouter);
app.use('/documents', documentsRouter);


/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * Handle 404 errors - route not found
 */
app.use((req, res, next) => {
    const error = createError(404, `Route ${req.method} ${req.path} not found`);
    next(error);
});

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
app.use((err, req, res, next) => {
    // Set locals for error page rendering
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Determine error status
    const status = err.status || err.statusCode || 500;

    // Handle API vs web requests differently
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
        // API endpoints - return JSON error
        return res.status(status).json({
            success: false,
            error: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // Web endpoints - render error page
    res.status(status);
    res.render('error');
});

module.exports = app;
