const Joi = require('joi');

/**
 * Product validation schemas
 */
const productSchema = Joi.object({
    name: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Product name cannot be empty',
            'string.min': 'Product name must be at least 1 character long',
            'string.max': 'Product name cannot exceed 100 characters',
            'any.required': 'Product name is required'
        }),
    price: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be a positive number',
            'any.required': 'Price is required'
        })
});

const productUpdateSchema = Joi.object({
    name: Joi.string()
        .min(1)
        .max(100)
        .optional()
        .messages({
            'string.empty': 'Product name cannot be empty',
            'string.min': 'Product name must be at least 1 character long',
            'string.max': 'Product name cannot exceed 100 characters'
        }),
    price: Joi.number()
        .positive()
        .precision(2)
        .optional()
        .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be a positive number'
        })
}).min(1).messages({
    'object.min': 'At least one field (name or price) must be provided for update'
});

/**
 * Cart validation schemas
 */
const cartItemSchema = Joi.object({
    productId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Product ID must be a number',
            'number.integer': 'Product ID must be an integer',
            'number.positive': 'Product ID must be positive',
            'any.required': 'Product ID is required'
        }),
    quantity: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .optional()
        .default(1)
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'number.max': 'Quantity cannot exceed 1000'
        })
});

const cartUpdateSchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .required()
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'number.max': 'Quantity cannot exceed 1000',
            'any.required': 'Quantity is required'
        })
});

/**
 * User authentication validation schemas
 */
const userRegistrationSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one digit',
            'any.required': 'Password is required'
        }),
    roles: Joi.array()
        .items(Joi.string().valid('user', 'admin'))
        .optional()
        .default(['user'])
        .messages({
            'array.includes': 'Roles must be one of: user, admin'
        })
});

const userLoginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(1)
        .required()
        .messages({
            'string.empty': 'Password cannot be empty',
            'any.required': 'Password is required'
        })
});

/**
 * ID parameter validation
 */
const idParamSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'ID must be a number',
            'number.integer': 'ID must be an integer',
            'number.positive': 'ID must be positive',
            'any.required': 'ID is required'
        })
});

/**
 * Test data generators for valid and invalid scenarios
 */
const testData = {
    products: {
        valid: [
            { name: 'Test Product', price: 19.99 },
            { name: 'Another Product', price: 99.95 },
            { name: 'Budget Item', price: 1.00 },
            { name: 'Premium Product', price: 999.99 }
        ],
        invalid: [
            { name: '', price: 19.99, expectedErrors: ['Product name cannot be empty'] },
            { name: 'Valid Name', price: -10, expectedErrors: ['Price must be a positive number'] },
            { name: 'Valid Name', price: 'not-a-number', expectedErrors: ['Price must be a number'] },
            { price: 19.99, expectedErrors: ['Product name is required'] },
            { name: 'Valid Name', expectedErrors: ['Price is required'] },
            { name: 'A'.repeat(101), price: 19.99, expectedErrors: ['Product name cannot exceed 100 characters'] },
            { name: 'Valid Name', price: 0, expectedErrors: ['Price must be a positive number'] }
        ]
    },
    cart: {
        valid: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 5 },
            { productId: 3 }, // quantity defaults to 1
            { productId: 999, quantity: 100 }
        ],
        invalid: [
            { productId: 'not-a-number', quantity: 1, expectedErrors: ['Product ID must be a number'] },
            { productId: -1, quantity: 1, expectedErrors: ['Product ID must be positive'] },
            { productId: 1.5, quantity: 1, expectedErrors: ['Product ID must be an integer'] },
            { quantity: 1, expectedErrors: ['Product ID is required'] },
            { productId: 1, quantity: 0, expectedErrors: ['Quantity must be at least 1'] },
            { productId: 1, quantity: -5, expectedErrors: ['Quantity must be at least 1'] },
            { productId: 1, quantity: 1001, expectedErrors: ['Quantity cannot exceed 1000'] },
            { productId: 1, quantity: 'not-a-number', expectedErrors: ['Quantity must be a number'] }
        ]
    },
    users: {
        validRegistration: [
            { email: 'test@example.com', password: 'Password123' },
            { email: 'admin@test.com', password: 'AdminPass1', roles: ['admin'] },
            { email: 'user@demo.org', password: 'SecurePass9' }
        ],
        invalidRegistration: [
            { email: 'invalid-email', password: 'Password123', expectedErrors: ['Please provide a valid email address'] },
            { email: 'test@example.com', password: 'short', expectedErrors: ['Password must be at least 8 characters long'] },
            { email: 'test@example.com', password: 'onlylowercase', expectedErrors: ['Password must contain at least one lowercase letter, one uppercase letter, and one digit'] },
            { email: 'test@example.com', password: 'ONLYUPPERCASE', expectedErrors: ['Password must contain at least one lowercase letter, one uppercase letter, and one digit'] },
            { email: 'test@example.com', password: 'NoNumbers', expectedErrors: ['Password must contain at least one lowercase letter, one uppercase letter, and one digit'] },
            { password: 'Password123', expectedErrors: ['Email is required'] },
            { email: 'test@example.com', expectedErrors: ['Password is required'] }
        ],
        validLogin: [
            { email: 'test@example.com', password: 'anypassword' },
            { email: 'admin@test.com', password: 'AdminPass1' }
        ],
        invalidLogin: [
            { email: 'invalid-email', password: 'password', expectedErrors: ['Please provide a valid email address'] },
            { email: 'test@example.com', password: '', expectedErrors: ['Password cannot be empty'] },
            { password: 'password', expectedErrors: ['Email is required'] },
            { email: 'test@example.com', expectedErrors: ['Password is required'] }
        ]
    }
};

module.exports = {
    productSchema,
    productUpdateSchema,
    cartItemSchema,
    cartUpdateSchema,
    userRegistrationSchema,
    userLoginSchema,
    idParamSchema,
    testData
};