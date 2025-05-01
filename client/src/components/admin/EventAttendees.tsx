import React, { useState, useEffect } from 'react';
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
  Chip,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check as CheckIcon,
  Search as SearchIcon, 
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface EventAttendee {
  id: number;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday?: string | null;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  registration_date?: string | null;
  check_in_date?: string | null;
  status: string;
  pin: string;
}

interface EditAttendeeDialogProps {
  open: boolean;
  attendee: EventAttendee | null;
  onClose: () => void;
  onSave: (attendeeId: number, updatedData: any) => Promise<void>;
}

const EditAttendeeDialog: React.FC<EditAttendeeDialogProps> = ({ open, attendee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    birthday: '',
    pin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attendee) {
      setFormData({
        first_name: attendee.first_name || '',
        last_name: attendee.last_name || '',
        email: attendee.email || '',
        phone: attendee.phone || '',
        gender: attendee.gender || '',
        birthday: attendee.birthday || '',
        pin: attendee.pin || ''
      });
    }
  }, [attendee]);

  // Handle text field changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select field changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!attendee) return;
    
    try {
      setLoading(true);
      setError(null);
      await onSave(attendee.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update attendee');
    } finally {
      setLoading(false);
    }
  };

  if (!attendee) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Attendee</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleTextChange}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleTextChange}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleTextChange}
            type="email"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleTextChange}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={handleSelectChange}
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="Birthday"
            name="birthday"
            type="date"
            value={formData.birthday ? formData.birthday.substring(0, 10) : ''}
            onChange={handleTextChange}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="PIN"
            name="pin"
            value={formData.pin}
            onChange={handleTextChange}
            inputProps={{ maxLength: 4 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EventAttendees: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isOrganizer } = useAuth();
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    attendee: EventAttendee | null;
  }>({
    open: false,
    attendee: null
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchAttendees = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const response = await eventsApi.getEventAttendees(eventId);
      // Handle the response based on your API structure
      // Assuming the API returns either an array directly or a data property with the array
      const attendeeData = Array.isArray(response) ? response : response.data || [];
      setAttendees(attendeeData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
      setError('Failed to load attendee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin() && !isOrganizer()) {
      navigate('/events');
      return;
    }

    fetchAttendees();
  }, [eventId, navigate, isAdmin, isOrganizer]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin)
      .then(() => {
        setCopiedPin(pin);
        setTimeout(() => setCopiedPin(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy pin:', err);
      });
  };

  const openEditDialog = (attendee: EventAttendee) => {
    setEditDialog({
      open: true,
      attendee
    });
  };

  const closeEditDialog = () => {
    setEditDialog({
      open: false,
      attendee: null
    });
  };

  const handleSaveAttendee = async (attendeeId: number, updatedData: any) => {
    if (!eventId) return;
    
    try {
      const response = await eventsApi.updateAttendeeDetails(eventId, attendeeId.toString(), updatedData);
      
      // Update the attendee in the local state
      setAttendees(prev => prev.map(a => 
        a.id === attendeeId 
          ? { 
              ...a, 
              ...updatedData, 
              name: `${updatedData.first_name} ${updatedData.last_name}` 
            } 
          : a
      ));
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Attendee details updated successfully',
        severity: 'success'
      });
      
      // Refresh attendee data
      fetchAttendees();
      
    } catch (err: any) {
      console.error('Failed to update attendee:', err);
      throw new Error(err.message || 'Failed to update attendee details');
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const filteredAttendees = attendees.filter(attendee => 
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/events/${eventId}`)} 
          sx={{ mt: 2 }}
        >
          Back to Event
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(`/events/${eventId}`)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Event Attendees
        </Typography>
      </Box>
      
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search attendees by name or email..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {filteredAttendees.length} Attendees
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Birthday</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>PIN</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell>{attendee.name}</TableCell>
                  <TableCell>{attendee.email}</TableCell>
                  <TableCell>{attendee.age || 'N/A'}</TableCell>
                  <TableCell>{attendee.birthday ? new Date(attendee.birthday).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{attendee.gender || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={attendee.status} 
                      color={attendee.status === 'Checked In' ? 'success' : 'default'}
                      icon={attendee.status === 'Checked In' ? <CheckIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>{attendee.pin}</Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => copyPin(attendee.pin)}
                        color={copiedPin === attendee.pin ? "success" : "default"}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(attendee)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAttendees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" py={3}>
                      No attendees found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Attendee Dialog */}
      <EditAttendeeDialog
        open={editDialog.open}
        attendee={editDialog.attendee}
        onClose={closeEditDialog}
        onSave={handleSaveAttendee}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={closeNotification}
        message={notification.message}
      />
    </Box>
  );
};

export default EventAttendees; 