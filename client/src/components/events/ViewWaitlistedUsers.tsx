import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Cancel as CancelEditIcon, Download as DownloadIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import { churchOptions } from '../../constants/churchOptions';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ViewWaitlistedUsersProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewWaitlistedUsers = ({
  open,
  event,
  onClose,
}: ViewWaitlistedUsersProps) => {
  const { isAdmin, isOrganizer } = useAuth();
  const [waitlistedUsers, setWaitlistedUsers] = useState<any[]>([]);
  const [filteredWaitlistedUsers, setFilteredWaitlistedUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWaitlistUserId, setEditingWaitlistUserId] = useState<number | null>(null);
  const [editWaitlistFormData, setEditWaitlistFormData] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    birthday: '',
    church: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManageUsers = isAdmin() || isOrganizer();

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

    const fetchWaitlistedUsers = async () => {
      try {
        setSearchTerm('');
        setEditingWaitlistUserId(null);
        setErrorMessage(null);

        const response = await eventsApi.getEventWaitlist(event.id.toString());
        const sortedData = [...response.data].sort((a, b) => {
          if (!a.waitlisted_at) return 1;
          if (!b.waitlisted_at) return -1;
          return new Date(b.waitlisted_at).getTime() - new Date(a.waitlisted_at).getTime();
        });

        setWaitlistedUsers(sortedData);
        setFilteredWaitlistedUsers(sortedData);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch event waitlist');
      }
    };

    fetchWaitlistedUsers();
  }, [open, event]);

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);

    if (!value || value.trim() === '') {
      setFilteredWaitlistedUsers([...waitlistedUsers]);
      return;
    }

    const searchWords = value.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
    const filtered = waitlistedUsers.filter(user => {
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.last_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      return searchWords.every(word => (
        firstName.startsWith(word) ||
        lastName.startsWith(word) ||
        email.startsWith(word)
      ));
    });

    setFilteredWaitlistedUsers(filtered);
  };

  const handleStartEditing = (user: any) => {
    setEditingWaitlistUserId(user.id);
    setEditWaitlistFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || '',
      birthday: user.birthday ? user.birthday.substring(0, 10) : '',
      church: user.church,
    });
  };

  const handleCancelEditing = () => {
    setEditingWaitlistUserId(null);
    setEditWaitlistFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: '',
      birthday: '',
      church: '',
    });
  };

  const handleEditFormChange = (value: any, field: string) => {
    setEditWaitlistFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdits = async (userId: number) => {
    if (!event || !editWaitlistFormData) {
      setErrorMessage('Error: No event selected or no data to save for waitlist user.');
      return;
    }

    try {
      const response = await eventsApi.updateWaitlistUserDetails(
        event.id.toString(),
        userId.toString(),
        { ...editWaitlistFormData }
      );

      const updateUserInList = (users: any[]) =>
        users.map(u => {
          if (u.id !== userId) return u;

          if (response.user) {
            return {
              ...u,
              ...response.user,
              name: `${response.user.first_name} ${response.user.last_name}`,
              age: response.user.birthday ? calculateAge(new Date(response.user.birthday)) : u.age,
            };
          }

          return {
            ...u,
            ...editWaitlistFormData,
            name: `${editWaitlistFormData.first_name} ${editWaitlistFormData.last_name}`,
            age: editWaitlistFormData.birthday ? calculateAge(new Date(editWaitlistFormData.birthday)) : u.age,
          };
        });

      setWaitlistedUsers(prev => updateUserInList(prev));
      setFilteredWaitlistedUsers(prev => updateUserInList(prev));
      setEditingWaitlistUserId(null);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to update waitlist user information.');
    }
  };

  const handleExport = () => {
    const usersToExport = searchTerm.trim() ? filteredWaitlistedUsers : waitlistedUsers;
    if (!event || usersToExport.length === 0) {
      setErrorMessage('No waitlisted users available to export.');
      return;
    }

    try {
      let csvContent = 'Name,Email,Phone,Gender,Age,Birthday,Church,Waitlisted At\n';
      usersToExport.forEach(user => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const waitlistedAt = user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A';
        const church = user.church || 'Other';

        csvContent += `"${user.name}","${user.email}","${user.phone || 'N/A'}",${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${church},${waitlistedAt}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${searchTerm.trim() ? 'filtered_waitlist' : 'waitlist'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('Failed to export waitlisted users.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{event?.name} - Waitlisted Users</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}>
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {waitlistedUsers.length > 0 ? (
          <>
            <Box sx={{ mb: 2, px: { xs: 1, sm: 0 } }}>
              <TextField
                label="Search Waitlist"
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
              Showing {filteredWaitlistedUsers.length} of {waitlistedUsers.length} users on waitlist
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
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Waitlisted At</strong></TableCell>
                    {canManageUsers && (
                      <TableCell sx={{ width: 100, minWidth: 90, textAlign: 'center' }}><strong>Actions</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWaitlistedUsers.map((user) => (
                    <TableRow key={user.id}>
                      {editingWaitlistUserId === user.id ? (
                        <>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                              <TextField size="small" label="First Name" value={editWaitlistFormData.first_name} onChange={(e) => handleEditFormChange(e.target.value, 'first_name')} sx={{ width: '100%' }} />
                              <TextField size="small" label="Last Name" value={editWaitlistFormData.last_name} onChange={(e) => handleEditFormChange(e.target.value, 'last_name')} sx={{ width: '100%' }} />
                            </Box>
                          </TableCell>
                          <TableCell><TextField size="small" label="Email" value={editWaitlistFormData.email} onChange={(e) => handleEditFormChange(e.target.value, 'email')} fullWidth /></TableCell>
                          <TableCell><TextField size="small" label="Phone" value={editWaitlistFormData.phone} onChange={(e) => handleEditFormChange(e.target.value, 'phone')} fullWidth /></TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Gender</InputLabel>
                              <Select value={editWaitlistFormData.gender || ''} label="Gender" onChange={(e) => handleEditFormChange(e.target.value, 'gender')}>
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{editWaitlistFormData.birthday ? calculateAge(new Date(editWaitlistFormData.birthday)) : ''}</TableCell>
                          <TableCell><TextField size="small" label="Birthday" type="date" value={editWaitlistFormData.birthday || ''} onChange={(e) => handleEditFormChange(e.target.value, 'birthday')} InputLabelProps={{ shrink: true }} fullWidth /></TableCell>
                          <TableCell>
                            <Autocomplete
                              fullWidth
                              freeSolo
                              size="small"
                              options={churchOptions}
                              value={editWaitlistFormData.church || ''}
                              onChange={(_event, newValue) => handleEditFormChange(newValue || '', 'church')}
                              onInputChange={(_event, newInputValue) => handleEditFormChange(newInputValue, 'church')}
                              ListboxProps={{ style: { maxHeight: '200px' } }}
                              renderInput={(params) => <TextField {...params} label="Church" size="small" />}
                            />
                          </TableCell>
                          <TableCell>{user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A'}</TableCell>
                          {canManageUsers && (
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton size="small" color="primary" onClick={() => handleSaveEdits(user.id)} title="Save">
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="default" onClick={handleCancelEditing} title="Cancel">
                                  <CancelEditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          )}
                        </>
                      ) : (
                        <>
                          <TableCell>{user.name}</TableCell>
                          <TableCell sx={{ wordBreak: 'break-all' }}>{user.email}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>{user.gender}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{user.age}</TableCell>
                          <TableCell>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</TableCell>
                          <TableCell>{user.church || 'Other'}</TableCell>
                          <TableCell>{user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A'}</TableCell>
                          {canManageUsers && (
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
            No users currently on the waitlist for this event.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          {canManageUsers && waitlistedUsers.length > 0 && (
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

export default ViewWaitlistedUsers;
