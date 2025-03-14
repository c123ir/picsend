import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  async register(email: string, password: string, name: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      name,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('token');
    if (token) {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  },

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('توکن یافت نشد');
    }
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default authService; 