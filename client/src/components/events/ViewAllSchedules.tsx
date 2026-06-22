import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ViewAllSchedulesProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewAllSchedules = ({ open, event, onClose }: ViewAllSchedulesProps) => {
  const { isAdmin } = useAuth();
  const [allSchedules, setAllSchedules] = useState<Record<number, any[]>>({});
  const [filteredSchedules, setFilteredSchedules] = useState<Record<number, any[]>>({});
  const [usersMap, setUsersMap] = useState<Record<number, { id: number, first_name: string, last_name: string }>>({});
  const [loadingAllSchedules, setLoadingAllSchedules] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' } | null>(null);
  const [speedDateSelections, setSpeedDateSelections] = useState<Record<number, boolean>>({});
  const [selectionErrorMessage, setSelectionErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !event) return;

    const fetchSchedules = async () => {
      try {
        setLoadingAllSchedules(true);
        setSearchTerm('');
        setSortConfig(null);
        setSpeedDateSelections({});
        setSelectionErrorMessage(null);

        const response = await eventsApi.getAllSchedules(event.id.toString());
        setAllSchedules(response.schedules || {});
        setFilteredSchedules(response.schedules || {});

        const attendeesResponse = await eventsApi.getEventAttendees(event.id.toString());
        const userMap: Record<number, { id: number, first_name: string, last_name: string }> = {};
        attendeesResponse.data.forEach((attendee: any) => {
          userMap[attendee.id] = {
            id: attendee.id,
            first_name: attendee.first_name || '',
            last_name: attendee.last_name || ''
          };
        });
        setUsersMap(userMap);
      } catch (error: any) {
        setSelectionErrorMessage(error.message || 'Failed to load all schedules');
      } finally {
        setLoadingAllSchedules(false);
      }
    };

    fetchSchedules();
  }, [open, event]);

  const applyFilterAndSort = (search: string, sort: { key: string, direction: 'ascending' | 'descending' } | null) => {
    let filtered: Record<number, any[]> = {};

    if (!search || search.trim() === '') {
      filtered = { ...allSchedules };
    } else {
      const lowercaseSearch = search.toLowerCase().trim();
      Object.entries(allSchedules).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule) || userSchedule.length === 0) return;
        const user = Object.values(usersMap).find(u => u.id === Number(userId));
        const userName = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : '';
        const nameWords = userName.split(/\s+/);
        const nameMatch = nameWords.some(word => word.startsWith(lowercaseSearch));
        if (nameMatch) filtered[Number(userId)] = userSchedule;
      });
    }

    if (sort) {
      let allItems: any[] = [];
      Object.entries(filtered).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule)) return;
        const user = Object.values(usersMap).find(u => u.id === Number(userId));
        const userName = user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
        userSchedule.forEach((item: any) => {
          allItems.push({ userId: Number(userId), userName, ...item });
        });
      });

      allItems.sort((a, b) => {
        let compareA: string | number = '';
        let compareB: string | number = '';
        switch (sort.key) {
          case 'user':
            compareA = a.userName.toLowerCase();
            compareB = b.userName.toLowerCase();
            break;
          case 'round':
            compareA = a.round;
            compareB = b.round;
            break;
          case 'table':
            compareA = a.table;
            compareB = b.table;
            break;
          case 'partner':
            compareA = a.partner_name.toLowerCase();
            compareB = b.partner_name.toLowerCase();
            break;
          default:
            return 0;
        }

        if (compareA < compareB) return sort.direction === 'ascending' ? -1 : 1;
        if (compareA > compareB) return sort.direction === 'ascending' ? 1 : -1;
        return 0;
      });

      filtered = {};
      allItems.forEach(item => {
        const userId = item.userId;
        if (!filtered[userId]) filtered[userId] = [];
        const { userId: _userId, userName: _userName, ...rest } = item;
        filtered[userId].push(rest);
      });
    }

    setFilteredSchedules(filtered);
  };

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    const nextSort = { key, direction };
    setSortConfig(nextSort);
    applyFilterAndSort(searchTerm, nextSort);
  };

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);
    applyFilterAndSort(value, sortConfig);
  };

  const handleSaveSpeedDateSelections = async () => {
    if (!event) {
      setSelectionErrorMessage('No event selected for saving selections.');
      return;
    }

    const selectionsToSubmit = Object.entries(speedDateSelections).map(([id, interested]) => ({
      event_speed_date_id: Number(id),
      interested,
    }));

    if (selectionsToSubmit.length === 0) {
      setSelectionErrorMessage('No selections have been made to save.');
      return;
    }

    try {
      setSelectionErrorMessage(null);
      await eventsApi.submitSpeedDateSelections(event.id.toString(), selectionsToSubmit);
      alert('Speed date selections saved successfully!');
    } catch (error: any) {
      setSelectionErrorMessage(error.response?.data?.message || error.message || 'Failed to save speed date selections.');
    }
  };

  const handleExportSchedules = () => {
    if (!event || !filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      setSelectionErrorMessage('No schedules available to export');
      return;
    }

    try {
      let csvContent = 'User Name,Round,Table,Partner Name,Partner Age\n';
      Object.entries(filteredSchedules).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule) || userSchedule.length === 0) return;
        const user = Object.values(usersMap).find(u => u.id === Number(userId));
        const userName = user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
        userSchedule.forEach((item: any) => {
          csvContent += `"${userName}",${item.round},${item.table},"${item.partner_name}",${item.partner_age || 'N/A'}\n`;
        });
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_schedules.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setSelectionErrorMessage('Failed to export schedules');
    }
  };

  const renderSortableHeader = (key: string, label: string) => (
    <TableCell onClick={() => handleSort(key)} sx={{ cursor: 'pointer', backgroundColor: sortConfig?.key === key ? 'rgba(0, 0, 0, 0.04)' : 'inherit', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <strong>{label}</strong>
        {sortConfig?.key === key && (
          <span style={{ marginLeft: '4px' }}>
            {sortConfig.direction === 'ascending' ? '↑' : '↓'}
          </span>
        )}
      </Box>
    </TableCell>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{event?.name} - All Schedules</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}>
        {loadingAllSchedules ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Loading all schedules...</Typography>
          </Box>
        ) : Object.keys(allSchedules).length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, px: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Search"
                placeholder="Search by name, round, table..."
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
              {isAdmin() && (
                <Button variant="outlined" color="primary" onClick={handleExportSchedules} startIcon={<DownloadIcon />} sx={{ whiteSpace: 'nowrap' }}>
                  Export CSV
                </Button>
              )}
            </Box>
            {selectionErrorMessage && (
              <Alert severity="error" sx={{ mb: 2, mx: 1 }} onClose={() => setSelectionErrorMessage(null)}>
                {selectionErrorMessage}
              </Alert>
            )}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
              Showing schedules for {Object.keys(filteredSchedules).length} users
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {renderSortableHeader('user', 'User')}
                    {renderSortableHeader('round', 'Round')}
                    {renderSortableHeader('table', 'Table')}
                    {renderSortableHeader('partner', 'Partner')}
                    <TableCell><strong>User Church</strong></TableCell>
                    <TableCell><strong>Partner Church</strong></TableCell>
                    <TableCell><strong>Age Difference</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(filteredSchedules).flatMap(([userId, userSchedule]) => {
                    if (!Array.isArray(userSchedule) || userSchedule.length === 0) return [];
                    const user = Object.values(usersMap).find(u => u.id === Number(userId));
                    const userName = user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
                    return userSchedule.map((item: any, index: number) => (
                      <TableRow key={`${userId}-${index}`}>
                        <TableCell>{userName}</TableCell>
                        <TableCell>{item.round}</TableCell>
                        <TableCell>{item.table}</TableCell>
                        <TableCell>{item.partner_name}</TableCell>
                        <TableCell>{item.user_church || 'Other'}</TableCell>
                        <TableCell>{item.partner_church || 'Other'}</TableCell>
                        <TableCell>{typeof item.user_age === 'number' && typeof item.partner_age === 'number' ? Math.abs(item.user_age - item.partner_age) : 'N/A'}</TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <DialogContentText sx={{ textAlign: 'center', py: 3 }}>
            No schedules available. The event might not have started yet, or there may not be enough attendees checked in.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleSaveSpeedDateSelections} color="primary" variant="contained" disabled={Object.keys(speedDateSelections).length === 0 || loadingAllSchedules}>
          Save Selections
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewAllSchedules;
