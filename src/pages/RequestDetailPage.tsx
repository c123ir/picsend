import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { requestService } from '../services/api';

interface Request {
  id: string;
  title: string;
  amount: number;
  status: 'در انتظار تایید' | 'تایید شده' | 'در حال بررسی' | 'رد شده';
  requester: {
    name: string;
    email: string;
  };
  date: string;
  description?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        if (id) {
          const data = await requestService.getRequestById(id);
          setRequest(data);
        }
      } catch (error) {
        console.error('Error fetching request:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const handleStatusUpdate = async (newStatus: Request['status']) => {
    try {
      if (id) {
        await requestService.updateRequestStatus(id, newStatus, comment);
        const updatedRequest = await requestService.getRequestById(id);
        setRequest(updatedRequest);
        setComment('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">
          درخواست مورد نظر یافت نشد
        </Typography>
      </Box>
    );
  }

  const getStatusColor = (status: Request['status']) => {
    const statusColors = {
      'در انتظار تایید': 'warning',
      'تایید شده': 'success',
      'در حال بررسی': 'info',
      'رد شده': 'error',
    } as const;
    return statusColors[status];
  };

  return (
    <Box p={3}>
      <Paper elevation={2}>
        <Box p={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom>
                {request.title}
              </Typography>
              <Chip
                label={request.status}
                color={getStatusColor(request.status)}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                درخواست‌کننده: {request.requester.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ایمیل: {request.requester.email}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                مبلغ: {request.amount.toLocaleString()} تومان
              </Typography>
              <Typography variant="body2" color="textSecondary">
                تاریخ: {new Date(request.date).toLocaleDateString('fa-IR')}
              </Typography>
            </Grid>

            {request.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  توضیحات:
                </Typography>
                <Typography variant="body1" paragraph>
                  {request.description}
                </Typography>
              </Grid>
            )}

            {request.attachments && request.attachments.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  فایل‌های پیوست:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {request.attachments.map((attachment) => (
                    <Button
                      key={attachment.id}
                      variant="outlined"
                      size="small"
                      href={attachment.url}
                      target="_blank"
                    >
                      {attachment.name}
                    </Button>
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="توضیحات تغییر وضعیت"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusUpdate('تایید شده')}
                  disabled={request.status === 'تایید شده'}
                >
                  تایید درخواست
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusUpdate('رد شده')}
                  disabled={request.status === 'رد شده'}
                >
                  رد درخواست
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => handleStatusUpdate('در حال بررسی')}
                  disabled={request.status === 'در حال بررسی'}
                >
                  در حال بررسی
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}; 