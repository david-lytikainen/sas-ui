import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { EventStatus } from '../../types/event';

interface CreateEventFormProps {
  showCreateCard: boolean;
  createForm: {
    name: string;
    description: string;
    starts_at: string;
    address: string;
    max_capacity: string;
    price_per_person: string;
    status: EventStatus;
  };
  onToggleCreateCard: () => void;
  onCreateEvent: () => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (status: EventStatus) => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
  showCreateCard,
  createForm,
  onToggleCreateCard,
  onCreateEvent,
  onFormChange,
  onDateChange,
  onPriceChange,
  onStatusChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!showCreateCard) return null;

  return (
    <Card sx={{ mb: 3, mt: isMobile ? 1 : 0 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: isMobile ? 1 : 2 }}>
          Create New Event
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Event Name"
              name="name"
              value={createForm.name}
              onChange={onFormChange}
              fullWidth
              required
              size={isMobile ? "small" : "medium"}
              margin="dense"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={createForm.description}
              onChange={onFormChange}
              fullWidth
              multiline
              rows={isMobile ? 2 : 4}
              size={isMobile ? "small" : "medium"}
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Start Date and Time"
              name="starts_at"
              type="datetime-local"
              value={createForm.starts_at}
              onChange={onDateChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              required
              size={isMobile ? "small" : "medium"}
              margin="dense"
              inputProps={{
                style: { 
                  textAlign: 'left',
                  paddingLeft: '12px'
                }
              }}
              sx={{ 
                '& .MuiInputBase-input': { 
                  paddingRight: '14px',
                  WebkitAppearance: 'none',
                  textAlign: 'left !important',
                  direction: 'ltr !important',
                  '&::placeholder': {
                    opacity: 0.7,
                    color: 'text.secondary',
                  },
                  '&::-webkit-calendar-picker-indicator': {
                    position: 'absolute',
                    right: 0,
                    padding: '8px',
                    marginRight: '4px',
                    cursor: 'pointer',
                    color: 'rgba(0, 0, 0, 0.54)',
                    opacity: 0,
                    height: '24px',
                    width: '24px',
                    display: 'block',
                    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'rgba(0,0,0,0.54)\' d=\'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z\'/></svg>")',
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 2
                  }
                },
                '& .MuiInputBase-root:has(input[value=""]):before': {
                  content: '"MM/DD/YYYY hh:mm"',
                  display: createForm.starts_at ? 'none' : 'block',
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: theme.palette.mode === 'dark' ? 'rgb(255, 255, 255)' : 'rgba(0, 0, 0, 0.38)',
                  fontSize: '16px',
                  zIndex: 1
                },
                '& .MuiInputBase-root:after': {
                  display: 'none'
                },
                '& .MuiOutlinedInput-root': {
                  paddingRight: 0
                },
                '& .MuiInputAdornment-root': {
                  marginLeft: 0
                },
                '& input[type="datetime-local"]': {
                  display: 'flex',
                  textAlign: 'left !important',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  paddingLeft: '12px !important',
                  '&::-webkit-date-and-time-value': {
                    textAlign: 'left !important',
                    margin: 0,
                    opacity: createForm.starts_at ? 1 : 0
                  },
                  '&::-webkit-datetime-edit': {
                    textAlign: 'left !important',
                    paddingLeft: 0,
                    opacity: createForm.starts_at ? 1 : 0
                  },
                  '&::-webkit-datetime-edit-fields-wrapper': {
                    padding: 0,
                    margin: 0,
                    textAlign: 'left !important'
                  },
                  '&::-webkit-datetime-edit-text': {
                    padding: 0,
                    margin: 0,
                    textAlign: 'left !important'
                  },
                  '&::-webkit-datetime-edit-hour-field, &::-webkit-datetime-edit-minute-field, &::-webkit-datetime-edit-day-field, &::-webkit-datetime-edit-month-field, &::-webkit-datetime-edit-year-field, &::-webkit-datetime-edit-ampm-field': {
                    textAlign: 'left !important'
                  },
                  '&:not([value]), &[value=""]': {
                    color: 'transparent'
                  }
                },
                '& input[type="datetime-local"][value]:not([value=""])': {
                  textAlign: 'left !important',
                  direction: 'ltr !important',
                  color: theme.palette.mode === 'dark' ? 'white !important' : 'text.primary !important',
                  '&::-webkit-datetime-edit': {
                    paddingLeft: 0,
                    textAlign: 'left !important',
                    opacity: 1
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{
                      opacity: 0.7,
                      color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0, 0, 0, 0.54)'
                    }}>
                      <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </div>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Address"
              name="address"
              value={createForm.address}
              onChange={onFormChange}
              fullWidth
              size={isMobile ? "small" : "medium"}
              margin="dense"
            />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField
              label="Max Capacity"
              name="max_capacity"
              type="number"
              value={createForm.max_capacity}
              onChange={onFormChange}
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
              size={isMobile ? "small" : "medium"}
              margin="dense"
            />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField
              label="Price Per Person"
              name="price_per_person"
              type="number"
              value={createForm.price_per_person}
              onChange={onPriceChange}
              fullWidth
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              size={isMobile ? "small" : "medium"}
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"} margin="dense">
              <InputLabel id="event-status-label">Status</InputLabel>
              <Select
                labelId="event-status-label"
                name="status"
                value={createForm.status}
                label="Status"
                onChange={(e) => onStatusChange(e.target.value as EventStatus)}
              >
                <MenuItem value="Registration Open">Registration Open</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: isMobile ? 1 : 2 }}>
        <Button onClick={onToggleCreateCard} color="inherit" size={isMobile ? "small" : "medium"}>
          Cancel
        </Button>
        <Button onClick={onCreateEvent} variant="contained" color="primary" size={isMobile ? "small" : "medium"}>
          Create Event
        </Button>
      </CardActions>
    </Card>
  );
};

export default CreateEventForm; 