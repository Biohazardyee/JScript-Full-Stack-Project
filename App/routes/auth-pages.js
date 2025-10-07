const express = require('express');
const path = require('path');
const router = express.Router();

/**
 * Serve login page
 */
router.get('/login-page', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

/**
 * Serve register page
 */
router.get('/register-page', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/register.html'));
});

/**
 * Root redirect to login page
 */
router.get('/', (req, res) => {
    res.redirect('/login-page');
});

module.exports = router;