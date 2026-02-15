import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set up test environment variables
  process.env.JWT_SECRET = 'test-jwt-secret-for-property-based-testing';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-property-based-testing';
  process.env.NODE_ENV = 'test';
});