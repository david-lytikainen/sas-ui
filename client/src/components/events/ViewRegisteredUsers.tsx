import Modal from '../common/Modal';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Event } from '../../types/event';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatUTCToLocal } from '../../utils/date';
import { downloadCsv } from '../../utils/download';
import ConfirmDialog from '../common/ConfirmDialog';

interface RegisteredUser {
  id: number;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday: string | null;
  age: number;
  gender: string | null;
  phone: string;
  registration_date: string | null;
  check_in_date: string | null;
  status: string;
}

interface ViewRegisteredUsersProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewRegisteredUsers = ({ open, event, onClose }: ViewRegisteredUsersProps) => {
  const { user, isAdmin, isOrganizer } = useAuth();
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [filteredRegisteredUsers, setFilteredRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingInUserId, setCheckingInUserId] = useState<number | null>(null);
  const [userToCheckIn, setUserToCheckIn] = useState<RegisteredUser | null>(null);

  const canExport = isAdmin() || (isOrganizer() && !!event && Number(event.creator_id) === Number(user?.id));
  const canManage = isAdmin() || isOrganizer();

  const loadRegisteredUsers = async (currentEvent: Event) => {
    const response = await eventsApi.getEventAttendees(currentEvent.id.toString());
    const sortedData = [...response.data].sort((a, b) => {
      if (!a.registration_date) return -1;
      if (!b.registration_date) return 1;
      return new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime();
    });

    setRegisteredUsers(sortedData);
    setFilteredRegisteredUsers(sortedData);
  };

