/**
 * @fileoverview Test helpers and utilities for API testing
 * @author GitHub Copilot
 * @version 1.0.0
 */

const request = require('supertest');
const app = require('../../app');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Test configuration constants
 */
const TEST_CONFIG = {
    TIMEOUT: 20000,
    DEFAULT_PASSWORD: 'testpass123',
    ADMIN_PASSWORD: 'adminpass123',
    TEST_IMAGE_PATH: path.join(__dirname, '../imgs/1718217729729.jpg'),
    TEST_IMAGE_HASH: 'fb9a32989d331497bbd0393e3b423cde',
    API_ENDPOINTS: {
        REGISTER: '/register',
        LOGIN: '/login',
        ARTICLES: '/articles',
        CART: '/cart',
        DOCUMENTS: '/documents'
    },
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_ERROR: 500
    }
};

/**
 * Test user factory for creating unique test users
 */
class TestUserFactory {
    /**
     * Generate a unique email for testing
     * @param {string} prefix - Email prefix
     * @returns {string} Unique email address
     */
    static generateEmail(prefix = 'test') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
    }

    /**
     * Create a test user object
     * @param {string} role - User role ('user' or 'admin')
     * @returns {Object} Test user object
     */
    static createUser(role = 'user') {
        const user = {
            email: this.generateEmail(role),
            password: role === 'admin' ? TEST_CONFIG.ADMIN_PASSWORD : TEST_CONFIG.DEFAULT_PASSWORD
        };

        if (role === 'admin') {
            user.roles = ['admin'];
        }

        return user;
    }
}

/**
 * Authentication helper for managing test user sessions
 */
class AuthHelper {
    /**
     * Register a new user and return the response
     * @param {Object} userData - User data for registration
     * @returns {Promise<Object>} Registration response
     */
    static async registerUser(userData) {
        return await request(app)
            .post(TEST_CONFIG.API_ENDPOINTS.REGISTER)
            .send(userData);
    }

    /**
     * Login user and return the response with token
     * @param {Object} credentials - User login credentials
     * @returns {Promise<Object>} Login response with token
     */
    static async loginUser(credentials) {
        return await request(app)
            .post(TEST_CONFIG.API_ENDPOINTS.LOGIN)
            .send(credentials);
    }

    /**
     * Create and authenticate a test user
     * @param {string} role - User role ('user' or 'admin')
     * @returns {Promise<Object>} Object with user data and token
     */
    static async createAuthenticatedUser(role = 'user') {
        const userData = TestUserFactory.createUser(role);
        
        // Try to register (might fail if user exists)
        await this.registerUser(userData);
        
        // Login to get token
        const loginResponse = await this.loginUser({
            email: userData.email,
            password: userData.password
        });

        return {
            userData,
            token: loginResponse.body.token,
            userId: loginResponse.body.user?.id
        };
    }
}

/**
 * File helper utilities for document testing
 */
class FileHelper {
    /**
     * Create a test buffer with specified size
     * @param {number} size - Buffer size in bytes
     * @param {string} content - Content pattern
     * @returns {Buffer} Test buffer
     */
    static createTestBuffer(size, content = 'test') {
        const buffer = Buffer.alloc(size);
        const contentBuffer = Buffer.from(content);
        
        for (let i = 0; i < size; i += contentBuffer.length) {
            const remainingSize = Math.min(contentBuffer.length, size - i);
            contentBuffer.copy(buffer, i, 0, remainingSize);
        }
        
        return buffer;
    }

    /**
     * Create a test image buffer
     * @param {string} type - Image type ('png' or 'jpg')
     * @returns {Buffer} Test image buffer
     */
    static createTestImage(type = 'png') {
        const signatures = {
            png: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            jpg: Buffer.from([0xFF, 0xD8, 0xFF])
        };

        const signature = signatures[type] || signatures.png;
        const padding = Buffer.alloc(64 - signature.length);
        return Buffer.concat([signature, padding]);
    }

    /**
     * Calculate MD5 hash of a buffer
     * @param {Buffer} buffer - Buffer to hash
     * @returns {string} MD5 hash
     */
    static calculateHash(buffer) {
        return crypto.createHash('md5').update(buffer).digest('hex');
    }

    /**
     * Read and hash the test image file
     * @returns {Object} Object with buffer and hash
     */
    static getTestImageData() {
        const buffer = fs.readFileSync(TEST_CONFIG.TEST_IMAGE_PATH);
        const hash = this.calculateHash(buffer);
        return { buffer, hash };
    }
}

/**
 * API testing helper for common request patterns
 */
class ApiHelper {
    /**
     * Make an authenticated request
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {string} token - JWT token
     * @param {Object} data - Request data
     * @returns {Promise<Object>} Response object
     */
    static async authenticatedRequest(method, endpoint, token, data = null) {
        const req = request(app)[method.toLowerCase()](endpoint);
        
        if (token) {
            req.set('Authorization', `Bearer ${token}`);
        }
        
        if (data) {
            req.send(data);
        }
        
        return await req;
    }

    /**
     * Upload a file with authentication
     * @param {string} endpoint - Upload endpoint
     * @param {string} token - JWT token
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} filename - File name
     * @param {string} mimetype - MIME type
     * @returns {Promise<Object>} Upload response
     */
    static async uploadFile(endpoint, token, fileBuffer, filename, mimetype) {
        return await request(app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .attach('file', fileBuffer, {
                filename,
                contentType: mimetype
            });
    }
}

/**
 * Test validation helpers
 */
class ValidationHelper {
    /**
     * Validate standard API response structure
     * @param {Object} response - Response object
     * @param {number} expectedStatus - Expected status code
     * @param {boolean} shouldSucceed - Whether the response should indicate success
     */
    static validateApiResponse(response, expectedStatus, shouldSucceed = true) {
        const { expect } = require('chai');
        
        expect(response.status).to.equal(expectedStatus);
        expect(response.body).to.be.an('object');
        expect(response.body.success).to.equal(shouldSucceed);
    }

    /**
     * Validate JWT token structure
     * @param {string} token - JWT token to validate
     */
    static validateJwtToken(token) {
        const { expect } = require('chai');
        
        expect(token).to.be.a('string');
        expect(token.split('.')).to.have.length(3);
    }

    /**
     * Validate pagination response
     * @param {Object} response - Response with pagination
     */
    static validatePaginatedResponse(response) {
        const { expect } = require('chai');
        
        expect(response.body.data).to.be.an('array');
        expect(response.body).to.have.property('total');
        expect(response.body).to.have.property('page');
        expect(response.body).to.have.property('limit');
    }
}

/**
 * Database cleanup utilities
 */
class CleanupHelper {
    /**
     * Clean up test files from uploads directory
     * @param {Array<string>} filenames - Array of filenames to clean up
     */
    static cleanupUploadedFiles(filenames = []) {
        const uploadsDir = path.join(__dirname, '../data/uploads');
        
        filenames.forEach(filename => {
            const filePath = path.join(uploadsDir, filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.warn(`Failed to cleanup file ${filename}:`, error.message);
            }
        });
    }

    /**
     * Clean up test data from JSON files
     * @param {Array<Object>} documents - Documents to remove from documents.json
     */
    static async cleanupTestDocuments(documents = []) {
        // This would implement cleanup logic for test documents
        // Implementation depends on your data storage strategy
    }
}

module.exports = {
    TEST_CONFIG,
    TestUserFactory,
    AuthHelper,
    FileHelper,
    ApiHelper,
    ValidationHelper,
    CleanupHelper
};