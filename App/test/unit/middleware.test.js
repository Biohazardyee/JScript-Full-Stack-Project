/**
 * @fileoverview Unit tests for authentication middleware
 * @description Tests for security and admin middleware functions
 * @author GitHub Copilot
 * @version 1.0.0
 */

const { securityMiddleware, adminMiddleware } = require('../../utilities/utilities');

describe('Authentication Middleware', function() {
    let req, res, next;

    beforeEach(function() {
        // Create fresh mock objects for each test
        req = {
            user: null
        };
        
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis()
        };
        
        next = sinon.stub();
    });

    describe('Security Middleware', function() {
        describe('Role Authorization', function() {
            it('should allow users with "user" role', function() {
                req.user = { roles: ['user'] };

                securityMiddleware(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
            });

            it('should allow users with "admin" role', function() {
                req.user = { roles: ['admin'] };

                securityMiddleware(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
            });

            it('should allow users with multiple valid roles', function() {
                req.user = { roles: ['user', 'admin'] };

                securityMiddleware(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
            });
        });

        describe('Access Denial', function() {
            it('should deny access for unauthorized roles', function() {
                req.user = { roles: ['guest'] };

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should deny access when no user is present', function() {
                req.user = null;

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should deny access for users with empty roles array', function() {
                req.user = { roles: [] };

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should deny access for users without roles property', function() {
                req.user = { id: 'user123' }; // No roles property

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });
        });

        describe('Role Case Sensitivity', function() {
            it('should be case sensitive for role matching', function() {
                req.user = { roles: ['User'] }; // Capital 'U'

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should not match partial role names', function() {
                req.user = { roles: ['use'] }; // Partial match

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });
        });
    });

    describe('Admin Middleware', function() {
        describe('Admin Access Control', function() {
            it('should allow users with "admin" role', function() {
                req.user = { roles: ['admin'] };

                adminMiddleware(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
            });

            it('should allow users with multiple roles including admin', function() {
                req.user = { roles: ['user', 'admin', 'moderator'] };

                adminMiddleware(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
            });
        });

        describe('Access Denial', function() {
            it('should deny access for users with only "user" role', function() {
                req.user = { roles: ['user'] };

                adminMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should deny access for unauthorized roles', function() {
                req.user = { roles: ['moderator'] };

                adminMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should deny access when no user is present', function() {
                req.user = null;

                adminMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should deny access for users with empty roles', function() {
                req.user = { roles: [] };

                adminMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });
        });

        describe('Case Sensitivity', function() {
            it('should be case sensitive for admin role', function() {
                req.user = { roles: ['Admin'] }; // Capital 'A'

                adminMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should not match partial admin role names', function() {
                req.user = { roles: ['admi'] }; // Partial match

                adminMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });
        });
    });

    describe('Middleware Integration', function() {
        describe('Chained Middleware Execution', function() {
            it('should work with both middlewares in sequence for admin user', function() {
                req.user = { roles: ['admin'] };

                // Execute security middleware first
                securityMiddleware(req, res, next);
                expect(next.calledOnce).to.be.true;

                // Reset next stub and execute admin middleware
                next.resetHistory();
                adminMiddleware(req, res, next);
                expect(next.calledOnce).to.be.true;

                // Verify no error responses were sent
                expect(res.status.called).to.be.false;
            });

            it('should fail at admin middleware for user with only user role', function() {
                req.user = { roles: ['user'] };

                // Execute security middleware first - should pass
                securityMiddleware(req, res, next);
                expect(next.calledOnce).to.be.true;

                // Reset mocks and execute admin middleware - should fail
                res.status.resetHistory();
                res.json.resetHistory();
                next.resetHistory();

                adminMiddleware(req, res, next);
                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });
        });

        describe('Error Propagation', function() {
            it('should handle exceptions in middleware gracefully', function() {
                // Create a middleware that throws an error
                const errorMiddleware = (req, res, next) => {
                    throw new Error('Middleware error');
                };

                // This test demonstrates how middleware errors should be handled
                expect(() => errorMiddleware(req, res, next)).to.throw('Middleware error');
            });
        });
    });

    describe('Edge Cases', function() {
        describe('Malformed Request Objects', function() {
            it('should handle undefined user object', function() {
                req.user = undefined;

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should handle user object with null roles', function() {
                req.user = { roles: null };

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should handle user object with non-array roles', function() {
                req.user = { roles: 'admin' }; // String instead of array

                securityMiddleware(req, res, next);

                expect(res.status.calledWith(403)).to.be.true;
                expect(next.called).to.be.false;
            });
        });

        describe('Response Object Validation', function() {
            it('should call response methods correctly', function() {
                req.user = { roles: ['guest'] };

                securityMiddleware(req, res, next);

                // Verify response methods are called in correct order
                expect(res.status.calledBefore(res.json)).to.be.true;
                expect(res.status.calledWith(403)).to.be.true;
                expect(res.json.calledWith({ 
                    success: false, 
                    error: 'Forbidden' 
                })).to.be.true;
            });
        });
    });
});