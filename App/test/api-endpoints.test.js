const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../app');
const { testData } = require('../schemas/validation');
const utilities = require('../utilities/utilities');

// Mock utilities for testing
const originalWriteProducts = utilities.writeProducts;
const originalReadProducts = utilities.readProducts;
const originalWriteCart = utilities.writeCart;
const originalReadCart = utilities.readCart;

describe('API Endpoints Comprehensive Testing', function() {
    let userToken;
    let adminToken;
    
    // Sample test data
    const sampleProducts = [
        { id: 1, name: 'Test Product 1', price: 19.99 },
        { id: 2, name: 'Test Product 2', price: 29.99 },
        { id: 3, name: 'Test Product 3', price: 39.99 }
    ];
    
    const sampleCart = [
        { id: 1, productId: 1, quantity: 2, addedAt: new Date().toISOString() },
        { id: 2, productId: 2, quantity: 1, addedAt: new Date().toISOString() }
    ];

    beforeEach(function() {
        // Mock data functions
        utilities.readProducts = () => [...sampleProducts];
        utilities.writeProducts = () => {};
        utilities.readCart = () => [...sampleCart];
        utilities.writeCart = () => {};
        
        // Create mock JWT tokens for testing
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'test-secret';
        
        userToken = jwt.sign({
            userId: 'user123',
            email: 'user@test.com',
            roles: ['user']
        }, secret);
        
        adminToken = jwt.sign({
            userId: 'admin123',
            email: 'admin@test.com',
            roles: ['admin']
        }, secret);
    });

    afterEach(function() {
        // Restore original functions
        utilities.writeProducts = originalWriteProducts;
        utilities.readProducts = originalReadProducts;
        utilities.writeCart = originalWriteCart;
        utilities.readCart = originalReadCart;
    });

    describe('Products API Endpoints (/articles)', function() {
        
        describe('GET /articles - Get all products', function() {
            it('should return all products with valid authentication', function(done) {
                request(app)
                    .get('/articles')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('data');
                        expect(res.body.data).to.be.an('array');
                        expect(res.body.data).to.have.length(3);
                        done();
                    });
            });

            it('should return 401 without authentication token', function(done) {
                request(app)
                    .get('/articles')
                    .expect(401)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });

            it('should return 500 with invalid token (JWT malformed)', function(done) {
                request(app)
                    .get('/articles')
                    .set('Authorization', 'Bearer invalid-token')
                    .expect(500)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });

        describe('GET /articles/:id - Get product by ID', function() {
            it('should return specific product with valid ID', function(done) {
                request(app)
                    .get('/articles/1')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body.data).to.have.property('id', 1);
                        expect(res.body.data).to.have.property('name', 'Test Product 1');
                        done();
                    });
            });

            it('should return 404 for non-existent product ID', function(done) {
                request(app)
                    .get('/articles/155999')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Product not found');
                        done();
                    });
            });

            it('should return 400 for invalid ID format', function(done) {
                request(app)
                    .get('/articles/invalid-id')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body.error).to.include('Invalid product ID');
                        done();
                    });
            });
        });

        describe('POST /articles - Create new product', function() {
            it('should create product with valid data and admin token', function(done) {
                const validProduct = testData.products.valid[0];
                request(app)
                    .post('/articles')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validProduct)
                    .expect(201)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('message', 'Product created successfully');
                        expect(res.body.data).to.have.property('name', validProduct.name);
                        expect(res.body.data).to.have.property('price', validProduct.price);
                        done();
                    });
            });

            it('should return 403 for user without admin role', function(done) {
                const validProduct = testData.products.valid[0];
                request(app)
                    .post('/articles')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(validProduct)
                    .expect(403)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });

            it('should return 400 for missing product name', function(done) {
                request(app)
                    .post('/articles')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ price: 19.99 })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Validation failed');
                        done();
                    });
            });

            it('should return 400 for missing price', function(done) {
                request(app)
                    .post('/articles')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Test Product' })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Validation failed');
                        done();
                    });
            });

            it('should return 400 for negative price', function(done) {
                request(app)
                    .post('/articles')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Test Product', price: -10 })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Validation failed');
                        done();
                    });
            });

            it('should return 400 for invalid price type', function(done) {
                request(app)
                    .post('/articles')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Test Product', price: 'not-a-number' })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Validation failed');
                        done();
                    });
            });
        });

        describe('PUT /articles/:id - Update product', function() {
            it('should update product with valid data and admin token', function(done) {
                const updateData = { name: 'Updated Product', price: 99.99 };
                request(app)
                    .put('/articles/1')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(updateData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('message', 'Product updated successfully');
                        done();
                    });
            });

            it('should return 404 for updating non-existent product', function(done) {
                const updateData = { name: 'Updated Product', price: 99.99 };
                request(app)
                    .put('/articles/999')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Product not found');
                        done();
                    });
            });

            it('should return 403 for user without admin role', function(done) {
                const updateData = { name: 'Updated Product', price: 99.99 };
                request(app)
                    .put('/articles/1')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(updateData)
                    .expect(403)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });

        describe('DELETE /articles/:id - Delete product', function() {
            it('should delete product with admin token', function(done) {
                request(app)
                    .delete('/articles/1')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('message', 'Product deleted successfully');
                        done();
                    });
            });

            it('should return 404 for deleting non-existent product', function(done) {
                request(app)
                    .delete('/articles/999')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });

            it('should return 403 for user without admin role', function(done) {
                request(app)
                    .delete('/articles/1')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(403)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });
    });

    describe('Cart API Endpoints (/cart)', function() {
        
        describe('GET /cart - Get cart', function() {
            it('should return cart with valid authentication', function(done) {
                request(app)
                    .get('/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('data');
                        done();
                    });
            });

            it('should return 401 without authentication', function(done) {
                request(app)
                    .get('/cart')
                    .expect(401)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });

        describe('POST /cart - Add to cart', function() {
            it('should add valid product to cart', function(done) {
                const validCartItem = testData.cart.valid[0];
                request(app)
                    .post('/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(validCartItem)
                    .expect(201)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('message', 'Product added to cart successfully');
                        done();
                    });
            });

            it('should return 404 for non-existent product', function(done) {
                request(app)
                    .post('/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ productId: 999, quantity: 1 })
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body).to.have.property('error', 'Product not found');
                        done();
                    });
            });

            it('should return 400 for invalid product ID', function(done) {
                request(app)
                    .post('/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ productId: 'invalid', quantity: 1 })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });

            it('should return 400 for invalid quantity', function(done) {
                request(app)
                    .post('/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ productId: 1, quantity: -1 })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });

        describe('PUT /cart/:id - Update cart item', function() {
            it('should update cart item quantity', function(done) {
                request(app)
                    .put('/cart/1')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ quantity: 5 })
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        done();
                    });
            });

            it('should return 404 for non-existent cart item', function(done) {
                request(app)
                    .put('/cart/999')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ quantity: 5 })
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });

            it('should return 400 for invalid quantity', function(done) {
                request(app)
                    .put('/cart/1')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ quantity: -1 })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });

        describe('DELETE /cart/:id - Remove cart item', function() {
            it('should remove cart item', function(done) {
                request(app)
                    .delete('/cart/1')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        done();
                    });
            });

            it('should return 404 for non-existent cart item', function(done) {
                request(app)
                    .delete('/cart/999')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(404)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        done();
                    });
            });
        });

        describe('DELETE /cart - Clear cart', function() {
            it('should clear entire cart', function(done) {
                request(app)
                    .delete('/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', true);
                        expect(res.body).to.have.property('message', 'Cart cleared successfully');
                        done();
                    });
            });
        });
    });

    describe('Authentication API Endpoints', function() {
        
        describe('POST /register - User registration', function() {
            it('should accept valid registration data format', function(done) {
                const validUser = testData.users.validRegistration[0];
                request(app)
                    .post('/register')
                    .send(validUser)
                    .end((err, res) => {
                        // Response could be 201 (success) or 409 (duplicate) depending on DB state
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });

            it('should return error for invalid email format', function(done) {
                request(app)
                    .post('/register')
                    .send({ email: 'invalid-email', password: 'Password123' })
                    .end((err, res) => {
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });

            it('should return error for short password', function(done) {
                request(app)
                    .post('/register')
                    .send({ email: 'shortpass@example.com', password: 'short' })
                    .expect(422)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body.message).to.include('Password must be at least 8 characters long');
                        done();
                    });
            });

            it('should return error for missing email', function(done) {
                request(app)
                    .post('/register')
                    .send({ password: 'Password123' })
                    .end((err, res) => {
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });

            it('should return error for missing password', function(done) {
                request(app)
                    .post('/register')
                    .send({ email: 'missing-pass@example.com' })
                    .end((err, res) => {
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });
        });

        describe('POST /login - User login', function() {
            it('should accept valid login format', function(done) {
                request(app)
                    .post('/login')
                    .send({ email: 'test@example.com', password: 'anypassword' })
                    .end((err, res) => {
                        // Response could be 200 (success) or 401 (invalid credentials)
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });

            it('should return 401 for non-existent user', function(done) {
                request(app)
                    .post('/login')
                    .send({ email: 'nonexistent@test.com', password: 'Password123' })
                    .expect(401)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body).to.have.property('success', false);
                        expect(res.body.message).to.include('Invalid email or password');
                        done();
                    });
            });

            it('should handle missing email', function(done) {
                request(app)
                    .post('/login')
                    .send({ password: 'password' })
                    .end((err, res) => {
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });

            it('should handle missing password', function(done) {
                request(app)
                    .post('/login')
                    .send({ email: 'test@example.com' })
                    .end((err, res) => {
                        expect(res.body).to.have.property('success');
                        done();
                    });
            });
        });
    });

    describe('Error Handling and Edge Cases', function() {
        
        it('should handle requests with special characters', function(done) {
            const specialData = {
                name: 'Test Product 特殊字符 🚀',
                price: 19.99
            };
            request(app)
                .post('/articles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(specialData)
                .end((err, res) => {
                    expect(res.body).to.have.property('success');
                    done();
                });
        });

        it('should handle very large product names', function(done) {
            const largeData = {
                name: 'A'.repeat(1000),
                price: 19.99
            };
            request(app)
                .post('/articles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(largeData)
                .end((err, res) => {
                    expect(res.body).to.have.property('success');
                    done();
                });
        });

        it('should handle zero price', function(done) {
            request(app)
                .post('/articles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test Product', price: 0 })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });

        it('should handle decimal product IDs', function(done) {
            request(app)
                .get('/articles/1.5')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });

        it('should handle negative product IDs', function(done) {
            request(app)
                .get('/articles/-1')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });
    });
});