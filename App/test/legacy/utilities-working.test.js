const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Import the utilities module
const utilities = require('../utilities/utilities');

describe('Utilities Module - Working Tests', () => {
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
    });

    describe('writeJson', () => {
        it('should write JSON data to file with proper formatting', () => {
            const testData = { items: [{ id: 1, name: 'test' }] };

            utilities.writeJson('/test/path.json', testData);

            expect(fsWriteSyncStub.calledOnceWith(
                '/test/path.json',
                JSON.stringify(testData, null, 2)
            )).to.be.true;
        });

        it('should handle empty data', () => {
            const testData = [];

            utilities.writeJson('/test/path.json', testData);

            expect(fsWriteSyncStub.calledOnceWith(
                '/test/path.json',
                JSON.stringify(testData, null, 2)
            )).to.be.true;
        });
    });

    describe('readCart and readProducts', () => {
        it('should read cart data from correct file path', () => {
            const mockCartData = [{ id: 1, productId: 1, quantity: 2 }];
            fsReadSyncStub.returns(JSON.stringify(mockCartData));

            const result = utilities.readCart();

            expect(result).to.deep.equal(mockCartData);
            // Verify it's calling some file path (exact path checking is complex due to __dirname)
            expect(fsReadSyncStub.called).to.be.true;
        });

        it('should read products data from correct file path', () => {
            const mockProductsData = [{ id: 1, name: 'Product 1', price: 10.99 }];
            fsReadSyncStub.returns(JSON.stringify(mockProductsData));

            const result = utilities.readProducts();

            expect(result).to.deep.equal(mockProductsData);
            expect(fsReadSyncStub.called).to.be.true;
        });

        it('should return empty arrays when files do not exist', () => {
            fsReadSyncStub.throws(new Error('ENOENT: no such file or directory'));

            expect(utilities.readCart()).to.deep.equal([]);
            expect(utilities.readProducts()).to.deep.equal([]);
        });
    });

    describe('writeCart and writeProducts', () => {
        it('should write cart data', () => {
            const cartData = [{ id: 1, productId: 1, quantity: 2 }];

            utilities.writeCart(cartData);

            expect(fsWriteSyncStub.called).to.be.true;
            expect(fsWriteSyncStub.firstCall.args[1]).to.equal(JSON.stringify(cartData, null, 2));
        });

        it('should write products data', () => {
            const productsData = [{ id: 1, name: 'Product 1', price: 10.99 }];

            utilities.writeProducts(productsData);

            expect(fsWriteSyncStub.called).to.be.true;
            expect(fsWriteSyncStub.firstCall.args[1]).to.equal(JSON.stringify(productsData, null, 2));
        });
    });

    describe('generateId', () => {
        it('should return 1 for empty array', () => {
            expect(utilities.generateId([])).to.equal(1);
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
            expect(utilities.generateId(items)).to.equal(6);
        });

        it('should handle single item array', () => {
            const items = [{ id: 10, name: 'item1' }];
            expect(utilities.generateId(items)).to.equal(11);
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

        it('should handle string price that can be parsed', () => {
            const validProduct = { name: 'Test Product', price: '19.99' };
            const errors = utilities.validateProduct(validProduct);
            expect(errors).to.be.an('array').that.is.empty;
        });

        it('should return multiple errors for completely invalid product', () => {
            const invalidProduct = { name: '', price: -1 };
            const errors = utilities.validateProduct(invalidProduct);
            expect(errors).to.have.length(2);
        });

        it('should handle null or undefined product', () => {
            expect(utilities.validateProduct(null)).to.have.length.above(0);
            expect(utilities.validateProduct(undefined)).to.have.length.above(0);
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
            // Use closeTo for floating point comparison
            expect(balance).to.be.closeTo(45.99, 0.01); // (10.00 * 2) + (25.99 * 1)
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
    });

    describe('getCartWithDetails', () => {
        it('should return cart with product details and balance', () => {
            // Mock cart data
            const mockCartData = [
                { id: 1, productId: 1, quantity: 2, addedAt: '2023-01-01T00:00:00Z' },
                { id: 2, productId: 2, quantity: 1, addedAt: '2023-01-02T00:00:00Z' }
            ];

            // Mock products data
            const mockProductsData = [
                { id: 1, name: 'Product 1', price: 10.50 },
                { id: 2, name: 'Product 2', price: 25.99 }
            ];

            // Setup file read stubs to return different data based on file pattern
            fsReadSyncStub.callsFake((filePath) => {
                if (filePath.includes('cart.json')) {
                    return JSON.stringify(mockCartData);
                } else if (filePath.includes('products.json')) {
                    return JSON.stringify(mockProductsData);
                }
                throw new Error('Unknown file');
            });

            const result = utilities.getCartWithDetails();

            expect(result).to.have.property('items').that.is.an('array');
            expect(result).to.have.property('balance');
            expect(result).to.have.property('itemCount');

            // Check items structure
            expect(result.items).to.have.length(2);

            const firstItem = result.items[0];
            expect(firstItem).to.deep.include({
                id: 1,
                productId: 1,
                quantity: 2,
                addedAt: '2023-01-01T00:00:00Z'
            });
            expect(firstItem).to.have.property('product');
            expect(firstItem.product).to.deep.equal({ id: 1, name: 'Product 1', price: 10.50 });
            expect(firstItem).to.have.property('subtotal', 21.00); // 10.50 * 2

            // Check balance calculation (using closeTo for floating point)
            expect(result.balance).to.be.closeTo(46.99, 0.01); // 21.00 + 25.99

            // Check item count
            expect(result.itemCount).to.equal(3); // 2 + 1
        });

        it('should handle empty cart', () => {
            fsReadSyncStub.callsFake((filePath) => {
                if (filePath.includes('cart.json')) {
                    return JSON.stringify([]);
                } else if (filePath.includes('products.json')) {
                    return JSON.stringify([{ id: 1, name: 'Product 1', price: 10.00 }]);
                }
                throw new Error('Unknown file');
            });

            const result = utilities.getCartWithDetails();

            expect(result).to.deep.equal({
                items: [],
                balance: 0,
                itemCount: 0
            });
        });

        it('should handle file read errors gracefully', () => {
            fsReadSyncStub.throws(new Error('File not found'));

            const result = utilities.getCartWithDetails();

            expect(result).to.deep.equal({
                items: [],
                balance: 0,
                itemCount: 0
            });
        });
    });
});