  const formatTableDateTime = (utcDateString: string) => {
    const date = new Date(utcDateString);
    if (Number.isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (!open || !event) return;

    const fetchRegisteredUsers = async () => {
      try {
        setSearchTerm('');
        setErrorMessage(null);

        await loadRegisteredUsers(event);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to fetch registered users');
      }
    };

    fetchRegisteredUsers();
  }, [open, event]);

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);

    if (!value || value.trim() === '') {
      setFilteredRegisteredUsers([...registeredUsers]);
      return;
    }

    const searchWords = value
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const filtered = registeredUsers.filter((user) => {
      const firstName = user.first_name.toLowerCase();
      const lastName = user.last_name.toLowerCase();

      return searchWords.every((word) => firstName.startsWith(word) || lastName.startsWith(word));
    });

    setFilteredRegisteredUsers(filtered);
  };

  const handleManualCheckIn = async (userId: number) => {
    if (!event) {
      setErrorMessage('No event selected');
      return;
    }

    try {
      setCheckingInUserId(userId);
      await eventsApi.manualCheckInAttendee(event.id.toString(), userId.toString());
      await loadRegisteredUsers(event);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to check in attendee');
    } finally {
      setCheckingInUserId(null);
    }
  };

  const handleCheckInConfirm = () => {
    if (!userToCheckIn) return;
    setUserToCheckIn(null);
    handleManualCheckIn(userToCheckIn.id);
  };

  const handleExport = () => {
    const usersToExport = searchTerm.trim() ? filteredRegisteredUsers : registeredUsers;

    if (!event || usersToExport.length === 0) {
      setErrorMessage('No registered users available to export');
      return;
    }

    try {
      let csvContent = 'Name,Email,Gender,Age,Birthday,Registration Date,Check-in Time,Status\n';

      usersToExport.forEach((user) => {
        const birthday = user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A';
        const registrationDate = user.registration_date ? formatUTCToLocal(user.registration_date, true) : 'N/A';
        const checkInDate = user.check_in_date ? formatUTCToLocal(user.check_in_date, true) : 'Not checked in';
        csvContent += `"${user.name}","${user.email}",${user.gender || 'N/A'},${user.age || 'N/A'},${birthday},${registrationDate},${checkInDate},${user.status}\n`;
      });

      downloadCsv(
        csvContent,
        `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${searchTerm.trim() ? 'filtered_users' : 'registered_users'}.csv`
      );
    } catch (error) {
      setErrorMessage('Failed to export registered users');
    }
  };

  const handleEmailAttendees = () => {
    if (!event || registeredUsers.length === 0) {
      setErrorMessage('No registered users available to email.');
      return;
    }

    const recipients = Array.from(new Set(registeredUsers.map((user) => user.email).filter(Boolean)));
    if (recipients.length === 0) {
      setErrorMessage('No attendee email addresses are available.');
      return;
    }

    window.location.href = `mailto:?bcc=${encodeURIComponent(recipients.join(','))}&subject=${encodeURIComponent(`Saved & Single: ${event.name}`)}`;
  };

  return (
    <Modal onClose={onClose} size="xl" open={open}>
      <div className="modal-header fw-semibold">Registered Users</div>
      <div className="p-0 p-sm-2 modal-body overflow-y-auto">
        {errorMessage && (
          <div role="alert" className="mb-3 alert alert-danger alert-dismissible">
            {errorMessage}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setErrorMessage(null)} />
          </div>
        )}
        {registeredUsers.length > 0 ? (
          <>
            <div className="mb-3 px-2 px-sm-0">
              <div className="my-2 w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Search by name'}</span>
                  <input className="form-control" placeholder="Search by name" value={searchTerm} onChange={handleSearchChange} />
                </label>
              </div>
            </div>
            <p className="text-body-secondary mb-2 px-2 px-sm-0 small"> Showing {filteredRegisteredUsers.length} of {registeredUsers.length} users </p>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    {canManage && (
                      <th className="text-center">
                        <strong>Actions</strong>
                      </th>
                    )}
                    <th>
                      <strong>Name</strong>
                    </th>
                    <th>
                      <strong>Email</strong>
                    </th>
                    <th>
                      <strong>Check-in Time</strong>
                    </th>
                    <th>
                      <strong>Registered</strong>
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
                      <strong>Status</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegisteredUsers.map((user) => (
                    <tr key={user.id}>
                      {canManage && (
                        <td className="text-center">
                          {user.status !== 'Checked In' && (
                            <button type="button" onClick={() => setUserToCheckIn(user)} disabled={checkingInUserId === user.id} className="text-nowrap btn btn-primary btn-sm" > {checkingInUserId === user.id ? 'Checking In...' : 'Check In'} </button>
                          )}
                        </td>
                      )}
                      <td>{user.name}</td>
                      <td className="text-break">{user.email}</td>
                      <td>{user.check_in_date ? formatTableDateTime(user.check_in_date) : 'Not checked in'}</td>
                      <td>{user.registration_date ? formatTableDateTime(user.registration_date) : 'N/A'}</td>
                      <td>{user.gender}</td>
                      <td className="text-center">{user.age}</td>
                      <td>{user.birthday ? formatUTCToLocal(user.birthday, false) : 'N/A'}</td>
                      <td>
                        <span className={ 'badge rounded-pill text-bg-' + (user.status === 'Checked In' ? 'success' : 'primary').replace('error', 'danger') } > {user.status} </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="p-3 text-center mb-0">No registered users found for this event.</p>
        )}
      </div>
      <ConfirmDialog open={!!userToCheckIn} title={`Check In ${userToCheckIn?.name}?`} confirmLabel="Yes" cancelLabel="No" onCancel={() => setUserToCheckIn(null)} onConfirm={handleCheckInConfirm} ></ConfirmDialog>
      <div className="d-flex justify-content-between px-3 py-3 modal-footer">
        <div>
          {canExport && registeredUsers.length > 0 && (
            <div className="d-flex gap-2 flex-wrap">
              <button type="button" onClick={handleEmailAttendees} className="btn btn-outline-primary">
                <span className="me-2">{<i className="fa-solid fa-envelope" aria-hidden="true" />}</span>Email attendees
              </button>
              <button type="button" onClick={handleExport} className="btn btn-outline-primary">
                <span className="me-2">{<i className="fa-solid fa-download" aria-hidden="true" />}</span>Export CSV
              </button>
            </div>
          )}
        </div>
        <button type="button" onClick={onClose} className="btn btn-link"> Close </button>
      </div>
    </Modal>
  );
};

export default ViewRegisteredUsers;
