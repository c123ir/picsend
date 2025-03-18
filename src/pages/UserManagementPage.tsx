import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api/userService';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User';
import { loggingClient } from '../utils/loggingClient';

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // حالت‌های مدیریت دیالوگ‌ها
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // داده‌های موقت برای فرم‌ها
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDTO | UpdateUserDTO>({
    phone: '',
    email: '',
    fullName: '',
    role: 'user'
  });
  const [password, setPassword] = useState('');
  
  // بارگیری لیست کاربران
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.findAll();
      setUsers(response);
      loggingClient.info('لیست کاربران بارگیری شد', { 
        count: response.length,
        action: 'admin_users_loaded'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت لیست کاربران';
      setError(errorMessage);
      loggingClient.error('خطا در بارگیری لیست کاربران', { 
        error: errorMessage,
        action: 'admin_users_load_error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // مدیریت تغییر صفحه و تعداد ردیف‌ها
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // مدیریت تغییر فیلدهای فرم
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // باز کردن دیالوگ افزودن کاربر
  const handleOpenAddDialog = () => {
    setFormData({
      phone: '',
      email: '',
      fullName: '',
      role: 'user'
    });
    setPassword('');
    setOpenAddDialog(true);
  };
  
  // باز کردن دیالوگ ویرایش کاربر
  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      phone: user.phone || '',
      email: user.email || '',
      fullName: user.fullName || '',
      role: user.role,
      isActive: user.isActive
    });
    setOpenEditDialog(true);
  };
  
  // باز کردن دیالوگ حذف کاربر
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };
  
  // بستن همه دیالوگ‌ها
  const handleCloseDialogs = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setOpenDeleteDialog(false);
    setSelectedUser(null);
    setPassword('');
  };
  
  // ثبت کاربر جدید
  const handleAddUser = async () => {
    try {
      if (!formData.phone && !formData.email) {
        setError('وارد کردن ایمیل یا شماره تلفن الزامی است');
        return;
      }
      
      if (!password) {
        setError('وارد کردن رمز عبور الزامی است');
        return;
      }
      
      // افزودن رمز عبور به داده‌های فرم برای ارسال
      const userData = { ...formData, password } as CreateUserDTO & { password: string };
      
      await userService.createByAdmin(userData);
      loggingClient.info('کاربر جدید ایجاد شد', { 
        phone: formData.phone, 
        email: formData.email,
        action: 'admin_user_created'
      });
      
      // بستن دیالوگ و بازیابی لیست کاربران
      handleCloseDialogs();
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ایجاد کاربر';
      setError(errorMessage);
      loggingClient.error('خطا در ایجاد کاربر', { 
        error: errorMessage, 
        action: 'admin_user_create_error'
      });
    }
  };
  
  // بروزرسانی کاربر
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.update(selectedUser.id, formData as UpdateUserDTO);
      loggingClient.info('کاربر بروزرسانی شد', { 
        userId: selectedUser.id, 
        action: 'admin_user_updated'
      });
      
      // بستن دیالوگ و بازیابی لیست کاربران
      handleCloseDialogs();
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در بروزرسانی کاربر';
      setError(errorMessage);
      loggingClient.error('خطا در بروزرسانی کاربر', { 
        error: errorMessage, 
        userId: selectedUser.id,
        action: 'admin_user_update_error'
      });
    }
  };
  
  // حذف کاربر
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.delete(selectedUser.id);
      loggingClient.warn('کاربر حذف شد', { 
        userId: selectedUser.id, 
        action: 'admin_user_deleted'
      });
      
      // بستن دیالوگ و بازیابی لیست کاربران
      handleCloseDialogs();
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در حذف کاربر';
      setError(errorMessage);
      loggingClient.error('خطا در حذف کاربر', { 
        error: errorMessage, 
        userId: selectedUser?.id,
        action: 'admin_user_delete_error'
      });
    }
  };
  
  // فعال/غیرفعال کردن کاربر
  const handleToggleActivation = async (user: User) => {
    try {
      if (user.isActive) {
        await userService.deactivate(user.id);
        loggingClient.warn('کاربر غیرفعال شد', { 
          userId: user.id, 
          action: 'admin_user_deactivated'
        });
      } else {
        await userService.activate(user.id);
        loggingClient.info('کاربر فعال شد', { 
          userId: user.id, 
          action: 'admin_user_activated'
        });
      }
      
      // بازیابی لیست کاربران
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در تغییر وضعیت کاربر';
      setError(errorMessage);
      loggingClient.error('خطا در تغییر وضعیت فعال سازی کاربر', { 
        error: errorMessage, 
        userId: user.id,
        action: 'admin_user_toggle_activation_error'
      });
    }
  };
  
  // نمایش وضعیت با چیپ رنگی
  const renderRoleChip = (role: string) => {
    return (
      <Chip 
        label={role === 'admin' ? 'مدیر' : 'کاربر'}
        color={role === 'admin' ? 'primary' : 'default'}
        size="small"
      />
    );
  };
  
  const renderStatusChip = (isActive: boolean) => {
    return (
      <Chip 
        label={isActive ? 'فعال' : 'غیرفعال'}
        color={isActive ? 'success' : 'error'}
        size="small"
      />
    );
  };
  
  // رندر جدول کاربران
  const renderUsersTable = () => {
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>آواتار</TableCell>
              <TableCell>نام و نام خانوادگی</TableCell>
              <TableCell>شماره موبایل</TableCell>
              <TableCell>ایمیل</TableCell>
              <TableCell>نقش</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell>تاریخ ثبت نام</TableCell>
              <TableCell>عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Avatar src={user.avatar} alt={user.fullName}>
                      {user.fullName?.[0] || user.email?.[0] || user.phone?.[0]}
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.fullName || '---'}</TableCell>
                  <TableCell>{user.phone || '---'}</TableCell>
                  <TableCell>{user.email || '---'}</TableCell>
                  <TableCell>{renderRoleChip(user.role)}</TableCell>
                  <TableCell>{renderStatusChip(user.isActive)}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="ویرایش کاربر">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}>
                      <IconButton 
                        size="small" 
                        color={user.isActive ? 'error' : 'success'} 
                        onClick={() => handleToggleActivation(user)}
                        disabled={user.id === currentUser?.id} // نمی‌توان خود را غیرفعال کرد
                      >
                        {user.isActive ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف کاربر">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(user)}
                        disabled={user.id === currentUser?.id} // نمی‌توان خود را حذف کرد
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="تعداد در صفحه:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
        />
      </TableContainer>
    );
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          مدیریت کاربران
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<RefreshIcon />} 
            onClick={fetchUsers}
            sx={{ ml: 1 }}
          >
            بارگیری مجدد
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleOpenAddDialog}
          >
            کاربر جدید
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Typography>در حال بارگیری...</Typography>
      ) : users.length === 0 ? (
        <Typography>هیچ کاربری یافت نشد.</Typography>
      ) : (
        renderUsersTable()
      )}
      
      {/* دیالوگ افزودن کاربر */}
      <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن کاربر جدید</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="fullName"
              label="نام و نام خانوادگی"
              fullWidth
              value={formData.fullName}
              onChange={handleInputChange}
            />
            <TextField
              name="phone"
              label="شماره موبایل"
              fullWidth
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="مثال: 09123456789"
            />
            <TextField
              name="email"
              label="ایمیل"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              name="password"
              label="رمز عبور"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FormControl fullWidth>
              <InputLabel id="role-label">نقش کاربر</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="نقش کاربر"
                onChange={handleInputChange}
              >
                <MenuItem value="user">کاربر عادی</MenuItem>
                <MenuItem value="admin">مدیر</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="inherit">انصراف</Button>
          <Button onClick={handleAddUser} color="primary" variant="contained">
            ثبت کاربر
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* دیالوگ ویرایش کاربر */}
      <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>ویرایش کاربر</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="fullName"
              label="نام و نام خانوادگی"
              fullWidth
              value={formData.fullName}
              onChange={handleInputChange}
            />
            <TextField
              name="phone"
              label="شماره موبایل"
              fullWidth
              value={formData.phone}
              onChange={handleInputChange}
              disabled // شماره تلفن نباید تغییر کند
            />
            <TextField
              name="email"
              label="ایمیل"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel id="role-edit-label">نقش کاربر</InputLabel>
              <Select
                labelId="role-edit-label"
                name="role"
                value={formData.role}
                label="نقش کاربر"
                onChange={handleInputChange}
              >
                <MenuItem value="user">کاربر عادی</MenuItem>
                <MenuItem value="admin">مدیر</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  name="isActive"
                />
              }
              label="کاربر فعال است"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="inherit">انصراف</Button>
          <Button onClick={handleUpdateUser} color="primary" variant="contained">
            بروزرسانی
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* دیالوگ حذف کاربر */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>حذف کاربر</DialogTitle>
        <DialogContent>
          <DialogContentText>
            آیا از حذف کاربر "{selectedUser?.fullName || selectedUser?.phone || selectedUser?.email}" اطمینان دارید؟
            <br />
            این عملیات غیرقابل بازگشت است.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="inherit">انصراف</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage; 