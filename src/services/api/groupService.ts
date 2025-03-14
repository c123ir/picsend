import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const groupService = {
  async createGroup(data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/groups`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getGroups(): Promise<Group[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/groups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async getGroup(id: string): Promise<Group> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/groups/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/groups/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async deleteGroup(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/groups/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default groupService; 