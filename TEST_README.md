# Test Suite Documentation

This document provides an overview of the comprehensive test suite for the project.

## Overview

The test suite uses **Vitest** as the test runner and **React Testing Library v16** for component testing. This setup is optimized for **React 19** and **Next.js 15** with modern 2025 best practices.

## Setup

### Install Dependencies

```bash
npm install
```

This will install all testing dependencies:

- `vitest` - Fast test runner with ESM and TypeScript support (2025 recommended for Next.js 15)
- `@testing-library/react` v16+ - React component testing utilities with React 19 support
- `@testing-library/dom` - DOM testing utilities (peer dependency for RTL v16+)
- `@testing-library/jest-dom` - Custom matchers for DOM assertions
- `@testing-library/user-event` - User interaction simulation
- `@vitejs/plugin-react` - React plugin for Vite
- `jsdom` - Mature DOM implementation (better React 19 stability than happy-dom)
- `@vitest/ui` - UI for test visualization
- `@vitest/coverage-v8` - Code coverage reporting

### Configuration Files

- **vitest.config.ts** - Main Vitest configuration
- **vitest.setup.ts** - Test environment setup and global mocks

### Why This Setup is Modern (2025)

**Vitest over Jest:**

- ✅ 50% faster test execution than Jest
- ✅ Native TypeScript, ESM, and JSX support
- ✅ Official Next.js 15 recommendation for new projects
- ✅ React team recommends Vite as preferred build tool

**jsdom over happy-dom:**

- ✅ Better React 19 stability and maturity
- ✅ More complete browser API implementation
- ✅ Handles complex React Testing Library queries (especially `byRole`)
- ⚠️ happy-dom can be 5x slower with role-based queries in some cases

**React Testing Library v16:**

- ✅ React 19 compatibility
- ✅ Requires `@testing-library/dom` as peer dependency (now explicit)
- ✅ Handles React 19's new `act` import location automatically

**Key React 19 Changes:**

