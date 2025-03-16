import React from 'react';
import { useTrail, animated, config } from '@react-spring/web';

interface AnimatedListProps {
  items: React.ReactNode[];
  delay?: number;
  trail?: number;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  delay = 0,
  trail = 100,
}) => {
  const trails = useTrail(items.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay,
    config: config.gentle,
  });

  return (
    <>
      {trails.map((props, index) => (
        <animated.div key={index} style={props}>
          {items[index]}
        </animated.div>
      ))}
    </>
  );
};

export default AnimatedList; 