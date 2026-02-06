import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
  },
}));

// Mock the auth context
const mockLogin = jest.fn();
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAdmin: false,
    login: mockLogin,
    logout: jest.fn(),
  }),
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('LoginForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('exemple@email.com')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    expect(screen.getByText(/mot de passe oublié/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    expect(screen.getByText('Email requis')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    // Use an email that passes HTML5 validation but fails our stricter regex
    await user.type(emailInput, 'test@domain');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email invalide')).toBeInTheDocument();
    });
  });

  it('shows error for short password', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    expect(screen.getByText(/Le mot de passe doit contenir au moins 6 caractères/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find the toggle button (eye icon button) - it's a button without submit type
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(btn => btn.getAttribute('type') === 'button');
    
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('submits form with valid credentials and redirects on success', async () => {
    (api.login as jest.Mock).mockResolvedValueOnce({
      user: { id: '1', email: 'test@example.com' },
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays API error message on login failure', async () => {
    (api.login as jest.Mock).mockRejectedValueOnce({
      message: 'Identifiants invalides',
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Create a promise that we can control
    let resolveLogin: (value: unknown) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    (api.login as jest.Mock).mockReturnValueOnce(loginPromise);

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Connexion...')).toBeInTheDocument();

    // Resolve the promise
    resolveLogin!({ user: { id: '1' } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('disables submit button while loading', async () => {
    let resolveLogin: (value: unknown) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });
    (api.login as jest.Mock).mockReturnValueOnce(loginPromise);

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connexion/i })).toBeDisabled();
    });

    resolveLogin!({ user: { id: '1' } });
  });
});
