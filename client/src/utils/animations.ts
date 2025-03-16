import { config } from '@react-spring/web';

export const fadeIn = {
  from: { opacity: 0, transform: 'translateY(20px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
  config: { tension: 280, friction: 20 }
};

export const slideIn = {
  from: { transform: 'translateX(-100%)' },
  enter: { transform: 'translateX(0%)' },
  leave: { transform: 'translateX(100%)' },
  config: config.gentle
};

export const scaleIn = {
  from: { transform: 'scale(0.8)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
  config: { tension: 200, friction: 20 }
};

export const bounceTransition = {
  from: { transform: 'scale(0.3)', opacity: 0 },
  enter: { transform: 'scale(1)', opacity: 1 },
  leave: { transform: 'scale(0)', opacity: 0 },
  config: { tension: 180, friction: 12 }
};

export const pageTransition = {
  from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
  enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
  leave: { opacity: 0, transform: 'translate3d(-50%,0,0)' },
  config: { duration: 300 }
};

export const listAnimation = {
  from: { transform: 'translateY(40px)', opacity: 0 },
  enter: { transform: 'translateY(0px)', opacity: 1 },
  leave: { transform: 'translateY(20px)', opacity: 0 },
  trail: 100, // Delay between each item
  config: { mass: 1, tension: 280, friction: 20 }
};

export const hoverScale = {
  scale: 1,
  config: {
    mass: 1,
    tension: 170,
    friction: 26
  }
};

export const buttonClick = {
  from: { transform: 'scale(1)' },
  to: async (next: any) => {
    await next({ transform: 'scale(0.95)' });
    await next({ transform: 'scale(1)' });
  },
  config: { tension: 300, friction: 10 }
};

export const notificationSlide = {
  from: { transform: 'translateX(100%)', opacity: 0 },
  enter: { transform: 'translateX(0)', opacity: 1 },
  leave: { transform: 'translateX(100%)', opacity: 0 },
  config: { tension: 200, friction: 20 }
}; 