import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// Mock the useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = {
  login: mockLogin,
  isLoading: false,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
  });

  it('should render login form elements', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Sign In to Multilingual Mandi')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    
    // Start typing to clear error
    await user.type(emailInput, 'test@example.com');
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should call login function with correct credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show error message when login fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Invalid credentials' 
    });
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    mockUseAuth.isLoading = true;
    
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Signing In...' });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Signing In...')).toBeInTheDocument();
  });

  it('should call onSuccess callback when login succeeds', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockLogin.mockResolvedValue({ success: true });
    
    render(<LoginForm onSuccess={onSuccess} />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show switch to register link when callback provided', () => {
    const onSwitchToRegister = vi.fn();
    render(<LoginForm onSwitchToRegister={onSwitchToRegister} />);
    
    const switchLink = screen.getByText('Sign up here');
    expect(switchLink).toBeInTheDocument();
    
    fireEvent.click(switchLink);
    expect(onSwitchToRegister).toHaveBeenCalled();
  });

  it('should disable form inputs during loading', () => {
    mockUseAuth.isLoading = true;
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});