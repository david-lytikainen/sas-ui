import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { useSpring, animated, useTrail } from '@react-spring/web';

interface SplashScreenProps {
  type: 'login' | 'logout';
}

const SplashScreen: React.FC<SplashScreenProps> = ({ type }) => {
  const theme = useTheme();
  
  const message = type === 'login' 
    ? 'Saved & Single'
    : 'Goodbye :)';

  const chars = useMemo(() => message.split(''), [message]);
  const trail = useTrail(chars.length, {
    from: { opacity: 0, transform: 'translateY(5px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { 
      tension: 280,
      friction: 14,
      mass: .05,
    },
    delay: 0,
    trail: 0,
  });

  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 50 }
  });

  return (
    <animated.div style={fadeIn}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          backgroundColor: theme.palette.background.default,
          zIndex: 9999,
          pt: '40vh',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          justifyContent: 'center',
          mb: 3,
        }}>
          {trail.map((style, index) => (
            <animated.span
              key={index}
              style={{
                ...style,
                display: 'inline-block',
                color: theme.palette.primary.main,
                fontSize: '2.5rem',
                fontWeight: 600,
                marginRight: chars[index] === ' ' ? '0.5em' : '0.1em',
                fontFamily: theme.typography.h3.fontFamily,
              }}
            >
              {chars[index]}
            </animated.span>
          ))}
        </Box>
      </Box>
    </animated.div>
  );
};

export default SplashScreen; 