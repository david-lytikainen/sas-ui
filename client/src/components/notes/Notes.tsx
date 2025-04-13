import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { Note, notesService } from '../../services/notesService';
import { useAuth } from '../../context/AuthContext';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = () => {
    if (!user) return;
    const loadedNotes = notesService.getNotes(String(user.id));
    setNotes(loadedNotes);
  };

  const handleSearch = (query: string) => {
    if (!user) return;
    setSearchQuery(query);
    if (query.trim()) {
      const searchResults = notesService.searchNotes(String(user.id), query);
      setNotes(searchResults);
    } else {
      loadNotes();
    }
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags?.join(', ') || '');
    setDialogOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this note?')) {
      notesService.deleteNote(String(user.id), id);
      loadNotes();
    }
  };

  const handleSaveNote = () => {
    if (!user) return;
    
    const tags = noteTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const noteData = {
      title: noteTitle,
      content: noteContent,
      tags,
    };

    if (editingNote) {
      notesService.updateNote(String(user.id), editingNote.id, noteData);
    } else {
      notesService.saveNote(String(user.id), noteData);
    }

    setDialogOpen(false);
    loadNotes();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notes
        </Typography>
        <TextField
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List>
        {notes.map((note) => (
          <Paper
            key={note.id}
            elevation={2}
            sx={{ mb: 2, p: 2, backgroundColor: theme.palette.background.paper }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{note.title}</Typography>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    mb: 2,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {note.content}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {note.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      icon={<LabelIcon />}
                      sx={{ backgroundColor: theme.palette.primary.main + '20' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Last updated: {formatDate(note.updatedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleEditNote(note)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteNote(note.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        ))}
      </List>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleAddNote}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingNote ? 'Edit Note' : 'New Note'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Content"
            multiline
            rows={4}
            fullWidth
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Tags (comma-separated)"
            fullWidth
            value={noteTags}
            onChange={(e) => setNoteTags(e.target.value)}
            placeholder="tag1, tag2, tag3"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveNote}
            variant="contained"
            disabled={!noteTitle.trim() || !noteContent.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notes; 