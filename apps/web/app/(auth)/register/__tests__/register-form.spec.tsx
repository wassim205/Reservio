import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../register-form';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    register: jest.fn(),
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

describe('RegisterForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the register form correctly', () => {
    render(<RegisterForm />);

    expect(screen.getByText('Nom complet')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('exemple@email.com')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByLabelText(/j'accepte les/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    expect(screen.getByText('Nom requis')).toBeInTheDocument();
    expect(screen.getByText('Email requis')).toBeInTheDocument();
    expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
    expect(screen.getByText('Vous devez accepter les conditions')).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const termsCheckbox = screen.getByRole('checkbox');

    await user.type(fullnameInput, 'Jean Dupont');
    await user.type(emailInput, 'test@domain');
    await user.type(passwordInput, 'password123');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email invalide')).toBeInTheDocument();
    });
  });

  it('shows error for short password', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, '123');

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    expect(screen.getByText(/Le mot de passe doit contenir au moins 6 caractères/i)).toBeInTheDocument();
  });

  it('shows error for short fullname', async () => {
    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    await user.type(fullnameInput, 'A');

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    expect(screen.getByText(/Le nom doit contenir au moins 2 caractères/i)).toBeInTheDocument();
  });

  it('shows error when terms not accepted', async () => {
    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await user.type(fullnameInput, 'Jean Dupont');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    expect(screen.getByText('Vous devez accepter les conditions')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(btn => btn.getAttribute('type') === 'button');
    
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('submits form with valid data and redirects on success', async () => {
    (api.register as jest.Mock).mockResolvedValueOnce({
      user: { id: '1', fullname: 'Jean Dupont', email: 'test@example.com' },
    });

    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(fullnameInput, 'Jean Dupont');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith({
        fullname: 'Jean Dupont',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('displays API error message on registration failure', async () => {
    (api.register as jest.Mock).mockRejectedValueOnce({
      message: 'Email déjà utilisé',
    });

    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(fullnameInput, 'Jean Dupont');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email déjà utilisé')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveRegister: (value: unknown) => void;
    const registerPromise = new Promise(resolve => {
      resolveRegister = resolve;
    });
    (api.register as jest.Mock).mockReturnValueOnce(registerPromise);

    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(fullnameInput, 'Jean Dupont');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    expect(screen.getByText('Création en cours...')).toBeInTheDocument();

    resolveRegister!({ user: { id: '1' } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('disables submit button while loading', async () => {
    let resolveRegister: (value: unknown) => void;
    const registerPromise = new Promise(resolve => {
      resolveRegister = resolve;
    });
    (api.register as jest.Mock).mockReturnValueOnce(registerPromise);

    render(<RegisterForm />);

    const fullnameInput = screen.getByPlaceholderText('Jean Dupont');
    const emailInput = screen.getByPlaceholderText('exemple@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(fullnameInput, 'Jean Dupont');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /créer mon compte/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /création en cours/i })).toBeDisabled();
    });

    resolveRegister!({ user: { id: '1' } });
  });

  it('links to terms and privacy pages exist', () => {
    render(<RegisterForm />);

    const termsLink = screen.getByRole('link', { name: /conditions/i });
    const privacyLink = screen.getByRole('link', { name: /politique de confidentialité/i });

    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});
