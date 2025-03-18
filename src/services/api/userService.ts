import axios from 'axios';
import { User, CreateUserDTO, UpdateUserDTO } from '../../models/User';
import { API_CONFIG } from '../../config/api';
import { loggingClient } from '../../utils/loggingClient';

const BASE_URL = `${API_CONFIG.baseURL}/users`;

// اضافه کردن توکن احراز هویت به هدرهای درخواست‌ها
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const userService = {
  // دریافت اطلاعات کاربر با شماره موبایل
  async findByPhone(phone: string): Promise<User | null> {
    try {
      const startTime = performance.now();
      const response = await axios.get(`${BASE_URL}/phone/${phone}`);
      loggingClient.logPerformance('userService.findByPhone', performance.now() - startTime);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      loggingClient.error('خطا در یافتن کاربر با شماره تلفن', {
        error: error instanceof Error ? error.message : String(error),
        phone,
        action: 'user_find_by_phone_error'
      });
      throw error;
    }
  },

  // ایجاد کاربر جدید
  async create(data: CreateUserDTO): Promise<User> {
    try {
      const startTime = performance.now();
      const response = await axios.post(BASE_URL, data);
      loggingClient.logPerformance('userService.create', performance.now() - startTime);
      loggingClient.info('کاربر جدید ایجاد شد', {
        phone: data.phone,
        action: 'user_created'
      });
      return response.data;
    } catch (error) {
      loggingClient.error('خطا در ایجاد کاربر', {
        error: error instanceof Error ? error.message : String(error),
        action: 'user_create_error'
      });
      throw error;
    }
  },

  // بروزرسانی اطلاعات کاربر
  async update(userId: string, data: UpdateUserDTO): Promise<User> {
    try {
      const startTime = performance.now();
      const response = await axios.put(`${BASE_URL}/${userId}`, data, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.update', performance.now() - startTime);
      loggingClient.info('اطلاعات کاربر بروزرسانی شد', {
        userId,
        action: 'user_updated'
      });
      return response.data;
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action: 'user_update_error'
      });
      throw error;
    }
  },

  // دریافت اطلاعات کاربر با آیدی
  async findById(userId: string): Promise<User> {
    try {
      const startTime = performance.now();
      const response = await axios.get(`${BASE_URL}/${userId}`, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.findById', performance.now() - startTime);
      return response.data;
    } catch (error) {
      loggingClient.error('خطا در یافتن کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action: 'user_find_by_id_error'
      });
      throw error;
    }
  },

  // بروزرسانی زمان آخرین ورود
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const startTime = performance.now();
      await axios.post(`${BASE_URL}/${userId}/last-login`, {}, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.updateLastLogin', performance.now() - startTime);
      loggingClient.info('زمان آخرین ورود کاربر بروزرسانی شد', {
        userId,
        action: 'user_last_login_updated'
      });
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی زمان آخرین ورود', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action: 'user_update_last_login_error'
      });
      throw error;
    }
  },

  // غیرفعال کردن کاربر
  async deactivate(userId: string): Promise<void> {
    try {
      const startTime = performance.now();
      await axios.put(`${BASE_URL}/${userId}/deactivate`, {}, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.deactivate', performance.now() - startTime);
      loggingClient.warn('کاربر غیرفعال شد', {
        userId,
        action: 'user_deactivated'
      });
    } catch (error) {
      loggingClient.error('خطا در غیرفعال کردن کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action: 'user_deactivate_error'
      });
      throw error;
    }
  },

  // فعال کردن کاربر
  async activate(userId: string): Promise<void> {
    try {
      const startTime = performance.now();
      await axios.put(`${BASE_URL}/${userId}/activate`, {}, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.activate', performance.now() - startTime);
      loggingClient.info('کاربر فعال شد', {
        userId,
        action: 'user_activated'
      });
    } catch (error) {
      loggingClient.error('خطا در فعال کردن کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action: 'user_activate_error'
      });
      throw error;
    }
  },
  
  // دریافت لیست همه کاربران (مخصوص مدیر)
  async findAll(): Promise<User[]> {
    try {
      const startTime = performance.now();
      const response = await axios.get(BASE_URL, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.findAll', performance.now() - startTime);
      loggingClient.info('لیست کاربران دریافت شد', {
        count: Array.isArray(response.data) ? response.data.length : 1,
        action: 'admin_users_loaded'
      });
      
      // اطمینان از اینکه نتیجه همیشه یک آرایه است
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      loggingClient.error('خطا در دریافت لیست کاربران', {
        error: error instanceof Error ? error.message : String(error),
        action: 'admin_users_load_error'
      });
      // در صورت خطا، آرایه خالی برگردان
      return [];
    }
  },
  
  // ایجاد کاربر جدید توسط مدیر
  async createByAdmin(data: CreateUserDTO & { password: string }): Promise<User> {
    try {
      const startTime = performance.now();
      const response = await axios.post(BASE_URL, data, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.createByAdmin', performance.now() - startTime);
      loggingClient.info('کاربر جدید توسط مدیر ایجاد شد', {
        phone: data.phone,
        email: data.email,
        role: data.role,
        action: 'admin_user_created'
      });
      return response.data.user;
    } catch (error) {
      loggingClient.error('خطا در ایجاد کاربر توسط مدیر', {
        error: error instanceof Error ? error.message : String(error),
        action: 'admin_user_create_error'
      });
      throw error;
    }
  },
  
  // حذف کاربر توسط مدیر
  async delete(userId: string): Promise<void> {
    try {
      const startTime = performance.now();
      await axios.delete(`${BASE_URL}/${userId}`, {
        headers: getAuthHeader()
      });
      loggingClient.logPerformance('userService.delete', performance.now() - startTime);
      loggingClient.warn('کاربر حذف شد', {
        userId,
        action: 'admin_user_deleted'
      });
    } catch (error) {
      loggingClient.error('خطا در حذف کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        action: 'admin_user_delete_error'
      });
      throw error;
    }
  }
}; 