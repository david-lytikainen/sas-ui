import { useTrail, config } from '@react-spring/web';

interface ListAnimationConfig {
  items: any[];
  delay?: number;
  trail?: number;
  from?: object;
  to?: object;
}

export const useListAnimation = ({
  items,
  delay = 0,
  trail = 100,
  from = { opacity: 0, transform: 'translateY(20px)' },
  to = { opacity: 1, transform: 'translateY(0px)' }
}: ListAnimationConfig) => {
  const trails = useTrail(items.length, {
    from,
    to,
    delay,
    config: { ...config.gentle, tension: 280, friction: 20 },
  });

  return trails;
};

export default useListAnimation; 