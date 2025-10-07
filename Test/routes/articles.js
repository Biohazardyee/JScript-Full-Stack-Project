var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const securityMiddleware = (req, res, next) => {
    if (req.headers['value'] === 'user' || req.headers['value'] === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Forbidden' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.headers['value'] === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Forbidden' });
    }
}

// Helper function to read products
const readProducts = () => {
    try {
        const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper function to write products
const writeProducts = (products) => {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
};

// Helper function to generate unique ID
const generateId = (products) => {
    if (products.length === 0) return 1;
    return Math.max(...products.map(p => p.id)) + 1;
};

// Helper function to validate product data
const validateProduct = (product) => {
    const errors = [];

    if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
        errors.push('Price is required and must be a positive number');
    }

    return errors;
};

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
