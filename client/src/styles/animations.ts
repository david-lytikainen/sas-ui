export const fadeInUp = (element: Element) => {
  return element.animate(
    [
      { 
        opacity: 0, 
        transform: 'translateY(20px)',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      { 
        opacity: 1, 
        transform: 'translateY(0)',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    ],
    {
      duration: 500,
      fill: 'forwards'
    }
  );
};

export const scaleIn = (element: Element) => {
  return element.animate(
    [
      { 
        opacity: 0, 
        transform: 'scale(0.95)',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      { 
        opacity: 1, 
        transform: 'scale(1)',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    ],
    {
      duration: 400,
      fill: 'forwards'
    }
  );
};

export const slideInRight = (element: Element) => {
  return element.animate(
    [
      { 
        opacity: 0, 
        transform: 'translateX(30px)',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      { 
        opacity: 1, 
        transform: 'translateX(0)',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    ],
    {
      duration: 450,
      fill: 'forwards'
    }
  );
};

export const buttonPop = (element: Element) => {
  return element.animate(
    [
      { transform: 'scale(0.95)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' }
    ],
    {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  );
}; 