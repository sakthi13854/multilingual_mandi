// Feature: multilingual-mandi, Property 1: Valid registration creates accounts with language preferences
// Feature: multilingual-mandi, Property 2: Invalid registration data is properly rejected  
// Feature: multilingual-mandi, Property 3: Authentication round-trip consistency
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AuthService } from '../src/services/auth.js';
import { UserRegistrationData } from '../src/types/auth.js';

describe('Property Tests: User Registration with Language Preferences', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    // Mock Prisma client for testing without database
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn()
      }
    };
    
    authService = new AuthService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Property 1: Valid registration creates accounts with language preferences', async () => {
    // Generator for valid user registration data
    const validUserDataArbitrary = fc.record({
      email: fc.string({ minLength: 3, maxLength: 20 })
        .map(s => `test${s.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}@test.property`),
      password: fc.string({ minLength: 8, maxLength: 20 })
        .map(s => s.trim() || 'password123'), // Ensure non-empty password
      name: fc.string({ minLength: 2, maxLength: 50 })
        .map(s => s.trim() || 'Test User'), // Ensure non-empty name
      preferredLanguage: fc.constantFrom('en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'),
      userType: fc.constantFrom('VENDOR', 'BUYER') as fc.Arbitrary<'VENDOR' | 'BUYER'>,
      phoneNumber: fc.option(
        fc.constant('9876543210'), // Use a fixed valid phone number
        { nil: undefined }
      )
    });

    await fc.assert(
      fc.asyncProperty(validUserDataArbitrary, async (userData: UserRegistrationData) => {
        // Mock database responses
        mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
        mockPrisma.user.create.mockResolvedValue({
          id: 'test-user-id',
          email: userData.email,
          name: userData.name,
          userType: userData.userType,
          preferredLanguage: userData.preferredLanguage, // Use the actual preferred language
        });

        // Act: Register user
        const result = await authService.register(userData);

        // Assert: Registration should succeed
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.user).toBeDefined();
        expect(result.token).toBeDefined();

        // Assert: User data should match input
        expect(result.user!.email).toBe(userData.email);
        expect(result.user!.name).toBe(userData.name);
        expect(result.user!.userType).toBe(userData.userType);
        expect(result.user!.preferredLanguage).toBe(userData.preferredLanguage);

        // Assert: Database methods were called correctly
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: userData.email }
        });
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: userData.email,
            name: userData.name,
            userType: userData.userType,
            preferredLanguage: userData.preferredLanguage,
            phoneNumber: userData.phoneNumber,
          }),
          select: expect.any(Object)
        });
      }),
      { 
        numRuns: 3,
        timeout: 5000,
        verbose: false
      }
    );
  });

  it('Property 1 Edge Case: Registration with all supported languages', async () => {
    const supportedLanguages = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'];
    
    for (const language of supportedLanguages) {
      const userData: UserRegistrationData = {
        email: `test-${language}@test.property`,
        password: 'testpassword123',
        name: 'Test User',
        preferredLanguage: language,
        userType: 'BUYER'
      };

      // Mock database responses
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: `test-user-${language}`,
        email: userData.email,
        name: userData.name,
        userType: userData.userType,
        preferredLanguage: language, // Use the actual language parameter
      });

      const result = await authService.register(userData);
      
      expect(result.success).toBe(true);
      expect(result.user!.preferredLanguage).toBe(language);
      
      // Verify database was called with correct language
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          preferredLanguage: language
        }),
        select: expect.any(Object)
      });
    }
  });
});

describe('Property Tests: Invalid Registration Data Rejection', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn()
      }
    };
    
    authService = new AuthService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Property 2: Invalid registration data is properly rejected', async () => {
    // Generator for invalid user registration data
    const invalidUserDataArbitrary = fc.oneof(
      // Invalid email formats
      fc.record({
        email: fc.oneof(
          fc.constant('invalid-email'),
          fc.constant(''),
          fc.constant('no-at-symbol.com'),
          fc.constant('@missing-local.com'),
          fc.constant('missing-domain@.com')
        ),
        password: fc.constant('validpassword123'),
        name: fc.constant('Valid Name'),
        preferredLanguage: fc.constant('en'),
        userType: fc.constant('BUYER') as fc.Arbitrary<'BUYER'>,
        phoneNumber: fc.constant(undefined)
      }),
      // Invalid password (too short)
      fc.record({
        email: fc.constant('valid@test.property'),
        password: fc.string({ maxLength: 7 }),
        name: fc.constant('Valid Name'),
        preferredLanguage: fc.constant('en'),
        userType: fc.constant('BUYER') as fc.Arbitrary<'BUYER'>,
        phoneNumber: fc.constant(undefined)
      }),
      // Invalid name (too short)
      fc.record({
        email: fc.constant('valid@test.property'),
        password: fc.constant('validpassword123'),
        name: fc.oneof(fc.constant(''), fc.constant('a')),
        preferredLanguage: fc.constant('en'),
        userType: fc.constant('BUYER') as fc.Arbitrary<'BUYER'>,
        phoneNumber: fc.constant(undefined)
      }),
      // Invalid language code
      fc.record({
        email: fc.constant('valid@test.property'),
        password: fc.constant('validpassword123'),
        name: fc.constant('Valid Name'),
        preferredLanguage: fc.oneof(fc.constant(''), fc.constant('x')),
        userType: fc.constant('BUYER') as fc.Arbitrary<'BUYER'>,
        phoneNumber: fc.constant(undefined)
      })
    );

    await fc.assert(
      fc.asyncProperty(invalidUserDataArbitrary, async (userData: UserRegistrationData) => {
        // Act: Attempt to register with invalid data
        const result = await authService.register(userData);

        // Assert: Registration should fail
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.user).toBeUndefined();
        expect(result.token).toBeUndefined();

        // Assert: Database create should not be called for invalid data
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      }),
      { 
        numRuns: 5,
        timeout: 5000,
        verbose: false
      }
    );
  });

  it('Property 2 Edge Case: Duplicate email rejection', async () => {
    const userData: UserRegistrationData = {
      email: 'duplicate@test.property',
      password: 'validpassword123',
      name: 'Test User',
      preferredLanguage: 'en',
      userType: 'BUYER'
    };

    // Mock existing user found
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user-id',
      email: userData.email
    });

    const result = await authService.register(userData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});

