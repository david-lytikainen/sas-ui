import React from 'react';
// import { Link as RouterLink } from 'react-router-dom'; // No longer needed for AppBar items
// import AppBar from '@mui/material/AppBar'; // Removed
// import Toolbar from '@mui/material/Toolbar'; // Removed
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button'; // Re-added for Hero section buttons
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
// IconButton, Icons, useTheme, ColorModeContext potentially moved to main Navigation or kept if other uses exist
// For now, assuming theme toggle will be solely in main Navigation. If not, these imports would stay.
// import IconButton from '@mui/material/IconButton'; 
// import Brightness4Icon from '@mui/icons-material/Brightness4'; 
// import Brightness7Icon from '@mui/icons-material/Brightness7'; 
// import { useTheme } from '@mui/material/styles'; 
// import { ColorModeContext } from '../../context/ColorModeContext'; 
import { Link as RouterLink } from 'react-router-dom'; // Keep for other links if any

const LandingPage: React.FC = () => {
  // const theme = useTheme(); // Moved to main Navigation
  // const colorMode = useContext(ColorModeContext); // Moved to main Navigation

  const images = [
    { src: '/images/event-photo-1.jpg', alt: 'Attendees at a Saved and Single event' },
    { src: '/images/event-photo-2.jpg', alt: 'Speakers at a Saved and Single event' },
    { src: '/images/event-photo-3.jpg', alt: 'Guests mingling at a Saved and Single event' },
  ];

  const displayedImages = images.slice(0, 3);

  return (
    // Removed AppBar and Toolbar from here
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default' }}> 
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Meet Your Match, In Faith.
        </Typography>
        <Typography variant="h5" component="p" color="text.secondary" sx={{ mb: 4, maxWidth: '750px', mx: 'auto' }}>
          Tired of endless swiping? Saved & Single hosts cross-church speed-dating events for Christian singles (ages 20-30) in PA, DE, & NJ to connect authentically, in person.
        </Typography>
        {/* Button Container for mobile stacking */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', alignItems: 'center', gap: { xs: 2, sm: 2 } }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={RouterLink} 
            to="/register" 
            sx={{ width: { xs: '80%', sm: 'auto' } }} // Full width on xs, auto on sm+
          >
            Register for an Event
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large" 
            component={RouterLink} 
            to="/login"
            sx={{ width: { xs: '80%', sm: 'auto' } }} // Full width on xs, auto on sm+
          >
            Member Login
          </Button>
        </Box>
      </Container>

      {/* About Section - Shortened Text */}
      <Box sx={{ backgroundColor: 'background.paper', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 4 }}>
            Why Saved & Single?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: '1.1rem' }}>
            Christian dating can be wild. Online dating might lead to exhaustion or dead ends and it can be challenging to meet other Christians outside of your church community. Saved and Single is a cross-church speed-dating event that helps Christian singles from PA, DE, and NJ intentionally connect in person at a stunning private barn in Berwyn, PA.
          </Typography>
        </Container>
      </Box>

      {/* Photos Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 4 }}>
          Glimpses From Our Events
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {displayedImages.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', aspectRatio: '4/3' }}>
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer will be handled by the main Navigation/Layout */}
    </Box>
  );
};

export default LandingPage; 