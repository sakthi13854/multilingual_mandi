// Feature: multilingual-mandi, Property 1: Valid registration creates accounts with language preferences
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AuthService } from '../src/services/auth.js';
describe('Property Tests: User Registration with Language Preferences', () => {
    let authService;
    let mockPrisma;
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
            email: fc.string({ minLength: 5, maxLength: 50 })
                .map(s => `${s.replace(/[^a-zA-Z0-9]/g, '')}@test.property`),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            name: fc.string({ minLength: 2, maxLength: 100 })
                .filter(s => s.trim().length >= 2),
            preferredLanguage: fc.constantFrom('en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'),
            userType: fc.constantFrom('VENDOR', 'BUYER'),
            phoneNumber: fc.option(fc.string({ minLength: 10, maxLength: 15 })
                .map(s => s.replace(/[^0-9]/g, '').slice(0, 10))
                .filter(s => s.length >= 10), { nil: undefined })
        });
        await fc.assert(fc.asyncProperty(validUserDataArbitrary, async (userData) => {
            // Mock database responses
            mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
            mockPrisma.user.create.mockResolvedValue({
                id: 'test-user-id',
                email: userData.email,
                name: userData.name,
                userType: userData.userType,
                preferredLanguage: userData.preferredLanguage,
            });
            // Act: Register user
            const result = await authService.register(userData);
            // Assert: Registration should succeed
            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            // Assert: User data should match input
            expect(result.user.email).toBe(userData.email);
            expect(result.user.name).toBe(userData.name);
            expect(result.user.userType).toBe(userData.userType);
            expect(result.user.preferredLanguage).toBe(userData.preferredLanguage);
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
        }), {
            numRuns: 20,
            timeout: 30000,
            verbose: true
        });
    });
    it('Property 1 Edge Case: Registration with all supported languages', async () => {
        const supportedLanguages = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'];
        for (const language of supportedLanguages) {
            const userData = {
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
                preferredLanguage: language,
            });
            const result = await authService.register(userData);
            expect(result.success).toBe(true);
            expect(result.user.preferredLanguage).toBe(language);
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
//# sourceMappingURL=auth.property.test.js.map