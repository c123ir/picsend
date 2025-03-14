export interface User {
  id: string;
  phone: string;
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
  fullName?: string;
  email?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserDTO {
  fullName?: string;
  email?: string;
  avatar?: string;
  isActive?: boolean;
  role?: 'user' | 'admin';
} 