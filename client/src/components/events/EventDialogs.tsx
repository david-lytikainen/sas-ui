import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelEditIcon,
  CheckCircle as CheckInIcon,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { Event } from '../../types/event';
import { churchOptions } from '../../constants/churchOptions';

interface EventDialogsProps {
  // Sign up dialog
  signUpDialogOpen: boolean;
  setSignUpDialogOpen: (open: boolean) => void;
  handleSignUpConfirm: () => void;

  // Cancel dialog
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  handleCancelConfirm: () => void;

  // Check-in dialog
  globalCheckInDialogOpen: boolean;
  setGlobalCheckInDialogOpen: (open: boolean) => void;
  selectedEventForCheckIn: Event | null;
  checkInPin: string;
  setCheckInPin: (pin: string) => void;
  checkInError: string | null;
  handleGlobalCheckInConfirm: () => void;

  // View pins dialog
  viewPinsDialogOpen: boolean;
  setViewPinsDialogOpen: (open: boolean) => void;
  selectedEventForPins: Event | null;
  attendeePins: {name: string, email: string, pin: string}[];
  filteredPins: {name: string, email: string, pin: string}[];
  pinSearchTerm: string;
  handlePinSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Registered users dialog
  viewRegisteredUsersDialogOpen: boolean;
  setViewRegisteredUsersDialogOpen: (open: boolean) => void;
  selectedEventForRegisteredUsers: Event | null;
  registeredUsers: any[];
  filteredRegisteredUsers: any[];
  registeredUsersSearchTerm: string;
  handleRegisteredUsersSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editingUserId: number | null;
  editFormData: any;
  handleStartEditing: (user: any) => void;
  handleCancelEditing: () => void;
  handleSaveEdits: (userId: number) => void;
  handleEditFormChange: (value: any, field: string) => void;
  formatUTCToLocal: (utcDateString: string, includeTime?: boolean) => string;
  calculateAge: (birthday: Date) => number;
  handleExportRegisteredUsers: () => void;
  isAdmin: () => boolean;
  isOrganizer: () => boolean;

  // Waitlist dialog
  waitlistDialogOpen: boolean;
  setWaitlistDialogOpen: (open: boolean) => void;
  eventForWaitlist: Event | null;
  setEventForWaitlist: (event: Event | null) => void;
  waitlistReason: string;
  handleJoinWaitlistConfirm: () => void;

  // Submit confirmation dialog
  submitConfirmOpen: boolean;
  setSubmitConfirmOpen: (open: boolean) => void;
  handleSubmitConfirm: () => void;
}

