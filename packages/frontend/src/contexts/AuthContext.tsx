import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResult, LoginCredentials, UserRegistrationData } from '../types/auth';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (userData: UserRegistrationData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateLanguagePreference: (language: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on app load
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await authAPI.login(credentials);
      
      if (result.success && result.user && result.token) {
        setUser(result.user as User);
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistrationData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await authAPI.register(userData);
      
      if (result.success && result.user && result.token) {
        setUser(result.user as User);
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      setIsLoading(false);
    }
  };

  const updateLanguagePreference = async (language: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authAPI.updateLanguagePreference(language);
    
    if (result.success && user) {
      const updatedUser = { ...user, preferredLanguage: language };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
    
    return result;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateLanguagePreference,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};