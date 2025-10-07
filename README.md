# 🛍️ JScript Full Stack E-Commerce API

A comprehensive Express.js API featuring e-commerce functionality, document management, JWT authentication, and MongoDB integration. This project demonstrates modern Node.js development practices with extensive testing coverage.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with bcrypt password hashing
- Role-based access control (user/admin)
- Secure middleware protection for private routes
- Input validation and sanitization

### 🛒 E-Commerce Core
- Product catalog management (CRUD operations)
- Shopping cart functionality with automatic calculations
- User-specific cart management
- Admin-only product management

### 📁 Document Management
- Secure file upload (images and audio, max 10MB)
- File integrity validation with hash verification
- Multer-based file handling with filtering
- Document metadata storage and retrieval

### 🧪 Professional Testing
- 100+ comprehensive tests with 90%+ coverage
- Unit and integration test separation
- Professional test helpers and utilities
- Legacy test compatibility

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- MongoDB Atlas account or local MongoDB
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone https://github.com/Biohazardyee/JScript-Full-Stack-Project.git
cd JScript-Full-Stack-Project/App

# Install dependencies
npm install

# Configure environment (see Environment Setup below)
cp .env.example .env

# Start development server
npm run dev
```

**Server**: `http://localhost:3000`

## 📁 Project Structure

```
JScript-Full-Stack-Project/
├── .gitignore               # Git ignore patterns
├── README.md               # Main project documentation
└── App/                    # Main application directory
    ├── .env                # Environment variables (not in git)
    ├── .mocharc.json       # Mocha test configuration
    ├── .nycrc              # Coverage configuration
    ├── app.js              # Express application entry point
    ├── package.json        # Dependencies and scripts
    ├── package-lock.json   # Dependency lock file
    │
    ├── bin/                # Server startup scripts
    │   └── www             # Server bootstrap
    │
    ├── config/             # Configuration files
    │   └── database.js     # Database connection setup
    │
    ├── data/               # Data storage (JSON files)
    │   ├── cart.json       # Shopping cart data
    │   ├── documents.json  # Document metadata
    │   ├── products.json   # Product catalog
    │   └── uploads/        # Uploaded file storage
    │
    ├── imgs/               # Test images for development
    │
    ├── middleware/         # Custom middleware
    │   └── auth.js         # Authentication middleware
    │
    ├── public/             # Static assets
    │   ├── images/
    │   ├── javascripts/
    │   └── stylesheets/
    │       └── style.css
    │
    ├── routes/             # API route definitions
    │   ├── articles.js     # Product CRUD operations
    │   ├── cart.js         # Shopping cart management
    │   ├── documents.js    # File upload/download
    │   ├── login.js        # User authentication
    │   └── register.js     # User registration
    │
    ├── schemas/            # Validation schemas
    │   └── validation.js   # Input validation rules
    │
    ├── test/               # Test suite
    │   ├── setup.js        # Test environment setup
    │   ├── README.md       # Testing documentation
    │   ├── helpers/        # Shared test utilities
    │   ├── unit/           # Unit tests
    │   ├── integration/    # Integration tests
    │   └── legacy/         # Original working tests
    │
    ├── utilities/          # Helper functions
    │   └── utilities.js    # File I/O and utility functions
    │
    └── views/              # EJS templates
        ├── error.ejs       # Error page template
        └── index.ejs       # Home page template
```

### Environment Setup

Create a `.env` file in the `/App` directory:

```env
# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here

# MongoDB Configuration
MongoDBConnection=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce

# Environment
NODE_ENV=development

# Optional: Port configuration
PORT=3000
```

**MongoDB Atlas Setup:**

1. Create a free MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster (M0 tier is free)
3. Create a database user with read/write permissions
4. Get your connection string from "Connect" → "Connect your application"
5. Replace `<username>`, `<password>`, and `<databasename>` in your connection string
6. Add the connection string to your `.env` file

## � Authentication System

This API uses **JWT (JSON Web Tokens)** for authentication with bcrypt password hashing.

### Test Users

| Email               | Password      | Roles       |
| ------------------- | ------------- | ----------- |
| `admin@example.com` | `password123` | admin, user |
| `user@example.com`  | `password123` | user        |

---

## � User Registration

### Register New User

**POST** `/register`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Added user",
  "data": "User n°507f1f77bcf86cd799439011, email: newuser@example.com with roles: user was created"
}
```

**Validation Requirements:**

- Email must be unique and valid format
- Password must be at least 8 characters long
- Both fields are required

---

## 🔑 Authentication Flow

### Step 1: Register a New User (Optional)

**POST** `/register` with user details (see User Registration section above)

### Step 2: Login to get JWT Token

**POST** `/login`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "roles": ["admin", "user"]
  }
}
```

### Step 3: Use JWT Token for Protected Routes

**Headers for all protected routes:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

⚠️ **Important:** Include "Bearer " before your token with a space!

---

## 📦 Products (`/articles`) - Protected Routes

