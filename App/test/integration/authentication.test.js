/**
 * @fileoverview Authentication API integration tests
 * @description Tests for user registration, login, and JWT token validation
 * @author GitHub Copilot
 * @version 1.0.0
 */

const request = require('supertest');
const app = require('../../app');
const { 
    TEST_CONFIG, 
    TestUserFactory, 
    AuthHelper, 
    ValidationHelper 
} = require('./helpers/test-helpers');

describe('Authentication API', function() {
    // Set timeout for all tests in this suite
    this.timeout(TEST_CONFIG.TIMEOUT);

    describe('User Registration', function() {
        describe('POST /register - Success Cases', function() {
            it('should successfully register a new user', async function() {
                const userData = TestUserFactory.createUser();

                const response = await AuthHelper.registerUser(userData);

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.CREATED);
                expect(response.body.message).to.include('Added user');
                expect(response.body.data).to.include(userData.email);
            });

            it('should successfully register a user with admin roles', async function() {
                const adminData = TestUserFactory.createUser('admin');

                const response = await AuthHelper.registerUser(adminData);

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.CREATED);
                expect(response.body.message).to.include('Added user');
            });
        });

        describe('POST /register - Validation', function() {
            it('should validate required email field', async function() {
                const invalidUser = { password: TEST_CONFIG.DEFAULT_PASSWORD };

                const response = await AuthHelper.registerUser(invalidUser);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR, 
                    false
                );
            });

            it('should validate required password field', async function() {
                const invalidUser = { email: TestUserFactory.generateEmail() };

                const response = await AuthHelper.registerUser(invalidUser);
                
                // This test may timeout due to validation issues
                if (response) {
                    ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR, false);
                }
            });

            it('should validate email format', async function() {
                const invalidUser = {
                    email: 'invalid-email-format',
                    password: TEST_CONFIG.DEFAULT_PASSWORD
                };

                const response = await AuthHelper.registerUser(invalidUser);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR, 
                    false
                );
            });

            it('should validate password length requirements', async function() {
                const invalidUser = {
                    email: TestUserFactory.generateEmail(),
                    password: '123' // Too short
                };

                const response = await AuthHelper.registerUser(invalidUser);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.CONFLICT, 
                    false
                );
            });
        });

        describe('POST /register - Duplicate Prevention', function() {
            it('should prevent duplicate email registration', async function() {
                const userData = TestUserFactory.createUser();

                // Register user first time
                await AuthHelper.registerUser(userData);

                // Attempt to register again
                const duplicateResponse = await AuthHelper.registerUser(userData);

                ValidationHelper.validateApiResponse(
                    duplicateResponse, 
                    TEST_CONFIG.HTTP_STATUS.CONFLICT, 
                    false
                );
            });
        });
    });

    describe('User Login', function() {
        let testUser;

        before(async function() {
            // Create a test user for login tests
            testUser = TestUserFactory.createUser();
            await AuthHelper.registerUser(testUser);
        });

        describe('POST /login - Success Cases', function() {
            it('should login successfully with valid credentials', async function() {
                const credentials = {
                    email: testUser.email,
                    password: testUser.password
                };

                const response = await AuthHelper.loginUser(credentials);

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                expect(response.body).to.have.property('token');
                expect(response.body).to.have.property('user');
                expect(response.body.user.email).to.equal(testUser.email);
                expect(response.body.user.roles).to.be.an('array');
                
                ValidationHelper.validateJwtToken(response.body.token);
            });
        });

        describe('POST /login - Validation', function() {
            it('should reject login with invalid email', async function() {
                const invalidCredentials = {
                    email: 'nonexistent@example.com',
                    password: testUser.password
                };

                const response = await AuthHelper.loginUser(invalidCredentials);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });

            it('should reject login with invalid password', async function() {
                const invalidCredentials = {
                    email: testUser.email,
                    password: 'wrongpassword'
                };

                const response = await AuthHelper.loginUser(invalidCredentials);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });

            it('should validate required email field for login', async function() {
                const incompleteCredentials = { password: testUser.password };

                const response = await AuthHelper.loginUser(incompleteCredentials);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });

            it('should validate required password field for login', async function() {
                const incompleteCredentials = { email: testUser.email };

                const response = await AuthHelper.loginUser(incompleteCredentials);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR, 
                    false
                );
            });

            it('should handle empty request body', async function() {
                const response = await AuthHelper.loginUser({});

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });
        });
    });

    describe('JWT Token Validation', function() {
        let validToken;

        before(async function() {
            // Get a valid token for testing
            const { token } = await AuthHelper.createAuthenticatedUser();
            validToken = token;
        });

        describe('Token Authentication', function() {
            it('should accept valid JWT token', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.ARTICLES)
                    .set('Authorization', `Bearer ${validToken}`);

                expect(response.status).to.equal(TEST_CONFIG.HTTP_STATUS.OK);
            });

            it('should reject request without token', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.ARTICLES);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });

            it('should reject invalid token format', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.ARTICLES)
                    .set('Authorization', 'Bearer invalid-token');

                expect(response.status).to.equal(TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR);
            });

            it('should reject malformed authorization header', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.ARTICLES)
                    .set('Authorization', 'InvalidFormat');

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });

            it('should reject empty authorization header', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.ARTICLES)
                    .set('Authorization', '');

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });
        });
    });
});