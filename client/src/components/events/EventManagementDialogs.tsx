import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  Select,
  InputAdornment,
} from '@mui/material';
import { 
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Event } from '../../types/event';
import { eventsApi } from '../../services/api';

interface EventManagementDialogsProps {
  // View Registered Users Dialog
  viewRegisteredUsersDialogOpen: boolean;
  selectedEventForRegisteredUsers: Event | null;
  registeredUsers: any[];
  onViewRegisteredUsersDialogClose: () => void;

  // View Pins Dialog
  viewPinsDialogOpen: boolean;
  selectedEventForPins: Event | null;
  attendeePins: any[];
  onViewPinsDialogClose: () => void;

  // View Waitlist Dialog
  viewWaitlistDialogOpen: boolean;
  selectedEventForWaitlist: Event | null;
  waitlistUsers: any[];
  onViewWaitlistDialogClose: () => void;

  // View All Schedules Dialog
  viewAllSchedulesDialogOpen: boolean;
  selectedEventForAllSchedules: Event | null;
  allSchedules: Record<number, any[]>;
  onViewAllSchedulesDialogClose: () => void;

  // Edit Event Dialog
  editEventDialogOpen: boolean;
  eventToEdit: Event | null;
  onEditEventDialogClose: () => void;
  onEditEventSuccess?: () => void;

  // Delete Event Dialog
  deleteEventDialogOpen: boolean;
  eventToDelete: number | null;
  onDeleteEventDialogClose: () => void;
  onDeleteEventConfirm: () => void;

  // Data refresh callback
  onUserDataRefresh?: (eventId: number, isWaitlist?: boolean) => void;
}

