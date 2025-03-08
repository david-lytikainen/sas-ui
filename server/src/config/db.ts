import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

type Schema = {
  users: Array<{
    _id: string;
    name: string;
    email: string;
    password: string;
    birthday: string;
    church: string;
    gender: 'M' | 'F';
  }>;
  dateEvents: Array<{
    _id: string;
    round: number;
    male: string;
    female: string;
    eventDate: string;
    maleResponse: boolean | null;
    femaleResponse: boolean | null;
    isMatch: boolean | null;
  }>;
  dateNotes: Array<{
    _id: string;
    dateEvent: string;
    user: string;
    notes: string;
    privateRating: number;
    interests: string[];
    redFlags: string[];
  }>;
}

const adapter = new FileSync<Schema>(path.join(__dirname, '../../data/db.json'));
const db = low(adapter);

// Set defaults (required if JSON file is empty)
db.defaults({
  users: [],
  dateEvents: [],
  dateNotes: []
}).write();

export default db;
