# Testing Guide

This document outlines the testing strategy and patterns for the AkwaabaHRPay system.

## Testing Structure

```
__tests__/
├── setup.ts                 # Global test setup and configuration
├── services/                # Service layer tests
│   ├── employee-service.test.ts
│   ├── payroll-service.test.ts
│   └── attendance-service.test.ts
└── api/                     # API route tests
    └── employees.test.ts
```

## Running Tests

### Install Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
```

### Configure Jest

Create `jest.config.js` in the project root:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- employee-service.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="getEmployeesByCompany"
```

## Test Patterns

### Service Tests

Services should be tested for:
- Happy path (successful operations)
- Error handling
- Data validation
- Edge cases

Example:

```typescript
describe("EmployeeService", () => {
  let employeeService: EmployeeService

  beforeEach(() => {
    employeeService = new EmployeeService(true)
  })

  it("should fetch employees for a company", async () => {
    const result = await employeeService.getEmployeesByCompany("company-id")

    expect(result).toHaveProperty("success")
    expect(result).toHaveProperty("data")
    expect(result).toHaveProperty("error")
  })
})
```

### API Tests

API routes should be tested for:
- Correct response status codes
- Response data structure
- Authentication/authorization
- Input validation
- Error handling

Example:

```typescript
describe("GET /api/employees", () => {
  it("should return 200 with employees list", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/api/employees"))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty("employees")
  })

  it("should return 401 for unauthenticated requests", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/api/employees"))

    expect(response.status).toBe(401)
  })
})
```

## Mocking Strategy

### Mocking Supabase

```typescript
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))
```

### Mocking HTTP Requests

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  })
)
```

## Coverage Goals

Target coverage metrics:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Run coverage report:

```bash
npm test -- --coverage
```

## Continuous Integration

Add to CI/CD pipeline:

```yaml
- name: Run Tests
  run: npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Best Practices

1. **Keep tests focused**: Each test should test one thing
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Mock external dependencies**: Mock Supabase, APIs, and other external services
4. **Test edge cases**: Include tests for empty data, null values, errors
5. **Avoid test interdependencies**: Tests should be independent and can run in any order
6. **Use beforeEach/afterEach**: Setup and teardown state properly
7. **Don't test implementation details**: Test behavior, not implementation
8. **Keep tests maintainable**: Update tests when features change

## Debugging Tests

### Run a Single Test

```bash
npm test -- employee-service.test.ts
```

### Run Tests in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Add Console Output

```typescript
it("should fetch employees", async () => {
  const result = await employeeService.getEmployeesByCompany("company-id")
  
  console.log("Result:", result) // This will show in test output
  
  expect(result.success).toBe(true)
})
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/testing)

## Common Issues

### "Cannot find module" errors

Ensure `tsconfig.json` has correct path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Async test timeouts

Increase Jest timeout for slow tests:

```typescript
jest.setTimeout(10000)

it("should handle slow operation", async () => {
  // test code
})
```

### Supabase client not mocking properly

Ensure mock is set up before importing the service:

```typescript
jest.mock("@/lib/supabase/server")

import { EmployeeService } from "@/lib/services"
```
