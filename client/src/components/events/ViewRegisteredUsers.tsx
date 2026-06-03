import { Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Cancel as CancelEditIcon, Download as DownloadIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import authApi from '../../services/api';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export interface RegisteredUser {
  id: number;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday: string | null;
  age: number;
  gender: string | null;
  phone: string;
  registration_date: string | null;
  check_in_date: string | null;
  status: string;
  pin: string;
  church?: string;
}

interface ViewRegisteredUsersProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewRegisteredUsers = ({
  open,
  event,
  onClose,
}: ViewRegisteredUsersProps) => {
  const { isAdmin, isOrganizer } = useAuth();
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [filteredRegisteredUsers, setFilteredRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [churchOptions, setChurchOptions] = useState<string[]>([]);

  const canExport = isAdmin();
  const canEdit = isAdmin() || isOrganizer();

  const formatUTCToLocal = (utcDateString: string, includeTime: boolean = true) => {
    try {
      const date = new Date(utcDateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: includeTime ? '2-digit' : undefined,
        minute: includeTime ? '2-digit' : undefined,
        timeZoneName: includeTime ? 'short' : undefined,
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateAge = (birthday: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (!open || !event) return;

    const fetchRegisteredUsers = async () => {
      try {
        setSearchTerm('');
        setEditingUserId(null);
        setEditFormData(null);
        setErrorMessage(null);

        const response = await eventsApi.getEventAttendees(event.id.toString());
        const sortedData = [...response.data].sort((a, b) => {
          if (!a.registration_date) return -1;
          if (!b.registration_date) return 1;
          return new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime();
        });

        setRegisteredUsers(sortedData);
        setFilteredRegisteredUsers(sortedData);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch registered users');
      }
    };

    fetchRegisteredUsers();
  }, [open, event]);

  useEffect(() => {
    const loadChurches = async () => {
      const churches = await authApi.getChurches();
      setChurchOptions(Array.from(new Set([...churches, 'Other'])));
    };
    loadChurches();
  }, []);

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);

    if (!value || value.trim() === '') {
      setFilteredRegisteredUsers([...registeredUsers]);
      return;
    }

    const searchWords = value.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
    const filtered = registeredUsers.filter(user => {
      const firstName = user.first_name.toLowerCase();
      const lastName = user.last_name.toLowerCase();

      return searchWords.every(word => firstName.startsWith(word) || lastName.startsWith(word));
    });

    setFilteredRegisteredUsers(filtered);
  };

  const handleStartEditing = (user: RegisteredUser) => {
    setEditingUserId(user.id);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      birthday: user.birthday ? user.birthday.substring(0, 10) : '',
      church: user.church,
      pin: user.pin,
    });
  };

  const handleCancelEditing = () => {
    setEditingUserId(null);
    setEditFormData(null);
  };

  const handleEditFormChange = (value: any, field: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value,
    });
  };

  const handleSaveEdits = async (userId: number) => {
    try {
      if (!event) {
        setErrorMessage('No event selected');
        return;
      }

      const attendee = registeredUsers.find(user => user.id === userId);
      if (!attendee) {
        setErrorMessage('Attendee record not found');
        return;
      }

      const response = await eventsApi.updateAttendeeDetails(
        event.id.toString(),
        attendee.id.toString(),
        editFormData
      );

      const updateUserData = (users: RegisteredUser[]) =>
        users.map(user => {
          if (user.id !== userId) return user;

          if (response.attendee) {
            return {
              ...user,
              ...response.attendee,
            };
          }

          return {
            ...user,
            ...editFormData,
            name: `${editFormData.first_name} ${editFormData.last_name}`,
            age: editFormData.birthday ? calculateAge(new Date(editFormData.birthday)) : user.age,
          };
        });

      setRegisteredUsers(updateUserData);
      setFilteredRegisteredUsers(updateUserData);
      setEditingUserId(null);
      setEditFormData(null);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update user information');
    }
  };

  const handleExport = () => {
    const usersToExport = searchTerm.trim() ? filteredRegisteredUsers : registeredUsers;

    if (!event || usersToExport.length === 0) {
      setErrorMessage('No registered users available to export');
      return;
    }

    try {
      let csvContent = 'Name,Email,Phone,Gender,Age,Birthday,Registration Date,Check-in Time,Status,PIN\n';

      usersToExport.forEach((user) => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const registrationDate = user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A';
        const checkInDate = user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in';

        csvContent += `"${user.name}","${user.email}","${user.phone}",${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${registrationDate},${checkInDate},${user.status},${user.pin}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${searchTerm.trim() ? 'filtered_users' : 'registered_users'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('Failed to export registered users');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{event?.name} - Registered Users</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}>
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {registeredUsers.length > 0 ? (
          <>
            <Box sx={{ mb: 2, px: { xs: 1, sm: 0 } }}>
              <TextField
                label="Search Users"
                placeholder="Search by name or email..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      🔍
                    </Box>
                  ),
                }}
              />
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: { xs: 1, sm: 0 } }}>
              Showing {filteredRegisteredUsers.length} of {registeredUsers.length} users
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 500, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '15%', minWidth: 150 }}><strong>Name</strong></TableCell>
                    <TableCell sx={{ width: '20%', minWidth: 180 }}><strong>Email</strong></TableCell>
                    <TableCell sx={{ width: 130, minWidth: 120 }}><strong>Phone</strong></TableCell>
                    <TableCell sx={{ width: 80, minWidth: 70 }}><strong>Gender</strong></TableCell>
                    <TableCell sx={{ width: 60, minWidth: 50, textAlign: 'center' }}><strong>Age</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Birthday</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Church</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Registered</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Status</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Check-in Time</strong></TableCell>
                    <TableCell sx={{ width: 70, minWidth: 60, textAlign: 'center' }}><strong>PIN</strong></TableCell>
                    {canEdit && (
                      <TableCell sx={{ width: 100, minWidth: 90, textAlign: 'center' }}><strong>Actions</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRegisteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {editingUserId === user.id ? (
                        <>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField size="small" label="First Name" value={editFormData.first_name} onChange={(e) => handleEditFormChange(e.target.value, 'first_name')} sx={{ width: 'calc(50% - 4px)' }} />
                              <TextField size="small" label="Last Name" value={editFormData.last_name} onChange={(e) => handleEditFormChange(e.target.value, 'last_name')} sx={{ width: 'calc(50% - 4px)' }} />
                            </Box>
                          </TableCell>
                          <TableCell><TextField size="small" label="Email" value={editFormData.email} onChange={(e) => handleEditFormChange(e.target.value, 'email')} fullWidth /></TableCell>
                          <TableCell><TextField size="small" label="Phone" value={editFormData.phone} onChange={(e) => handleEditFormChange(e.target.value, 'phone')} fullWidth /></TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Gender</InputLabel>
                              <Select value={editFormData.gender || ''} label="Gender" onChange={(e) => handleEditFormChange(e.target.value, 'gender')}>
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{editFormData.birthday ? calculateAge(new Date(editFormData.birthday)) : ''}</TableCell>
                          <TableCell><TextField size="small" label="Birthday" type="date" value={editFormData.birthday || ''} onChange={(e) => handleEditFormChange(e.target.value, 'birthday')} InputLabelProps={{ shrink: true }} fullWidth /></TableCell>
                          <TableCell>
                            <Autocomplete
                              fullWidth
                              freeSolo
                              size="small"
                              options={churchOptions}
                              value={editFormData.church || ''}
                              onChange={(_event, newValue) => handleEditFormChange(newValue || '', 'church')}
                              onInputChange={(_event, newInputValue) => handleEditFormChange(newInputValue, 'church')}
                              ListboxProps={{ style: { maxHeight: '200px' } }}
                              renderInput={(params) => <TextField {...params} label="Church" size="small" />}
                            />
                          </TableCell>
                          <TableCell>{user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A'}</TableCell>
                          <TableCell><Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" /></TableCell>
                          <TableCell>{user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in'}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}><TextField size="small" label="PIN" value={editFormData.pin || ''} onChange={(e) => handleEditFormChange(e.target.value, 'pin')} inputProps={{ maxLength: 4, pattern: '[0-9]*' }} sx={{ width: 65 }} /></TableCell>
                          {canEdit && (
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton size="small" color="primary" onClick={() => handleSaveEdits(user.id)} title="Save"><SaveIcon fontSize="small" /></IconButton>
                                <IconButton size="small" color="error" onClick={handleCancelEditing} title="Cancel"><CancelEditIcon fontSize="small" /></IconButton>
                              </Box>
                            </TableCell>
                          )}
                        </>
                      ) : (
                        <>
                          <TableCell>{user.name}</TableCell>
                          <TableCell sx={{ wordBreak: 'break-all' }}>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.gender}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{user.age}</TableCell>
                          <TableCell>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</TableCell>
                          <TableCell>{user.church || 'Other'}</TableCell>
                          <TableCell>{user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A'}</TableCell>
                          <TableCell><Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" /></TableCell>
                          <TableCell>{user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in'}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{user.pin}</TableCell>
                          {canEdit && (
                            <TableCell sx={{ textAlign: 'center' }}>
                              <IconButton size="small" color="primary" onClick={() => handleStartEditing(user)} title="Edit">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No registered users found for this event.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          {canExport && registeredUsers.length > 0 && (
            <Button variant="outlined" color="primary" onClick={handleExport} startIcon={<DownloadIcon />}>
              Export CSV
            </Button>
          )}
        </Box>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewRegisteredUsers;
