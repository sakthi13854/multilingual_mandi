import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.js';
import { UserRegistrationData, UserRegistrationSchema } from '../types/auth.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const authService = new AuthService();

// User registration endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData: UserRegistrationData = req.body;
    
    // Validate request body
    const validationResult = UserRegistrationSchema.safeParse(userData);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Invalid registration data: ${validationResult.error.errors.map(e => e.message).join(', ')}`
      });
    }

    const result = await authService.register(userData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Registration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// User login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.login({ email, password });
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Token refresh endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    await authService.logout(userId);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update language preference endpoint
router.put('/language', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { language } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    if (!language || typeof language !== 'string' || language.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Valid language code is required'
      });
    }

    await authService.setLanguagePreference(userId, language);
    
    res.status(200).json({
      success: true,
      message: 'Language preference updated successfully'
    });
  } catch (error) {
    console.error('Language preference update endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;