const EventDialogs: React.FC<EventDialogsProps> = ({
  // Sign up dialog props
  signUpDialogOpen,
  setSignUpDialogOpen,
  handleSignUpConfirm,

  // Cancel dialog props
  cancelDialogOpen,
  setCancelDialogOpen,
  handleCancelConfirm,

  // Check-in dialog props
  globalCheckInDialogOpen,
  setGlobalCheckInDialogOpen,
  selectedEventForCheckIn,
  checkInPin,
  setCheckInPin,
  checkInError,
  handleGlobalCheckInConfirm,

  // View pins dialog props
  viewPinsDialogOpen,
  setViewPinsDialogOpen,
  selectedEventForPins,
  attendeePins,
  filteredPins,
  pinSearchTerm,
  handlePinSearchChange,

  // Registered users dialog props
  viewRegisteredUsersDialogOpen,
  setViewRegisteredUsersDialogOpen,
  selectedEventForRegisteredUsers,
  registeredUsers,
  filteredRegisteredUsers,
  registeredUsersSearchTerm,
  handleRegisteredUsersSearchChange,
  editingUserId,
  editFormData,
  handleStartEditing,
  handleCancelEditing,
  handleSaveEdits,
  handleEditFormChange,
  formatUTCToLocal,
  calculateAge,
  handleExportRegisteredUsers,
  isAdmin,
  isOrganizer,

  // Waitlist dialog props
  waitlistDialogOpen,
  setWaitlistDialogOpen,
  eventForWaitlist,
  setEventForWaitlist,
  waitlistReason,
  handleJoinWaitlistConfirm,

  // Submit confirmation dialog props
  submitConfirmOpen,
  setSubmitConfirmOpen,
  handleSubmitConfirm,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Sign Up Dialog */}
      <Dialog
        open={signUpDialogOpen}
        onClose={() => setSignUpDialogOpen(false)}
      >
        <DialogTitle>Sign Up for Event</DialogTitle>
        <DialogContent>
          Are you sure you want to sign up for this event?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignUpDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSignUpConfirm} color="primary" variant="contained">
            Sign Up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Registration Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Event Registration</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel your registration for this event?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            Yes, Cancel Registration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={globalCheckInDialogOpen} onClose={() => setGlobalCheckInDialogOpen(false)}>
        <DialogTitle>Event Check-In</DialogTitle>
        <DialogContent>
          {selectedEventForCheckIn && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {selectedEventForCheckIn.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatUTCToLocal(selectedEventForCheckIn.starts_at)}
              </Typography>
            </>
          )}
          {checkInError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {checkInError}
            </Alert>
          )}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Enter the 4-digit PIN given to you by an admin
            </Typography>
            <TextField
              sx={{ mt: 0, mb: 0 }}
              label="PIN"
              type="password"
              value={checkInPin}
              onChange={(e) => setCheckInPin(e.target.value)}
              inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
              fullWidth
              margin="dense"
              disabled={!selectedEventForCheckIn}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGlobalCheckInDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleGlobalCheckInConfirm} 
            color="primary" 
            variant="contained"
            disabled={!selectedEventForCheckIn || !checkInPin || checkInPin.length !== 4}
            startIcon={<CheckBoxIcon />}
          >
            Check In
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Pins Dialog */}
      <Dialog 
        open={viewPinsDialogOpen} 
        onClose={() => setViewPinsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEventForPins?.name} - Attendee PINs
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
          {attendeePins.length > 0 ? (
            <>
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Search"
                  placeholder="Search by name, email, or PIN..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={pinSearchTerm}
                  onChange={handlePinSearchChange}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                        🔍
                      </Box>
                    ),
                  }}
                />
              </Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Showing {filteredPins.length} of {attendeePins.length} attendees
              </Typography>
              <List>
                {filteredPins.map((attendee, index) => (
                  <ListItem key={index} divider={index < filteredPins.length - 1}>
                    <ListItemText
                      primary={attendee.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {attendee.email}
                          </Typography>
                          <Typography 
                            component="span" 
                            variant="body2" 
                            sx={{ 
                              display: 'block', 
                              fontWeight: 'bold',
                              color: theme.palette.primary.main 
                            }}
                          >
                            PIN: {attendee.pin}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
              No registered attendees with PINs found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPinsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Registered Users Dialog */}
      <Dialog 
        open={viewRegisteredUsersDialogOpen} 
        onClose={() => setViewRegisteredUsersDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedEventForRegisteredUsers?.name} - Registered Users
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 0, sm: 1 } }}>
          {registeredUsers.length > 0 ? (
            <>
              <Box sx={{ mb: 2, px: { xs: 1, sm: 0 } }}>
                <TextField
                  label="Search Users"
                  placeholder="Search by name or email..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={registeredUsersSearchTerm}
                  onChange={handleRegisteredUsersSearchChange}
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
                      {(isAdmin() || isOrganizer()) && (
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
                                <TextField 
                                  size="small" 
                                  label="First Name" 
                                  value={editFormData.first_name} 
                                  onChange={(e) => handleEditFormChange(e.target.value, 'first_name')} 
                                  sx={{ width: 'calc(50% - 4px)' }} 
                                />
                                <TextField 
                                  size="small" 
                                  label="Last Name" 
                                  value={editFormData.last_name} 
                                  onChange={(e) => handleEditFormChange(e.target.value, 'last_name')} 
                                  sx={{ width: 'calc(50% - 4px)' }} 
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <TextField 
                                size="small" 
                                label="Email" 
                                value={editFormData.email} 
                                onChange={(e) => handleEditFormChange(e.target.value, 'email')} 
                                fullWidth 
                              />
                            </TableCell>
                            <TableCell>
                              <TextField 
                                size="small" 
                                label="Phone" 
                                value={editFormData.phone} 
                                onChange={(e) => handleEditFormChange(e.target.value, 'phone')} 
                                fullWidth 
                              />
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select 
                                  value={editFormData.gender || ''} 
                                  label="Gender" 
                                  onChange={(e) => handleEditFormChange(e.target.value, 'gender')}
                                >
                                  <MenuItem value="Male">Male</MenuItem>
                                  <MenuItem value="Female">Female</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {editFormData.birthday ? calculateAge(new Date(editFormData.birthday)) : ''}
                            </TableCell>
                            <TableCell>
                              <TextField 
                                size="small" 
                                label="Birthday" 
                                type="date" 
                                value={editFormData.birthday || ''} 
                                onChange={(e) => handleEditFormChange(e.target.value, 'birthday')} 
                                InputLabelProps={{ shrink: true }} 
                                fullWidth 
                              />
                            </TableCell>
                            <TableCell>
                              <Autocomplete
                                fullWidth
                                freeSolo
                                size="small"
                                options={churchOptions}
                                value={editFormData.church || ''}
                                onChange={(event, newValue) => {
                                  handleEditFormChange(newValue || '', 'church');
                                }}
                                onInputChange={(event, newInputValue) => {
                                  handleEditFormChange(newInputValue, 'church');
                                }}
                                ListboxProps={{
                                  style: {
                                    maxHeight: '200px',
                                  },
                                }}
                                renderInput={(params) => (
                                  <TextField 
                                    {...params} 
                                    label="Church" 
                                    size="small"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>{user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={user.status} 
                                color={user.status === 'Checked In' ? 'success' : 'primary'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in'}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <TextField 
                                size="small" 
                                label="PIN" 
                                value={editFormData.pin || ''} 
                                onChange={(e) => handleEditFormChange(e.target.value, 'pin')} 
                                inputProps={{ maxLength: 4, pattern: '[0-9]*' }} 
                                sx={{ width: 65 }} 
                              />
                            </TableCell>
                            {(isAdmin() || isOrganizer()) && (
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  <IconButton 
                                    size="small" 
                                    color="primary" 
                                    onClick={() => handleSaveEdits(user.id)} 
                                    title="Save"
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error" 
                                    onClick={handleCancelEditing} 
                                    title="Cancel"
                                  >
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
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>{user.gender}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{user.age}</TableCell>
                            <TableCell>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</TableCell>
                            <TableCell>{user.church || 'Other'}</TableCell>
                            <TableCell>{user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={user.status} 
                                color={user.status === 'Checked In' ? 'success' : 'primary'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in'}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{user.pin}</TableCell>
                            {(isAdmin() || isOrganizer()) && (
                              <TableCell sx={{ textAlign: 'center' }}>
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => handleStartEditing(user)} 
                                  title="Edit"
                                >
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
            {isAdmin() && registeredUsers.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleExportRegisteredUsers}
                startIcon={<DownloadIcon />}
              >
                Export CSV
              </Button>
            )}
          </Box>
          <Button onClick={() => setViewRegisteredUsersDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Waitlist Confirmation Dialog */}
      <Dialog
        open={waitlistDialogOpen}
        onClose={() => {
          setWaitlistDialogOpen(false);
          setEventForWaitlist(null);
        }}
      >
        <DialogTitle>Join Waitlist for "{eventForWaitlist?.name}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {waitlistReason}. Would you like to be added to the waitlist?
          </DialogContentText>
          <DialogContentText variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            If a spot opens up, you may be automatically registered.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setWaitlistDialogOpen(false);
            setEventForWaitlist(null);
          }}>No, Thanks</Button>
          <Button onClick={handleJoinWaitlistConfirm} color="primary" variant="contained">
            Yes, Join Waitlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Selections Confirmation Dialog */}
      <Dialog
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
      >
        <DialogTitle>Submit Final Selections?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Once you submit, you will not be able to change your selections. Are you sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitConfirm} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventDialogs; 