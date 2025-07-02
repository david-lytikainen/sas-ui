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
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            // purple in light mode, blue in dark mode
            main: mode === 'dark' ? '#1976d2' : '#6200ea',
          },
        },
      }),
    [mode],
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
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  // Typewriter animation state
  const fullText = 'Meet Your Match, In Faith.';
  const [displayedText, setDisplayedText] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer for video animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === 'video-section') {
            setIsVideoVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the video is visible
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    const videoSection = document.getElementById('video-section');
    if (videoSection) {
      observer.observe(videoSection);
    }

    return () => {
      if (videoSection) {
        observer.unobserve(videoSection);
      }
    };
  }, []);

  // Handle video play/pause
  const toggleVideoPlayback = () => {
    if (videoRef) {
      if (isVideoPlaying) {
        videoRef.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.play();
        setIsVideoPlaying(true);
      }
    }
  };

  useEffect(() => {
    if (typeIndex < fullText.length) {
      let speed = 55;
      if (typeIndex === 17) {
        speed = 400;
      }
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, typeIndex + 1));
        setTypeIndex(typeIndex + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [typeIndex, fullText]);

  const theme = useTheme();

  const images = [
    { src: '/images/event-photo-1.jpg', alt: 'Saved and Single event venue' },
    { src: '/images/event-photo-2.jpg', alt: 'Speakers at a Saved and Single event' },
    { src: '/images/event-photo-3.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-4.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-5.jpg', alt: 'Food selection at the 2024 Saved and Single event' },
    { src: '/images/event-photo-6.jpg', alt: 'Speakers at a Saved and Single event' },
  ];

  // Auto-advance carousel for images section
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % images.length
        );
        setTimeout(() => setIsTransitioning(false), 800);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isTransitioning, images.length]);
  

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
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', width: '100%', textAlign: 'center', minHeight: { xs: '120px', sm: '140px', md: '120px', lg: '120px' }, mb: { xs: 0, md: -10} }}>
          {/* Invisible full text to reserve space */}
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'transparent',
              letterSpacing: '0.01em',
              minHeight: '2.5em',
              userSelect: 'none',
              pointerEvents: 'none',
              visibility: 'hidden',
              position: 'static',
              width: '100%',
              display: 'block',
              whiteSpace: 'normal',
              textAlign: 'center',
            }}
            aria-hidden="true"
          >
            {fullText}
          </Typography>
          {/* Animated text */}
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              letterSpacing: '0.01em',
              minHeight: '2.5em',
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              display: 'block',
              whiteSpace: 'normal',
              textAlign: 'center',
              fontSize: { xs: '3.5rem', sm: '3.75rem' }
            }}
          >
            {displayedText}
          </Typography>
        </Box>
        <Typography 
          variant="h5" 
          component="p" 
          color="text.secondary" 
          sx={{ 
            mb: { xs: 2, sm: 4 }, 
            maxWidth: '750px', 
            mx: 'auto', 
            alignContent: 'center',
            fontSize: { xs: '1rem', sm: '1.5rem' }
          }}
        >
          Tired of endless swiping? Saved & Single hosts cross-church speed-dating events for Christian singles (ages 20-30) in PA, DE, & NJ to connect authentically, in person.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', alignItems: 'center', gap: { xs: 2, sm: 2 } }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={RouterLink} 
            to="/register" 
            sx={{ width: { xs: '80%', sm: 'auto' } }}
          >
            Register for an Event
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large" 
            component={RouterLink} 
            to={user ? '/events' : '/login'}
            sx={{ width: { xs: '80%', sm: 'auto' } }}
          >
            {user ? 'Go to Events' : 'Member Login'}
          </Button>
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
            Christian dating can be wild. Online dating might lead to exhaustion or dead ends and it can be challenging to meet other Christians outside of your church community. Saved and Single is a cross-church speed-dating event that helps Christian singles from PA, DE, and NJ intentionally connect in person at a stunning private barn in Berwyn, PA.
          </Typography>
        </Container>
      </Box>

             {/* Enhanced Video Section */}
       <Box 
         id="video-section"
         sx={{ 
           py: { xs: 6, md: 10 },
           background: '#fafafa',
           position: 'relative',
           overflow: 'hidden'
         }}
       >
                 {/* Decorative background elements */}
         <Box
           sx={{
             position: 'absolute',
             top: -50,
             left: -50,
             width: 200,
             height: 200,
             borderRadius: '50%',
             background: theme.palette.mode === 'dark'
               ? 'linear-gradient(45deg, rgba(98, 0, 234, 0.2), rgba(25, 118, 210, 0.2))'
               : 'linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))',
             animation: 'float 6s ease-in-out infinite',
             '@keyframes float': {
               '0%, 100%': { transform: 'translateY(0px)' },
               '50%': { transform: 'translateY(-20px)' }
             }
           }}
         />
         <Box
           sx={{
             position: 'absolute',
             bottom: -30,
             right: -30,
             width: 150,
             height: 150,
             borderRadius: '50%',
             background: theme.palette.mode === 'dark'
               ? 'linear-gradient(45deg, rgba(25, 118, 210, 0.2), rgba(98, 0, 234, 0.2))'
               : 'linear-gradient(45deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
             animation: 'float 8s ease-in-out infinite reverse',
           }}
         />

        <Container maxWidth="lg">
          {/* Section Title */}
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            sx={{ 
              fontWeight: 600, 
              mb: { xs: 3, md: 5 }, 
              color: theme.palette.primary.main,
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              opacity: isVideoVisible ? 1 : 0,
              transform: isVideoVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out'
            }}
          >
            Experience Saved & Single 2025 
          </Typography>

          <Box 
            sx={{ 
              position: 'relative', 
              maxWidth: '900px', 
              mx: 'auto',
              transform: isVideoVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
              opacity: isVideoVisible ? 1 : 0,
              transition: 'all 1s ease-out 0.2s'
            }}
          >
                         <Paper 
               elevation={isVideoHovered ? 20 : 8}
               onMouseEnter={() => setIsVideoHovered(true)}
               onMouseLeave={() => setIsVideoHovered(false)}
               onClick={toggleVideoPlayback}
               sx={{ 
                 borderRadius: { xs: 2, md: 3 }, 
                 overflow: 'hidden', 
                 aspectRatio: isMobile ? '9/16' : '16/9',
                 position: 'relative',
                 bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                 cursor: 'pointer',
                 transform: isVideoHovered ? 'scale(1.02)' : 'scale(1)',
                 transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                 '&::before': {
                   content: '""',
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   right: 0,
                   bottom: 0,
                   background: isVideoHovered 
                     ? theme.palette.mode === 'dark'
                       ? 'linear-gradient(45deg, rgba(98, 0, 234, 0.15), rgba(25, 118, 210, 0.15))'
                       : 'linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))'
                     : 'transparent',
                   zIndex: 1,
                   transition: 'background 0.4s ease',
                   pointerEvents: 'none'
                 }
               }}
             >
                             {/* Video */}
               <video
                 ref={(el) => setVideoRef(el)}
                 autoPlay
                 muted
                 loop
                 playsInline
                 onLoadedData={() => setVideoLoaded(true)}
                 onPlay={() => setIsVideoPlaying(true)}
                 onPause={() => setIsVideoPlaying(false)}
                 style={{
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   width: '100%',
                   height: '100%',
                   objectFit: 'cover',
                   opacity: videoLoaded ? 1 : 0,
                   transition: 'opacity 0.8s ease-in-out',
                   filter: isVideoHovered ? 'brightness(1.1) contrast(1.05)' : 'brightness(1) contrast(1)',
                 }}
               >
                 <source 
                   src={isMobile ? "/Saved and Single Vertical.mp4" : "/Saved and Single Horizontal.mp4"} 
                   type="video/mp4" 
                 />
                 Your browser does not support the video tag.
               </video>
              
              {/* Fallback image while video loads */}
              {!videoLoaded && (
                <img
                  src="/images/event-photo-1.jpg"
                  alt="Saved and Single event"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}

                             {/* Loading indicator */}
               {!videoLoaded && (
                 <Box
                   sx={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: 'translate(-50%, -50%)',
                     zIndex: 2,
                     color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.600'
                   }}
                 >
                   <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
                     Loading video...
                   </Typography>
                 </Box>
               )}

               {/* Hover overlay with play/pause icon */}
               <Box
                 sx={{
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   right: 0,
                   bottom: 0,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   background: isVideoHovered 
                     ? theme.palette.mode === 'dark' 
                       ? 'rgba(0, 0, 0, 0.5)' 
                       : 'rgba(0, 0, 0, 0.3)'
                     : 'transparent',
                   opacity: isVideoHovered ? 1 : 0,
                   transition: 'all 0.3s ease',
                   zIndex: 2,
                   pointerEvents: 'none'
                 }}
               >
                 <Box
                   sx={{
                     width: 80,
                     height: 80,
                     borderRadius: '50%',
                     background: theme.palette.mode === 'dark' 
                       ? 'rgba(255, 255, 255, 0.15)'
                       : 'rgba(255, 255, 255, 0.9)',
                     border: theme.palette.mode === 'dark' 
                       ? '2px solid rgba(255, 255, 255, 0.3)'
                       : 'none',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     transform: isVideoHovered ? 'scale(1)' : 'scale(0.8)',
                     transition: 'transform 0.3s ease',
                     backdropFilter: 'blur(10px)'
                   }}
                 >
                   {isVideoPlaying ? (
                     // Pause icon
                     <Box sx={{ display: 'flex', gap: '4px' }}>
                       <Box
                         sx={{
                           width: '6px',
                           height: '20px',
                           backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#6200ea',
                           borderRadius: '1px'
                         }}
                       />
                       <Box
                         sx={{
                           width: '6px',
                           height: '20px',
                           backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#6200ea',
                           borderRadius: '1px'
                         }}
                       />
                     </Box>
                   ) : (
                     // Play icon
                     <Box
                       sx={{
                         width: 0,
                         height: 0,
                         borderLeft: `20px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#6200ea'}`,
                         borderTop: '12px solid transparent',
                         borderBottom: '12px solid transparent',
                         marginLeft: '4px'
                       }}
                     />
                   )}
                 </Box>
               </Box>
            </Paper>

            {/* Video description */}
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mt: 3,
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                maxWidth: '600px',
                mx: 'auto',
                opacity: isVideoVisible ? 1 : 0,
                transform: isVideoVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease-out 0.4s'
              }}
            >
              Catch the highlights of the 2025 event and the dating experience. 
              
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Photos Carousel Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
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
          Glimpses From Our 2024 Event
        </Typography>
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
    </Box>
  );
};

export default LandingPage;