import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface Request {
  id: string;
  title: string;
  description: string;
  status: string;
  groupId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  files: string[];
}

const requestService = {
  async createRequest(formData: FormData): Promise<Request> {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/requests`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getRequests(): Promise<Request[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getRequest(id: string): Promise<Request> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/requests/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async updateRequest(id: string, data: Partial<Request>): Promise<Request> {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/requests/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async deleteRequest(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/requests/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default requestService; 