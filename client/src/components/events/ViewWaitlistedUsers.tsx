import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
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
  const { user, isAdmin, isOrganizer } = useAuth();
  const [waitlistedUsers, setWaitlistedUsers] = useState<any[]>([]);
  const [filteredWaitlistedUsers, setFilteredWaitlistedUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManageUsers = isAdmin() || (isOrganizer() && !!event && Number(event.creator_id) === Number(user?.id));

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

  useEffect(() => {
    if (!open || !event) return;

    const fetchWaitlistedUsers = async () => {
      try {
        setSearchTerm('');
        setErrorMessage(null);

        const response = await eventsApi.getEventWaitlist(event.id.toString());
        const sortedData = [...response.data].sort((a, b) => {
          if (!a.waitlisted_at) return -1;
          if (!b.waitlisted_at) return 1;
          return new Date(a.waitlisted_at).getTime() - new Date(b.waitlisted_at).getTime();
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

  const handleExport = () => {
    const usersToExport = searchTerm.trim() ? filteredWaitlistedUsers : waitlistedUsers;
    if (!event || usersToExport.length === 0) {
      setErrorMessage('No waitlisted users available to export.');
      return;
    }

    try {
      let csvContent = 'Name,Email,Gender,Age,Birthday,Waitlisted At\n';
      usersToExport.forEach(user => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const waitlistedAt = user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A';
        csvContent += `"${user.name}","${user.email}",${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${waitlistedAt}\n`;
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, px: { xs: 1, sm: 0 } }}>
              Waitlisted users stay on the waitlist until they return and sign up themselves after a spot opens.
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 500, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '15%', minWidth: 150 }}><strong>Name</strong></TableCell>
                    <TableCell sx={{ width: '20%', minWidth: 180 }}><strong>Email</strong></TableCell>
                    <TableCell sx={{ width: 80, minWidth: 70 }}><strong>Gender</strong></TableCell>
                    <TableCell sx={{ width: 60, minWidth: 50, textAlign: 'center' }}><strong>Age</strong></TableCell>
                    <TableCell sx={{ width: 110, minWidth: 100 }}><strong>Birthday</strong></TableCell>
                    <TableCell sx={{ width: 160, minWidth: 150 }}><strong>Waitlisted At</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWaitlistedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>{user.email}</TableCell>
                      <TableCell>{user.gender}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{user.age}</TableCell>
                      <TableCell>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</TableCell>
                      <TableCell>{user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A'}</TableCell>
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
