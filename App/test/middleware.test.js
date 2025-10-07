const { expect } = require('chai');
const sinon = require('sinon');

// Import the utilities module
const utilities = require('../utilities/utilities');

describe('Middleware Functions', () => {
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
            req.headers.value = 'user';

            utilities.securityMiddleware(req, res, next);

            expect(next).to.have.been.calledOnce;
            expect(res.status).to.not.have.been.called;
            expect(res.json).to.not.have.been.called;
        });

        it('should call next() for admin role', () => {
            req.headers.value = 'admin';

            utilities.securityMiddleware(req, res, next);

            expect(next).to.have.been.calledOnce;
            expect(res.status).to.not.have.been.called;
            expect(res.json).to.not.have.been.called;
        });

        it('should return 403 for unauthorized role', () => {
            req.headers.value = 'guest';

            utilities.securityMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should return 403 when no value header present', () => {
            // req.headers.value is undefined

            utilities.securityMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should return 403 for empty value header', () => {
            req.headers.value = '';

            utilities.securityMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should return 403 for null value header', () => {
            req.headers.value = null;

            utilities.securityMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should be case sensitive for roles', () => {
            req.headers.value = 'USER'; // uppercase

            utilities.securityMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should handle special characters in role', () => {
            req.headers.value = 'user '; // trailing space

            utilities.securityMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });
    });

    describe('adminMiddleware', () => {
        it('should call next() for admin role', () => {
            req.headers.value = 'admin';

            utilities.adminMiddleware(req, res, next);

            expect(next).to.have.been.calledOnce;
            expect(res.status).to.not.have.been.called;
            expect(res.json).to.not.have.been.called;
        });

        it('should return 403 for user role', () => {
            req.headers.value = 'user';

            utilities.adminMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should return 403 for unauthorized role', () => {
            req.headers.value = 'guest';

            utilities.adminMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should return 403 when no value header present', () => {
            // req.headers.value is undefined

            utilities.adminMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should return 403 for empty value header', () => {
            req.headers.value = '';

            utilities.adminMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should be case sensitive for admin role', () => {
            req.headers.value = 'ADMIN'; // uppercase

            utilities.adminMiddleware(req, res, next);

            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });

        it('should handle multiple middleware calls independently', () => {
            // First call - admin access
            req.headers.value = 'admin';
            utilities.adminMiddleware(req, res, next);
            expect(next).to.have.been.calledOnce;

            // Reset mocks
            next.resetHistory();
            res.status.resetHistory();
            res.json.resetHistory();

            // Second call - user access (should be denied)
            req.headers.value = 'user';
            utilities.adminMiddleware(req, res, next);
            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
        });
    });

    describe('Middleware Error Handling', () => {
        it('should handle exceptions in securityMiddleware gracefully', () => {
            // Simulate an error in the middleware by making res.status throw
            res.status.throws(new Error('Response error'));
            req.headers.value = 'invalid';

            expect(() => {
                utilities.securityMiddleware(req, res, next);
            }).to.throw('Response error');

            expect(next).to.not.have.been.called;
        });

        it('should handle exceptions in adminMiddleware gracefully', () => {
            // Simulate an error in the middleware by making res.status throw
            res.status.throws(new Error('Response error'));
            req.headers.value = 'user';

            expect(() => {
                utilities.adminMiddleware(req, res, next);
            }).to.throw('Response error');

            expect(next).to.not.have.been.called;
        });
    });

    describe('Middleware Integration Tests', () => {
        it('should work with both middlewares in sequence for admin', () => {
            req.headers.value = 'admin';

            // First security middleware
            utilities.securityMiddleware(req, res, next);
            expect(next).to.have.been.calledOnce;

            // Reset next spy
            next.resetHistory();

            // Then admin middleware
            utilities.adminMiddleware(req, res, next);
            expect(next).to.have.been.calledOnce;

            // No error responses should have been called
            expect(res.status).to.not.have.been.called;
            expect(res.json).to.not.have.been.called;
        });

        it('should fail at admin middleware for user role', () => {
            req.headers.value = 'user';

            // First security middleware (should pass)
            utilities.securityMiddleware(req, res, next);
            expect(next).to.have.been.calledOnce;

            // Reset mocks
            next.resetHistory();
            res.status.resetHistory();
            res.json.resetHistory();

            // Then admin middleware (should fail)
            utilities.adminMiddleware(req, res, next);
            expect(next).to.not.have.been.called;
            expect(res.status).to.have.been.calledWith(403);
            expect(res.json).to.have.been.calledWith({
                success: false,
                error: 'Forbidden'
            });
        });
    });
});