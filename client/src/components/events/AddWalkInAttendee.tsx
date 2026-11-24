import Modal from '../common/Modal';
import { useEffect, useState } from 'react';
import type { Event } from '../../types/event';
import { eventsApi } from '../../services/api';

interface WalkInUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AddWalkInAttendeeProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const AddWalkInAttendee = ({ open, event, onClose }: AddWalkInAttendeeProps) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<WalkInUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<WalkInUser | null>(null);
  const [addedFirstName, setAddedFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setUsers([]);
    setSelectedUser(null);
    setAddedFirstName(null);
    setErrorMessage(null);
  }, [open, event]);

  useEffect(() => {
    if (!open || !event || !search.trim()) {
      setUsers([]);
      return;
    }
    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const results = await eventsApi.searchWalkInUsers(event.id.toString(), search);
        if (active) setUsers(results);
      } catch (error: any) {
        if (active) setErrorMessage(error.message || 'Failed to search users');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [event, open, search]);

  const addSelectedUser = async () => {
    if (!event || !selectedUser) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      const result = await eventsApi.addWalkInAttendee(event.id.toString(), selectedUser.id);
      setAddedFirstName(result.first_name);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to add walk-in attendee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} open={open}>
      <div className="modal-header fw-semibold">Add Walk-in Attendee</div>
      <div className="modal-body overflow-y-auto">
        {errorMessage && <div role="alert" className="mb-3 alert alert-danger">{errorMessage}</div>}
        {addedFirstName ? (
          <div className="py-1">
            <div className="w-100 text-center">
              <i className="fa-solid fa-circle-check text-success fs-2 mb-1" />
            </div>
            <ol>
              <li>Tell the attendee to refresh their page</li>
              <li>Have them Sign up for the event</li>
              <li>Remember to check them in!</li>
            </ol>
          </div>
        ) : (
          <>
            <label className="d-block">
              <span className="form-label">Search for a user by name</span>
              <input className="form-control" value={search} onChange={(change) => { setSearch(change.target.value); setSelectedUser(null); setErrorMessage(null); }} placeholder="Search for a user by name" autoComplete="off" />
            </label>
            {search.trim() && (
              <div className="list-group mt-2" role="listbox" aria-label="Matching users">
                {users.map((candidate) => (
                  <button type="button" role="option" aria-selected={selectedUser?.id === candidate.id} key={candidate.id} onClick={() => setSelectedUser(candidate)} className={`list-group-item list-group-item-action text-start ${selectedUser?.id === candidate.id ? 'active' : ''}`}>
                    {candidate.first_name} {candidate.last_name} ({candidate.email})
                  </button>
                ))}
                {loading && <div className="list-group-item text-body-secondary">Searching…</div>}
                {!loading && users.length === 0 && <div className="list-group-item text-body-secondary">No matching users found.</div>}
              </div>
            )}
          </>
        )}
      </div>
      <div className="modal-footer d-flex flex-column flex-sm-row">
        <button type="button" onClick={onClose} className="btn btn-link w-100">{addedFirstName ? 'Done' : 'Cancel'}</button>
        {!addedFirstName && <button type="button" onClick={addSelectedUser} disabled={!selectedUser || saving} className="btn btn-primary w-100">{saving ? 'Adding…' : selectedUser ? `Let ${selectedUser.first_name} Sign up` : 'Select a user'}</button>}
      </div>
    </Modal>
  );
};

export default AddWalkInAttendee;