- In React 19, `act` moved from `react-dom/test-utils` to `react`
- React Testing Library v16+ handles this automatically
- If you need `act` directly, import from `react` not `react-dom/test-utils`

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test src/pages/api/__tests__/generate-template.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --grep "form validation"
```

## Test Structure

### API Routes Tests (`src/pages/api/__tests__/`)

#### `generate-template.test.ts` (257 lines)
Tests for the AI image generation endpoint:
- ✓ Prompt generation with different difficulty levels
- ✓ Duration-based prompt adjustments
- ✓ OpenAI API integration
- ✓ Supabase Storage upload
- ✓ Error handling (API failures, no image generated, storage errors)
- ✓ Response format validation

#### `save-template.test.ts` (50 lines)
Tests for saving templates to the database:
- ✓ HTTP method validation (POST only)
- ✓ Template insertion with all fields
- ✓ Default title handling
- ✓ Database error handling
- ✓ Response format (201 status, success flag)

#### `get-templates.test.ts` (40 lines)
Tests for fetching paginated templates:
- ✓ Pagination (limit, offset, range calculation)
- ✓ Query execution (user filtering, sorting)
- ✓ Success response with metadata
- ✓ Empty results handling
- ✓ Database error handling
- ✓ Type coercion for query parameters

#### `get-template.test.ts` (39 lines)
Tests for fetching a single template:
- ✓ ID validation (missing, undefined, array, string)
- ✓ Query execution
- ✓ Success response
- ✓ 404 handling (PGRST116 error code)
- ✓ 500 handling (other database errors)
- ✓ Edge cases (empty string, UUID format, numeric ID)

### Library Tests (`src/lib/__tests__/`)

#### `supabase.test.ts`
Tests for Supabase client configuration:
- ✓ Environment variable usage
- ✓ Admin client configuration (autoRefreshToken, persistSession)
- ✓ Client creation (public and admin)
- ✓ Type exports validation

### Component Tests

#### `CreateTemplate.test.tsx` (`src/pages/CreateTemplate/__tests__/`)
Tests for the template creation form:
- ✓ Initial render (all fields, Header/Footer, option cards)
- ✓ Form field interactions (title, medium, difficulty, duration)
- ✓ Option selection (vision vs images)
- ✓ Form validation (required fields, alerts)
- ✓ Form submission (success flow, error handling, API calls)
- ✓ Loading state during submission
- ✓ Draft button functionality

#### `TemplateView.test.tsx` (`src/pages/TemplateView/__tests__/`)
Tests for the template display page:
- ✓ Loading state (spinner, no premature fetching)
- ✓ No template found (error message, create button)
- ✓ Template data fetching (API calls, error handling)
- ✓ Template display (title, medium, difficulty, duration, image, description)
- ✓ Action buttons (create another, back to home)
- ✓ Download functionality (button, link creation, filename generation)

#### `Header.test.tsx` (`src/components/__tests__/`)
Tests for the header component:
- ✓ Rendering (header element, title display, h1 element)
- ✓ Props handling (different titles, empty string, long titles, special characters)
- ✓ CSS classes application

#### `Footer.test.tsx` (`src/components/__tests__/`)
Tests for the footer component:
- ✓ Rendering (footer element, copyright text)
- ✓ CSS classes application
- ✓ Component structure
- ✓ Accessibility (contentinfo landmark)

## Test Coverage

### Current Coverage by Module

| Module | Files | Coverage Focus |
|--------|-------|----------------|
| API Routes | 4 files | High priority - critical business logic |
| Libraries | 1 file | Medium priority - client configuration |
| Page Components | 2 files | Medium priority - user interactions |
| UI Components | 2 files | Low priority - presentation |

### Expected Coverage Metrics

Run `npm run test:coverage` to see detailed metrics:
- **Statements**: Target 80%+
- **Branches**: Target 75%+
- **Functions**: Target 80%+
- **Lines**: Target 80%+

## Testing Patterns

### Mocking External Dependencies

```typescript
// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: {},
  }),
}));

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock fetch API
global.fetch = vi.fn();
```

### Testing Async Operations

```typescript
await waitFor(() => {
  expect(screen.getByText('Success!')).toBeInTheDocument();
});
```

### User Interactions

```typescript
const user = userEvent.setup();
await user.type(input, 'test value');
await user.click(button);
```

### Form Testing

```typescript
const submitButton = screen.getByRole('button', { name: 'Submit' });
fireEvent.click(submitButton);
```

## Best Practices

1. **Descriptive Test Names**: Use clear, action-oriented test names
2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
3. **Mock at Boundaries**: Mock external APIs and databases, not internal logic
4. **Test Behavior, Not Implementation**: Focus on what users see and do
5. **Avoid Test Interdependence**: Each test should be independently runnable
6. **Use Testing Library Queries**: Prefer `getByRole`, `getByText` over `querySelector`
7. **Clean Up**: Use `beforeEach` to reset mocks and state

## Troubleshooting

### Tests Failing Due to Missing Mocks

Ensure all external dependencies are mocked in `vitest.setup.ts` or individual test files.

### Type Errors

Make sure TypeScript is properly configured and all type definitions are installed.

### Async Issues

Use `waitFor` for assertions that depend on async operations.

### Coverage Issues

Check that all test files are being discovered. Vitest looks for files matching:
- `**/__tests__/**/*.{ts,tsx}`
- `**/*.{test,spec}.{ts,tsx}`

## Adding New Tests

1. Create test file next to the code being tested or in `__tests__` directory
2. Import necessary testing utilities
3. Mock external dependencies
4. Write descriptive test cases using `describe` and `it` blocks
5. Follow existing patterns for consistency
6. Run tests to ensure they pass
7. Check coverage to identify gaps

## CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event](https://testing-library.com/docs/user-event/intro)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

## Summary

✅ **Modern 2025 Stack**: Vitest (50% faster than Jest) + React Testing Library v16 + jsdom
✅ **React 19 Compatible**: Uses RTL v16 with React 19.1.0 support
✅ **Next.js 15 Optimized**: Follows official Next.js testing recommendations
✅ **10 test files** covering all major components and API routes
✅ **Comprehensive coverage** of business logic and user interactions
✅ **Mocked dependencies** for isolated, fast tests
✅ **Easy to run** with simple npm scripts
✅ **Well-documented** patterns and best practices

### Technology Stack

| Technology | Version | Why? |
|------------|---------|------|
| Vitest | ^1.0.4 | 50% faster, native TypeScript/ESM, Next.js 15 recommended |
| @testing-library/react | ^16.3.0 | React 19 compatibility, official React team recommendation |
| @testing-library/dom | ^10.4.0 | Required peer dependency for RTL v16+ |
| jsdom | ^25.0.1 | Better React 19 stability than happy-dom, complete browser APIs |
| React | 19.1.0 | Latest React with new features and `act` improvements |
| Next.js | 15.5.4 | Latest Next.js with Turbopack |

The test suite is ready to use. Install dependencies with `npm install` and run tests with `npm test`.
