import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector, CompactLanguageSelector } from './LanguageSelector';

// Mock the useAuth hook
const mockUpdateLanguagePreference = vi.fn();
const mockUseAuth = {
  user: {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    userType: 'BUYER' as const,
    preferredLanguage: 'en',
  },
  updateLanguagePreference: mockUpdateLanguagePreference,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render language dropdown with all supported languages', () => {
    render(<LanguageSelector />);
    
    const select = screen.getByTitle('Select your preferred language');
    expect(select).toBeInTheDocument();
    
    // Check for some Indian languages
    expect(screen.getByText('English (English)')).toBeInTheDocument();
    expect(screen.getByText('Hindi (हिन्दी)')).toBeInTheDocument();
    expect(screen.getByText('Bengali (বাংলা)')).toBeInTheDocument();
    expect(screen.getByText('Tamil (தமிழ்)')).toBeInTheDocument();
  });

  it('should show current user language as selected', () => {
    render(<LanguageSelector />);
    
    const select = screen.getByTitle('Select your preferred language') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('should use provided currentLanguage prop', () => {
    render(<LanguageSelector currentLanguage="hi" />);
    
    const select = screen.getByTitle('Select your preferred language') as HTMLSelectElement;
    expect(select.value).toBe('hi');
  });

  it('should call onLanguageChange when external handler provided', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();
    
    render(<LanguageSelector onLanguageChange={onLanguageChange} />);
    
    const select = screen.getByTitle('Select your preferred language');
    await user.selectOptions(select, 'hi');
    
    expect(onLanguageChange).toHaveBeenCalledWith('hi');
    expect(mockUpdateLanguagePreference).not.toHaveBeenCalled();
  });

  it('should update user preference when authenticated and no external handler', async () => {
    const user = userEvent.setup();
    mockUpdateLanguagePreference.mockResolvedValue({ success: true });
    
    render(<LanguageSelector />);
    
    const select = screen.getByTitle('Select your preferred language');
    await user.selectOptions(select, 'hi');
    
    expect(mockUpdateLanguagePreference).toHaveBeenCalledWith('hi');
  });

  it('should show error message when language update fails', async () => {
    const user = userEvent.setup();
    mockUpdateLanguagePreference.mockResolvedValue({ 
      success: false, 
      error: 'Update failed' 
    });
    
    render(<LanguageSelector />);
    
    const select = screen.getByTitle('Select your preferred language');
    await user.selectOptions(select, 'hi');
    
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('should show loading indicator during update', async () => {
    const user = userEvent.setup();
    // Mock a delayed response
    mockUpdateLanguagePreference.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    render(<LanguageSelector />);
    
    const select = screen.getByTitle('Select your preferred language');
    await user.selectOptions(select, 'hi');
    
    // Check for loading spinner (SVG with animate-spin class)
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('should disable select during update', async () => {
    const user = userEvent.setup();
    mockUpdateLanguagePreference.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    render(<LanguageSelector />);
    
    const select = screen.getByTitle('Select your preferred language');
    await user.selectOptions(select, 'hi');
    
    expect(select).toBeDisabled();
  });

  it('should work when user is not authenticated', () => {
    mockUseAuth.user = null;
    
    render(<LanguageSelector currentLanguage="en" />);
    
    const select = screen.getByTitle('Select your preferred language') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });
});

describe('CompactLanguageSelector Component', () => {
  it('should render compact language selector', () => {
    render(<CompactLanguageSelector currentLanguage="en" />);
    
    const select = screen.getByTitle('Select language');
    expect(select).toBeInTheDocument();
    
    // Should show native names
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('हिन्दी')).toBeInTheDocument();
  });

  it('should call onLanguageChange when selection changes', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();
    
    render(<CompactLanguageSelector onLanguageChange={onLanguageChange} />);
    
    const select = screen.getByTitle('Select language');
    await user.selectOptions(select, 'hi');
    
    expect(onLanguageChange).toHaveBeenCalledWith('hi');
  });

  it('should show selected language', () => {
    render(<CompactLanguageSelector currentLanguage="hi" />);
    
    const select = screen.getByTitle('Select language') as HTMLSelectElement;
    expect(select.value).toBe('hi');
  });

  it('should default to English when no language provided', () => {
    render(<CompactLanguageSelector />);
    
    const select = screen.getByTitle('Select language') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });
});