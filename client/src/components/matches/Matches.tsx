import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  IconButton,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ChurchIcon from '@mui/icons-material/Church';
import CakeIcon from '@mui/icons-material/Cake';
import { useAuth } from '../../context/AuthContext';

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
  };
  compatibility_score: number;
  notes?: string;
}

export const Matches = () => {
  const { user, isAdmin } = useAuth();
  const theme = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  useEffect(() => {
    // Mock API call to get matches
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
    // Mock data - replace with actual API call
    return Promise.resolve([
      {
        id: 'match1',
        male: {
          id: 'male1',
          name: 'Jamie FitzGerald',
          email: 'jamie@example.com',
          phone: '(555) 123-4567',
          age: 28,
          church: 'First Presbyterian Church'
        },
        female: {
          id: 'female1',
          name: 'Laura Josuweit',
          email: 'laura@example.com',
          phone: '(555) 987-6543',
          age: 26,
          church: 'Grace Community Church'
        },
        event: {
          id: 'event1',
          name: 'First Presbyterian Church',
        },
        compatibility_score: 85,
        notes: 'Great conversation about travel',
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

  const ContactInfo = ({ participant }: { participant: Participant }) => (
    <List dense>
      {participant.email && (
        <ListItem>
          <ListItemIcon>
            <EmailIcon />
          </ListItemIcon>
          <ListItemText primary="Email" secondary={participant.email} />
        </ListItem>
      )}
      {participant.phone && (
        <ListItem>
          <ListItemIcon>
            <PhoneIcon />
          </ListItemIcon>
          <ListItemText primary="Phone" secondary={participant.phone} />
        </ListItem>
      )}
      {participant.church && (
        <ListItem>
          <ListItemIcon>
            <ChurchIcon />
          </ListItemIcon>
          <ListItemText primary="Church" secondary={participant.church} />
        </ListItem>
      )}
      {participant.age && (
        <ListItem>
          <ListItemIcon>
            <CakeIcon />
          </ListItemIcon>
          <ListItemText primary="Age" secondary={participant.age} />
        </ListItem>
      )}
    </List>
  );

  return (
    <Container>
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
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          Match #{index + 1}
                        </Typography>
                        {(isAdmin() || userIsParticipant) && (
                          <IconButton
                            onClick={() => toggleNotes(matchId)}
                            aria-label="show details"
                          >
                            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>
                          <strong>Male:</strong> {match.male.name}
                        </Typography>
                        <Typography>
                          <strong>Female:</strong> {match.female.name}
                        </Typography>
                      </Box>

                      <Collapse in={isExpanded}>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mt: 2 }}>
                          {isAdmin() ? (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Male Participant
                              </Typography>
                              <ContactInfo participant={match.male} />
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                Female Participant
                              </Typography>
                              <ContactInfo participant={match.female} />
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle2" gutterBottom>
                                Notes:
                              </Typography>
                              <Typography color="text.secondary" paragraph>
                                {match.notes || 'No notes'}
                              </Typography>
                            </>
                          ) : userIsParticipant && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Contact Information
                              </Typography>
                              <ContactInfo 
                                participant={
                                  user?.id === match.male.id ? match.female : match.male
                                }
                              />
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle2" gutterBottom>
                                Notes:
                              </Typography>
                              <Typography color="text.secondary" paragraph>
                                {match.notes || 'No notes'}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
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