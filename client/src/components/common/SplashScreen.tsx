import React, { useMemo } from 'react';
import { animated, useTrail } from '@react-spring/web';

interface SplashScreenProps {
  type: 'login' | 'logout';
}

const SplashScreen: React.FC<SplashScreenProps> = ({ type }) => {
  const message = type === 'login' ? 'Saved & Single' : 'Goodbye 🙂';

  const chars = useMemo(() => Array.from(message), [message]);
  const trail = useTrail(chars.length, {
    from: { opacity: 0, transform: 'translateY(0px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: {
      tension: 400,
      friction: 17,
      mass: 0.5,
    },
    delay: 0,
    trail: 0,
  });

  return (
    <div className="splash position-fixed top-0 start-0 w-100 h-100 bg-body text-center">
      {trail.map((style, index) => (
        <animated.span key={index} className="d-inline-block text-primary fs-1 fw-semibold" style={{ ...style, marginRight: chars[index] === ' ' ? '0.25em' : '0' }} > {chars[index]} </animated.span>
      ))}
    </div>
  );
};

export default SplashScreen;
