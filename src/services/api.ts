import axios, { AxiosError } from 'axios';
import { loggers } from '../utils/logger';

const logger = loggers.api;

// تنظیمات پایه axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3010',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// اینترسپتور برای مدیریت خطاها
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.code === 'ERR_NETWORK') {
            logger.error('خطای شبکه در ارتباط با سرور', {
                error: error.message,
                config: error.config
            });
        } else if (error.response) {
            logger.error(`خطای ${error.response.status} از سرور`, {
                error: error.response.data,
                config: error.config
            });
        } else {
            logger.error('خطای ناشناخته در ارتباط با سرور', {
                error: error.message
            });
        }
        return Promise.reject(error);
    }
);

// سرویس‌های احراز هویت
export const authService = {
    login: async (username: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            logger.info('ورود موفق کاربر', { username });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                logger.error('خطا در ورود کاربر', {
                    username,
                    error: error.message
                });
            }
            throw error;
        }
    },

    register: async (userData: any) => {
        try {
            const response = await api.post('/auth/register', userData);
            logger.info('ثبت‌نام موفق کاربر', { email: userData.email });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                logger.error('خطا در ثبت‌نام کاربر', {
                    email: userData.email,
                    error: error.message
                });
            }
            throw error;
        }
    },

    sendVerificationSMS: async (phone: string) => {
        try {
            const response = await api.post('/sms/send', { phone });
            logger.info('ارسال موفق کد تایید', { phone });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                logger.error('خطا در ارسال کد تایید', {
                    phone,
                    error: error.message
                });
            }
            throw error;
        }
    }
};

// سرویس‌های گروه
export const groupService = {
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getGroupById: async (id: string) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (data: { name: string; description?: string }) => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  updateGroup: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  }
};

// سرویس‌های درخواست
export const requestService = {
  getRequests: async () => {
    const response = await api.get('/requests');
    return response.data;
  },

  getRequestById: async (id: string) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  createRequest: async (data: FormData) => {
    const response = await api.post('/requests', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateRequestStatus: async (id: string, status: string, comment?: string) => {
    const response = await api.put(`/requests/${id}/status`, { status, comment });
    return response.data;
  }
};

// سرویس‌های فایل
export const fileService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteFile: async (id: string) => {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  }
};

export default api; 