import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CheckInIcon,
  People as ParticipantsIcon,
} from '@mui/icons-material';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import CheckInManagement from './CheckInManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Participant {
  id: string;
  name: string;
  age: number;
  gender: string;
  church: string;
  checkedIn: boolean;
}

interface Match {
  round: number;
  male: Participant;
  female: Participant;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const EventManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isOrganizer } = useAuth();
  const { getEventById } = useEvents();
  const [event, setEvent] = useState(getEventById(id!));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (id) {
      loadCheckedInParticipants();
      loadEventMatches();
    }
  }, [id]);

  const loadCheckedInParticipants = async () => {
    try {
      const data = await eventsApi.getCheckedInParticipants(id!);
      setParticipants(data);
    } catch (err: any) {
      setError('Failed to load participants');
    }
  };

  const loadEventMatches = async () => {
    try {
      const data = await eventsApi.getEventMatches(id!);
      setMatches(data);
    } catch (err: any) {
      // Ignore if no matches exist yet
    }
  };

  const handleRunMatching = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await eventsApi.runMatching(id!);
      setMatches(data);
      setSuccess('Successfully generated matches!');
      setTabValue(1); // Switch to matches tab
    } catch (err: any) {
      setError(err.message || 'Failed to run matching algorithm');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (participantId: string) => {
    try {
      await eventsApi.checkInParticipant(id!, participantId);
      await loadCheckedInParticipants();
      setSuccess('Participant checked in successfully');
    } catch (err: any) {
      setError('Failed to check in participant');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!event || !user || (!isAdmin() && !isOrganizer())) {
    return (
      <Container>
        <Typography>You don't have permission to manage this event.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Event: {event.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label="Check-in" />
              <Tab label="Matching" />
              <Tab label="Results" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Event Overview
            </Typography>
            {/* Add event overview content */}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CheckInManagement eventId={id || ''} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Matching Management
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRunMatching}
                disabled={loading || participants.length < 2}
                startIcon={loading ? <CircularProgress size={20} /> : <StartIcon />}
              >
                Run Matching Algorithm
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Church</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.age}</TableCell>
                      <TableCell>{participant.gender}</TableCell>
                      <TableCell>{participant.church}</TableCell>
                      <TableCell>
                        <Chip
                          label={participant.checkedIn ? 'Checked In' : 'Not Checked In'}
                          color={participant.checkedIn ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {!participant.checkedIn && (
                          <Button
                            startIcon={<CheckInIcon />}
                            onClick={() => handleCheckIn(participant.id)}
                          >
                            Check In
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Event Results
            </Typography>
            {matches.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Round</TableCell>
                      <TableCell>Male Participant</TableCell>
                      <TableCell>Female Participant</TableCell>
                      <TableCell>Age Difference</TableCell>
                      <TableCell>Same Church</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matches.map((match, index) => (
                      <TableRow key={index}>
                        <TableCell>{match.round}</TableCell>
                        <TableCell>{match.male.name}</TableCell>
                        <TableCell>{match.female.name}</TableCell>
                        <TableCell>
                          {Math.abs(match.male.age - match.female.age)} years
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={match.male.church === match.female.church ? 'Yes' : 'No'}
                            color={match.male.church === match.female.church ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No matches generated yet. Run the matching algorithm to create matches.</Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default EventManagement; 