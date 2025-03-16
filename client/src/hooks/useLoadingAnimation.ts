import { useSpring } from '@react-spring/web';

interface LoadingAnimationConfig {
  isLoading: boolean;
  duration?: number;
}

export const useLoadingAnimation = ({
  isLoading,
  duration = 1000
}: LoadingAnimationConfig) => {
  const springProps = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: async (next) => {
      while (isLoading) {
        await next({ transform: 'scale(1.1)', opacity: 0.7 });
        await next({ transform: 'scale(0.9)', opacity: 0.5 });
      }
      await next({ transform: 'scale(1)', opacity: 1 });
    },
    config: {
      duration,
    },
  });

  return springProps;
};

export default useLoadingAnimation; 