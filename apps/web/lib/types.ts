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

// Event types
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: EventStatus;
  metadata: Record<string, unknown> | null;
  createdById: string;
  createdBy: {
    id: string;
    fullname: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  metadata?: Record<string, unknown>;
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
  event: {
    title: {
      minLength: 3,
      maxLength: 100,
      message: 'Le titre doit contenir entre 3 et 100 caractères',
    },
    description: {
      minLength: 10,
      maxLength: 2000,
      message: 'La description doit contenir entre 10 et 2000 caractères',
    },
    location: {
      maxLength: 200,
      message: 'Le lieu ne peut pas dépasser 200 caractères',
    },
    capacity: {
      min: 1,
      message: 'La capacité doit être au moins 1',
    },
  },
};
