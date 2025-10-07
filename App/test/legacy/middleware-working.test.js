const { expect } = require('chai');
const sinon = require('sinon');

// Import the utilities module
const utilities = require('../utilities/utilities');

describe('Middleware Functions - Working Tests', () => {
    let req, res, next;

    beforeEach(() => {
        // Create mock request, response, and next function
        req = {
            headers: {}
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis()
        };
        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('securityMiddleware', () => {
        it('should call next() for user role', () => {
            req.user = { roles: ['user'] };

            utilities.securityMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(res.status.called).to.be.false;
            expect(res.json.called).to.be.false;
        });

        it('should call next() for admin role', () => {
            req.user = { roles: ['admin'] };

            utilities.securityMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(res.status.called).to.be.false;
            expect(res.json.called).to.be.false;
        });

        it('should return 403 for unauthorized role', () => {
            req.user = { roles: ['guest'] };

            utilities.securityMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                error: 'Forbidden'
            })).to.be.true;
        });

        it('should return 403 when no user present', () => {
            // req.user is undefined

            utilities.securityMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                error: 'Forbidden'
            })).to.be.true;
        });

        it('should return 403 for empty user roles', () => {
            req.user = { roles: [] };

            utilities.securityMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
        });

        it('should be case sensitive for roles', () => {
            req.user = { roles: ['USER'] }; // uppercase

            utilities.securityMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
        });
    });

    describe('adminMiddleware', () => {
        it('should call next() for admin role', () => {
            req.user = { roles: ['admin'] };

            utilities.adminMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(res.status.called).to.be.false;
            expect(res.json.called).to.be.false;
        });

        it('should return 403 for user role', () => {
            req.user = { roles: ['user'] };

            utilities.adminMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                error: 'Forbidden'
            })).to.be.true;
        });

        it('should return 403 for unauthorized role', () => {
            req.user = { roles: ['guest'] };

            utilities.adminMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
        });

        it('should return 403 when no user present', () => {
            utilities.adminMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
        });

        it('should be case sensitive for admin role', () => {
            req.user = { roles: ['ADMIN'] }; // uppercase

            utilities.adminMiddleware(req, res, next);

            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
        });
    });

    describe('Middleware Integration Tests', () => {
        it('should work with both middlewares in sequence for admin', () => {
            req.user = { roles: ['admin'] };

            // First security middleware
            utilities.securityMiddleware(req, res, next);
            expect(next.calledOnce).to.be.true;

            // Reset next spy
            next.resetHistory();

            // Then admin middleware
            utilities.adminMiddleware(req, res, next);
            expect(next.calledOnce).to.be.true;

            // No error responses should have been called
            expect(res.status.called).to.be.false;
            expect(res.json.called).to.be.false;
        });

        it('should fail at admin middleware for user role', () => {
            req.user = { roles: ['user'] };

            // First security middleware (should pass)
            utilities.securityMiddleware(req, res, next);
            expect(next.calledOnce).to.be.true;

            // Reset mocks
            next.resetHistory();
            res.status.resetHistory();
            res.json.resetHistory();

            // Then admin middleware (should fail)
            utilities.adminMiddleware(req, res, next);
            expect(next.called).to.be.false;
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                error: 'Forbidden'
            })).to.be.true;
        });
    });

    describe('Middleware Error Handling', () => {
        it('should handle exceptions in middleware gracefully', () => {
            // Simulate an error by making res.status throw
            res.status.throws(new Error('Response error'));
            req.user = { roles: ['invalid'] };

            expect(() => {
                utilities.securityMiddleware(req, res, next);
            }).to.throw('Response error');

            expect(next.called).to.be.false;
        });
    });
});