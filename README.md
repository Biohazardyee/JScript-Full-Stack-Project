# E-Commerce API with JWT Authentication

Express.js API for managing products and shopping cart with JWT-based authentication, bcrypt password hashing, and MongoDB Atlas database.

## 🚀 Setup

### Prerequisites

- Node.js installed
- MongoDB Atlas account
- Environment variables configured

### Installation

```bash
npm install
npm start
```

Server: `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the project root:

```env
JWT_SECRET=your_jwt_secret_here
MongoDBConnection=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/databasename
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

### Test Coverage
- **Statements**: 100% (60/60)
- **Functions**: 100% (18/18)  
- **Lines**: 100% (52/52)
- **Branches**: 93.93% (31/33)

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
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
