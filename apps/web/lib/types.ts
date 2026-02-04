// Auth types for frontend

export interface User {
  id: string;
  fullname: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenInput {
  refresh_token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// Validation constants
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalide',
  },
  password: {
    minLength: 6,
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  },
  fullname: {
    minLength: 2,
    message: 'Le nom doit contenir au moins 2 caractères',
  },
};
