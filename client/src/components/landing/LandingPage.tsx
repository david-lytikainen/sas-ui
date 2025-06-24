import React, { createContext, useState, useMemo, useEffect, CSSProperties, useRef } from 'react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';

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

  // Typewriter animation state
  const fullText = 'Meet Your Match, In Faith.';
  const [displayedText, setDisplayedText] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const answerRef = useRef<HTMLDivElement>(null);

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

  const faqs = [
    {
      question: "What should I expect at a Saved & Single event?",
      answer: "Expect a fun, relaxed atmosphere at a beautiful venue where you'll meet other single Christians. The night includes structured speed dating, mingling, and refreshments. Our goal is to make it easy and enjoyable to make new connections.",
    },
    {
      question: "What should I bring with me?",
      answer: "Just bring yourself, a positive attitude, and your smartphone! Your phone will be used with our web app to see your schedule for the night and select your matches. Everything else is provided.",
    },
    {
      question: "How do I use the app during the event?",
      answer: "Upon arrival, you'll check in and get access to the event within the app. It will show you your schedule and where to go for each round. After each date, you'll use the app to  indicate if you're interested in the person you just met.",
    },
    {
      question: "How many dates will I go on?",
      answer: "The number of dates depends on the number of attendees at each event, but we aim for everyone to have between 10 and 15 meaningful conversations.",
    },
    {
      question: "How many rounds are there and how long is each one?",
      answer: "Typically, there are 10-15 rounds, with each date lasting about 3-4 minutes.",
    },
    {
      question: "Why is there a cost to attend?",
      answer: "The ticket price helps us cover the costs of venue, refreshments, staffing, event insurance, cleaning, and the development of the app that makes the event run smoothly.",
    },
  ];

  const images = [
    { src: '/images/event-photo-1.jpg', alt: 'Saved and Single event venue' },
    { src: '/images/event-photo-2.jpg', alt: 'Speakers at a Saved and Single event' },
    { src: '/images/event-photo-3.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-4.jpg', alt: 'Guests mingling at a Saved and Single event' },
    { src: '/images/event-photo-5.jpg', alt: 'Food selection at the 2024 Saved and Single event' },
    { src: '/images/event-photo-6.jpg', alt: 'Speakers at a Saved and Single event' },
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, );

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % images.length
    );
    setTimeout(() => setIsTransitioning(false), 800);
  };

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
            border: 'none', 
            background: 'none',
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

      {/* Q&A Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
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
            Frequently Asked Questions
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4}, minHeight: { xs: 'auto', md: 220 } }}>
            {/* Left side - Questions */}
            <Grid container spacing={2} sx={{ flex: 3, alignContent: 'flex-start' }}>
              {faqs.map((faq, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Button
                    fullWidth
                    onClick={() => {
                      setActiveFaq(index);
                      if (isMobile && answerRef.current) {
                        setTimeout(() => {
                          answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 50);
                      }
                    }}
                    onMouseEnter={() => setActiveFaq(index)}
                    sx={{
                      height: '100%',
                      justifyContent: 'flex-start',
                      p: 2,
                      textAlign: 'left',
                      color: activeFaq === index ? 'primary.main' : 'text.primary',
                      backgroundColor: activeFaq === index ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                      textTransform: 'none',
                      fontWeight: activeFaq === index ? 600 : 400,
                      borderRadius: 3,
                    }}
                  >
                    {faq.question}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {/* Right side - Answer */}
            <Box ref={answerRef} sx={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  flexGrow: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden', 
                  borderRadius: 3,
                }}
                key={activeFaq}
                className="scale-in"
              >
                <Typography variant="h6" component="h3" sx={{ mb: 1.5, color: 'primary.main', flexShrink: 0 }}>
                  {faqs[activeFaq].question}
                </Typography>
                <Box sx={{ overflowY: 'auto', pr: 1,
                    '::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.divider,
                        borderRadius: '4px',
                    }
                }}>
                  <Typography color="text.secondary">{faqs[activeFaq].answer}</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;