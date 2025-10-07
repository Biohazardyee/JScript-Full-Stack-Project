/**
 * @fileoverview Unit tests for utilities module
 * @description Tests for JSON file operations, data validation, and utility functions
 * @author GitHub Copilot
 * @version 1.0.0
 */

const sinon = require('sinon');
const fs = require('fs');
const utilities = require('../../utilities/utilities');

describe('Utilities Module', function() {
    let fsReadSyncStub, fsWriteSyncStub;

    beforeEach(function() {
        // Create fresh stubs for each test
        fsReadSyncStub = sinon.stub(fs, 'readFileSync');
        fsWriteSyncStub = sinon.stub(fs, 'writeFileSync');
    });

    afterEach(function() {
        // Clean up all stubs after each test
        sinon.restore();
    });

    describe('JSON File Operations', function() {
        describe('readJson()', function() {
            it('should successfully read and parse valid JSON file', function() {
                const mockData = { items: [{ id: 1, name: 'test' }] };
                fsReadSyncStub.returns(JSON.stringify(mockData));

                const result = utilities.readJson('/test/path.json');

                expect(fsReadSyncStub.calledOnceWith('/test/path.json', 'utf8')).to.be.true;
                expect(result).to.deep.equal(mockData);
            });

            it('should return default value when file does not exist', function() {
                const defaultValue = [];
                fsReadSyncStub.throws(new Error('ENOENT: no such file or directory'));

                const result = utilities.readJson('/nonexistent/path.json', defaultValue);

                expect(result).to.deep.equal(defaultValue);
            });

            it('should return default value when JSON parsing fails', function() {
                const defaultValue = { default: true };
                fsReadSyncStub.returns('invalid json content');

                const result = utilities.readJson('/test/path.json', defaultValue);

                expect(result).to.deep.equal(defaultValue);
            });

            it('should handle empty file gracefully', function() {
                const defaultValue = {};
                fsReadSyncStub.returns('');

                const result = utilities.readJson('/empty/file.json', defaultValue);

                expect(result).to.deep.equal(defaultValue);
            });
        });

        describe('writeJson()', function() {
            it('should write JSON data with proper formatting', function() {
                const testData = { items: [{ id: 1, name: 'test' }] };
                const expectedJson = JSON.stringify(testData, null, 2);

                utilities.writeJson('/test/path.json', testData);

                expect(fsWriteSyncStub.calledOnceWith('/test/path.json', expectedJson, 'utf8')).to.be.true;
            });

            it('should handle empty data objects', function() {
                const testData = {};
                const expectedJson = JSON.stringify(testData, null, 2);

                utilities.writeJson('/test/path.json', testData);

                expect(fsWriteSyncStub.calledOnceWith('/test/path.json', expectedJson, 'utf8')).to.be.true;
            });

            it('should handle array data', function() {
                const testData = [1, 2, 3];
                const expectedJson = JSON.stringify(testData, null, 2);

                utilities.writeJson('/test/path.json', testData);

                expect(fsWriteSyncStub.calledOnceWith('/test/path.json', expectedJson, 'utf8')).to.be.true;
            });
        });
    });

    describe('Data File Operations', function() {
        describe('Cart Data Management', function() {
            it('should read cart data from correct file path', function() {
                const mockCartData = [{ id: 1, productId: 1, quantity: 2 }];
                fsReadSyncStub.returns(JSON.stringify(mockCartData));

                const result = utilities.readCart();

                expect(fsReadSyncStub.calledOnce).to.be.true;
                expect(result).to.deep.equal(mockCartData);
            });

            it('should return empty array when cart file does not exist', function() {
                fsReadSyncStub.throws(new Error('File not found'));

                const result = utilities.readCart();

                expect(result).to.deep.equal([]);
            });

            it('should write cart data to correct location', function() {
                const cartData = [{ id: 1, productId: 1, quantity: 2 }];

                utilities.writeCart(cartData);

                expect(fsWriteSyncStub.calledOnce).to.be.true;
                const writtenData = JSON.parse(fsWriteSyncStub.firstCall.args[1]);
                expect(writtenData).to.deep.equal(cartData);
            });
        });

        describe('Products Data Management', function() {
            it('should read products data from correct file path', function() {
                const mockProductsData = [{ id: 1, name: 'Test Product', price: 99.99 }];
                fsReadSyncStub.returns(JSON.stringify(mockProductsData));

                const result = utilities.readProducts();

                expect(fsReadSyncStub.calledOnce).to.be.true;
                expect(result).to.deep.equal(mockProductsData);
            });

            it('should return empty array when products file does not exist', function() {
                fsReadSyncStub.throws(new Error('File not found'));

                const result = utilities.readProducts();

                expect(result).to.deep.equal([]);
            });

            it('should write products data to correct location', function() {
                const productsData = [{ id: 1, name: 'Test Product', price: 99.99 }];

                utilities.writeProducts(productsData);

                expect(fsWriteSyncStub.calledOnce).to.be.true;
                const writtenData = JSON.parse(fsWriteSyncStub.firstCall.args[1]);
                expect(writtenData).to.deep.equal(productsData);
            });
        });
    });

    describe('ID Generation', function() {
        describe('generateId()', function() {
            it('should return 1 for empty array', function() {
                const result = utilities.generateId([]);
                expect(result).to.equal(1);
            });

            it('should return 1 for null input', function() {
                const result = utilities.generateId(null);
                expect(result).to.equal(1);
            });

            it('should return 1 for undefined input', function() {
                const result = utilities.generateId(undefined);
                expect(result).to.equal(1);
            });

            it('should return 1 for non-array input', function() {
                const result = utilities.generateId('not an array');
                expect(result).to.equal(1);
            });

            it('should return max id + 1 for array with items', function() {
                const items = [
                    { id: 1, name: 'item1' },
                    { id: 3, name: 'item3' },
                    { id: 2, name: 'item2' }
                ];
                const result = utilities.generateId(items);
                expect(result).to.equal(4);
            });

            it('should handle single item array', function() {
                const items = [{ id: 5, name: 'single item' }];
                const result = utilities.generateId(items);
                expect(result).to.equal(6);
            });

            it('should handle items without id property', function() {
                const items = [{ name: 'no id' }, { id: 2 }];
                const result = utilities.generateId(items);
                expect(result).to.equal(3);
            });
        });
    });

    describe('Product Validation', function() {
        describe('validateProduct()', function() {
            it('should return empty array for valid product', function() {
                const validProduct = {
                    name: 'Valid Product',
                    price: 99.99,
                    category: 'Electronics'
                };

                const errors = utilities.validateProduct(validProduct);
                expect(errors).to.be.an('array').that.is.empty;
            });

            it('should return errors for missing name', function() {
                const invalidProduct = { price: 99.99 };
                const errors = utilities.validateProduct(invalidProduct);
                
                expect(errors).to.be.an('array').that.is.not.empty;
                expect(errors.some(error => error.includes('name'))).to.be.true;
            });

            it('should return errors for empty name', function() {
                const invalidProduct = { name: '', price: 99.99 };
                const errors = utilities.validateProduct(invalidProduct);
                
                expect(errors).to.be.an('array').that.is.not.empty;
                expect(errors.some(error => error.includes('name'))).to.be.true;
            });

            it('should return errors for missing price', function() {
                const invalidProduct = { name: 'Product' };
                const errors = utilities.validateProduct(invalidProduct);
                
                expect(errors).to.be.an('array').that.is.not.empty;
                expect(errors.some(error => error.includes('price'))).to.be.true;
            });

            it('should return errors for zero price', function() {
                const invalidProduct = { name: 'Product', price: 0 };
                const errors = utilities.validateProduct(invalidProduct);
                
                expect(errors).to.be.an('array').that.is.not.empty;
                expect(errors.some(error => error.includes('price'))).to.be.true;
            });

            it('should return errors for negative price', function() {
                const invalidProduct = { name: 'Product', price: -10 };
                const errors = utilities.validateProduct(invalidProduct);
                
                expect(errors).to.be.an('array').that.is.not.empty;
                expect(errors.some(error => error.includes('price'))).to.be.true;
            });

            it('should handle string price that can be parsed', function() {
                const product = { name: 'Product', price: '99.99' };
                const errors = utilities.validateProduct(product);
                
                expect(errors).to.be.an('array').that.is.empty;
            });

            it('should return multiple errors for completely invalid product', function() {
                const invalidProduct = { name: '', price: -10 };
                const errors = utilities.validateProduct(invalidProduct);
                
                expect(errors).to.be.an('array');
                expect(errors.length).to.be.greaterThan(1);
            });

            it('should handle null or undefined product gracefully', function() {
                const nullErrors = utilities.validateProduct(null);
                const undefinedErrors = utilities.validateProduct(undefined);
                
                expect(nullErrors).to.be.an('array');
                expect(undefinedErrors).to.be.an('array');
            });
        });
    });

    describe('Cart Calculations', function() {
        beforeEach(function() {
            // Mock products data for cart calculations
            const mockProducts = [
                { id: 1, name: 'Product 1', price: 10.00 },
                { id: 2, name: 'Product 2', price: 25.50 },
                { id: 3, name: 'Product 3', price: 5.75 }
            ];
            
            // Stub readProducts to return mock data
            sinon.stub(utilities, 'readProducts').returns(mockProducts);
        });

        describe('calculateBalance()', function() {
            it('should calculate total balance correctly', function() {
                const cartItems = [
                    { id: 1, productId: 1, quantity: 2 }, // 2 * 10.00 = 20.00
                    { id: 2, productId: 2, quantity: 1 }, // 1 * 25.50 = 25.50
                    { id: 3, productId: 3, quantity: 3 }  // 3 * 5.75 = 17.25
                ];

                const balance = utilities.calculateBalance(cartItems);
                expect(balance).to.equal(62.75);
            });

            it('should handle empty cart', function() {
                const balance = utilities.calculateBalance([]);
                expect(balance).to.equal(0);
            });

            it('should handle cart items with non-existent products', function() {
                const cartItems = [
                    { id: 1, productId: 999, quantity: 2 }, // Non-existent product
                    { id: 2, productId: 1, quantity: 1 }    // Valid product
                ];

                const balance = utilities.calculateBalance(cartItems);
                expect(balance).to.equal(10.00); // Only valid product counted
            });

            it('should handle mixed valid and invalid cart items', function() {
                const cartItems = [
                    { id: 1, productId: 1, quantity: 1 },    // Valid: 10.00
                    { id: 2, productId: 999, quantity: 5 },  // Invalid product
                    { id: 3, productId: 2, quantity: 2 }     // Valid: 51.00
                ];

                const balance = utilities.calculateBalance(cartItems);
                expect(balance).to.equal(61.00);
            });
        });

        describe('getCartWithDetails()', function() {
            it('should return cart with product details and balance', function() {
                const cartItems = [
                    { id: 1, productId: 1, quantity: 2 },
                    { id: 2, productId: 2, quantity: 1 }
                ];

                // Mock readCart to return our test data
                sinon.stub(utilities, 'readCart').returns(cartItems);

                const cartWithDetails = utilities.getCartWithDetails();

                expect(cartWithDetails).to.have.property('items');
                expect(cartWithDetails).to.have.property('balance');
                expect(cartWithDetails.balance).to.equal(45.50); // (2*10.00) + (1*25.50)
                expect(cartWithDetails.items).to.have.length(2);
            });

            it('should handle empty cart gracefully', function() {
                sinon.stub(utilities, 'readCart').returns([]);

                const cartWithDetails = utilities.getCartWithDetails();

                expect(cartWithDetails.items).to.be.an('array').that.is.empty;
                expect(cartWithDetails.balance).to.equal(0);
            });

            it('should handle file read errors gracefully', function() {
                sinon.stub(utilities, 'readCart').throws(new Error('File read error'));

                const cartWithDetails = utilities.getCartWithDetails();

                expect(cartWithDetails).to.have.property('items');
                expect(cartWithDetails).to.have.property('balance');
            });
        });
    });
});