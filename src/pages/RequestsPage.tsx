import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  FilterList,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data - replace with actual data from API
const requests = [
  {
    id: 1,
    title: 'درخواست خرید تجهیزات',
    amount: '۱۲,۵۰۰,۰۰۰',
    status: 'در انتظار تایید',
    requester: 'علی محمدی',
    date: '۱۴۰۲/۱۲/۱۵',
    group: 'فنی',
  },
  {
    id: 2,
    title: 'پرداخت قبض برق',
    amount: '۸۵۰,۰۰۰',
    status: 'تایید شده',
    requester: 'محمد احمدی',
    date: '۱۴۰۲/۱۲/۱۴',
    group: 'اداری',
  },
  {
    id: 3,
    title: 'هزینه‌های جاری',
    amount: '۲,۳۰۰,۰۰۰',
    status: 'در حال بررسی',
    requester: 'رضا کریمی',
    date: '۱۴۰۲/۱۲/۱۳',
    group: 'مالی',
  },
];

const statusColors: Record<string, 'warning' | 'success' | 'info' | 'error'> = {
  'در انتظار تایید': 'warning',
  'تایید شده': 'success',
  'در حال بررسی': 'info',
  'رد شده': 'error',
};

export const RequestsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, requestId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequestId(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequestId(null);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          درخواست‌ها
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/requests/new')}
        >
          درخواست جدید
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="جستجو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>وضعیت</InputLabel>
            <Select
              value={statusFilter}
              label="وضعیت"
              onChange={handleStatusFilterChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterList />
                </InputAdornment>
              }
            >
              <MenuItem value="">همه</MenuItem>
              <MenuItem value="در انتظار تایید">در انتظار تایید</MenuItem>
              <MenuItem value="تایید شده">تایید شده</MenuItem>
              <MenuItem value="در حال بررسی">در حال بررسی</MenuItem>
              <MenuItem value="رد شده">رد شده</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>عنوان</TableCell>
                <TableCell>مبلغ (ریال)</TableCell>
                <TableCell>درخواست‌کننده</TableCell>
                <TableCell>گروه</TableCell>
                <TableCell>تاریخ</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests
                .filter((request) =>
                  request.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  (!statusFilter || request.status === statusFilter)
                )
                .map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.amount}</TableCell>
                    <TableCell>{request.requester}</TableCell>
                    <TableCell>{request.group}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={statusColors[request.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, request.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleMenuClose();
            navigate(`/requests/${selectedRequestId}`);
          }}>
            مشاهده جزئیات
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>ویرایش</MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            حذف
          </MenuItem>
        </Menu>
      </Paper>
    </Box>
  );
}; 