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
  Stack,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Person as PersonIcon,
  Cake as CakeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { animated, useSpring } from '@react-spring/web';

const AnimatedCard = animated(Card);

interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  church?: string;
}

interface Match {
  id: string;
  male: Participant;
  female: Participant;
  event: {
    id: string;
    name: string;
    date?: string;
  };
  compatibility_score: number;
  notes?: string;
}

export const Matches = () => {
  const { user, isAdmin } = useAuth();
  const theme = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    config: { tension: 280, friction: 20 },
  });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await getMockMatches();
        setMatches(response);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    fetchMatches();
  }, []);

  const getMockMatches = async (): Promise<Match[]> => {
    return Promise.resolve([
      {
        id: 'match1',
        male: {
          id: 'male1',
          name: 'Jamie FitzGerald',
          email: 'jamie@example.com',
          phone: '(555) 123-4567',
          age: 28,
          church: 'First Presbyterian Church',
        },
        female: {
          id: 'female1',
          name: 'Laura Josuweit',
          email: 'laura@example.com',
          phone: '(555) 987-6543',
          age: 26,
          church: 'Grace Community Church',
        },
        event: {
          id: 'event1',
          name: 'First Presbyterian Church Speed Dating',
          date: '2024-03-08',
        },
        compatibility_score: 85,
        notes: 'Great conversation about travel and shared interest in photography.',
      },
    ]);
  };

  const toggleNotes = (matchId: string) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const getUserMatches = () => {
    if (isAdmin()) {
      return matches;
    }
    return matches.filter(
      match => match.male.id === user?.id || match.female.id === user?.id
    );
  };

  const userMatches = getUserMatches();

  const ParticipantInfo = ({ participant }: { participant: Participant }) => (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Avatar 
        sx={{ 
          width: 48, 
          height: 48,
          bgcolor: theme.palette.primary.main,
          fontSize: '1.25rem',
        }}
      >
        {participant.name.charAt(0)}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">
          {participant.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {participant.church}
        </Typography>
      </Box>
    </Box>
  );

  const ContactInfo = ({ participant }: { participant: Participant }) => (
    <List dense>
      {participant.email && (
        <ListItem>
          <ListItemIcon>
            <EmailIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary={participant.email}
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      )}
      {participant.phone && (
        <ListItem>
          <ListItemIcon>
            <PhoneIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary={participant.phone}
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      )}
      {participant.age && (
        <ListItem>
          <ListItemIcon>
            <CakeIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary={`${participant.age} years old`}
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      )}
    </List>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isAdmin() ? 'All Matches' : 'Your Matches'}
        </Typography>

        {userMatches.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              No Matches Found
            </Typography>
            <Typography color="text.secondary">
              {isAdmin()
                ? 'There are no matches from the event yet.'
                : 'You have no matches from the event yet.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {userMatches.map((match, index) => {
              const matchId = match.id;
              const isExpanded = expandedMatch === matchId;
              const userIsParticipant = match.male.id === user?.id || match.female.id === user?.id;

              return (
                <Grid item xs={12} key={matchId}>
                  <AnimatedCard style={cardSpring}>
                    <CardContent>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        mb: 3
                      }}>
                        <Box>
                          <Typography variant="h5" gutterBottom>
                            Match #{index + 1}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon color="primary" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              {match.event.name}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>

                      <Grid container spacing={3} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <ParticipantInfo participant={match.male} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <ParticipantInfo participant={match.female} />
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => toggleNotes(matchId)}
                          endIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          size="small"
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </Box>

                      <Collapse in={isExpanded}>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mt: 2 }}>
                          {(isAdmin() || userIsParticipant) && (
                            <>
                              <Typography variant="subtitle1" gutterBottom>
                                Contact Information
                              </Typography>
                              <Grid container spacing={3}>
                                {isAdmin() ? (
                                  <>
                                    <Grid item xs={12} md={6}>
                                      <ContactInfo participant={match.male} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <ContactInfo participant={match.female} />
                                    </Grid>
                                  </>
                                ) : (
                                  <Grid item xs={12}>
                                    <ContactInfo 
                                      participant={
                                        user?.id === match.male.id ? match.female : match.male
                                      }
                                    />
                                  </Grid>
                                )}
                              </Grid>
                              
                              {match.notes && (
                                <>
                                  <Divider sx={{ my: 2 }} />
                                  <Typography variant="subtitle1" gutterBottom>
                                    Notes
                                  </Typography>
                                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    {match.notes}
                                  </Typography>
                                </>
                              )}
                            </>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </AnimatedCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Matches; 