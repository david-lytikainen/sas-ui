import Modal from '../common/Modal';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatUTCToLocal } from '../../utils/date';
import { downloadCsv } from '../../utils/download';

interface ViewWaitlistedUsersProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewWaitlistedUsers = ({ open, event, onClose }: ViewWaitlistedUsersProps) => {
  const { user, isAdmin, isOrganizer } = useAuth();
  const [waitlistedUsers, setWaitlistedUsers] = useState<any[]>([]);
  const [filteredWaitlistedUsers, setFilteredWaitlistedUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canManageUsers = isAdmin() || (isOrganizer() && !!event && Number(event.creator_id) === Number(user?.id));

  useEffect(() => {
    if (!open || !event) return;

    const fetchWaitlistedUsers = async () => {
      try {
        setSearchTerm('');
        setErrorMessage(null);

        const response = await eventsApi.getEventWaitlist(event.id.toString());
        const sortedData = [...response.data].sort((a, b) => {
          if (!a.waitlisted_at) return -1;
          if (!b.waitlisted_at) return 1;
          return new Date(a.waitlisted_at).getTime() - new Date(b.waitlisted_at).getTime();
        });

        setWaitlistedUsers(sortedData);
        setFilteredWaitlistedUsers(sortedData);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch event waitlist');
      }
    };

    fetchWaitlistedUsers();
  }, [open, event]);

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);

    if (!value || value.trim() === '') {
      setFilteredWaitlistedUsers([...waitlistedUsers]);
      return;
    }

    const searchWords = value
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const filtered = waitlistedUsers.filter((user) => {
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.last_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      return searchWords.every((word) => firstName.startsWith(word) || lastName.startsWith(word) || email.startsWith(word));
    });

    setFilteredWaitlistedUsers(filtered);
  };

  const handleExport = () => {
    const usersToExport = searchTerm.trim() ? filteredWaitlistedUsers : waitlistedUsers;
    if (!event || usersToExport.length === 0) {
      setErrorMessage('No waitlisted users available to export.');
      return;
    }

    try {
      let csvContent = 'Name,Email,Gender,Age,Birthday,Waitlisted At\n';
      usersToExport.forEach((user) => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const waitlistedAt = user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A';
        csvContent += `"${user.name}","${user.email}",${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${waitlistedAt}\n`;
      });

      downloadCsv(csvContent, `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${searchTerm.trim() ? 'filtered_waitlist' : 'waitlist'}.csv`);
    } catch (error) {
      setErrorMessage('Failed to export waitlisted users.');
    }
  };

  return (
    <Modal onClose={onClose} size="xl" open={open}>
      <div className="modal-header fw-semibold">{event?.name} - Waitlisted Users</div>
      <div className="p-0 p-sm-2 modal-body">
        {errorMessage && (
          <div role="alert" className="mb-3 alert alert-danger alert-dismissible">
            {errorMessage}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setErrorMessage(null)} />
          </div>
        )}
        {waitlistedUsers.length > 0 ? (
          <>
            <div className="mb-3 px-2 px-sm-0">
              <div className="my-2 w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Search Waitlist'}</span>
                  <span className="input-group">
                    {<span className="text-body-secondary me-2">🔍</span>}
                    <input className="form-control" placeholder={'Search by name or email...'} value={searchTerm} onChange={handleSearchChange} />
                  </span>
                </label>
              </div>
            </div>
            <p className="text-body-secondary mb-2 px-2 px-sm-0 small"> Showing {filteredWaitlistedUsers.length} of {waitlistedUsers.length} users on waitlist </p>
            <p className="text-body-secondary mb-3 px-2 px-sm-0 small"> Waitlisted users stay on the waitlist until they return and sign up themselves after a spot opens. </p>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>
                      <strong>Name</strong>
                    </th>
                    <th>
                      <strong>Email</strong>
                    </th>
                    <th>
                      <strong>Gender</strong>
                    </th>
                    <th className="text-center">
                      <strong>Age</strong>
                    </th>
                    <th>
                      <strong>Birthday</strong>
                    </th>
                    <th>
                      <strong>Waitlisted At</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlistedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td className="text-break">{user.email}</td>
                      <td>{user.gender}</td>
                      <td className="text-center">{user.age}</td>
                      <td>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</td>
                      <td>{user.waitlisted_at ? formatUTCToLocal(user.waitlisted_at, true) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="p-3 text-center mb-0">No users currently on the waitlist for this event.</p>
        )}
      </div>
      <div className="d-flex justify-content-between px-3 py-3 modal-footer">
        <div>
          {canManageUsers && waitlistedUsers.length > 0 && (
            <button type="button" onClick={handleExport} className="btn btn-outline-primary">
              <span className="me-2">{<i className="fa-solid fa-download" aria-hidden="true" />}</span>Export CSV
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="btn btn-link"> Close </button>
      </div>
    </Modal>
  );
};

export default ViewWaitlistedUsers;
