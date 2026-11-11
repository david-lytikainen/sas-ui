import React, { useEffect, useRef, useState } from 'react';

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
    { src: '/images/photo3.avif', alt: 'Saved and Single event venue' },
    { src: '/images/photo2.avif', alt: 'Speakers at a Saved and Single event' },
    { src: '/images/photo5.avif', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/photo4.avif', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/photo1.avif', alt: 'Food selection at the 2024 Saved and Single event' },
  ];

  // Auto-advance carousel
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const swipeStartX = useRef<number | null>(null);
  const handleSwipeEnd = (endX: number) => {
    const startX = swipeStartX.current;
    swipeStartX.current = null;
    if (startX === null || isTransitioning || Math.abs(endX - startX) < 50) return;

    setIsTransitioning(true);
    setCurrentImageIndex((current) => endX > startX ? (current - 1 + images.length) % images.length : (current + 1) % images.length);
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
      <div className="container py-4 mb-5">
        <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm" onPointerDown={(event) => { swipeStartX.current = event.clientX; }} onPointerUp={(event) => handleSwipeEnd(event.clientX)} onPointerCancel={() => { swipeStartX.current = null; }} style={{ touchAction: 'pan-y' }}>
          {images.map((image, index) => (
            <img key={image.src} src={image.src} alt={image.alt} aria-hidden={index !== currentImageIndex} className={`object-fit-cover fade ${index === currentImageIndex ? 'show z-2' : 'z-1'}`} style={{ transitionDuration: '0.8s' }} />
          ))}
        </div>
        <div className="d-flex justify-content-center">
          {images.map((_, index) => (
            <button key={index} type="button" className={`btn btn-link ${currentImageIndex === index ? 'text-primary' : 'text-body-secondary'}`} disabled={isTransitioning} onClick={() => { setCurrentImageIndex(index); setIsTransitioning(true); setTimeout(() => setIsTransitioning(false), 500); }} >
              <i className="fa-solid fa-circle fa-xs" />
            </button>
          ))}
        </div>
      </div>
      <div className="bg-body-secondary py-5 mb-5 text-center border-top">
        <h2 className="text-primary mb-4">Why Saved & Single?</h2>
        <p className="text-body-secondary mb-0"> Tired of endless swiping? Saved & Single hosts speed-dating events for Christian singles to connect authentically, in person. </p>
      </div>
    </div>
  );
};

export default LandingPage;