| Method | URL             | Body                                   | Description         | Required Role |
| ------ | --------------- | -------------------------------------- | ------------------- | ------------- |
| GET    | `/articles`     | -                                      | Get all products    | user          |
| GET    | `/articles/:id` | -                                      | Get single product  | user          |
| POST   | `/articles`     | `{"name": "Product", "price": 99.99}`  | Create product      | admin         |
| PUT    | `/articles/:id` | `{"name": "Updated", "price": 129.99}` | Update product      | admin         |
| DELETE | `/articles/:id` | -                                      | Delete product      | admin         |
| DELETE | `/articles`     | -                                      | Delete all products | admin         |

## 🛒 Cart (`/cart`) - Protected Routes

| Method | URL         | Body                              | Description            | Required Role |
| ------ | ----------- | --------------------------------- | ---------------------- | ------------- |
| GET    | `/cart`     | -                                 | View cart with balance | user          |
| POST   | `/cart`     | `{"productId": 1, "quantity": 2}` | Add to cart            | user          |
| PUT    | `/cart/:id` | `{"quantity": 5}`                 | Update cart item       | user          |
| DELETE | `/cart/:id` | -                                 | Remove cart item       | user          |
| DELETE | `/cart`     | -                                 | Clear cart             | user          |

---

## 🧪 Testing with Postman

### Complete Test Flow

1. **Register a New User** (Optional)

   - POST `/register`
   - Headers: `Content-Type: application/json`
   - Body: `{"email": "testuser@example.com", "password": "password123"}`

2. **Login as Admin (or your new user)**

   - POST `/login` with admin credentials or your new user
   - Copy the JWT token from response

3. **Create a Product** (Admin only)

   - POST `/articles`
   - Headers: `Authorization: Bearer YOUR_TOKEN`, `Content-Type: application/json`
   - Body: `{"name": "Test Product", "price": 29.99}`

4. **View All Products**

   - GET `/articles`
   - Headers: `Authorization: Bearer YOUR_TOKEN`

5. **Add Product to Cart**

   - POST `/cart`
   - Headers: `Authorization: Bearer YOUR_TOKEN`, `Content-Type: application/json`
   - Body: `{"productId": 1, "quantity": 2}`

6. **View Cart with Balance**
   - GET `/cart`
   - Headers: `Authorization: Bearer YOUR_TOKEN`

### Testing Authentication Errors

- **No token:** Access any protected route without Authorization header
- **Invalid token:** Use malformed or expired token
- **Wrong format:** Use token without "Bearer " prefix
- **Wrong credentials:** Login with incorrect email/password

---

## 🚨 Error Responses

| Status | Error                                       | Cause                                  |
| ------ | ------------------------------------------- | -------------------------------------- |
| 401    | `Authorization header missing or malformed` | Missing token or wrong format          |
| 401    | `Invalid email or password`                 | Wrong login credentials                |
| 403    | `Invalid password or email credentials`     | Password doesn't match                 |
| 403    | `Insufficient privileges`                   | User role can't access admin endpoints |
| 404    | Product/item not found                      | Invalid ID in URL                      |
| 500    | Server error                                | Internal server error                  |

---

## 🔧 Development Notes

- **Database:** MongoDB Atlas cloud database with Mongoose ODM
- **Environment Variables:** JWT secret and MongoDB connection string stored in `.env` file
- **Password Security:** Bcrypt with salt rounds = 10
- **Token Format:** Bearer token in Authorization header
- **Route Protection:** Middleware applied after login/register routes
- **User Storage:** MongoDB Atlas with mongoose schema validation
- **Schema Validation:**
  - Email: required, unique, lowercase, valid format
  - Password: required, minimum 8 characters, bcrypt hashed
  - Roles: array with default value ['user']
  - Timestamps: automatic createdAt/updatedAt fields
- **Database Connection:** Automatic connection on app startup with success/error logging

---

## 🧪 Testing

### Professional Test Architecture
- **Organized Structure**: Separate unit, integration, and legacy test directories
- **Shared Helpers**: Centralized test utilities and helper classes
- **Legacy Compatibility**: Preserved working tests during refactoring
- **Documentation**: Comprehensive test documentation in `/test/README.md`

### Test Coverage
- **Statements**: 100% (60/60)
- **Functions**: 100% (18/18)  
- **Lines**: 100% (52/52)
- **Branches**: 93.93% (31/33)

### Running Tests

```bash
# Run main test suite
npm test

# Run specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:legacy         # Original working tests

# Development workflow
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report

# Test with real file operations
npm run test:legacy:image   # Real image upload/download test
```

### What's Tested
- **Utilities**: File I/O operations (readJson, writeJson, readCart, readProducts)
- **Middleware**: Authentication and authorization middleware
- **Helpers**: ID generation, product validation, cart calculations
- **Integration**: Complex functions combining multiple dependencies

### Testing Features
- **Mocking**: File system operations and HTTP middleware
- **Edge Cases**: Null inputs, empty arrays, invalid data
- **Error Handling**: File errors, JSON parsing errors, exceptions
- **Spying**: Function call verification and argument checking

Coverage reports available in `./coverage/index.html` after running tests.
