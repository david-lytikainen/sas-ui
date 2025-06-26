import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalanceWallet as VenmoIcon,
  Smartphone as PhoneIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';
import { eventsApi } from '../../services/api';
import { Event } from '../../types/event';

interface VenmoPaymentProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
  onSuccess: () => void;
}

interface VenmoPaymentData {
  client_secret: string;
  payment_intent_id: string;
  venmo_deep_link: {
    ios_deep_link: string;
    web_fallback: string;
    success_url: string;
    cancel_url: string;
  };
}

const VenmoPayment: React.FC<VenmoPaymentProps> = ({
  open,
  onClose,
  event,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venmoData, setVenmoData] = useState<VenmoPaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'completed' | 'failed'>('pending');
  const [isIOS, setIsIOS] = useState(false);
  const [hasVenmoApp, setHasVenmoApp] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    if (iOS) {
      setHasVenmoApp(true);
    }
  }, []);

  const initializeVenmoPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentStatus('pending');

      const response = await eventsApi.createVenmoPaymentIntent(event!.id.toString());
      setVenmoData(response);
      
    } catch (err: any) {
      console.error('Error initializing Venmo payment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initialize Venmo payment';
      
      if (errorMessage.includes('payment_method_types') || errorMessage.includes('venmo')) {
        setError('Venmo payments are currently in development mode. Please use the simulation feature or try card payment.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (open && event) {
      console.log('VenmoPayment: Initializing with event:', event.name);
      initializeVenmoPayment();
    } else if (open && !event) {
      console.log('VenmoPayment: Dialog opened but no event provided, waiting...');
      const timeout = setTimeout(() => {
        if (open && !event) {
          console.log('VenmoPayment: Still no event after delay, showing error');
          setError('No event selected');
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [open, event, initializeVenmoPayment]);

  const handleVenmoPayment = () => {
    if (!venmoData) return;

    setPaymentStatus('checking');

    if (isIOS && hasVenmoApp) {
      window.location.href = venmoData.venmo_deep_link.ios_deep_link;
      
      startPaymentPolling();
      
      setTimeout(() => {
        if (paymentStatus === 'checking') {
          setError('If Venmo app didn\'t open, try the web option below');
        }
      }, 3000);
    } else {
      window.open(venmoData.venmo_deep_link.web_fallback, '_blank');
      startPaymentPolling();
    }
  };

  const startPaymentPolling = () => {
    if (!venmoData) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await eventsApi.getVenmoPaymentStatus(venmoData.payment_intent_id);
        
        if (status.status === 'succeeded') {
          setPaymentStatus('completed');
          clearInterval(pollInterval);
          onSuccess();
        } else if (status.status === 'canceled' || status.status === 'failed') {
          setPaymentStatus('failed');
          clearInterval(pollInterval);
          setError('Payment was cancelled or failed');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'checking') {
        setPaymentStatus('failed');
        setError('Payment confirmation timed out. Please check your Venmo app and try again.');
      }
    }, 300000);
  };

  const handleSimulatePayment = async () => {
    if (!venmoData) return;

    try {
      setLoading(true);
      
      if (venmoData.payment_intent_id === 'mock_payment_intent_id') {
        setTimeout(() => {
          setPaymentStatus('completed');
          setLoading(false);
          onSuccess();
        }, 2000);
        return;
      }
      
      await eventsApi.simulateVenmoPayment(venmoData.payment_intent_id);
      setPaymentStatus('completed');
      onSuccess();
    } catch (err: any) {
      console.error('Error simulating payment:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to simulate payment';
      if (err.response?.status === 403) {
        setError('Development mode not enabled on server. Please restart the server with FLASK_ENV=development');
      } else {
        setError(`Simulation failed: ${errorMsg}. Please try again or contact support.`);
      }
    } finally {
      if (venmoData.payment_intent_id !== 'mock_payment_intent_id') {
        setLoading(false);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleClose = () => {
    setVenmoData(null);
    setError(null);
    setPaymentStatus('pending');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <VenmoIcon color="primary" />
            <Typography variant="h6">Pay with Venmo</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" py={3}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Setting up Venmo payment...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            {process.env.NODE_ENV === 'development' && error.includes('development mode') && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  💡 <strong>Development Mode:</strong> Use the "Simulate Payment" button below to test the flow.
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {event && !loading && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {event.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {new Date(event.starts_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Typography>
                         <Typography variant="h5" color="primary" gutterBottom>
               {formatPrice(parseFloat(event.price_per_person))}
             </Typography>

            {paymentStatus === 'pending' && venmoData && (
              <Box mt={3}>
                <Typography variant="body1" gutterBottom>
                  Choose your preferred payment method:
                </Typography>
                
                {isIOS && hasVenmoApp && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleVenmoPayment}
                    startIcon={<PhoneIcon />}
                    sx={{ mb: 2, bgcolor: '#3D95CE', '&:hover': { bgcolor: '#2E7BA6' } }}
                  >
                    Open Venmo App
                  </Button>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    if (venmoData) {
                      window.open(venmoData.venmo_deep_link.web_fallback, '_blank');
                      startPaymentPolling();
                    }
                  }}
                  startIcon={<ExternalLinkIcon />}
                  sx={{ mb: 2 }}
                >
                  Pay via Venmo Web
                </Button>

                {process.env.NODE_ENV === 'development' && (
                  <Box mt={2}>
                    <Chip 
                      label="Development Mode" 
                      size="small" 
                      color="warning" 
                      sx={{ mb: 1 }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSimulatePayment}
                      disabled={loading}
                      color="warning"
                      sx={{ 
                        bgcolor: '#ff9800', 
                        '&:hover': { bgcolor: '#f57c00' },
                        fontWeight: 'bold'
                      }}
                    >
                      🧪 Simulate Venmo Payment (Dev Only)
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {paymentStatus === 'checking' && (
              <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
                  Waiting for payment confirmation...
                  <br />
                  Complete your payment in the Venmo app
                </Typography>
              </Box>
            )}

            {paymentStatus === 'completed' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Payment completed successfully! You are now registered for the event.
              </Alert>
            )}

            {paymentStatus === 'failed' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Payment failed or was cancelled. Please try again.
              </Alert>
            )}

            {process.env.NODE_ENV === 'development' && error && !venmoData && (
              <Box mt={3}>
                <Chip 
                  label="Development Mode" 
                  size="small" 
                  color="warning" 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Test the Venmo payment flow without actual payment processing:
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setVenmoData({
                      client_secret: 'mock_client_secret',
                      payment_intent_id: 'mock_payment_intent_id',
                      venmo_deep_link: {
                        ios_deep_link: 'venmo://mock',
                        web_fallback: 'https://venmo.com/mock',
                        success_url: 'http://localhost:3000/success',
                        cancel_url: 'http://localhost:3000/cancel'
                      }
                    });
                    setError(null);
                  }}
                  color="warning"
                  sx={{ 
                    bgcolor: '#ff9800', 
                    '&:hover': { bgcolor: '#f57c00' },
                    fontWeight: 'bold'
                  }}
                >
                  🧪 Create Mock Venmo Payment
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          {paymentStatus === 'completed' ? 'Close' : 'Cancel'}
        </Button>
        {paymentStatus === 'failed' && venmoData && (
          <Button onClick={initializeVenmoPayment} color="primary">
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VenmoPayment; 