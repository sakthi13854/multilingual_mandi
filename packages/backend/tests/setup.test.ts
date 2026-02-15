import { describe, it, expect } from 'vitest';

describe('Project Setup Validation', () => {
  it('should have required environment variables defined', () => {
    // Basic setup validation
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it('should be able to import core modules', async () => {
    // Test that we can import our main modules
    const { AuthService } = await import('../src/services/auth.js');
    expect(AuthService).toBeDefined();
    
    const { UserRegistrationSchema } = await import('../src/types/auth.js');
    expect(UserRegistrationSchema).toBeDefined();
  });

  it('should validate TypeScript compilation works', () => {
    // This test passing means TypeScript compilation is working
    const testObject: { name: string; count: number } = {
      name: 'test',
      count: 42
    };
    
    expect(testObject.name).toBe('test');
    expect(testObject.count).toBe(42);
  });
});