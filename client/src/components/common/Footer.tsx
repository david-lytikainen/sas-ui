import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box 
      component="footer" 
      sx={{
        py: 1.5,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => 
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 2 },
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
          {new Date().getFullYear()} Saved & Single
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 } }}>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              color="inherit"
              sx={{ 
                fontSize: 'caption.fontSize', 
                textDecoration: 'none', 
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              Privacy Policy
            </Link>
            <Link
              component={RouterLink}
              to="/terms-and-conditions"
              color="inherit"
              sx={{ 
                fontSize: 'caption.fontSize', 
                textDecoration: 'none', 
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              Terms and Conditions
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 