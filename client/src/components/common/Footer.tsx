import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <Box 
      component="footer" 
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => 
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          Saved & Single {new Date().getFullYear()}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{mt: 1}}>
          <RouterLink to="/privacy-policy" style={{color: 'inherit', textDecoration: 'none'}}>
            Privacy Policy
          </RouterLink>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 