var express = require('express');
var router = express.Router();
const utilities = require('../utilities/utilities');
const { securityMiddleware, readProducts, writeProducts, generateId, validateProduct, adminMiddleware } = utilities;


// GET /products - Get all products
router.get('/', securityMiddleware, function (req, res, next) {
    try {
        const products = readProducts();
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read products',
            details: error.message
        });
    }
});

// GET /products/:id - Get single product by ID
router.get('/:id', securityMiddleware, function (req, res, next) {
    try {
        const products = readProducts();
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID. Must be a number.'
            });
        }

        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error reading product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read product',
            details: error.message
        });
    }
});

// POST /products - Create new product
router.post('/', adminMiddleware, function (req, res, next) {
    try {
        const { name, price } = req.body;

        // Validate input
        const validationErrors = validateProduct({ name, price });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }

        const products = readProducts();

        // Create new product
        const newProduct = {
            id: generateId(products),
            name: name.trim(),
            price: parseFloat(price),
            createdAt: new Date().toISOString()
        };

        products.push(newProduct);
        writeProducts(products);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create product',
            details: error.message
        });
    }
});

// PUT /products/:id - Update product by ID
router.put('/:id', adminMiddleware, function (req, res, next) {
    try {
        const productId = parseInt(req.params.id);
        const { name, price } = req.body;

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID. Must be a number.'
            });
        }

        // Validate input
        const validationErrors = validateProduct({ name, price });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }

        const products = readProducts();
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Update product
        products[productIndex] = {
            ...products[productIndex],
            name: name.trim(),
            price: parseFloat(price),
            updatedAt: new Date().toISOString()
        };

        writeProducts(products);

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: products[productIndex]
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product',
            details: error.message
        });
    }
});

// DELETE /products/:id - Delete product by ID
router.delete('/:id', adminMiddleware, function (req, res, next) {
    try {
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID. Must be a number.'
            });
        }

        const products = readProducts();
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const deletedProduct = products.splice(productIndex, 1)[0];
        writeProducts(products);

        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: deletedProduct
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product',
            details: error.message
        });
    }
});

// DELETE /products - Delete all products
router.delete('/', adminMiddleware, function (req, res, next) {
    try {
        writeProducts([]);

        res.json({
            success: true,
            message: 'All products deleted successfully'
        });
    } catch (error) {
        console.error('Error clearing products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear products',
            details: error.message
        });
    }
});

module.exports = router;
