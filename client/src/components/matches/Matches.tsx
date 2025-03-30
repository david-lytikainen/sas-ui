import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert } from '@mui/material';
import api from '../../services/api';

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

const Matches: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventsWithMatches, setEventsWithMatches] = useState<EventWithMatches[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await api.get<MatchesResponse>('/api/matches');
        if (response.data.success) {
          setEventsWithMatches(response.data.events);
        } else {
          setError(response.data.error || 'Failed to fetch matches');
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (eventsWithMatches.length === 0) {
    return (
      <Box m={2}>
        <Alert severity="info">No matches found. Keep participating in events to find your matches!</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Your Matches
      </Typography>
      {eventsWithMatches.map((event) => (
        <Box key={event.id} mb={4}>
          <Typography variant="h5" gutterBottom>
            {event.name} - {event.date}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            {event.match_count} {event.match_count === 1 ? 'Match' : 'Matches'}
          </Typography>
          <Grid container spacing={3}>
            {event.matches.map((match) => (
              <Grid item xs={12} sm={6} md={4} key={match.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {match.matched_user.name}
                    </Typography>
                    <Typography color="textSecondary">
                      Table: {match.matched_user.table_number}
                    </Typography>
                    <Typography color="textSecondary">
                      Round: {match.matched_user.round_number}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default Matches; 