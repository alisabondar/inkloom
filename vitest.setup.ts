import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Suppress console.error in tests (expected errors are intentionally logged)
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.PIXAZO_API_KEY = 'test-pixazo-key';

// React 19 Compatibility Notes:
// - In React 19, `act` has been moved from 'react-dom/test-utils' to 'react'
// - React Testing Library v16+ handles this automatically
// - If you need to use `act` directly, import it from 'react' instead of 'react-dom/test-utils'
// Example: import { act } from 'react';
