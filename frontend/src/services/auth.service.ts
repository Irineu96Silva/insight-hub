
import { api } from './api.service';
import type { LoginDto, RegisterDto, User } from 'src/types'; // We might need to define types

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(userData: RegisterDto): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  }
};
