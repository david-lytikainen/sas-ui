import { useAuth } from '../context/AuthContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  userId: string;
}

const getStorageKey = (userId: string) => `sas_ui_notes_${userId}`;

export const notesService = {
  getNotes: (userId: string): Note[] => {
    const notes = localStorage.getItem(getStorageKey(userId));
    return notes ? JSON.parse(notes) : [];
  },

  saveNote: (userId: string, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Note => {
    const notes = notesService.getNotes(userId);
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId,
    };
    
    notes.push(newNote);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(notes));
    return newNote;
  },

  updateNote: (userId: string, id: string, updates: Partial<Note>): Note | null => {
    const notes = notesService.getNotes(userId);
    const noteIndex = notes.findIndex(note => note.id === id && note.userId === userId);
    
    if (noteIndex === -1) return null;
    
    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      userId,
    };
    
    notes[noteIndex] = updatedNote;
    localStorage.setItem(getStorageKey(userId), JSON.stringify(notes));
    return updatedNote;
  },

  deleteNote: (userId: string, id: string): boolean => {
    const notes = notesService.getNotes(userId);
    const filteredNotes = notes.filter(note => !(note.id === id && note.userId === userId));
    
    if (filteredNotes.length === notes.length) return false;
    
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filteredNotes));
    return true;
  },

  searchNotes: (userId: string, query: string): Note[] => {
    const notes = notesService.getNotes(userId);
    const searchTerm = query.toLowerCase();
    
    return notes.filter(note => 
      note.userId === userId && (
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );
  }
}; 