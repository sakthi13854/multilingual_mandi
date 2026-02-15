import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

// Mock the useAuth hook
const mockRegister = vi.fn();
const mockUseAuth = {
  register: mockRegister,
  isLoading: false,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

describe('RegisterForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
  });

  it('should render registration form elements', () => {
    render(<RegisterForm />);
    
    expect(screen.getByText('Join Multilingual Mandi')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Language')).toBeInTheDocument();
    expect(screen.getByText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number (Optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await user.click(submitButton);
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
  });

  it('should show validation error for short name', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    await user.type(nameInput, 'A');
    await user.click(submitButton);
    
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
  });

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('should show validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('should show validation error for invalid phone number', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const phoneInput = screen.getByLabelText('Phone Number (Optional)');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    await user.type(phoneInput, '123');
    await user.click(submitButton);
    
    expect(screen.getByText('Please enter a valid 10-digit phone number')).toBeInTheDocument();
  });

  it('should render language selection dropdown with Indian languages', () => {
    render(<RegisterForm />);
    
    const languageSelect = screen.getByLabelText('Preferred Language');
    expect(languageSelect).toBeInTheDocument();
    
    // Check for some Indian languages
    expect(screen.getByText('English (English)')).toBeInTheDocument();
    expect(screen.getByText('Hindi (हिन्दी)')).toBeInTheDocument();
    expect(screen.getByText('Bengali (বাংলা)')).toBeInTheDocument();
  });

  it('should render account type radio buttons', () => {
    render(<RegisterForm />);
    
    const buyerRadio = screen.getByLabelText('Buyer - I want to purchase products');
    const vendorRadio = screen.getByLabelText('Vendor - I want to sell products');
    
    expect(buyerRadio).toBeInTheDocument();
    expect(vendorRadio).toBeInTheDocument();
    expect(buyerRadio).toBeChecked(); // Default selection
  });

  it('should allow switching between account types', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const buyerRadio = screen.getByLabelText('Buyer - I want to purchase products');
    const vendorRadio = screen.getByLabelText('Vendor - I want to sell products');
    
    expect(buyerRadio).toBeChecked();
    
    await user.click(vendorRadio);
    expect(vendorRadio).toBeChecked();
    expect(buyerRadio).not.toBeChecked();
  });

  it('should call register function with correct data', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: true });
    
    render(<RegisterForm />);
    
    // Fill out the form
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.selectOptions(screen.getByLabelText('Preferred Language'), 'hi');
    await user.click(screen.getByLabelText('Vendor - I want to sell products'));
    await user.type(screen.getByLabelText('Phone Number (Optional)'), '9876543210');
    
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    
    expect(mockRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      preferredLanguage: 'hi',
      userType: 'VENDOR',
      phoneNumber: '9876543210',
    });
  });

  it('should show error message when registration fails', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ 
      success: false, 
      error: 'Email already exists' 
    });
    
    render(<RegisterForm />);
    
    // Fill out valid form
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('should show loading state during registration', async () => {
    mockUseAuth.isLoading = true;
    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Creating Account...' });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
  });

  it('should call onSuccess callback when registration succeeds', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockRegister.mockResolvedValue({ success: true });
    
    render(<RegisterForm onSuccess={onSuccess} />);
    
    // Fill out valid form
    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show switch to login link when callback provided', () => {
    const onSwitchToLogin = vi.fn();
    render(<RegisterForm onSwitchToLogin={onSwitchToLogin} />);
    
    const switchLink = screen.getByText('Sign in here');
    expect(switchLink).toBeInTheDocument();
    
    fireEvent.click(switchLink);
    expect(onSwitchToLogin).toHaveBeenCalled();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText('Full Name');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    
    // Start typing to clear error
    await user.type(nameInput, 'John');
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });
});