describe('Property Tests: Authentication Round-trip Consistency', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn()
      }
    };
    
    authService = new AuthService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Property 3: Authentication round-trip consistency', async () => {
    // Generator for valid user registration data
    const validUserDataArbitrary = fc.record({
      email: fc.string({ minLength: 3, maxLength: 20 })
        .map(s => `test${s.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}@test.property`),
      password: fc.string({ minLength: 8, maxLength: 20 })
        .map(s => s.trim() || 'password123'),
      name: fc.string({ minLength: 2, maxLength: 50 })
        .map(s => s.trim() || 'Test User'),
      preferredLanguage: fc.constantFrom('en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'),
      userType: fc.constantFrom('VENDOR', 'BUYER') as fc.Arbitrary<'VENDOR' | 'BUYER'>,
      phoneNumber: fc.option(
        fc.constant('9876543210'),
        { nil: undefined }
      )
    });

    await fc.assert(
      fc.asyncProperty(validUserDataArbitrary, async (userData: UserRegistrationData) => {
        // Setup: Mock successful registration
        mockPrisma.user.findUnique.mockResolvedValueOnce(null); // No existing user for registration
        mockPrisma.user.create.mockResolvedValueOnce({
          id: 'test-user-id',
          email: userData.email,
          name: userData.name,
          userType: userData.userType,
          preferredLanguage: userData.preferredLanguage,
        });

        // Act: Register user
        const registerResult = await authService.register(userData);
        
        // Assert: Registration should succeed
        expect(registerResult.success).toBe(true);
        expect(registerResult.user).toBeDefined();
        expect(registerResult.token).toBeDefined();

        // Setup: Mock successful login with hashed password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          id: 'test-user-id',
          email: userData.email,
          name: userData.name,
          userType: userData.userType,
          preferredLanguage: userData.preferredLanguage,
          passwordHash: hashedPassword
        });

        // Act: Login with same credentials
        const loginResult = await authService.login({
          email: userData.email,
          password: userData.password
        });

        // Assert: Login should succeed
        expect(loginResult.success).toBe(true);
        expect(loginResult.user).toBeDefined();
        expect(loginResult.token).toBeDefined();
        expect(loginResult.refreshToken).toBeDefined();

        // Assert: User data consistency between registration and login
        expect(loginResult.user!.email).toBe(registerResult.user!.email);
        expect(loginResult.user!.name).toBe(registerResult.user!.name);
        expect(loginResult.user!.userType).toBe(registerResult.user!.userType);
        expect(loginResult.user!.preferredLanguage).toBe(registerResult.user!.preferredLanguage);
      }),
      { 
        numRuns: 3,
        timeout: 5000,
        verbose: false
      }
    );
  });

  it('Property 3 Edge Case: Invalid login credentials are rejected', async () => {
    const validEmail = 'test@test.property';
    const validPassword = 'validpassword123';
    const invalidPassword = 'wrongpassword';

    // Mock user exists with hashed password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(validPassword, 12);
    
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'test-user-id',
      email: validEmail,
      name: 'Test User',
      userType: 'BUYER',
      preferredLanguage: 'en',
      passwordHash: hashedPassword
    });

    // Test with wrong password
    const result = await authService.login({
      email: validEmail,
      password: invalidPassword
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email or password');
    expect(result.user).toBeUndefined();
    expect(result.token).toBeUndefined();
  });

  it('Property 3 Edge Case: Non-existent user login is rejected', async () => {
    // Mock user not found
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await authService.login({
      email: 'nonexistent@test.property',
      password: 'anypassword123'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email or password');
    expect(result.user).toBeUndefined();
    expect(result.token).toBeUndefined();
  });
});