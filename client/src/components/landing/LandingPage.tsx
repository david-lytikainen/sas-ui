import React, { createContext, useState, useMemo, useEffect, CSSProperties } from 'react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorMode = useMemo(() => ({ toggleColorMode: () => {} }), []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#1976d2',
          },
        },
      }),
    [],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fullText = 'Meet Your Match, In Faith.';
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    if (typedLength >= fullText.length) return;
    const speed = typedLength === 17 ? 400 : 55;
    const timeout = setTimeout(() => setTypedLength(prev => prev + 1), speed);
    return () => clearTimeout(timeout);
  }, [fullText.length, typedLength]);

  const displayedText = fullText.slice(0, typedLength);

  const theme = useTheme();

  const images = [
    { src: '/images/event-photo-1.jpg', alt: 'Saved and Single event venue' },
    { src: '/images/event-photo-2.jpg', alt: 'Speakers at a Saved and Single event' },
    { src: '/images/event-photo-3.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-4.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-5.jpg', alt: 'Food selection at the 2024 Saved and Single event' },
    { src: '/images/event-photo-6.jpg', alt: 'Speakers at a Saved and Single event' },
  ];

  // Auto-advance carousel
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % images.length
    );
    setTimeout(() => setIsTransitioning(false), 800);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning) handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isTransitioning]);

  const getImageStyle = (index: number): CSSProperties => {
    const isCurrent = index === currentImageIndex;
    const isNext = index === (currentImageIndex + 1) % images.length;
    const isPrev = index === (currentImageIndex - 1 + images.length) % images.length;

    let opacity = 0;
    let zIndex = 0;

    if (isCurrent) {
      opacity = 1;
      zIndex = 2;
    } else if (isNext || isPrev) {
      opacity = 0;
      zIndex = 1;
    }

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity,
      zIndex,
      transition: 'opacity 0.8s ease-in-out',
    };
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default' }}> 
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 2, pt: 0 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            textAlign: 'center', 
            mb: 0.5, 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Saved & Single
        </Typography>
        <Box sx={{ minHeight: '2.4em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography 
            variant="h5" 
            component="h5"  
            sx={{ 
              fontWeight: 700, 
              letterSpacing: '0.01em',
              textAlign: 'center',
              my: 0
            }}
          >
            {displayedText || '\u00A0'}
          </Typography>
        </Box>
        {!user && (
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 1,
              px: 2,
              py: 1.25,
              borderRadius: '999px',
              bgcolor: 'rgba(25, 118, 210, 0.14)',
              border: '1px solid rgba(25, 118, 210, 0.4)',
              color: 'text.primary',
              maxWidth: 360,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Sign in above to attend or organize events.
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                top: -13,
                right: { xs: 48, sm: 28 },
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '14px solid rgba(25, 118, 210, 0.4)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 2,
                  left: -9,
                  width: 0,
                  height: 0,
                  borderLeft: '9px solid transparent',
                  borderRight: '9px solid transparent',
                  borderBottom: '12px solid rgba(18, 18, 18, 0.96)',
                },
              }}
            />
          </Box>
        )}
      </Container>

      {/* Photos Carousel Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 5 } }}>
        <Box sx={{ position: 'relative', maxWidth: '1000px', mx: 'auto' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden', 
              aspectRatio: '16/9',
              position: 'relative',
              bgcolor: 'grey.100'
            }}
          >
            {images.map((image, index) => (
              <img 
                key={index}
                src={image.src} 
                alt={image.alt} 
                style={getImageStyle(index)}
              />
            ))}
          </Paper>
          {/* Image Indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
            {images.map((_, index) => (
              <Box
                key={index}
                onClick={() => {
                  if (!isTransitioning) {
                    setCurrentImageIndex(index);
                    setIsTransitioning(true);
                    setTimeout(() => setIsTransitioning(false), 500);
                  }
                }}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: currentImageIndex === index ? 'primary.main' : 'grey.300',
                  cursor: isTransitioning ? 'default' : 'pointer',
                  transition: 'background-color 0.3s',
                  opacity: isTransitioning ? 0.5 : 1
                }}
              />
            ))}
          </Box>
        </Box>
      </Container>

      {/* About Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            align="center" 
            sx={{ 
              fontWeight: 600, 
              mb: 4, 
              color: theme.palette.primary.main,
              fontSize: { xs: '1.75rem', sm: '2.125rem' }
            }}
          >
            Why Saved & Single?
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              fontSize: { xs: '0.95rem', sm: '1.1rem' }, 
              textAlign: 'center' 
            }}
          >
            Tired of endless swiping? Saved & Single hosts speed-dating events for Christian singles to connect authentically, in person.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
