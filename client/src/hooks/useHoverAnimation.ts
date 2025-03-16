import { useSpring, SpringConfig } from '@react-spring/web';
import { useState } from 'react';

interface HoverConfig {
  scale?: number;
  rotation?: number;
  lift?: number;
  config?: SpringConfig;
}

export const useHoverAnimation = (config: HoverConfig = {}) => {
  const {
    scale = 1.05,
    rotation = 0,
    lift = 5,
    config: springConfig = {
      tension: 300,
      friction: 10,
    },
  } = config;

  const [isHovered, setIsHovered] = useState(false);

  const springProps = useSpring({
    transform: isHovered
      ? `scale(${scale}) rotate(${rotation}deg) translateY(-${lift}px)`
      : 'scale(1) rotate(0deg) translateY(0px)',
    config: springConfig,
  });

  const bind = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { springProps, bind };
};

export default useHoverAnimation; 