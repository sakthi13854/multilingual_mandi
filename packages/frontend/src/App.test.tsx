import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Mock the AuthContext
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateLanguagePreference: vi.fn(),
  }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App Component', () => {
  it('should render without crashing', () => {
    renderWithProviders(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('should redirect to auth page when not authenticated', () => {
    renderWithProviders(<App />);
    // Since we're not authenticated, we should see the auth page content
    expect(screen.getByText('Multilingual Mandi')).toBeInTheDocument();
  });
});