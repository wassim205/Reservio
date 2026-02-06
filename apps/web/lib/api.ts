import type {
  LoginInput,
  RegisterInput,
  ApiError,
  User,
  Event,
  CreateEventInput,
  UpdateEventInput,
  EventStatus,
  Registration,
} from './types';

// Use same-origin proxy to avoid cross-origin cookie issues
const API_URL = '/api';

// Response types for cookie-based auth
interface AuthResponse {
  user: User;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data as T;
  }

  // Auth endpoints
  async login(input: LoginInput): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe(): Promise<AuthResponse | null> {
    try {
      return await this.request<AuthResponse>('/auth/me');
    } catch {
      return null;
    }
  }

  // ============ EVENT ENDPOINTS ============

  // Get all events (admin only)
  async getEvents(status?: EventStatus): Promise<{ events: Event[] }> {
    const query = status ? `?status=${status}` : '';
    return this.request<{ events: Event[] }>(`/events${query}`);
  }

  // Get published events (public)
  async getPublishedEvents(): Promise<{ events: Event[] }> {
    return this.request<{ events: Event[] }>('/events/published');
  }

  // Get single event
  async getEvent(id: string): Promise<{ event: Event }> {
    return this.request<{ event: Event }>(`/events/${id}`);
  }

  // Create event (admin only)
  async createEvent(input: CreateEventInput): Promise<{ event: Event; message: string }> {
    return this.request<{ event: Event; message: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Update event (admin only)
  async updateEvent(id: string, input: UpdateEventInput): Promise<{ event: Event; message: string }> {
    return this.request<{ event: Event; message: string }>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Publish event (admin only)
  async publishEvent(id: string): Promise<{ event: Event; message: string }> {
    return this.request<{ event: Event; message: string }>(`/events/${id}/publish`, {
      method: 'POST',
    });
  }

  // Cancel event (admin only)
  async cancelEvent(id: string): Promise<{ event: Event; message: string }> {
    return this.request<{ event: Event; message: string }>(`/events/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Delete event (admin only)
  async deleteEvent(id: string): Promise<void> {
    await this.request<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ REGISTRATION ENDPOINTS ============

  // Register for an event (participant)
  async registerForEvent(eventId: string): Promise<{ registration: Registration; message: string }> {
    return this.request<{ registration: Registration; message: string }>(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  // Get my registrations (participant)
  async getMyRegistrations(): Promise<{ registrations: Registration[] }> {
    return this.request<{ registrations: Registration[] }>('/registrations/my');
  }

  // Cancel my registration (participant)
  async cancelRegistration(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/registrations/${id}`, {
      method: 'DELETE',
    });
  }

  // Check if already registered for an event
  async checkRegistration(eventId: string): Promise<Registration | null> {
    try {
      const { registrations } = await this.getMyRegistrations();
      return registrations.find(r => r.eventId === eventId && r.status !== 'CANCELLED') || null;
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
