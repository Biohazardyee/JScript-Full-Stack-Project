const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');

// Import the utilities module
const utilities = require('../utilities/utilities');

describe('Complex Integration Functions', () => {
    let fsReadSyncStub;

    beforeEach(() => {
        fsReadSyncStub = sinon.stub(fs, 'readFileSync');
    });

    afterEach(() => {
        sinon.restore();
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
                { id: 2, name: 'Product 2', price: 25.99 },
                { id: 3, name: 'Product 3', price: 5.00 } // not in cart
            ];

            // Setup file read stubs
            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns(JSON.stringify(mockCartData));
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify(mockProductsData));

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

            const secondItem = result.items[1];
            expect(secondItem).to.deep.include({
                id: 2,
                productId: 2,
                quantity: 1,
                addedAt: '2023-01-02T00:00:00Z'
            });
            expect(secondItem.product).to.deep.equal({ id: 2, name: 'Product 2', price: 25.99 });
            expect(secondItem).to.have.property('subtotal', 25.99); // 25.99 * 1

            // Check balance calculation
            expect(result.balance).to.equal(46.99); // 21.00 + 25.99

            // Check item count
            expect(result.itemCount).to.equal(3); // 2 + 1
        });

        it('should handle cart items with non-existent products', () => {
            const mockCartData = [
                { id: 1, productId: 999, quantity: 2 }, // product doesn't exist
                { id: 2, productId: 2, quantity: 1 }
            ];

            const mockProductsData = [
                { id: 2, name: 'Product 2', price: 15.00 }
            ];

            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns(JSON.stringify(mockCartData));
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify(mockProductsData));

            const result = utilities.getCartWithDetails();

            expect(result.items).to.have.length(2);

            // First item should have null product
            const firstItem = result.items[0];
            expect(firstItem.product).to.be.null;
            expect(firstItem.subtotal).to.equal(0);

            // Second item should have product
            const secondItem = result.items[1];
            expect(secondItem.product).to.deep.equal({ id: 2, name: 'Product 2', price: 15.00 });
            expect(secondItem.subtotal).to.equal(15.00);

            // Balance should only include valid products
            expect(result.balance).to.equal(15.00);
            expect(result.itemCount).to.equal(3); // quantity sum regardless of product existence
        });

        it('should handle empty cart', () => {
            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns(JSON.stringify([]));
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify([{ id: 1, name: 'Product 1', price: 10.00 }]));

            const result = utilities.getCartWithDetails();

            expect(result).to.deep.equal({
                items: [],
                balance: 0,
                itemCount: 0
            });
        });

        it('should handle empty products', () => {
            const mockCartData = [{ id: 1, productId: 1, quantity: 2 }];

            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns(JSON.stringify(mockCartData));
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify([]));

            const result = utilities.getCartWithDetails();

            expect(result.items).to.have.length(1);
            expect(result.items[0].product).to.be.null;
            expect(result.items[0].subtotal).to.equal(0);
            expect(result.balance).to.equal(0);
            expect(result.itemCount).to.equal(2);
        });

        it('should handle file read errors gracefully', () => {
            // Simulate cart file not found
            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .throws(new Error('ENOENT: cart file not found'));

            // Products file exists
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify([{ id: 1, name: 'Product 1', price: 10.00 }]));

            const result = utilities.getCartWithDetails();

            expect(result).to.deep.equal({
                items: [],
                balance: 0,
                itemCount: 0
            });
        });

        it('should handle both files missing', () => {
            fsReadSyncStub.throws(new Error('File not found'));

            const result = utilities.getCartWithDetails();

            expect(result).to.deep.equal({
                items: [],
                balance: 0,
                itemCount: 0
            });
        });

        it('should handle decimal prices and quantities correctly', () => {
            const mockCartData = [
                { id: 1, productId: 1, quantity: 1.5 },
                { id: 2, productId: 2, quantity: 2.75 }
            ];

            const mockProductsData = [
                { id: 1, name: 'Product 1', price: 10.33 },
                { id: 2, name: 'Product 2', price: 8.67 }
            ];

            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns(JSON.stringify(mockCartData));
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify(mockProductsData));

            const result = utilities.getCartWithDetails();

            expect(result.items[0].subtotal).to.be.closeTo(15.495, 0.001); // 10.33 * 1.5
            expect(result.items[1].subtotal).to.be.closeTo(23.8425, 0.001); // 8.67 * 2.75
            expect(result.balance).to.be.closeTo(39.3375, 0.001); // 15.495 + 23.8425
            expect(result.itemCount).to.equal(4.25); // 1.5 + 2.75
        });

        it('should preserve all cart item properties', () => {
            const mockCartData = [
                {
                    id: 1,
                    productId: 1,
                    quantity: 2,
                    addedAt: '2023-01-01T00:00:00Z',
                    updatedAt: '2023-01-02T00:00:00Z',
                    customField: 'custom value'
                }
            ];

            const mockProductsData = [
                { id: 1, name: 'Product 1', price: 10.00 }
            ];

            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns(JSON.stringify(mockCartData));
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns(JSON.stringify(mockProductsData));

            const result = utilities.getCartWithDetails();

            const item = result.items[0];
            expect(item).to.have.property('id', 1);
            expect(item).to.have.property('productId', 1);
            expect(item).to.have.property('quantity', 2);
            expect(item).to.have.property('addedAt', '2023-01-01T00:00:00Z');
            expect(item).to.have.property('updatedAt', '2023-01-02T00:00:00Z');
            expect(item).to.have.property('customField', 'custom value');
            expect(item).to.have.property('product');
            expect(item).to.have.property('subtotal', 20.00);
        });

        it('should handle malformed JSON gracefully', () => {
            fsReadSyncStub
                .withArgs(sinon.match(/cart\.json/), 'utf8')
                .returns('invalid json');
            fsReadSyncStub
                .withArgs(sinon.match(/products\.json/), 'utf8')
                .returns('also invalid json');

            const result = utilities.getCartWithDetails();

            expect(result).to.deep.equal({
                items: [],
                balance: 0,
                itemCount: 0
            });
        });
    });

    describe('Integration with File System', () => {
        it('should call readCart and readProducts functions', () => {
            // Spy on the individual functions
            const readCartSpy = sinon.spy(utilities, 'readCart');
            const readProductsSpy = sinon.spy(utilities, 'readProducts');

            // Setup file stubs
            fsReadSyncStub.returns(JSON.stringify([]));

            utilities.getCartWithDetails();

            expect(readCartSpy).to.have.been.calledOnce;
            expect(readProductsSpy).to.have.been.calledOnce;

            readCartSpy.restore();
            readProductsSpy.restore();
        });
    });
});