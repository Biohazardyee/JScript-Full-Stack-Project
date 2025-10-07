# Test Documentation

This document describes the testing structure and best practices for the JScript Full Stack Project.

## Test Organization

### Directory Structure
```
test/
├── setup.js                    # Global test configuration
├── helpers/
│   └── test-helpers.js         # Shared utilities and helpers
├── unit/                       # Unit tests
│   ├── utilities.test.js       # Utilities module tests
│   └── middleware.test.js      # Middleware function tests
├── integration/                # Integration tests
│   ├── authentication.test.js  # Auth API tests
│   └── documents.test.js       # Document API tests
└── legacy/                     # Original test files (for reference)
    ├── utilities-working.test.js
    ├── middleware-working.test.js
    ├── real-image-test.js
    └── ...
```

## Test Scripts

### Primary Test Commands
- `npm test` - Run all tests (unit + integration)
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Legacy Test Commands
- `npm run test:legacy` - Run preserved working tests
- `npm run test:legacy:image` - Run real image test
- `npm run test:legacy:all` - Run all legacy tests

## Test Helpers

### TestUserFactory
Creates unique test users for authentication testing:
```javascript
const userData = TestUserFactory.createUser('admin');
const email = TestUserFactory.generateEmail('test');
```

### AuthHelper
Manages authentication in tests:
```javascript
const { token, userId } = await AuthHelper.createAuthenticatedUser();
const response = await AuthHelper.loginUser(credentials);
```

### FileHelper
Utilities for file testing:
```javascript
const testImage = FileHelper.createTestImage('png');
const hash = FileHelper.calculateHash(buffer);
const { buffer, hash } = FileHelper.getTestImageData();
```

### ApiHelper
Simplifies API testing:
```javascript
const response = await ApiHelper.authenticatedRequest('GET', '/endpoint', token);
const uploadResponse = await ApiHelper.uploadFile('/upload', token, buffer, 'file.png', 'image/png');
```

### ValidationHelper
Common assertion patterns:
```javascript
ValidationHelper.validateApiResponse(response, 200, true);
ValidationHelper.validateJwtToken(token);
```

## Test Configuration

### Constants
All test constants are centralized in `TEST_CONFIG`:
- HTTP status codes
- API endpoints
- Default timeouts
- File paths

### Environment
Tests run with a 20-second timeout by default and include proper setup/teardown.

## Best Practices

### Test Structure
1. Use descriptive `describe` blocks to organize tests
2. Group related functionality together
3. Use `before`/`after` hooks for setup/cleanup
4. Keep individual tests focused and atomic

### Authentication
1. Use `AuthHelper.createAuthenticatedUser()` for authenticated tests
2. Clean up test users when possible
3. Use unique emails for each test run

### File Testing
1. Use `FileHelper` utilities for consistent file creation
2. Track uploaded files for cleanup
3. Verify file integrity with hash comparison

### Error Testing
1. Test both success and failure cases
2. Validate error response structure
3. Use appropriate HTTP status codes

## Coverage Goals

- **Statements**: 90%+
- **Branches**: 80%+
- **Functions**: 90%+
- **Lines**: 90%+

## Writing New Tests

### Unit Tests
Place in `test/unit/` and focus on:
- Individual function behavior
- Edge cases and error conditions
- Mock external dependencies

### Integration Tests
Place in `test/integration/` and focus on:
- API endpoint behavior
- Database interactions
- Authentication flows
- File upload/download

### Example Test Structure
```javascript
describe('Feature Name', function() {
    this.timeout(TEST_CONFIG.TIMEOUT);
    
    let authToken;
    
    before(async function() {
        const { token } = await AuthHelper.createAuthenticatedUser();
        authToken = token;
    });
    
    describe('Success Cases', function() {
        it('should handle valid input', async function() {
            // Test implementation
        });
    });
    
    describe('Error Cases', function() {
        it('should handle invalid input', async function() {
            // Test implementation
        });
    });
});
```

## Debugging Tests

### Common Issues
1. **Authentication failures**: Ensure user is created and token is valid
2. **File upload issues**: Check file size limits and MIME types
3. **Timeout errors**: Increase timeout for slow operations
4. **Stub conflicts**: Ensure proper cleanup in `afterEach` hooks

### Debugging Commands
```bash
# Run specific test file
npx mocha test/unit/utilities.test.js

# Run with debug output
DEBUG=* npm test

# Run single test
npx mocha test/unit/utilities.test.js --grep "should handle valid input"
```