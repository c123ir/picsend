import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/common/ImageUploader';
import { requestService, groupService } from '../services/api';

interface Group {
  id: string;
  name: string;
}

interface RequestFormData {
  title: string;
  description: string;
  groupId: string;
  files: File[];
}

const NewRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    description: '',
    groupId: '',
    files: []
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupService.getGroups();
        setGroups(response);
      } catch (error) {
        setError('خطا در دریافت لیست گروه‌ها');
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (file: File) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, file]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title || !formData.groupId) {
      setError('لطفاً عنوان و گروه را وارد کنید');
      return false;
    }

    if (formData.files.length === 0) {
      setError('لطفاً حداقل یک تصویر انتخاب کنید');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestFormData = new FormData();
      requestFormData.append('title', formData.title);
      requestFormData.append('description', formData.description);
      requestFormData.append('groupId', formData.groupId);
      formData.files.forEach(file => {
        requestFormData.append('files', file);
      });

      await requestService.createRequest(requestFormData);
      navigate('/requests');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingGroups) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          درخواست جدید
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="عنوان درخواست"
            name="title"
            value={formData.title}
            onChange={handleTextChange}
            dir="rtl"
            disabled={loading}
          />

          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="توضیحات"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleTextChange}
            dir="rtl"
            disabled={loading}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="group-label">گروه</InputLabel>
            <Select
              labelId="group-label"
              id="groupId"
              name="groupId"
              value={formData.groupId}
              label="گروه"
              onChange={handleSelectChange}
              disabled={loading}
            >
              {groups.map(group => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              تصاویر
            </Typography>
            <ImageUploader onImageSelect={handleImageSelect} />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'ثبت درخواست'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export { NewRequestPage }; 