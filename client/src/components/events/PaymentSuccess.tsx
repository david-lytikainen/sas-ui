import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { eventsApi } from '../../services/api';
import { useEvents } from '../../context/EventContext';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshEvents } = useEvents();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No payment session found');
        setLoading(false);
        return;
      }

      try {
        const result = await eventsApi.verifyPaymentSession(sessionId);
        setPaymentStatus(result.payment_status);
        
        if (result.payment_status === 'paid') {
          await refreshEvents();
        }
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError('Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, refreshEvents]);

  const handleReturnToEvents = () => {
    navigate('/events');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Verifying payment...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {error ? (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Typography variant="h5" gutterBottom>
                Payment Verification Failed
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We couldn't verify your payment. Please contact support if you believe this is an error.
              </Typography>
            </>
          ) : paymentStatus === 'paid' ? (
            <>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'success.main', 
                  mb: 2 
                }} 
              />
              <Typography variant="h4" gutterBottom color="success.main">
                Payment Successful!
              </Typography>
              <Typography variant="h6" gutterBottom>
                Thank you for your registration
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your payment has been processed successfully and you have been registered for the event. 
                You should receive a confirmation email shortly.
              </Typography>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Payment status: {paymentStatus || 'Unknown'}
              </Alert>
              <Typography variant="h5" gutterBottom>
                Payment Processing
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your payment is still being processed. Please check back in a few minutes or contact support if you have concerns.
              </Typography>
            </>
          )}

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              onClick={handleReturnToEvents}
              size="large"
            >
              Return to Events
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentSuccess; 