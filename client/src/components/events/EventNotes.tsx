import React, { useState, useEffect, ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Fab,
  Paper,
  MenuItem,
  FormHelperText,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Create as CreateIcon,
  Lightbulb as TipIcon,
  FormatQuote as QuoteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';

interface Note {
  id: string;
  eventId: string;
  userId: string;
  partnerId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
}

const NOTE_PROMPTS = [
  "What did you find most interesting about them?",
  "What common interests did you discover?",
  "What made you laugh or smile during your conversation?",
  "What would you like to learn more about them?",
  "What values or beliefs did you connect on?",
];

const MAX_NOTE_LENGTH = 1000;

const EventNotes = (): ReactElement => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!eventId || !user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const notesData: Note[] = await eventsApi.getEventNotes(eventId);
        setNotes(notesData);
        
        // Fetch participant details for each note
        const participantIds = new Set<string>();
        notesData.forEach((note: Note) => {
          participantIds.add(note.partnerId);
        });
        
        // In a real app, we would fetch participant details here
        // For now, we'll create mock data
        const participantsMap: Record<string, Participant> = {};
        Array.from(participantIds).forEach(id => {
          participantsMap[id] = {
            id: id,
            user_id: id,
            first_name: `Partner ${id.substring(0, 4)}`,
            last_name: `${id.substring(4, 8)}`,
          };
        });
        
        setParticipants(participantsMap);
      } catch (error: any) {
        setError(error.message || 'Failed to load notes');
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [eventId, user]);

  const handleEditClick = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) return;
      
      await eventsApi.saveNote(eventId, noteToUpdate.partnerId, editContent);
      
      setNotes(notes.map(note =>
        note.id === noteId
          ? { ...note, content: editContent, updatedAt: new Date().toISOString() }
          : note
      ));
      
      setEditingNoteId(null);
      setEditContent('');
      setSuccess('Note updated successfully');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (noteId: string) => {
    setDeleteNoteId(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteNoteId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await eventsApi.deleteNote(deleteNoteId);
      
      setNotes(notes.filter(note => note.id !== deleteNoteId));
      setDeleteDialogOpen(false);
      setDeleteNoteId(null);
      setSuccess('Note deleted successfully');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (): Promise<void> => {
    if (!eventId || !selectedPartnerId || !newNoteContent.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const savedNote = await eventsApi.saveNote(eventId, selectedPartnerId, newNoteContent);
      if (savedNote) {
        setNotes(prevNotes => [...prevNotes, savedNote]);
        setAddNoteDialogOpen(false);
        setSelectedPartnerId(null);
        setNewNoteContent('');
        setSuccess('Note saved successfully');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setNewNoteContent(prev => {
      const newContent = prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`;
      return newContent.slice(0, MAX_NOTE_LENGTH);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && notes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && notes.length === 0) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Your Notes</Typography>
        <Tooltip title="Add a new note">
          <Fab
            color="primary"
            size="small"
            onClick={() => setAddNoteDialogOpen(true)}
            disabled={loading}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>
      
      {notes.length === 0 ? (
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
          <CreateIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start Taking Notes
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Keep track of your speed dating experience by taking notes about each person you meet.
            Your notes are private and only visible to you.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddNoteDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Add Your First Note
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    {participants[note.partnerId] 
                      ? `${participants[note.partnerId].first_name} ${participants[note.partnerId].last_name}` 
                      : 'Unknown Partner'}
                  </Typography>
                  <Box>
                    <Tooltip title="Edit note">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(note)}
                        sx={{ mr: 1 }}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete note">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(note.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {editingNoteId === note.id ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      multiline
                      rows={4}
                      value={editContent}
                      onChange={(e) => {
                        const newValue = e.target.value.slice(0, MAX_NOTE_LENGTH);
                        setEditContent(newValue);
                      }}
                      fullWidth
                      disabled={loading}
                      helperText={`${editContent.length}/${MAX_NOTE_LENGTH} characters`}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={() => setEditingNoteId(null)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={loading}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {formatDate(note.updatedAt)}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={loading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addNoteDialogOpen}
        onClose={() => setAddNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Note</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">
              Add a note about one of your speed dating partners:
            </Typography>
            
            <TextField
              select
              label="Select Partner"
              value={selectedPartnerId || ''}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              fullWidth
            >
              <MenuItem value="" disabled>Select a partner</MenuItem>
              {Object.values(participants).map((partner) => (
                <MenuItem key={partner.id} value={partner.id}>
                  {`${partner.first_name} ${partner.last_name}`}
                </MenuItem>
              ))}
            </TextField>
            
            <Box>
              <TextField
                label="Your Notes"
                multiline
                rows={4}
                value={newNoteContent}
                onChange={(e) => {
                  const newValue = e.target.value.slice(0, MAX_NOTE_LENGTH);
                  setNewNoteContent(newValue);
                }}
                fullWidth
              />
              <FormHelperText>
                {`${newNoteContent.length}/${MAX_NOTE_LENGTH} characters`}
              </FormHelperText>
            </Box>

            <Box>
              <Button
                startIcon={showPrompts ? <TipIcon /> : <TipIcon />}
                onClick={() => setShowPrompts(!showPrompts)}
                size="small"
                sx={{ mb: 1 }}
              >
                {showPrompts ? 'Hide Writing Prompts' : 'Show Writing Prompts'}
              </Button>
              
              {showPrompts && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Writing Prompts
                  </Typography>
                  <List dense>
                    {NOTE_PROMPTS.map((prompt, index) => (
                      <ListItem
                        key={index}
                        button
                        onClick={() => handlePromptClick(prompt)}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <QuoteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={prompt}
                          primaryTypographyProps={{
                            variant: 'body2',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNoteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveNote} 
            variant="contained" 
            color="primary"
            disabled={loading || !selectedPartnerId || !newNoteContent.trim()}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventNotes; 