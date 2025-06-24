import React from 'react';
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Event as EventIcon,
} from '@mui/icons-material';

interface EventHeaderProps {
  isAdmin: boolean;
  isOrganizer: boolean;
  showCreateCard: boolean;
  onToggleCreateCard: () => void;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  isAdmin,
  isOrganizer,
  showCreateCard,
  onToggleCreateCard,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: { xs: 'flex-start', sm: 'space-between' },
        alignItems: 'center', 
        mb: 4,
        flexDirection: { xs: 'row', sm: 'row' } 
      }}
    >
      <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ fontWeight: 'bold', mr: 1 }}>
        Events
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: { xs: 2, sm: 0 } }}>
        {(isAdmin || isOrganizer) && !showCreateCard && (
          <Button
            variant="contained"
            color="primary"
            onClick={onToggleCreateCard}
            startIcon={<EventIcon />}
            sx={{
              minWidth: { xs: 'auto', sm: 'inherit' }, 
              p: { xs: '6px 10px', sm: '6px 16px' }, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              whiteSpace: 'nowrap'
            }}
          >
            Create Event
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EventHeader; 