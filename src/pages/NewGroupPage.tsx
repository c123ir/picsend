import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  IconButton,
  Autocomplete,
  Chip,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  PersonAdd,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

// Mock data - replace with actual data from API
const availableUsers: User[] = [
  { id: 1, name: 'علی محمدی', email: 'ali@example.com', avatar: '/avatars/1.jpg' },
  { id: 2, name: 'رضا کریمی', email: 'reza@example.com', avatar: '/avatars/2.jpg' },
  { id: 3, name: 'محمد احمدی', email: 'mohammad@example.com', avatar: '/avatars/3.jpg' },
  { id: 4, name: 'سارا حسینی', email: 'sara@example.com', avatar: '/avatars/4.jpg' },
  { id: 5, name: 'مریم رضایی', email: 'maryam@example.com', avatar: '/avatars/5.jpg' },
];

interface Member {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

const NewGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = () => {
    if (selectedUser && selectedRole) {
      setMembers((prev) => [
        ...prev,
        {
          ...selectedUser,
          role: selectedRole,
        },
      ]);
      setSelectedUser(null);
      setSelectedRole('');
    }
  };

  const handleRemoveMember = (memberId: number) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement group creation logic
    console.log('Form data:', { ...formData, members });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton onClick={() => navigate('/groups')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          ایجاد گروه جدید
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="نام گروه"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="توضیحات"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                اعضای گروه
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Autocomplete
                  sx={{ flexGrow: 1 }}
                  options={availableUsers.filter(
                    (user) => !members.some((member) => member.id === user.id)
                  )}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  value={selectedUser}
                  onChange={(_event, newValue) => {
                    setSelectedUser(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="انتخاب کاربر"
                    />
                  )}
                />
                <TextField
                  sx={{ width: 200 }}
                  label="نقش"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={handleAddMember}
                  disabled={!selectedUser || !selectedRole}
                >
                  افزودن
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {members.map((member) => (
                  <Chip
                    key={member.id}
                    avatar={<Avatar src={member.avatar} alt={member.name} />}
                    label={`${member.name} (${member.role})`}
                    onDelete={() => handleRemoveMember(member.id)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/groups')}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                >
                  ایجاد گروه
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export { NewGroupPage }; 