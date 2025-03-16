import React from 'react';
import { useTransition, animated } from '@react-spring/web';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  const transitions = useTransition(location, {
    from: { 
      opacity: 0,
      transform: 'translate3d(0,20px,0) scale(0.98)',
      filter: 'blur(8px)',
      willChange: 'transform, opacity, filter'
    },
    enter: { 
      opacity: 1,
      transform: 'translate3d(0,0,0) scale(1)',
      filter: 'blur(0px)',
    },
    leave: { 
      opacity: 0,
      transform: 'translate3d(0,-20px,0) scale(0.96)',
      filter: 'blur(8px)',
      position: 'absolute',
      width: '100%',
      top: 0,
    },
    config: { 
      tension: 280,
      friction: 20,
      mass: 0.9,
      duration: 300
    },
    onRest: () => {
      window.scrollTo(0, 0);
    }
  });

  return transitions((style, item) => (
    <animated.div 
      style={{
        ...style,
        width: '100%',
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      {item.pathname === location.pathname && children}
    </animated.div>
  ));
};

export default PageTransition; 