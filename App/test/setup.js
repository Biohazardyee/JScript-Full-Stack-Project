/**
 * @fileoverview Global test setup and configuration
 * @author GitHub Copilot
 * @version 1.0.0
 */

const chai = require('chai');
const sinon = require('sinon');

// Configure Chai
chai.config.includeStack = true;

// Global test configuration
global.expect = chai.expect;
global.sinon = sinon;

// Set default timeout for all tests
const DEFAULT_TIMEOUT = 20000;

// Global test hooks
before(function() {
    this.timeout(DEFAULT_TIMEOUT);
    console.log('🧪 Starting test suite...');
});

after(function() {
    console.log('✅ Test suite completed');
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

module.exports = {
    DEFAULT_TIMEOUT
};