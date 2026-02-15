import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRegistrationData, AuthResult, UserRegistrationSchema, LoginCredentials } from '../types/auth.js';

export class AuthService {
  private prisma: any;

  constructor(prismaClient?: any) {
    // Allow injection of prisma client for testing
    if (prismaClient) {
      this.prisma = prismaClient;
    } else {
      // Dynamic import to avoid circular dependency issues
      import('../index.js').then(module => {
        this.prisma = module.prisma;
      });
    }
  }

  async register(userData: UserRegistrationData): Promise<AuthResult> {
    try {
      // Validate input data using Zod schema
      const validationResult = UserRegistrationSchema.safeParse(userData);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Invalid registration data: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        };
      }

      // Additional validation for edge cases
      if (userData.password.trim().length < 8) {
        return {
          success: false,
          error: 'Password must contain at least 8 non-whitespace characters'
        };
      }

      if (userData.name.trim().length < 2) {
        return {
          success: false,
          error: 'Name must contain at least 2 non-whitespace characters'
        };
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          userType: userData.userType,
          preferredLanguage: userData.preferredLanguage,
          phoneNumber: userData.phoneNumber,
        },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          preferredLanguage: true,
        }
      });

      // Generate JWT tokens with proper error handling
      const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-for-development';
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-development';
      
      if ((!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) && process.env.NODE_ENV === 'production') {
        console.error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required in production');
        return {
          success: false,
          error: 'Server configuration error'
        };
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '15m' } // Short-lived access token
      );

      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        refreshSecret,
        { expiresIn: '7d' } // Long-lived refresh token
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          preferredLanguage: user.preferredLanguage,
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed due to server error'
      };
    }
  }

  async refreshToken(token: string): Promise<AuthResult> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-development';
      const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-for-development';
      
      // Verify refresh token
      const decoded = jwt.verify(token, refreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      // Find user to ensure they still exist
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          preferredLanguage: true,
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate new access token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '15m' }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          preferredLanguage: user.preferredLanguage,
        },
        token: newToken
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Invalid or expired refresh token'
      };
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // For now, just log the logout action
      // In a full implementation, we might invalidate tokens in a blacklist
      console.log(`User ${userId} logged out`);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async setLanguagePreference(userId: string, language: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { preferredLanguage: language }
      });
    } catch (error) {
      console.error('Language preference update error:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;
      
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          preferredLanguage: true,
          passwordHash: true,
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT tokens with proper error handling
      const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-for-development';
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-development';
      
      if ((!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) && process.env.NODE_ENV === 'production') {
        console.error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required in production');
        return {
          success: false,
          error: 'Server configuration error'
        };
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '15m' } // Short-lived access token
      );

      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'refresh' },
        refreshSecret,
        { expiresIn: '7d' } // Long-lived refresh token
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          preferredLanguage: user.preferredLanguage,
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed due to server error'
      };
    }
  }
}