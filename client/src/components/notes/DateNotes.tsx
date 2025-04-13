import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface DateNote {
  id: string;
  eventId: string;
  eventName: string;
  participantId: string;
  participantName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const DateNotes: React.FC = () => {
  const [notes, setNotes] = useState<DateNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<DateNote | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedNote, setEditedNote] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      // Mock data - replace with actual API call
      const mockNotes: DateNote[] = [
      ];
      setNotes(mockNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleEditNote = (note: DateNote) => {
    setSelectedNote(note);
    setEditedNote(note.notes);
    setIsEditDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    try {
      // Mock API call - replace with actual API call
      const updatedNote = {
        ...selectedNote,
        notes: editedNote,
        updatedAt: new Date().toISOString(),
      };

      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === selectedNote.id ? updatedNote : note
        )
      );

      setIsEditDialogOpen(false);
      setSelectedNote(null);
      setEditedNote('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      // Mock API call - replace with actual API call
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Date Notes
        </Typography>

        {notes.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              No Notes Found
            </Typography>
            <Typography color="text.secondary">
              You haven't made any notes yet from your speed dating events.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {notes.map((note) => (
              <Grid item xs={12} key={note.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {note.eventName}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Date: {formatDate(note.createdAt)}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Participant: {note.participantName}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton onClick={() => handleEditNote(note)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteNote(note.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {note.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Note</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DateNotes; 