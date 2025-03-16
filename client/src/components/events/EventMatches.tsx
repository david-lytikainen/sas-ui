import { useState, useEffect, ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Church as ChurchIcon,
  Cake as AgeIcon,
  Star as StarIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';

interface Match {
  id: string;
  eventId: string;
  participant1Id: string;
  participant2Id: string;
  compatibilityScore: number;
  createdAt: string;
  mutualInterests?: string[];
  compatibilityDetails?: {
    values: number;
    interests: number;
    goals: number;
  };
}

interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  church?: string;
  denomination?: string;
  interests?: string[];
}

type SortOption = 'compatibility' | 'age' | 'name';
type FilterOption = 'all' | 'highMatch' | 'sameChurch';

const EventMatches = (): ReactElement => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [sortBy, setSortBy] = useState<SortOption>('compatibility');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const matchesData: Match[] = await eventsApi.getEventMatches(eventId);
        
        // Add mock mutual interests and compatibility details
        const enhancedMatches = matchesData.map(match => ({
          ...match,
          mutualInterests: [
            'Faith',
            'Family',
            'Travel',
            'Music',
            'Sports',
            'Reading',
            'Cooking',
          ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 2),
          compatibilityDetails: {
            values: Math.floor(Math.random() * 40) + 60,
            interests: Math.floor(Math.random() * 40) + 60,
            goals: Math.floor(Math.random() * 40) + 60,
          },
        }));
        
        setMatches(enhancedMatches);
        
        // Fetch participant details for each match
        const participantIds = new Set<string>();
        matchesData.forEach((match: Match) => {
          participantIds.add(match.participant1Id);
          participantIds.add(match.participant2Id);
        });
        
        // In a real app, we would fetch participant details here
        // For now, we'll create mock data
        const participantsMap: Record<string, Participant> = {};
        const denominations = ['Baptist', 'Non-denominational', 'Presbyterian', 'Methodist'];
        const interests = [
          'Faith',
          'Family',
          'Travel',
          'Music',
          'Sports',
          'Reading',
          'Cooking',
          'Photography',
          'Hiking',
          'Art',
        ];
        
        Array.from(participantIds).forEach(id => {
          participantsMap[id] = {
            id: id,
            user_id: id,
            first_name: id === user?.id ? 'You' : `Partner ${id.substring(0, 4)}`,
            last_name: id === user?.id ? '' : `${id.substring(4, 8)}`,
            age: 25 + Math.floor(Math.random() * 15),
            church: ['First Baptist', 'Grace Community', 'Hillsong', 'Calvary Chapel'][Math.floor(Math.random() * 4)],
            denomination: denominations[Math.floor(Math.random() * denominations.length)],
            interests: interests.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 3),
          };
        });
        
        setParticipants(participantsMap);
      } catch (error: any) {
        setError(error.message || 'Failed to load matches');
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [eventId, user?.id]);

  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortBy(event.target.value as SortOption);
  };

  const handleFilterChange = (event: SelectChangeEvent<FilterOption>) => {
    setFilterBy(event.target.value as FilterOption);
  };

  const sortMatches = (matches: Match[]) => {
    return [...matches].sort((a, b) => {
      const partnerA = participants[a.participant1Id === user?.id ? a.participant2Id : a.participant1Id];
      const partnerB = participants[b.participant1Id === user?.id ? b.participant2Id : b.participant1Id];
      
      switch (sortBy) {
        case 'compatibility':
          return b.compatibilityScore - a.compatibilityScore;
        case 'age':
          return (partnerA.age || 0) - (partnerB.age || 0);
        case 'name':
          return partnerA.first_name.localeCompare(partnerB.first_name);
        default:
          return 0;
      }
    });
  };

  const filterMatches = (matches: Match[]) => {
    return matches.filter(match => {
      const partner = participants[match.participant1Id === user?.id ? match.participant2Id : match.participant1Id];
      
      switch (filterBy) {
        case 'highMatch':
          return match.compatibilityScore >= 80;
        case 'sameChurch':
          return partner.church === participants[user?.id || '']?.church;
        default:
          return true;
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (matches.length === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.05)' 
            : 'rgba(0,0,0,0.02)',
          borderRadius: 2,
        }}
      >
        <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Matches Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Once the event is complete, you'll see your matches here. We'll analyze your conversations
          and preferences to help you find meaningful connections.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            What to expect:
          </Typography>
          <Stack spacing={1} alignItems="center">
            <Chip icon={<StarIcon />} label="Compatibility Scores" size="small" />
            <Chip icon={<HeartIcon />} label="Mutual Interests" size="small" />
            <Chip icon={<ChurchIcon />} label="Faith Details" size="small" />
          </Stack>
        </Box>
      </Paper>
    );
  }

  const filteredAndSortedMatches = sortMatches(filterMatches(matches));

  return (
    <Box>
      {/* Filters and Sorting */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={handleSortChange}
          >
            <MenuItem value="compatibility">Compatibility</MenuItem>
            <MenuItem value="age">Age</MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterBy}
            label="Filter"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">All Matches</MenuItem>
            <MenuItem value="highMatch">High Compatibility (80%+)</MenuItem>
            <MenuItem value="sameChurch">Same Church</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredAndSortedMatches.map((match) => {
          const partnerId = match.participant1Id === user?.id 
            ? match.participant2Id 
            : match.participant1Id;
          const partner = participants[partnerId];
          
          if (!partner) return null;
          
          return (
            <Grid item xs={12} md={6} key={match.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 56, 
                        height: 56,
                        bgcolor: 'primary.main',
                      }}
                    >
                      {partner.first_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {`${partner.first_name} ${partner.last_name}`.trim()}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AgeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {partner.age} years
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChurchIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {partner.church}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Compatibility Details */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Compatibility Breakdown
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary">
                            {match.compatibilityDetails?.values}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Values
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary">
                            {match.compatibilityDetails?.interests}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Interests
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary">
                            {match.compatibilityDetails?.goals}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Goals
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Mutual Interests */}
                  {match.mutualInterests && match.mutualInterests.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mutual Interests
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {match.mutualInterests.map((interest, index) => (
                          <Chip
                            key={index}
                            label={interest}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Overall Compatibility
                    </Typography>
                    <Tooltip title={`${match.compatibilityScore}% Match`}>
                      <Typography variant="h6" color="primary">
                        {match.compatibilityScore}%
                      </Typography>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default EventMatches;