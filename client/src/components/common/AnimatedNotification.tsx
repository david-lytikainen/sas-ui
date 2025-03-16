import React from 'react';
import { Alert, AlertProps, Snackbar } from '@mui/material';
import { animated, useTransition } from '@react-spring/web';

interface AnimatedNotificationProps extends Omit<AlertProps, 'children'> {
  open: boolean;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
}

const AnimatedAlert = animated(Alert);

const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  open,
  message,
  onClose,
  autoHideDuration = 6000,
  ...alertProps
}) => {
  const transitions = useTransition(open, {
    from: { 
      opacity: 0,
      transform: 'translateX(100%) scale(0.9)',
    },
    enter: { 
      opacity: 1,
      transform: 'translateX(0%) scale(1)',
    },
    leave: { 
      opacity: 0,
      transform: 'translateX(100%) scale(0.9)',
    },
    config: {
      tension: 280,
      friction: 20,
    },
  });

  return transitions((style, item) =>
    item ? (
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <AnimatedAlert
          elevation={6}
          variant="filled"
          {...alertProps}
          style={style}
          onClose={onClose}
        >
          {message}
        </AnimatedAlert>
      </Snackbar>
    ) : null
  );
};

export default AnimatedNotification; 