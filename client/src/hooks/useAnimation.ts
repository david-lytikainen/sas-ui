import { useRef, useEffect } from 'react';
import { fadeInUp, scaleIn, slideInRight, buttonPop } from '../styles/animations';

type AnimationType = 'fadeInUp' | 'scaleIn' | 'slideInRight' | 'buttonPop';

export const useAnimation = (type: AnimationType = 'fadeInUp') => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            switch (type) {
              case 'fadeInUp':
                fadeInUp(element);
                break;
              case 'scaleIn':
                scaleIn(element);
                break;
              case 'slideInRight':
                slideInRight(element);
                break;
              case 'buttonPop':
                buttonPop(element);
                break;
            }
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [type]);

  return elementRef;
}; 