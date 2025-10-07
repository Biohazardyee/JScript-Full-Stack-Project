var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');

const CART_FILE = path.join(__dirname, '../data/cart.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const securityMiddleware = (req, res, next) => {
    if (req.headers['value'] === 'user' || req.headers['value'] === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Forbidden' });
    }
};


// Helper function to read cart
const readCart = () => {
    try {
        const data = fs.readFileSync(CART_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper function to read products
const readProducts = () => {
    try {
        const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper function to write cart
const writeCart = (cartItems) => {
    fs.writeFileSync(CART_FILE, JSON.stringify(cartItems, null, 2));
};

// Helper function to calculate cart balance
const calculateBalance = (cartItems, products) => {
    return cartItems.reduce((total, cartItem) => {
        const product = products.find(p => p.id === cartItem.productId);
        if (product) {
            return total + (product.price * cartItem.quantity);
        }
        return total;
    }, 0);
};

// Helper function to get cart with product details and balance
const getCartWithDetails = () => {
    const cartItems = readCart();
    const products = readProducts();
    
    const cartWithDetails = cartItems.map(cartItem => {
        const product = products.find(p => p.id === cartItem.productId);
        return {
            ...cartItem,
            product: product || null,
            subtotal: product ? product.price * cartItem.quantity : 0
        };
    });
    
    const balance = calculateBalance(cartItems, products);
    
    return {
        items: cartWithDetails,
        balance: balance,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
};

// GET /cart - Get cart with product details and balance
router.get('/', securityMiddleware, function (req, res, next) {
    try {
        const cartData = getCartWithDetails();
        
        res.json({
            success: true,
            data: cartData
        });
    } catch (error) {
        console.error('Error reading cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read cart',
            details: error.message
        });
    }
});

// POST /cart - Add product to cart
router.post('/', securityMiddleware, function(req, res, next) {
    try {
        const { productId, quantity = 1 } = req.body;
        
        // Validate input
        if (!productId || isNaN(parseInt(productId))) {
            return res.status(400).json({
                success: false,
                error: 'Valid product ID is required'
            });
        }
        
        if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid quantity (positive number) is required'
            });
        }
        
        const products = readProducts();
        const product = products.find(p => p.id === parseInt(productId));
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        const cartItems = readCart();
        const existingItemIndex = cartItems.findIndex(item => item.productId === parseInt(productId));
        
        if (existingItemIndex >= 0) {
            // Update quantity if product already in cart
            cartItems[existingItemIndex].quantity += parseInt(quantity);
            cartItems[existingItemIndex].updatedAt = new Date().toISOString();
        } else {
            // Add new item to cart
            const newCartItem = {
                id: cartItems.length > 0 ? Math.max(...cartItems.map(item => item.id)) + 1 : 1,
                productId: parseInt(productId),
                quantity: parseInt(quantity),
                addedAt: new Date().toISOString()
            };
            cartItems.push(newCartItem);
        }
        
        writeCart(cartItems);
        const updatedCartData = getCartWithDetails();
        
        res.status(201).json({
            success: true,
            message: 'Product added to cart successfully',
            data: updatedCartData
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add product to cart',
            details: error.message
        });
    }
});

// PUT /cart/:id - Update quantity of item in cart
router.put('/:id', securityMiddleware, function(req, res, next) {
    try {
        const cartItemId = parseInt(req.params.id);
        const { quantity } = req.body;
        
        if (isNaN(cartItemId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid cart item ID'
            });
        }
        
        if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid quantity (positive number) is required'
            });
        }
        
        const cartItems = readCart();
        const itemIndex = cartItems.findIndex(item => item.id === cartItemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }
        
        cartItems[itemIndex].quantity = parseInt(quantity);
        cartItems[itemIndex].updatedAt = new Date().toISOString();
        
        writeCart(cartItems);
        const updatedCartData = getCartWithDetails();
        
        res.json({
            success: true,
            message: 'Cart item updated successfully',
            data: updatedCartData
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update cart item',
            details: error.message
        });
    }
});

// DELETE /cart/:id - Remove item from cart
router.delete('/:id', securityMiddleware, function(req, res, next) {
    try {
        const cartItemId = parseInt(req.params.id);
        
        if (isNaN(cartItemId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid cart item ID'
            });
        }
        
        const cartItems = readCart();
        const itemIndex = cartItems.findIndex(item => item.id === cartItemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }
        
        const removedItem = cartItems.splice(itemIndex, 1)[0];
        writeCart(cartItems);
        const updatedCartData = getCartWithDetails();
        
        res.json({
            success: true,
            message: 'Item removed from cart successfully',
            removedItem: removedItem,
            data: updatedCartData
        });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove cart item',
            details: error.message
        });
    }
});

// DELETE /cart - Clear entire cart
router.delete('/', securityMiddleware, function(req, res, next) {
    try {
        writeCart([]);
        
        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: {
                items: [],
                balance: 0,
                itemCount: 0
            }
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart',
            details: error.message
        });
    }
});




module.exports = router;