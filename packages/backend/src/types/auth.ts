import { z } from 'zod';

export const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  preferredLanguage: z.string().min(2, 'Language code must be at least 2 characters'),
  userType: z.enum(['VENDOR', 'BUYER'], { required_error: 'User type is required' }),
  phoneNumber: z.string().optional(),
});

export type UserRegistrationData = z.infer<typeof UserRegistrationSchema>;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    userType: string;
    preferredLanguage: string;
  };
  token?: string;
  refreshToken?: string;
  error?: string;
}