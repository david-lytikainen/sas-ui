import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';

interface DateNote {
  id: string;
  partnerName: string;
  date: Date;
  rating: number;
  interests: string[];
  notes: string;
}

const DateNotes = () => {
  const [notes, setNotes] = useState<DateNote[]>([]);
  const [open, setOpen] = useState(false);
  const [newNote, setNewNote] = useState<Partial<DateNote>>({
    partnerName: '',
    date: new Date(),
    rating: 0,
    interests: [],
    notes: '',
  });
  const [interestInput, setInterestInput] = useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewNote({
      partnerName: '',
      date: new Date(),
      rating: 0,
      interests: [],
      notes: '',
    });
    setInterestInput('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewNote({
      ...newNote,
      [e.target.name]: e.target.value,
    });
  };

  const handleRatingChange = (value: number | null) => {
    setNewNote({
      ...newNote,
      rating: value || 0,
    });
  };

  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      setNewNote({
        ...newNote,
        interests: [...(newNote.interests || []), interestInput.trim()],
      });
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setNewNote({
      ...newNote,
      interests: (newNote.interests || []).filter((i) => i !== interest),
    });
  };

  const handleSubmit = () => {
    if (newNote.partnerName && newNote.notes) {
      const note: DateNote = {
        id: Math.random().toString(36).substr(2, 9),
        partnerName: newNote.partnerName,
        date: newNote.date || new Date(),
        rating: newNote.rating || 0,
        interests: newNote.interests || [],
        notes: newNote.notes,
      };
      setNotes([...notes, note]);
      handleClose();
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Date Notes
          </Typography>
          <Button variant="contained" onClick={handleClickOpen}>
            Add New Note
          </Button>
        </Box>

        <Grid container spacing={3}>
          {notes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {note.partnerName}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {format(note.date, 'PPpp')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Rating value={note.rating} readOnly />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    {note.interests.map((interest) => (
                      <Chip
                        key={interest}
                        label={interest}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2">{note.notes}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Date Note</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="partnerName"
              label="Partner's Name"
              type="text"
              fullWidth
              value={newNote.partnerName}
              onChange={handleChange}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography component="legend">Rating</Typography>
              <Rating
                name="rating"
                value={newNote.rating}
                onChange={(_, value) => handleRatingChange(value)}
              />
            </Box>
            <TextField
              margin="dense"
              label="Add Interests (Press Enter)"
              type="text"
              fullWidth
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={handleInterestKeyPress}
            />
            <Box sx={{ mt: 1, mb: 2 }}>
              {newNote.interests?.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  onDelete={() => handleRemoveInterest(interest)}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
            <TextField
              margin="dense"
              name="notes"
              label="Notes"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={newNote.notes}
              onChange={handleChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Add Note
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DateNotes; 