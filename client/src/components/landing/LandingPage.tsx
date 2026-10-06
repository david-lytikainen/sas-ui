import React, { useState, useEffect } from 'react';

const LandingPage: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fullText = 'Meet Your Match, In Faith.';
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    if (typedLength >= fullText.length) return;
    const speed = typedLength === 17 ? 400 : 55;
    const timeout = setTimeout(() => setTypedLength((prev) => prev + 1), speed);
    return () => clearTimeout(timeout);
  }, [fullText.length, typedLength]);

  const displayedText = fullText.slice(0, typedLength);

  const images = [
    { src: '/images/event-photo-1.jpg', alt: 'Saved and Single event venue' },
    { src: '/images/event-photo-2.jpg', alt: 'Speakers at a Saved and Single event' },
    { src: '/images/event-photo-3.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-4.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-5.jpg', alt: 'Food selection at the 2024 Saved and Single event' },
  ];

  // Auto-advance carousel
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning) handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isTransitioning]);

  return (
    <div>
      <div className="container text-center mt-4">
        <h1 className="h2 fw-bold text-primary">Saved & Single</h1>
        <h2 className="h4 fw-bold">{displayedText || '\u00A0'}</h2>
      </div>
      <div className="container py-4">
        <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
          {images.map((image, index) => (
            <img key={image.src} src={image.src} alt={image.alt} aria-hidden={index !== currentImageIndex} className={`object-fit-cover fade ${index === currentImageIndex ? 'show z-2' : 'z-1'}`} style={{ transitionDuration: '0.8s' }} />
          ))}
        </div>
        <div className="d-flex justify-content-center mt-2 gap-1" role="group" aria-label="Event photos">
          {images.map((_, index) => (
            <button key={index} type="button" className={`btn btn-link ${currentImageIndex === index ? 'text-primary' : 'text-body-secondary'}`} aria-label={`Show photo ${index + 1}`} aria-pressed={currentImageIndex === index} disabled={isTransitioning} onClick={() => { setCurrentImageIndex(index); setIsTransitioning(true); setTimeout(() => setIsTransitioning(false), 500); }} >
              <i className="fa-solid fa-circle small" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className="bg-body-tertiary py-5 text-center">
        <div className="container content-medium">
          <h2 className="text-primary mb-4">Why Saved & Single?</h2>
          <p className="text-body-secondary mb-0"> Tired of endless swiping? Saved & Single hosts speed-dating events for Christian singles to connect authentically, in person. </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
