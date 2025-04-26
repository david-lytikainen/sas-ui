import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  SupervisorAccount as AdminIcon,
  Person as UserIcon,
  Store as OrganizerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name?: string;
  phone: string | null;
  age: number;
  church: string;
  denomination: string | null;
}

interface Role {
  id: number;
  name: string;
  permission_level: number;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  // setRoles is used in the commented API calls - will be used when backend is connected
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // Handle edit user form changes for text inputs
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle select change specifically
  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open edit dialog
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role_id,
      phone: user.phone || '',
      age: user.age,
      church: user.church,
      denomination: user.denomination || '',
    });
    setEditDialogOpen(true);
  };

  // Open create dialog
  const handleCreateUser = () => {
    setEditFormData({
      email: '',
      first_name: '',
      last_name: '',
      role_id: 3, // Default to attendee
      phone: '',
      age: 21,
      church: '',
      denomination: '',
    });
    setCreateDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Submit edited user data
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real app, this would be an API call
      // const response = await mockAuthApi.updateUser(selectedUser.id, editFormData);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...editFormData, role_name: roles.find(r => r.id === editFormData.role_id)?.name } 
          : u
      ));
      
      setSuccessMessage('User updated successfully');
      setEditDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  // Create new user
  const handleCreateUserSubmit = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await mockAuthApi.createUser(editFormData);
      
      // Update local state
      setUsers([...users, editFormData as User]);
      
      setSuccessMessage('User created successfully');
      setCreateDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  // Delete user
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real app, this would be an API call
      // const response = await mockAuthApi.deleteUser(selectedUser.id);
      
      // Update local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      setSuccessMessage('User deleted successfully');
      setDeleteDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get role icon based on role ID
  const getRoleIcon = (roleId: number) => {
    switch (roleId) {
      case 1: // Admin
        return <AdminIcon color="error" />;
      case 2: // Organizer
        return <OrganizerIcon color="info" />;
      default: // Attendee or other
        return <UserIcon color="action" />;
    }
  };

  // Get role color based on role ID
  const getRoleColor = (roleId: number): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (roleId) {
      case 1: // Admin
        return "error";
      case 2: // Organizer
        return "info";
      case 3: // Attendee
        return "success";
      default:
        return "default";
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          User Management
        </Typography>
      </Box>

      {/* Success and Error alerts */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          label="Search Users"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
        >
          Add New User
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    icon={getRoleIcon(user.role_id)}
                    label={user.role_name || roles.find(r => r.id === user.role_id)?.name || 'Unknown'}
                    size="small"
                    color={getRoleColor(user.role_id)}
                  />
                </TableCell>
                <TableCell>{user.phone || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit User">
                    <IconButton 
                      onClick={() => handleEditUser(user)} 
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton 
                      onClick={() => handleDeleteClick(user)} 
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="First Name"
                  value={editFormData.first_name}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  label="Last Name"
                  value={editFormData.last_name}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role_id"
                    value={editFormData.role_id}
                    label="Role"
                    onChange={handleSelectChange}
                  >
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  value={editFormData.phone}
                  onChange={handleEditFormChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="age"
                  label="Age"
                  type="number"
                  value={editFormData.age}
                  onChange={handleEditFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 18, max: 100 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="church"
                  label="Church"
                  value={editFormData.church}
                  onChange={handleEditFormChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="denomination"
                  label="Denomination"
                  value={editFormData.denomination}
                  onChange={handleEditFormChange}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained" 
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="First Name"
                  value={editFormData.first_name}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  label="Last Name"
                  value={editFormData.last_name}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="role-label-create">Role</InputLabel>
                  <Select
                    labelId="role-label-create"
                    name="role_id"
                    value={editFormData.role_id}
                    label="Role"
                    onChange={handleSelectChange}
                  >
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  value={editFormData.phone}
                  onChange={handleEditFormChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="age"
                  label="Age"
                  type="number"
                  value={editFormData.age}
                  onChange={handleEditFormChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 18, max: 100 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="church"
                  label="Church"
                  value={editFormData.church}
                  onChange={handleEditFormChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="denomination"
                  label="Denomination"
                  value={editFormData.denomination}
                  onChange={handleEditFormChange}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateUserSubmit} 
            variant="contained" 
            color="primary"
            disabled={!editFormData.email || !editFormData.first_name || !editFormData.last_name}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user: {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 