const EventManagementDialogs: React.FC<EventManagementDialogsProps> = ({
  viewRegisteredUsersDialogOpen,
  selectedEventForRegisteredUsers,
  registeredUsers,
  onViewRegisteredUsersDialogClose,
  viewPinsDialogOpen,
  selectedEventForPins,
  attendeePins,
  onViewPinsDialogClose,
  viewWaitlistDialogOpen,
  selectedEventForWaitlist,
  waitlistUsers,
  onViewWaitlistDialogClose,
  viewAllSchedulesDialogOpen,
  selectedEventForAllSchedules,
  allSchedules,
  onViewAllSchedulesDialogClose,
  editEventDialogOpen,
  eventToEdit,
  onEditEventDialogClose,
  onEditEventSuccess,
  deleteEventDialogOpen,
  eventToDelete,
  onDeleteEventDialogClose,
  onDeleteEventConfirm,
  onUserDataRefresh,
}) => {
  // Edit user states
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingWaitlistUserId, setEditingWaitlistUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    birthday?: string;
    church?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  // Search states
  const [registeredUsersSearch, setRegisteredUsersSearch] = useState('');
  const [waitlistUsersSearch, setWaitlistUsersSearch] = useState('');
  const [pinsSearch, setPinsSearch] = useState('');
  const [schedulesSearch, setSchedulesSearch] = useState('');

  // Edit event states
  const [editEventForm, setEditEventForm] = useState({
    name: '',
    description: '',
    starts_at: '',
    address: '',
    max_capacity: '',
    price_per_person: '',
  });

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'checked in':
        return 'success';
      case 'registered':
        return 'primary';
      case 'waitlisted':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Helper function for better search matching
  const matchesSearch = (text: string | undefined | null, searchTerm: string): boolean => {
    if (!text || !searchTerm) return false;
    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Split search term by spaces to handle multiple words
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    
    // Check if all search words are found as word boundaries or at start of words
    return searchWords.every(word => {
      // Check if word appears at word boundaries (start of word)
      const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      return wordBoundaryRegex.test(textLower) || textLower.startsWith(word);
    });
  };

  // Search filter functions
  const filterRegisteredUsers = (users: any[]) => {
    if (!registeredUsersSearch) return users;
    return users.filter(user => 
      matchesSearch(user.first_name, registeredUsersSearch) ||
      matchesSearch(user.last_name, registeredUsersSearch) ||
      matchesSearch(user.email, registeredUsersSearch) ||
      matchesSearch(user.phone, registeredUsersSearch) ||
      matchesSearch(user.church, registeredUsersSearch) ||
      matchesSearch(`${user.first_name} ${user.last_name}`, registeredUsersSearch)
    );
  };

  const filterWaitlistUsers = (users: any[]) => {
    if (!waitlistUsersSearch) return users;
    return users.filter(user => 
      matchesSearch(user.first_name, waitlistUsersSearch) ||
      matchesSearch(user.last_name, waitlistUsersSearch) ||
      matchesSearch(user.email, waitlistUsersSearch) ||
      matchesSearch(user.phone, waitlistUsersSearch) ||
      matchesSearch(user.church, waitlistUsersSearch) ||
      matchesSearch(`${user.first_name} ${user.last_name}`, waitlistUsersSearch)
    );
  };

  const filterPins = (pins: any[]) => {
    if (!pinsSearch) return pins;
    return pins.filter(pin => 
      matchesSearch(pin.name, pinsSearch) ||
      matchesSearch(pin.email, pinsSearch) ||
      matchesSearch(pin.pin, pinsSearch)
    );
  };

  // Convert schedule data to flat table format
  const getScheduleTableData = () => {
    if (!allSchedules) return [];
    
    const flatData: any[] = [];
    Object.entries(allSchedules).forEach(([userId, userSchedules]) => {
      if (Array.isArray(userSchedules) && userSchedules.length > 0) {
        userSchedules.forEach((schedule: any) => {
          flatData.push({
            userId: parseInt(userId),
            round: schedule.round,
            table: schedule.table,
            partner: schedule.partner_name || 'TBD',
            startTime: schedule.start_time || 'TBD',
            endTime: schedule.end_time || 'TBD',
          });
        });
      }
    });
    
    // Sort by user ID first, then by round
    flatData.sort((a, b) => {
      if (a.userId !== b.userId) {
        return a.userId - b.userId;
      }
      return a.round - b.round;
    });
    
    return flatData;
  };

  const filterSchedules = (scheduleData: any[]) => {
    if (!schedulesSearch) return scheduleData;
    return scheduleData.filter(item => 
      matchesSearch(item.userId.toString(), schedulesSearch) ||
      matchesSearch(item.round.toString(), schedulesSearch) ||
      matchesSearch(item.table.toString(), schedulesSearch) ||
      matchesSearch(item.partner, schedulesSearch)
    );
  };

  // User edit handlers
  const handleEditUser = (user: any, isWaitlist = false) => {
    if (isWaitlist) {
      setEditingWaitlistUserId(user.id);
    } else {
      setEditingUserId(user.id);
    }
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || '',
      birthday: user.birthday ? user.birthday.split('T')[0] : '',
      church: user.church || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingWaitlistUserId(null);
    setEditForm({});
  };

  const handleSaveUser = async (userId: number, isWaitlist = false) => {
    setSaving(true);
    try {
      if (isWaitlist) {
        await eventsApi.updateWaitlistUserDetails(
          selectedEventForWaitlist!.id.toString(),
          userId.toString(),
          editForm
        );
      } else {
        await eventsApi.updateAttendeeDetails(
          selectedEventForRegisteredUsers!.id.toString(),
          userId.toString(),
          editForm
        );
      }
      
      // Refresh the data using callback
      if (isWaitlist && selectedEventForWaitlist && onUserDataRefresh) {
        onUserDataRefresh(selectedEventForWaitlist.id, true);
      } else if (selectedEventForRegisteredUsers && onUserDataRefresh) {
        onUserDataRefresh(selectedEventForRegisteredUsers.id, false);
      }
      
      setEditingUserId(null);
      setEditingWaitlistUserId(null);
      setEditForm({});
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Edit event handlers
  const handleEditEventOpen = () => {
    if (eventToEdit) {
      setEditEventForm({
        name: eventToEdit.name || '',
        description: eventToEdit.description || '',
        starts_at: eventToEdit.starts_at ? new Date(eventToEdit.starts_at).toISOString().slice(0, 16) : '',
        address: eventToEdit.address || '',
        max_capacity: eventToEdit.max_capacity?.toString() || '',
        price_per_person: eventToEdit.price_per_person?.toString() || '',
      });
    }
  };

  const handleSaveEvent = async () => {
    if (!eventToEdit) return;
    
    setSaving(true);
    try {
      await eventsApi.updateEvent(eventToEdit.id.toString(), editEventForm);
      if (onEditEventSuccess) {
        onEditEventSuccess();
      } else {
        onEditEventDialogClose();
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      alert('Failed to update event: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (editEventDialogOpen && eventToEdit) {
      handleEditEventOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEventDialogOpen, eventToEdit]);

  return (
    <>
      {/* View Registered Users Dialog */}
      <Dialog 
        open={viewRegisteredUsersDialogOpen} 
        onClose={onViewRegisteredUsersDialogClose}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          Registered Users - {selectedEventForRegisteredUsers?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users by name, email, phone, or church..."
              value={registeredUsersSearch}
              onChange={(e) => setRegisteredUsersSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {registeredUsers.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Church</TableCell>
                    <TableCell>Registration Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterRegisteredUsers(registeredUsers).map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              value={editForm.first_name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                              placeholder="First Name"
                            />
                            <TextField
                              size="small"
                              value={editForm.last_name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                              placeholder="Last Name"
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" fontWeight="medium">
                            {user.first_name} {user.last_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <TextField
                            size="small"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Email"
                          />
                        ) : (
                          <Typography variant="body2">{user.email}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <TextField
                            size="small"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Phone"
                          />
                        ) : (
                          <Typography variant="body2">{user.phone || 'N/A'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.age || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={editForm.gender}
                              onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            >
                              <MenuItem value="Male">Male</MenuItem>
                              <MenuItem value="Female">Female</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2">{user.gender || 'N/A'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <TextField
                            size="small"
                            value={editForm.church}
                            onChange={(e) => setEditForm(prev => ({ ...prev, church: e.target.value }))}
                            placeholder="Church"
                          />
                        ) : (
                          <Typography variant="body2">{user.church || 'Other'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.registration_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {editingUserId === user.id ? (
                            <>
                              <Tooltip title="Save">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleSaveUser(user.id)}
                                  disabled={saving}
                                  color="primary"
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton 
                                  size="small" 
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="Edit User">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditUser(user)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Copy Email">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCopyToClipboard(user.email)}
                                >
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No registered users found.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onViewRegisteredUsersDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* View Pins Dialog */}
      <Dialog 
        open={viewPinsDialogOpen}
        onClose={onViewPinsDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Attendee PINs - {selectedEventForPins?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or PIN..."
              value={pinsSearch}
              onChange={(e) => setPinsSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {attendeePins.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>PIN</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterPins(attendeePins).map((attendee, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {attendee.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{attendee.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {attendee.pin}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={attendee.status} 
                          color={getStatusChipColor(attendee.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Copy PIN">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyToClipboard(attendee.pin)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy Email">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyToClipboard(attendee.email)}
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No attendee pins found.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onViewPinsDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Waitlist Dialog */}
      <Dialog
        open={viewWaitlistDialogOpen}
        onClose={onViewWaitlistDialogClose}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          Waitlist - {selectedEventForWaitlist?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users by name, email, phone, or church..."
              value={waitlistUsersSearch}
              onChange={(e) => setWaitlistUsersSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {waitlistUsers.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Church</TableCell>
                    <TableCell>Waitlisted Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterWaitlistUsers(waitlistUsers).map((user, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        {editingWaitlistUserId === user.id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              value={editForm.first_name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                              placeholder="First Name"
                            />
                            <TextField
                              size="small"
                              value={editForm.last_name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                              placeholder="Last Name"
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" fontWeight="medium">
                            {user.first_name} {user.last_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingWaitlistUserId === user.id ? (
                          <TextField
                            size="small"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Email"
                          />
                        ) : (
                          <Typography variant="body2">{user.email}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingWaitlistUserId === user.id ? (
                          <TextField
                            size="small"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Phone"
                          />
                        ) : (
                          <Typography variant="body2">{user.phone || 'N/A'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.age || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        {editingWaitlistUserId === user.id ? (
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={editForm.gender}
                              onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            >
                              <MenuItem value="Male">Male</MenuItem>
                              <MenuItem value="Female">Female</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2">{user.gender || 'N/A'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingWaitlistUserId === user.id ? (
                          <TextField
                            size="small"
                            value={editForm.church}
                            onChange={(e) => setEditForm(prev => ({ ...prev, church: e.target.value }))}
                            placeholder="Church"
                          />
                        ) : (
                          <Typography variant="body2">{user.church || 'Other'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.waitlisted_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {editingWaitlistUserId === user.id ? (
                            <>
                              <Tooltip title="Save">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleSaveUser(user.id, true)}
                                  disabled={saving}
                                  color="primary"
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton 
                                  size="small" 
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="Edit User">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditUser(user, true)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Copy Email">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCopyToClipboard(user.email)}
                                >
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No users on waitlist.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onViewWaitlistDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* View All Schedules Dialog */}
      <Dialog
        open={viewAllSchedulesDialogOpen}
        onClose={onViewAllSchedulesDialogClose}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          All Schedules - {selectedEventForAllSchedules?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user ID, round, table, or partner name..."
              value={schedulesSearch}
              onChange={(e) => setSchedulesSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {Object.keys(allSchedules).length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>Round</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Partner</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterSchedules(getScheduleTableData()).map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                          {item.userId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          Round {item.round}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Table {item.table}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.partner}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.startTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.endTime}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No schedules found.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onViewAllSchedulesDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Event Dialog */}
      <Dialog
        open={editEventDialogOpen}
        onClose={onEditEventDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Name"
                  value={editEventForm.name}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={editEventForm.description}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date & Time"
                  type="datetime-local"
                  value={editEventForm.starts_at}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, starts_at: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Capacity"
                  type="number"
                  value={editEventForm.max_capacity}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, max_capacity: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editEventForm.address}
                  onChange={(e) => setEditEventForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                                 <TextField
                   fullWidth
                   label="Price Per Person"
                   type="number"
                   inputProps={{ step: "0.01" }}
                   value={editEventForm.price_per_person}
                   onChange={(e) => setEditEventForm(prev => ({ ...prev, price_per_person: e.target.value }))}
                 />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onEditEventDialogClose} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSaveEvent} 
            variant="contained" 
            color="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog
        open={deleteEventDialogOpen}
        onClose={onDeleteEventDialogClose}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be undone.
          </Typography>
          {eventToDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Event ID: {eventToDelete}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onDeleteEventDialogClose}>Cancel</Button>
          <Button onClick={onDeleteEventConfirm} color="error" variant="contained">
            Delete Event
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventManagementDialogs; 