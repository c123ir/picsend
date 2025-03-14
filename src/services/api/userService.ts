import axios from 'axios';
import { User, CreateUserDTO, UpdateUserDTO } from '../../models/User';
import { API_CONFIG } from '../../config/api';

const BASE_URL = `${API_CONFIG.baseURL}/users`;

export const userService = {
  // دریافت اطلاعات کاربر با شماره موبایل
  async findByPhone(phone: string): Promise<User | null> {
    try {
      const response = await axios.get(`${BASE_URL}/phone/${phone}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // ایجاد کاربر جدید
  async create(data: CreateUserDTO): Promise<User> {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  },

  // بروزرسانی اطلاعات کاربر
  async update(userId: string, data: UpdateUserDTO): Promise<User> {
    const response = await axios.patch(`${BASE_URL}/${userId}`, data);
    return response.data;
  },

  // دریافت اطلاعات کاربر با آیدی
  async findById(userId: string): Promise<User> {
    const response = await axios.get(`${BASE_URL}/${userId}`);
    return response.data;
  },

  // بروزرسانی زمان آخرین ورود
  async updateLastLogin(userId: string): Promise<void> {
    await axios.post(`${BASE_URL}/${userId}/last-login`);
  },

  // غیرفعال کردن کاربر
  async deactivate(userId: string): Promise<void> {
    await axios.post(`${BASE_URL}/${userId}/deactivate`);
  },

  // فعال کردن کاربر
  async activate(userId: string): Promise<void> {
    await axios.post(`${BASE_URL}/${userId}/activate`);
  }
}; 