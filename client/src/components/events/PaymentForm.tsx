import React, { useState, useEffect, useMemo } from 'react';
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
  Divider,
  Skeleton,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { eventsApi } from '../../services/api';
import { Event } from '../../types/event';
import axios from 'axios';

let stripePromise: Promise<any> | null = null;
let stripeConfigPromise: Promise<any> | null = null;

const getStripeConfig = async () => {
  if (!stripeConfigPromise) {
    stripeConfigPromise = eventsApi.getStripeConfig();
  }
  return stripeConfigPromise;
};

const getStripe = async () => {
  if (!stripePromise) {
    try {
      const config = await getStripeConfig();
      stripePromise = loadStripe(config.publishable_key);
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
      // Fallback: try direct fetch to bypass axios interceptors
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/stripe/config`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const config = await response.json();
        stripePromise = loadStripe(config.publishable_key);
        console.log('Stripe config loaded via fallback fetch');
      } catch (fallbackError: any) {
        console.error('Fallback fetch also failed:', fallbackError);
        
        // Check if this is a mixed content issue (HTTPS → HTTP)
        const isHttpsToHttp = window.location.protocol === 'https:' && 
          (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').startsWith('http:');
        
        if (isHttpsToHttp) {
          throw new Error('Payment system unavailable: Mixed content blocked. Please ensure both frontend and backend use HTTPS, or access the site via HTTP.');
        } else if (fallbackError.message?.includes('Network Error')) {
          throw new Error('Payment system unavailable: Cannot connect to payment server. Please check your internet connection.');
        } else {
          // Last resort: try with a hardcoded key for development
          console.warn('Using fallback Stripe key due to config loading failure');
          const fallbackKey = 'pk_test_51RdZeRH6zrocvYcAtTKhX6hNjwZCiELcsS2VqafhAaoUGn1jxvdhcHnuo03lzBgpEEetAgY1tHVauVancijMEQi400hAgJRENi';
          stripePromise = loadStripe(fallbackKey);
          console.log('Stripe loaded with fallback key');
          return stripePromise;
        }
      }
    }
  }
  return stripePromise;
};

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
  onSuccess: () => void;
  existingPaymentIntentId?: string;
}

interface PaymentFormInnerProps {
  event: Event;
  onSuccess: () => void;
  onError: (error: string) => void;
  clientSecret: string;
}

const PaymentFormInner: React.FC<PaymentFormInnerProps> = ({
  event,
  onSuccess,
  onError,
  clientSecret
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event_form: React.FormEvent) => {
    event_form.preventDefault();

    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_PAYMENTS === 'true') {
      console.log('Development mode: simulating payment success');
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onSuccess();
      }, 1500);
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        onError(error.message || 'An error occurred during payment');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded! Waiting for registration processing...');
        
        // Explicitly verify the payment and register the user
        try {
          const verifyResponse = await axios.get(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/stripe/payment-intent/${paymentIntent.id}`, 
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true
            }
          );
          console.log('Payment verification response:', verifyResponse.data);
        } catch (verifyError) {
          console.error('Error verifying payment:', verifyError);
        }
        
        setTimeout(() => {
          onSuccess();
        }, 1000); // Increased delay to allow backend processing
      } else {
        onError('Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      onError('Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Registration Payment
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {event.name}
        </Typography>
        <Typography variant="h5" color="primary">
          ${parseFloat(event.price_per_person).toFixed(2)}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <PaymentElement 
          options={{
            paymentMethodOrder: ['card'],
            fields: {
              billingDetails: 'auto'
            }
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Processing...' : `Pay $${parseFloat(event.price_per_person).toFixed(2)}`}
        </Button>
      </Box>
    </form>
  );
};

const PaymentFormSkeleton: React.FC<{ event: Event }> = ({ event }) => (
  <>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Event Registration Payment
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {event.name}
      </Typography>
      <Typography variant="h5" color="primary">
        ${parseFloat(event.price_per_person).toFixed(2)}
      </Typography>
    </Box>

    <Divider sx={{ mb: 3 }} />

    <Box sx={{ mb: 3 }}>
      <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ flex: 1, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={60} sx={{ flex: 1, borderRadius: 1 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ flex: 1, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={60} sx={{ flex: 1, borderRadius: 1 }} />
      </Box>
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1 }} />
    </Box>
  </>
);

const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onClose,
  event,
  onSuccess,
  existingPaymentIntentId
}) => {
  const [stripeInstance, setStripeInstance] = useState<Promise<any> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const options = useMemo(() => ({
    clientSecret: clientSecret || '',
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#1976d2',
      },
    },
    // Development only: disable secure connection warnings for localhost
    ...(window.location.hostname === 'localhost' && {
      loader: 'auto' as const,
    }),
  }), [clientSecret]);

  useEffect(() => {
    if (open && event) {
      initializePayment();
    } else if (open && !event) {
      setClientSecret(null);
      setStripeInstance(null);
      setError(null);
      setLoading(false);
    }
  }, [open, event]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializePayment = async () => {
    if (!event) return;
    
    setLoading(true);
    setError(null);

    try {
      // Initialize Stripe first
      const stripe = await getStripe();
      setStripeInstance(Promise.resolve(stripe));

      // Create payment intent
      let clientSecretValue: string;
      if (existingPaymentIntentId) {
        // For waitlist users with existing payment intent
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/stripe/payment-intent/${existingPaymentIntentId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true
          }
        );
        clientSecretValue = response.data.client_secret;
      } else {
        // Create new payment intent
        const response = await eventsApi.createPaymentIntent(event.id.toString());
        clientSecretValue = response.client_secret;
      }

      if (clientSecretValue) {
        setClientSecret(clientSecretValue);
      } else {
        throw new Error('No client secret received from payment service');
      }
    } catch (error: any) {
      console.log('Payment initialization issue:', error.message || 'Unknown error');
      const isNetworkError = error.message?.includes('Network Error') || error.code === 'ERR_NETWORK';
      
      if (isNetworkError) {
        setError('Payment system temporarily unavailable. Please try refreshing the page or contact support.');
      } else {
        setError(error.message || 'Failed to initialize payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    setError(null);
    setClientSecret(null);
    setStripeInstance(null);
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Complete Your Registration
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <PaymentFormSkeleton event={event} />
        )}

        {!loading && !error && stripeInstance && clientSecret && (
          <Elements stripe={stripeInstance} options={options}>
            <PaymentFormInner
              event={event}
              onSuccess={handleSuccess}
              onError={handleError}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm; 