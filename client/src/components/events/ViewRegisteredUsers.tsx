import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Download as DownloadIcon, Email as EmailIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../common/ConfirmDialog';

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
  const { user, isAdmin, isOrganizer } = useAuth();
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [filteredRegisteredUsers, setFilteredRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingInUserId, setCheckingInUserId] = useState<number | null>(null);
  const [userToCheckIn, setUserToCheckIn] = useState<RegisteredUser | null>(null);

  const canExport = isAdmin() || (isOrganizer() && !!event && Number(event.creator_id) === Number(user?.id));
  const canManage = isAdmin() || isOrganizer();

  const loadRegisteredUsers = async (currentEvent: Event) => {
    const response = await eventsApi.getEventAttendees(currentEvent.id.toString());
    const sortedData = [...response.data].sort((a, b) => {
      if (!a.registration_date) return -1;
      if (!b.registration_date) return 1;
      return new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime();
    });

    setRegisteredUsers(sortedData);
    setFilteredRegisteredUsers(sortedData);
  };

  const formatUTCToLocal = (utcDateString: string, includeTime: boolean = true) => {
    try {
      if (!includeTime && /^\d{4}-\d{2}-\d{2}$/.test(utcDateString)) {
        const [year, month, day] = utcDateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

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

  const formatTableDateTime = (utcDateString: string) => {
    const date = new Date(utcDateString);
    if (Number.isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (!open || !event) return;

    const fetchRegisteredUsers = async () => {
      try {
        setSearchTerm('');
        setErrorMessage(null);

        await loadRegisteredUsers(event);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch registered users');
      }
    };

    fetchRegisteredUsers();
  }, [open, event]);

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

  const handleManualCheckIn = async (userId: number) => {
    if (!event) {
      setErrorMessage('No event selected');
      return;
    }

    try {
      setCheckingInUserId(userId);
      await eventsApi.manualCheckInAttendee(event.id.toString(), userId.toString());
      await loadRegisteredUsers(event);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to check in attendee');
    } finally {
      setCheckingInUserId(null);
    }
  };

  const handleCheckInConfirm = () => {
    if (!userToCheckIn) return;
    setUserToCheckIn(null);
    handleManualCheckIn(userToCheckIn.id);
  };

  const handleExport = () => {
    const usersToExport = searchTerm.trim() ? filteredRegisteredUsers : registeredUsers;

    if (!event || usersToExport.length === 0) {
      setErrorMessage('No registered users available to export');
      return;
    }

    try {
      let csvContent = 'Name,Email,Gender,Age,Birthday,Registration Date,Check-in Time,Status\n';

      usersToExport.forEach((user) => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const registrationDate = user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A';
        const checkInDate = user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in';
        csvContent += `"${user.name}","${user.email}",${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${registrationDate},${checkInDate},${user.status}\n`;
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

  const handleEmailAttendees = () => {
    if (!event || registeredUsers.length === 0) {
      setErrorMessage('No registered users available to email.');
      return;
    }

    const recipients = Array.from(new Set(registeredUsers.map(user => user.email).filter(Boolean)));
    if (recipients.length === 0) {
      setErrorMessage('No attendee email addresses are available.');
      return;
    }

    const params = new URLSearchParams({ bcc: recipients.join(','), subject: `Saved & Single: ${event.name}` });
    window.location.href = `mailto:?${params.toString()}`;
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
                    {canManage && (
                      <TableCell sx={{ width: 150, minWidth: 140, textAlign: 'center' }}><strong>Actions</strong></TableCell>
                    )}
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Check-in Time</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Registered</strong></TableCell>
                    <TableCell sx={{ width: 80, minWidth: 70 }}><strong>Gender</strong></TableCell>
                    <TableCell sx={{ width: 60, minWidth: 50, textAlign: 'center' }}><strong>Age</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Birthday</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRegisteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{user.email}</TableCell>
                      {canManage && (
                        <TableCell sx={{ textAlign: 'center' }}>
                          {user.status !== 'Checked In' && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => setUserToCheckIn(user)}
                              disabled={checkingInUserId === user.id}
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              {checkingInUserId === user.id ? 'Checking In...' : 'Check In'}
                            </Button>
                          )}
                        </TableCell>
                      )}
                      <TableCell>{user.check_in_date ? formatTableDateTime(user.check_in_date) : 'Not checked in'}</TableCell>
                      <TableCell>{user.registration_date ? formatTableDateTime(user.registration_date) : 'N/A'}</TableCell>
                      <TableCell>{user.gender}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{user.age}</TableCell>
                      <TableCell>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</TableCell>
                      <TableCell><Chip label={user.status} color={user.status === 'Checked In' ? 'success' : 'primary'} size="small" /></TableCell>
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
      <ConfirmDialog
        open={!!userToCheckIn}
        title={`Check In ${userToCheckIn?.name}?`}
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => setUserToCheckIn(null)}
        onConfirm={handleCheckInConfirm}
      >
      </ConfirmDialog>
      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          {canExport && registeredUsers.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" color="primary" onClick={handleEmailAttendees} startIcon={<EmailIcon />}>
                Email attendees
              </Button>
              <Button variant="outlined" color="primary" onClick={handleExport} startIcon={<DownloadIcon />}>
                Export CSV
              </Button>
            </Box>
          )}
        </Box>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewRegisteredUsers;
