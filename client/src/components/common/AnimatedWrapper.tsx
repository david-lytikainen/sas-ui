import React from 'react';
import { animated, useSpring } from '@react-spring/web';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounce';
  delay?: number;
  style?: React.CSSProperties;
}

const animations = {
  fadeIn: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideIn: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0%)' },
  },
  scaleIn: {
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  bounce: {
    from: { transform: 'scale(0.3)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
};

const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  style = {},
}) => {
  const springProps = useSpring({
    ...animations[animation],
    delay,
    config: {
      tension: 280,
      friction: 20,
    },
  });

  return (
    <animated.div style={{ ...springProps, ...style }}>
      {children}
    </animated.div>
  );
};

export default AnimatedWrapper; 