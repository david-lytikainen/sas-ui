import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Box,
  Avatar,
  Divider
} from '@mui/material';
import {Email as EmailIcon, Cake as CakeIcon } from '@mui/icons-material';


interface Match {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  gender: string;
}

interface MatchesDialogProps {
  open: boolean;
  onClose: () => void;
  eventName: string | undefined;
  matches: Match[];
  loading: boolean;
  error: string | null;
}

const MatchesDialog: React.FC<MatchesDialogProps> = ({ 
  open, 
  onClose, 
  eventName, 
  matches, 
  loading, 
  error 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle 
        sx={{
          fontSize: '.85rem',
        }}
      >
        Matches for {eventName || 'Event'}
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading your matches...</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        )}
        {!loading && !error && matches.length === 0 && (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No matches found for this event yet. 
          </Typography>
        )}
        {!loading && !error && matches.length > 0 && (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {matches.map((match) => (
              <React.Fragment key={match.id}>
                <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 36, height: 36, fontSize: '0.85rem' }}>
                    {match.first_name.charAt(0)}{match.last_name.charAt(0)}
                  </Avatar>
                  <ListItemText
                    primary={`${match.first_name} ${match.last_name}`}
                    primaryTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 500 } }}
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.25 }}>
                          <CakeIcon sx={{ fontSize: '0.8rem' }} /> Age: {match.age}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <EmailIcon sx={{ fontSize: '0.8rem' }} /> {match.email} 
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchesDialog; 