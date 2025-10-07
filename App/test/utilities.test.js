const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Import the utilities module
const utilities = require('../utilities/utilities');

describe('Utilities Module', () => {
    let fsReadSyncStub, fsWriteSyncStub;

    beforeEach(() => {
        // Create stubs for fs methods to mock file I/O
        fsReadSyncStub = sinon.stub(fs, 'readFileSync');
        fsWriteSyncStub = sinon.stub(fs, 'writeFileSync');
    });

    afterEach(() => {
        // Restore all stubs after each test
        sinon.restore();
    });

    describe('readJson', () => {
        it('should read and parse JSON file successfully', () => {
            const mockData = { items: [{ id: 1, name: 'test' }] };
            fsReadSyncStub.returns(JSON.stringify(mockData));

            const result = utilities.readJson('/test/path.json');

            expect(fsReadSyncStub.calledOnceWith('/test/path.json', 'utf8')).to.be.true;
            expect(result).to.deep.equal(mockData);
        });

        it('should return default value when file read fails', () => {
            fsReadSyncStub.throws(new Error('File not found'));

            const result = utilities.readJson('/test/path.json', []);

            expect(result).to.deep.equal([]);
        });

        it('should return default value when JSON parse fails', () => {
            fsReadSyncStub.returns('invalid json');

            const result = utilities.readJson('/test/path.json', { default: true });

            expect(result).to.deep.equal({ default: true });
        });

        it('should use empty array as default when no default provided', () => {
            fsReadSyncStub.throws(new Error('File error'));

            const result = utilities.readJson('/test/path.json');

            expect(result).to.deep.equal([]);
        });
    });

    describe('writeJson', () => {
        it('should write JSON data to file with proper formatting', () => {
            const testData = { items: [{ id: 1, name: 'test' }] };

            utilities.writeJson('/test/path.json', testData);

            expect(fsWriteSyncStub).to.have.been.calledOnceWith(
                '/test/path.json',
                JSON.stringify(testData, null, 2)
            );
        });

        it('should handle empty data', () => {
            const testData = [];

            utilities.writeJson('/test/path.json', testData);

            expect(fsWriteSyncStub).to.have.been.calledOnceWith(
                '/test/path.json',
                JSON.stringify(testData, null, 2)
            );
        });

        it('should handle complex nested objects', () => {
            const testData = {
                users: [{ id: 1, profile: { name: 'John', settings: { theme: 'dark' } } }],
                metadata: { version: '1.0', timestamp: Date.now() }
            };

            utilities.writeJson('/test/path.json', testData);

            expect(fsWriteSyncStub).to.have.been.calledOnceWith(
                '/test/path.json',
                JSON.stringify(testData, null, 2)
            );
        });
    });

    describe('readCart', () => {
        it('should read cart data from correct file path', () => {
            const mockCartData = [{ id: 1, productId: 1, quantity: 2 }];
            fsReadSyncStub.returns(JSON.stringify(mockCartData));

            const result = utilities.readCart();

            expect(result).to.deep.equal(mockCartData);
            // Verify it's calling the correct file path
            const expectedPath = path.join(__dirname, '..', 'data', 'cart.json');
            expect(fsReadSyncStub).to.have.been.calledWith(expectedPath, 'utf8');
        });

        it('should return empty array when cart file does not exist', () => {
            fsReadSyncStub.throws(new Error('ENOENT: no such file or directory'));

            const result = utilities.readCart();

            expect(result).to.deep.equal([]);
        });
    });

    describe('readProducts', () => {
        it('should read products data from correct file path', () => {
            const mockProductsData = [{ id: 1, name: 'Product 1', price: 10.99 }];
            fsReadSyncStub.returns(JSON.stringify(mockProductsData));

            const result = utilities.readProducts();

            expect(result).to.deep.equal(mockProductsData);
            const expectedPath = path.join(__dirname, '..', 'data', 'products.json');
            expect(fsReadSyncStub).to.have.been.calledWith(expectedPath, 'utf8');
        });

        it('should return empty array when products file does not exist', () => {
            fsReadSyncStub.throws(new Error('ENOENT: no such file or directory'));

            const result = utilities.readProducts();

            expect(result).to.deep.equal([]);
        });
    });

    describe('writeCart', () => {
        it('should write cart data to correct file path', () => {
            const cartData = [{ id: 1, productId: 1, quantity: 2 }];

            utilities.writeCart(cartData);

            const expectedPath = path.join(__dirname, '..', 'data', 'cart.json');
            expect(fsWriteSyncStub).to.have.been.calledWith(
                expectedPath,
                JSON.stringify(cartData, null, 2)
            );
        });
    });

    describe('writeProducts', () => {
        it('should write products data to correct file path', () => {
            const productsData = [{ id: 1, name: 'Product 1', price: 10.99 }];

            utilities.writeProducts(productsData);

            const expectedPath = path.join(__dirname, '..', 'data', 'products.json');
            expect(fsWriteSyncStub).to.have.been.calledWith(
                expectedPath,
                JSON.stringify(productsData, null, 2)
            );
        });
    });

    describe('generateId', () => {
        it('should return 1 for empty array', () => {
            const result = utilities.generateId([]);
            expect(result).to.equal(1);
        });

        it('should return 1 for null or undefined input', () => {
            expect(utilities.generateId(null)).to.equal(1);
            expect(utilities.generateId(undefined)).to.equal(1);
        });

        it('should return 1 for non-array input', () => {
            expect(utilities.generateId('not an array')).to.equal(1);
            expect(utilities.generateId(123)).to.equal(1);
            expect(utilities.generateId({})).to.equal(1);
        });

        it('should return max id + 1 for array with items', () => {
            const items = [
                { id: 1, name: 'item1' },
                { id: 5, name: 'item2' },
                { id: 3, name: 'item3' }
            ];
            const result = utilities.generateId(items);
            expect(result).to.equal(6);
        });

        it('should handle single item array', () => {
            const items = [{ id: 10, name: 'item1' }];
            const result = utilities.generateId(items);
            expect(result).to.equal(11);
        });

        it('should handle negative ids', () => {
            const items = [
                { id: -5, name: 'item1' },
                { id: 2, name: 'item2' },
                { id: -1, name: 'item3' }
            ];
            const result = utilities.generateId(items);
            expect(result).to.equal(3);
        });
    });

    describe('validateProduct', () => {
        it('should return empty array for valid product', () => {
            const validProduct = { name: 'Test Product', price: 19.99 };
            const errors = utilities.validateProduct(validProduct);
            expect(errors).to.be.an('array').that.is.empty;
        });

        it('should return errors for missing name', () => {
            const invalidProduct = { price: 19.99 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Name is required and must be a non-empty string');
        });

        it('should return errors for empty name', () => {
            const invalidProduct = { name: '', price: 19.99 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Name is required and must be a non-empty string');
        });

        it('should return errors for whitespace-only name', () => {
            const invalidProduct = { name: '   ', price: 19.99 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Name is required and must be a non-empty string');
        });

        it('should return errors for non-string name', () => {
            const invalidProduct = { name: 123, price: 19.99 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Name is required and must be a non-empty string');
        });

        it('should return errors for missing price', () => {
            const invalidProduct = { name: 'Test Product' };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Price is required and must be a positive number');
        });

        it('should return errors for zero price', () => {
            const invalidProduct = { name: 'Test Product', price: 0 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Price is required and must be a positive number');
        });

        it('should return errors for negative price', () => {
            const invalidProduct = { name: 'Test Product', price: -5.99 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Price is required and must be a positive number');
        });

        it('should return errors for NaN price', () => {
            const invalidProduct = { name: 'Test Product', price: 'not a number' };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.include('Price is required and must be a positive number');
        });

        it('should handle string price that can be parsed', () => {
            const validProduct = { name: 'Test Product', price: '19.99' };
            const errors = utilities.validateProduct(validProduct);
            expect(errors).to.be.an('array').that.is.empty;
        });

        it('should return multiple errors for completely invalid product', () => {
            const invalidProduct = { name: '', price: -1 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.have.length(2);
            expect(errors).to.include('Name is required and must be a non-empty string');
            expect(errors).to.include('Price is required and must be a positive number');
        });

        it('should return errors for null or undefined product', () => {
            expect(utilities.validateProduct(null)).to.include('Name is required and must be a non-empty string');
            expect(utilities.validateProduct(undefined)).to.include('Name is required and must be a non-empty string');
        });
    });

    describe('calculateBalance', () => {
        it('should calculate total balance correctly', () => {
            const cartItems = [
                { id: 1, productId: 1, quantity: 2 },
                { id: 2, productId: 2, quantity: 1 }
            ];
            const products = [
                { id: 1, name: 'Product 1', price: 10.00 },
                { id: 2, name: 'Product 2', price: 25.99 }
            ];

            const balance = utilities.calculateBalance(cartItems, products);
            expect(balance).to.equal(45.99); // (10.00 * 2) + (25.99 * 1)
        });

        it('should handle empty cart', () => {
            const cartItems = [];
            const products = [{ id: 1, name: 'Product 1', price: 10.00 }];

            const balance = utilities.calculateBalance(cartItems, products);
            expect(balance).to.equal(0);
        });

        it('should handle cart items with non-existent products', () => {
            const cartItems = [
                { id: 1, productId: 999, quantity: 2 } // product doesn't exist
            ];
            const products = [
                { id: 1, name: 'Product 1', price: 10.00 }
            ];

            const balance = utilities.calculateBalance(cartItems, products);
            expect(balance).to.equal(0);
        });

        it('should handle mixed valid and invalid cart items', () => {
            const cartItems = [
                { id: 1, productId: 1, quantity: 2 }, // valid
                { id: 2, productId: 999, quantity: 1 } // invalid product
            ];
            const products = [
                { id: 1, name: 'Product 1', price: 15.50 }
            ];

            const balance = utilities.calculateBalance(cartItems, products);
            expect(balance).to.equal(31.00); // 15.50 * 2
        });

        it('should handle decimal quantities and prices', () => {
            const cartItems = [
                { id: 1, productId: 1, quantity: 1.5 }
            ];
            const products = [
                { id: 1, name: 'Product 1', price: 10.33 }
            ];

            const balance = utilities.calculateBalance(cartItems, products);
            expect(balance).to.be.closeTo(15.495, 0.001);
        });
    });
});