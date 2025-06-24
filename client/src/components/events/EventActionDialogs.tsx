import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import {
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { Event } from '../../types/event';

interface EventActionDialogsProps {
  // Sign up dialog
  signUpDialogOpen: boolean;
  onSignUpDialogClose: () => void;
  onSignUpConfirm: () => void;

  // Cancel dialog
  cancelDialogOpen: boolean;
  onCancelDialogClose: () => void;
  onCancelConfirm: () => void;

  // Check-in dialog
  globalCheckInDialogOpen: boolean;
  selectedEventForCheckIn: Event | null;
  checkInPin: string;
  checkInError: string | null;
  onCheckInDialogClose: () => void;
  onCheckInPinChange: (pin: string) => void;
  onCheckInConfirm: () => void;
  formatDate: (dateString: string) => string;

  // Waitlist dialog
  waitlistDialogOpen: boolean;
  eventForWaitlist: Event | null;
  waitlistReason: string;
  onWaitlistDialogClose: () => void;
  onJoinWaitlistConfirm: () => void;

  // Submit dialog
  submitConfirmOpen: boolean;
  onSubmitDialogClose: () => void;
  onSubmitConfirm: () => void;
}

const EventActionDialogs: React.FC<EventActionDialogsProps> = ({
  signUpDialogOpen,
  onSignUpDialogClose,
  onSignUpConfirm,
  cancelDialogOpen,
  onCancelDialogClose,
  onCancelConfirm,
  globalCheckInDialogOpen,
  selectedEventForCheckIn,
  checkInPin,
  checkInError,
  onCheckInDialogClose,
  onCheckInPinChange,
  onCheckInConfirm,
  formatDate,
  waitlistDialogOpen,
  eventForWaitlist,
  waitlistReason,
  onWaitlistDialogClose,
  onJoinWaitlistConfirm,
  submitConfirmOpen,
  onSubmitDialogClose,
  onSubmitConfirm,
}) => {
  return (
    <>
      {/* Sign Up Dialog */}
      <Dialog
        open={signUpDialogOpen}
        onClose={onSignUpDialogClose}
      >
        <DialogTitle>Sign Up for Event</DialogTitle>
        <DialogContent>
          Are you sure you want to sign up for this event?
        </DialogContent>
        <DialogActions>
          <Button onClick={onSignUpDialogClose}>Cancel</Button>
          <Button onClick={onSignUpConfirm} color="primary" variant="contained">
            Sign Up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Registration Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={onCancelDialogClose}
      >
        <DialogTitle>Cancel Event Registration</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel your registration for this event?
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancelDialogClose}>No</Button>
          <Button onClick={onCancelConfirm} color="error" variant="contained">
            Yes, Cancel Registration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Check-in Dialog */}
      <Dialog open={globalCheckInDialogOpen} onClose={onCheckInDialogClose}>
        <DialogTitle>Event Check-In</DialogTitle>
        <DialogContent>
          {selectedEventForCheckIn && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {selectedEventForCheckIn.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDate(selectedEventForCheckIn.starts_at)}
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
              onChange={(e) => onCheckInPinChange(e.target.value)}
              inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
              fullWidth
              margin="dense"
              disabled={!selectedEventForCheckIn}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCheckInDialogClose}>Cancel</Button>
          <Button 
            onClick={onCheckInConfirm} 
            color="primary" 
            variant="contained"
            disabled={!selectedEventForCheckIn || !checkInPin || checkInPin.length !== 4}
            startIcon={<CheckBoxIcon />}
          >
            Check In
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Waitlist Confirmation Dialog */}
      <Dialog 
        open={waitlistDialogOpen}
        onClose={onWaitlistDialogClose}
      >
        <DialogTitle>Join Waitlist for "{eventForWaitlist?.name}"?</DialogTitle>
        <DialogContent>
          <Typography>
            {waitlistReason}. Would you like to be added to the waitlist?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            If a spot opens up, you may be automatically registered.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onWaitlistDialogClose}>No, Thanks</Button>
          <Button onClick={onJoinWaitlistConfirm} color="primary" variant="contained">
            Yes, Join Waitlist
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Selections Confirmation Dialog */}
      <Dialog
        open={submitConfirmOpen}
        onClose={onSubmitDialogClose}
      >
        <DialogTitle>Submit Final Selections?</DialogTitle>
        <DialogContent>
          <Typography>
            Once you submit, you will not be able to change your selections. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onSubmitDialogClose}>Cancel</Button>
          <Button onClick={onSubmitConfirm} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventActionDialogs; 