import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Avatar,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  ExpandMore as ExpandMoreIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { animated, useSpring } from '@react-spring/web';

const AnimatedCard = animated(Card);

interface MatchedUser {
  id: string;
  name: string;
  table_number: number;
  round_number: number;
}

interface Match {
  id: string;
  matched_user: MatchedUser;
}

interface EventWithMatches {
  id: string;
  name: string;
  date: string;
  match_count: number;
  matches: Match[];
}

interface MatchesResponse {
  success: boolean;
  events: EventWithMatches[];
  error?: string;
}

const AttendeeMatches = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [eventMatches, setEventMatches] = useState<EventWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    config: { tension: 280, friction: 20 },
  });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await api.get<MatchesResponse>('/api/matches');
        
        if (response.data.success) {
          setEventMatches(response.data.events);
        } else {
          console.error('API error:', response.data.error);
          setEventMatches([]);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
        setEventMatches([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMatches();
    }
  }, [user]);

  const toggleMatchDetails = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  const ParticipantInfo = ({ match }: { match: Match }) => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Avatar 
        sx={{ 
          width: 48, 
          height: 48,
          bgcolor: theme.palette.primary.main,
          fontSize: '1.25rem',
        }}
      >
        {match.matched_user.name.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">
          {match.matched_user.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Table {match.matched_user.table_number}, Round {match.matched_user.round_number}
        </Typography>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Matches
          </Typography>
          <Alert severity="info">
            Please log in to view your matches.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (eventMatches.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Matches
          </Typography>
          <Alert severity="info">
            <Typography variant="body1" gutterBottom>
              Hi there! You don't have any matches at the moment.
            </Typography>
            <Typography variant="body2">
              To find matches:
              <ul>
                <li>Register for upcoming speed dating events</li>
                <li>Attend the events and meet new people</li>
                <li>Mark your interest in the people you meet</li>
                <li>When there's mutual interest, they'll appear here!</li>
              </ul>
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Matches
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Here are your matches from events you've attended
        </Typography>

        {eventMatches.map((eventMatch) => (
          <Accordion key={eventMatch.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" />
                <Typography variant="h6">
                  {eventMatch.name}
                </Typography>
                <Chip 
                  label={eventMatch.date} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
                <Chip 
                  label={`${eventMatch.match_count} ${eventMatch.match_count === 1 ? 'Match' : 'Matches'}`} 
                  color="primary"
                  size="small" 
                  sx={{ ml: 1 }} 
                  icon={<FavoriteIcon />}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {eventMatch.matches.map((match) => (
                  <Grid item xs={12} md={6} key={match.id}>
                    <AnimatedCard style={cardSpring}>
                      <CardContent>
                        <ParticipantInfo match={match} />
                        
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => toggleMatchDetails(match.id)}
                            endIcon={expandedMatchId === match.id ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
                            fullWidth
                          >
                            {expandedMatchId === match.id ? 'Hide Details' : 'Show Details'}
                          </Button>
                        </Box>
                        
                        <Collapse in={expandedMatchId === match.id}>
                          <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                              Match Details
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemIcon>
                                  <EventIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={`Table ${match.matched_user.table_number}`}
                                  secondary={`Round ${match.matched_user.round_number}`}
                                />
                              </ListItem>
                            </List>
                          </Box>
                        </Collapse>
                      </CardContent>
                    </AnimatedCard>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
};

export default AttendeeMatches; 