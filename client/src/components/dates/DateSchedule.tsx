import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  IconButton,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  InputAdornment,
} from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { format, addMinutes, differenceInSeconds } from 'date-fns';

interface DateMatch {
  round: number;
  tableNumber: number;
  startTime: string;
  male: {
    name: string;
    age: number;
    church: string;
    id: string;
  };
  female: {
    name: string;
    age: number;
    church: string;
    id: string;
  };
  notes?: string;
  response?: boolean;
}

interface EventSettings {
  roundDuration: number;
  totalRounds: number;
  isActive: boolean;
  currentRound: number;
  startTime: Date | null;
  roundStartTime?: Date;
  eventPin?: string;
}

interface Match {
  male: {
    id: string;
    name: string;
  };
  female: {
    id: string;
    name: string;
  };
  maleNotes?: string;
  femaleNotes?: string;
}

const ROLES = {
  ADMIN: { id: 1, name: 'admin', permission_level: 100 },
} as const;

const DateSchedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rounds, setRounds] = useState<DateMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<DateMatch | null>(null);
  const [note, setNote] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEndEventDialog, setShowEndEventDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    roundDuration: 5,
    totalRounds: 10,
    isActive: false,
    currentRound: 0,
    startTime: null,
  });
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [hasEnteredPin, setHasEnteredPin] = useState(false);

  const handleEndEvent = () => {
    setShowEndEventDialog(true);
  };

  // Function to calculate round times based on settings
  const calculateRoundTimes = (baseTime: Date, roundDuration: number, totalRounds: number) => {
    const times: string[] = [];
    let currentTime = baseTime;
    
    for (let i = 0; i < totalRounds; i++) {
      times.push(format(currentTime, 'h:mm a'));
      currentTime = addMinutes(currentTime, roundDuration);
    }
    
    return times;
  };

  // Add timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (eventSettings.isActive && eventSettings.roundStartTime) {
      timer = setInterval(() => {
        const now = new Date();
        if (!eventSettings.roundStartTime) return; // Type guard
        
        const elapsed = differenceInSeconds(now, eventSettings.roundStartTime);
        const remaining = Math.max(0, eventSettings.roundDuration * 60 - elapsed);
        
        setTimeRemaining(remaining);
        setCurrentTime(format(now, 'h:mm:ss a'));

        // Auto-advance to next round when time is up
        if (remaining === 0) {
          if (eventSettings.currentRound < eventSettings.totalRounds) {
            setEventSettings(prev => ({
              ...prev,
              currentRound: prev.currentRound + 1,
              roundStartTime: new Date()
            }));
          } else {
            // Event is complete
            handleEndEvent();
          }
        }
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [eventSettings.isActive, eventSettings.roundStartTime, eventSettings.roundDuration, eventSettings.currentRound, eventSettings.totalRounds]);

  // Generate mock data based on number of rounds
  const generateMockData = (totalRounds: number, startTime: Date | null) => {
    const mockData: DateMatch[] = [];
    const names = {
      male: [
        'Jamie FitzGerald', 'Tyler Donohue', 'Wes Carroll', 'Ray Brookman', 'Micah Beck',
        'Luke Gifford', 'Dan McNulty', 'David Lytikainen', 'Brit Haseltine', 'Joshua Cibik',
        'Greg Pfeifer', 'Ben Szathmary', 'Nathan Abir', 'Andrew Murphy', 'Caleb Miller',
        'Andrew Tierney', 'Michael Whalen', 'Mike Taylor', 'Kyle Winters', 'Daniel Mackowiak'
      ],
      female: [
        'Laura Josuweit', 'Maggie McAndrews', 'Noelle Griest', 'Leigh Boggs', 'Jessica Henry',
        'Amanda Karasch', 'Tabitha Mulholland', 'Kirsten Rasmussen', 'Meredith Vesey', 'Danielle Hanratty',
        'Kori Wilson', 'Annika Soderberg', 'Atlee Lang', 'Lael Houston', 'Vanessa Smiley',
        'Esther Annan', 'Anne Marie Nabintu', 'Ashley Cowen', 'Suzanne Carpenter', 'Rachel Maezano'
      ]
    };

    const roundTimes = startTime ? calculateRoundTimes(startTime, eventSettings.roundDuration, totalRounds) : [];

    for (let round = 1; round <= totalRounds; round++) {
      // Two matches per round (one at each table)
      for (let table = 1; table <= 2; table++) {
        const maleIndex = (round - 1) * 2 + (table - 1);
        const femaleIndex = (round - 1) * 2 + (table - 1);

        // Use modulo to cycle through names if we have more rounds than participants
        const wrappedMaleIndex = maleIndex % names.male.length;
        const wrappedFemaleIndex = femaleIndex % names.female.length;

        mockData.push({
          round,
          tableNumber: table,
          startTime: roundTimes[round - 1] || `${7 + Math.floor((round - 1) / 2)}:${((round - 1) % 2) * 30 || '00'} PM`,
          male: {
            name: names.male[wrappedMaleIndex],
            age: 20 + Math.floor(Math.random() * 20),
            church: `Church ${String.fromCharCode(65 + wrappedMaleIndex)}`,
            id: `male${wrappedMaleIndex + 1}`
          },
          female: {
            name: names.female[wrappedFemaleIndex],
            age: 20 + Math.floor(Math.random() * 20),
            church: `Church ${String.fromCharCode(65 + wrappedFemaleIndex + 20)}`,
            id: `female${wrappedFemaleIndex + 1}`
          }
        });
      }
    }
    return mockData;
  };

  // Update rounds when settings change
  useEffect(() => {
    const newRounds = generateMockData(eventSettings.totalRounds, eventSettings.startTime);
    setRounds(newRounds);
  }, [eventSettings.totalRounds, eventSettings.startTime, eventSettings.roundDuration]);

  const getAgeDifference = (match: DateMatch) => {
    return Math.abs(match.male.age - match.female.age);
  };

  const isSameChurch = (match: DateMatch) => {
    return match.male.church === match.female.church;
  };

  const handleResponse = (round: number, tableNumber: number, response: boolean) => {
    setRounds(prevRounds => 
      prevRounds.map(match => 
        match.round === round && match.tableNumber === tableNumber
          ? { ...match, response }
          : match
      )
    );
  };

  const handleAddNote = (match: DateMatch) => {
    setSelectedMatch(match);
    setNote(match.notes || '');
  };

  const handleSubmitResponses = () => {
    const userMatches = rounds.filter(match => 
      match.male.id === user?.id || match.female.id === user?.id
    );
    
    const hasAllResponses = userMatches.every((match) => match.response !== undefined);
    
    if (!hasAllResponses) {
      setSubmitError('Please respond to all your dates before submitting');
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    // Here you would send the responses to your backend
    console.log('Submitting responses:', rounds);
    setShowConfirmDialog(false);
  };

  const handleStartEvent = () => {
    if (!eventSettings.eventPin) {
      generateEventPin();
    }
    setEventSettings(prev => ({
      ...prev,
      isActive: true,
      currentRound: 1,
      roundStartTime: new Date()
    }));
  };

  const handlePauseEvent = () => {
    setEventSettings(prev => ({
      ...prev,
      isActive: false,
      roundStartTime: undefined
    }));
  };

  const handleUpdateSettings = () => {
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = () => {
    if (!eventSettings.startTime) {
      setSubmitError('Please select a start time for the event');
      return;
    }
    
    // Generate new rounds with updated settings
    const newRounds = generateMockData(eventSettings.totalRounds, eventSettings.startTime);
    setRounds(newRounds);
    setShowSettingsDialog(false);
    setSubmitError(null);
  };

  const calculateMatches = () => {
    const matches: Match[] = [];
    const processedPairs = new Set<string>();

    rounds.forEach(match => {
      // Skip if we've already processed this pair
      const pairKey = `${match.male.id}-${match.female.id}`;
      const reversePairKey = `${match.female.id}-${match.male.id}`;
      
      if (processedPairs.has(pairKey) || processedPairs.has(reversePairKey)) {
        return;
      }

      // Find all interactions between this pair
      const allInteractions = rounds.filter(
        m => (m.male.id === match.male.id && m.female.id === match.female.id) ||
            (m.male.id === match.female.id && m.female.id === match.male.id)
      );

      // Check if both said yes
      const maleResponse = allInteractions.find(m => m.male.id === match.male.id)?.response;
      const femaleResponse = allInteractions.find(m => m.female.id === match.female.id)?.response;

      if (maleResponse && femaleResponse) {
        matches.push({
          male: {
            id: match.male.id,
            name: match.male.name,
          },
          female: {
            id: match.female.id,
            name: match.female.name,
          },
          maleNotes: match.notes,
          femaleNotes: allInteractions.find(m => m.female.id === match.female.id)?.notes,
        });
      }

      processedPairs.add(pairKey);
    });

    return matches;
  };

  const handleConfirmEndEvent = async () => {
    const matches = calculateMatches();
    
    try {
      // Here you would send the matches to your backend
      await saveMatchesToBackend(matches);
      
      setEventSettings(prev => ({
        ...prev,
        isActive: false,
        currentRound: 0,
      }));
      
      setShowEndEventDialog(false);
      navigate('/matches'); // Navigate to matches page
    } catch (error) {
      console.error('Error saving matches:', error);
      setSubmitError('Failed to save matches. Please try again.');
    }
  };

  const saveMatchesToBackend = async (matches: Match[]) => {
    // Mock API call - replace with actual API call
    console.log('Saving matches:', matches);
    return Promise.resolve();
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredRounds = user?.role_id === ROLES.ADMIN.id
    ? rounds 
    : rounds.filter(match => match.male.id === user?.id || match.female.id === user?.id);

  const roundsGrouped = filteredRounds.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, DateMatch[]>);

  // Check if PIN is required when component mounts
  useEffect(() => {
    if (eventSettings.isActive && eventSettings.eventPin && !hasEnteredPin && user?.role_id !== ROLES.ADMIN.id) {
      setShowPinDialog(true);
    }
  }, [eventSettings.isActive, eventSettings.eventPin, hasEnteredPin, user?.role_id]);

  const handlePinSubmit = () => {
    if (pinInput === eventSettings.eventPin) {
      setHasEnteredPin(true);
      setShowPinDialog(false);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  const generateEventPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setEventSettings(prev => ({
      ...prev,
      eventPin: pin
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Speed Dating Schedule
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {user?.role_id === ROLES.ADMIN.id && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleUpdateSettings}
                  sx={{ minWidth: 150 }}
                >
                  Event Settings
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={eventSettings.isActive ? handlePauseEvent : handleStartEvent}
                  startIcon={eventSettings.isActive ? <PauseIcon /> : <PlayArrowIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {eventSettings.isActive ? 'Pause Event' : 'Start Event'}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleEndEvent}
                  startIcon={<StopIcon />}
                  sx={{ minWidth: 150 }}
                >
                  End Event
                </Button>
              </>
            )}
            {user?.role_id !== ROLES.ADMIN.id && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitResponses}
                sx={{ minWidth: 200 }}
              >
                Submit My Responses
              </Button>
            )}
          </Box>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {eventSettings.isActive && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                Current Round: {eventSettings.currentRound} of {eventSettings.totalRounds}
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography>
                  Current Time: {currentTime}
                </Typography>
                <Typography>
                  Time Remaining: {formatTimeRemaining(timeRemaining)}
                </Typography>
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(timeRemaining / (eventSettings.roundDuration * 60)) * 100}
              sx={{ mt: 1 }}
            />
          </Alert>
        )}

        {user?.role_id === ROLES.ADMIN.id && eventSettings.eventPin && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                Event PIN: {eventSettings.eventPin}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={generateEventPin}
              >
                Generate New PIN
              </Button>
            </Box>
          </Alert>
        )}

        {Object.entries(roundsGrouped).map(([round, matches]) => (
          <Box key={round} sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              Round {round} - {matches[0].startTime}
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="10%" align="center">Table</TableCell>
                    <TableCell width="25%">Male</TableCell>
                    <TableCell width="25%">Female</TableCell>
                    <TableCell width="15%" align="center">Response</TableCell>
                    <TableCell width="25%">Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matches.map((match: DateMatch) => (
                    <TableRow key={`${match.round}-${match.tableNumber}`}>
                      <TableCell align="center">{match.tableNumber}</TableCell>
                      <TableCell>{match.male.name}</TableCell>
                      <TableCell>{match.female.name}</TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
                        <ButtonGroup 
                          size="small" 
                          sx={{ 
                            '& .MuiButton-root': {
                              minWidth: '60px',
                              px: 2
                            }
                          }}
                        >
                          <Button
                            variant={match.response === true ? "contained" : "outlined"}
                            color="success"
                            onClick={() => handleResponse(match.round, match.tableNumber, true)}
                          >
                            Yes
                          </Button>
                          <Button
                            variant={match.response === false ? "contained" : "outlined"}
                            color="error"
                            onClick={() => handleResponse(match.round, match.tableNumber, false)}
                          >
                            No
                          </Button>
                        </ButtonGroup>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small"
                            multiline
                            maxRows={2}
                            value={match.notes || ''}
                            onChange={(e) => {
                              const updatedRounds = rounds.map((r) =>
                                r.round === match.round && r.tableNumber === match.tableNumber
                                  ? { ...r, notes: e.target.value }
                                  : r
                              );
                              setRounds(updatedRounds);
                            }}
                            placeholder="Add notes..."
                            sx={{ flex: 1 }}
                          />
                          <Tooltip title="Add/Edit Notes">
                            <IconButton
                              size="small"
                              onClick={() => handleAddNote(match)}
                              color="primary"
                            >
                              <NoteAddIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
          <DialogTitle>Submit Responses</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit your responses? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showEndEventDialog} onClose={() => setShowEndEventDialog(false)}>
          <DialogTitle>End Event</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to end the event? This will:
            </Typography>
            <Box component="ul" sx={{ mt: 1 }}>
              <li>Stop all current rounds</li>
              <li>Calculate final matches</li>
              <li>Make matches available to participants</li>
            </Box>
            <Typography color="error" sx={{ mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEndEventDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmEndEvent} variant="contained" color="error">
              End Event
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)}>
          <DialogTitle>Event Settings</DialogTitle>
          <DialogContent>
            <Box sx={{ width: 400, pt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Event Start Time"
                  value={eventSettings.startTime}
                  onChange={(newValue) => 
                    setEventSettings(prev => ({ ...prev, startTime: newValue }))
                  }
                  sx={{ mb: 3, width: '100%' }}
                />
              </LocalizationProvider>

              <Typography gutterBottom>Round Duration (minutes)</Typography>
              <Slider
                value={eventSettings.roundDuration}
                onChange={(_, value) => 
                  setEventSettings(prev => ({ ...prev, roundDuration: value as number }))
                }
                min={3}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
              
              <Typography gutterBottom sx={{ mt: 3 }}>Total Rounds</Typography>
              <Slider
                value={eventSettings.totalRounds}
                onChange={(_, value) => 
                  setEventSettings(prev => ({ ...prev, totalRounds: value as number }))
                }
                min={5}
                max={20}
                step={1}
                marks
                valueLabelDisplay="auto"
              />

              {submitError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {submitError}
                </Alert>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Event Schedule Preview:
                </Typography>
                {eventSettings.startTime && (
                  <List dense>
                    {calculateRoundTimes(
                      eventSettings.startTime, 
                      eventSettings.roundDuration,
                      eventSettings.totalRounds
                    ).map((time, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Round ${index + 1}`}
                          secondary={time}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSettingsDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} variant="contained" color="primary">
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add PIN Dialog */}
        <Dialog open={showPinDialog} onClose={() => {}} disableEscapeKeyDown>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon />
              Enter Event PIN
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography gutterBottom>
                Please enter the PIN provided by the event administrator to access your schedule.
              </Typography>
              <TextField
                autoFocus
                fullWidth
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                error={!!pinError}
                helperText={pinError}
                placeholder="Enter 4-digit PIN"
                inputProps={{
                  maxLength: 4,
                  pattern: '[0-9]*',
                  inputMode: 'numeric',
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPin(!showPin)}
                        edge="end"
                      >
                        {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pinInput.length === 4) {
                    handlePinSubmit();
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={handlePinSubmit}
              disabled={pinInput.length !== 4}
              fullWidth
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DateSchedule; 