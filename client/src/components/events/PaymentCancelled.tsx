import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';

const PaymentCancelled: React.FC = () => {
  const navigate = useNavigate();

  const handleReturnToEvents = () => {
    navigate('/events');
  };

  const handleTryAgain = () => {
    navigate('/events');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CancelIcon 
            sx={{ 
              fontSize: 64, 
              color: 'warning.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h4" gutterBottom color="warning.main">
            Payment Cancelled
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Your payment was cancelled
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            You cancelled the payment process and your registration has not been completed.
            You can try again by returning to the events page.
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            If you experienced any issues during the payment process, please contact our support team.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="outlined" 
              onClick={handleReturnToEvents}
              size="large"
            >
              Return to Events
            </Button>
            <Button 
              variant="contained" 
              onClick={handleTryAgain}
              size="large"
            >
              Try Again
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentCancelled; 