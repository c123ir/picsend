export interface User {
  id: string;
  phone: string | null;
  fullName?: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserDTO {
  phone: string;
  email?: string;
  fullName?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

export interface UpdateUserDTO {
  phone?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  isActive?: boolean;
  role?: 'user' | 'admin';
} 