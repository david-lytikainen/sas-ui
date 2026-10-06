import Modal from '../common/Modal';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Event } from '../../types/event';
import { eventsApi } from '../../services/api';
import { downloadCsv } from '../../utils/download';
import { useAuth } from '../../context/AuthContext';

interface ViewAllSchedulesProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

const ViewAllSchedules = ({ open, event, onClose }: ViewAllSchedulesProps) => {
  const { isAdmin, user } = useAuth();
  const [allSchedules, setAllSchedules] = useState<Record<number, any[]>>({});
  const [filteredSchedules, setFilteredSchedules] = useState<Record<number, any[]>>({});
  const [usersMap, setUsersMap] = useState<Record<number, { id: number; first_name: string; last_name: string }>>({});
  const [loadingAllSchedules, setLoadingAllSchedules] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [selectionErrorMessage, setSelectionErrorMessage] = useState<string | null>(null);
  const canExportSchedules = !!event && (isAdmin() || (user?.role_id === 2 && String(event.creator_id) === String(user.id)));
  const getUserName = (userId: number) => {
    const userRecord = usersMap[userId];
    return userRecord ? `${userRecord.first_name} ${userRecord.last_name}` : `User ${userId}`;
  };

  useEffect(() => {
    if (!open || !event) return;

    const fetchSchedules = async () => {
      try {
        setLoadingAllSchedules(true);
        setSearchTerm('');
        setSortConfig(null);
        setSelectionErrorMessage(null);

        const response = await eventsApi.getAllSchedules(event.id.toString());
        setAllSchedules(response.schedules || {});
        setFilteredSchedules(response.schedules || {});

        const attendeesResponse = await eventsApi.getEventAttendees(event.id.toString());
        const userMap: Record<number, { id: number; first_name: string; last_name: string }> = {};
        attendeesResponse.data.forEach((attendee: any) => {
          userMap[attendee.id] = {
            id: attendee.id,
            first_name: attendee.first_name || '',
            last_name: attendee.last_name || '',
          };
        });
        setUsersMap(userMap);
      } catch (error: any) {
        setSelectionErrorMessage(error.message || 'Failed to load all schedules');
      } finally {
        setLoadingAllSchedules(false);
      }
    };

    fetchSchedules();
  }, [open, event]);

  const applyFilterAndSort = (search: string, sort: { key: string; direction: 'ascending' | 'descending' } | null) => {
    let filtered: Record<number, any[]> = {};

    if (!search || search.trim() === '') {
      filtered = { ...allSchedules };
    } else {
      const lowercaseSearch = search.toLowerCase().trim();
      Object.entries(allSchedules).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule) || userSchedule.length === 0) return;
        const userName = getUserName(Number(userId)).toLowerCase();
        const nameWords = userName.split(/\s+/);
        const nameMatch = nameWords.some((word) => word.startsWith(lowercaseSearch));
        if (nameMatch) filtered[Number(userId)] = userSchedule;
      });
    }

    if (sort) {
      let allItems: any[] = [];
      Object.entries(filtered).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule)) return;
        const userName = getUserName(Number(userId));
        userSchedule.forEach((item: any) => {
          allItems.push({ userId: Number(userId), userName, ...item });
        });
      });

      allItems.sort((a, b) => {
        let compareA: string | number = '';
        let compareB: string | number = '';
        switch (sort.key) {
          case 'user':
            compareA = a.userName.toLowerCase();
            compareB = b.userName.toLowerCase();
            break;
          case 'round':
            compareA = a.round;
            compareB = b.round;
            break;
          case 'table':
            compareA = a.table;
            compareB = b.table;
            break;
          case 'partner':
            compareA = a.partner_name.toLowerCase();
            compareB = b.partner_name.toLowerCase();
            break;
          default:
            return 0;
        }

        if (compareA < compareB) return sort.direction === 'ascending' ? -1 : 1;
        if (compareA > compareB) return sort.direction === 'ascending' ? 1 : -1;
        return 0;
      });

      filtered = {};
      allItems.forEach((item) => {
        const userId = item.userId;
        if (!filtered[userId]) filtered[userId] = [];
        const { userId: _userId, userName: _userName, ...rest } = item;
        filtered[userId].push(rest);
      });
    }

    setFilteredSchedules(filtered);
  };

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    const nextSort = { key, direction };
    setSortConfig(nextSort);
    applyFilterAndSort(searchTerm, nextSort);
  };

  const handleSearchChange = (searchEvent: ChangeEvent<HTMLInputElement>) => {
    const value = searchEvent.target.value;
    setSearchTerm(value);
    applyFilterAndSort(value, sortConfig);
  };

  const handleExportSchedules = () => {
    if (!event || !filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      setSelectionErrorMessage('No schedules available to export');
      return;
    }

    try {
      let csvContent = 'Name 1,Name 2,Round,Table\n';
      Object.entries(filteredSchedules).forEach(([userId, userSchedule]) => {
        if (!Array.isArray(userSchedule) || userSchedule.length === 0) return;
        const userName = getUserName(Number(userId));
        userSchedule.forEach((item: any) => {
          csvContent += `"${userName}","${item.partner_name}",${item.round},${item.table}\n`;
        });
      });

      downloadCsv(csvContent, `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_schedules.csv`);
    } catch (error) {
      setSelectionErrorMessage('Failed to export schedules');
    }
  };

  const renderSortableHeader = (key: string, label: string) => (
    <th scope="col" aria-sort={sortConfig?.key === key ? sortConfig.direction : 'none'}><button type="button" className="btn btn-link text-body text-decoration-none p-0" onClick={() => handleSort(key)}>
      <div className="d-flex align-items-center">
        <strong>{label}</strong>
        {sortConfig?.key === key && <span className="ms-1">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>}
      </div>
    </button></th>
  );

  return (
    <Modal onClose={onClose} size="lg" open={open}>
      <div className="modal-header fw-semibold">{event?.name} - All Schedules</div>
      <div className="p-0 p-sm-2 modal-body overflow-y-auto">
        {loadingAllSchedules ? (
          <div className="d-flex justify-content-center p-5">
            <p className="mb-0">Loading all schedules...</p>
          </div>
        ) : Object.keys(allSchedules).length > 0 ? (
          <div className="mt-3">
            <div className="mb-3 px-2 d-flex flex-wrap gap-3 align-items-center">
              <div className="my-2 w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Search'}</span>
                  <span className="input-group">
                    {<span className="text-body-secondary me-2">🔍</span>}
                    <input className="form-control" placeholder={'Search by name...'} value={searchTerm} onChange={handleSearchChange} />
                  </span>
                </label>
              </div>
              {canExportSchedules && (
                <button type="button" onClick={handleExportSchedules} className="text-nowrap btn btn-outline-primary">
                  <span className="me-2">{<i className="fa-solid fa-download" aria-hidden="true" />}</span>Export CSV
                </button>
              )}
            </div>
            {selectionErrorMessage && (
              <div role="alert" className="mb-3 mx-2 alert alert-danger alert-dismissible">
                {selectionErrorMessage}
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelectionErrorMessage(null)} />
              </div>
            )}
            <p className="text-body-secondary mb-2 px-2 small">Showing schedules for {Object.keys(filteredSchedules).length} users</p>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr> {renderSortableHeader('user', 'User')} {renderSortableHeader('partner', 'Partner')} {renderSortableHeader('round', 'Round')} {renderSortableHeader('table', 'Table')} </tr>
                </thead>
                <tbody>
                  {Object.entries(filteredSchedules).flatMap(([userId, userSchedule]) => {
                    if (!Array.isArray(userSchedule) || userSchedule.length === 0) return [];
                    const userName = getUserName(Number(userId));
                    return userSchedule.map((item: any, index: number) => (
                      <tr key={`${userId}-${index}`}>
                        <td>{userName}</td>
                        <td>{item.partner_name}</td>
                        <td>{item.round}</td>
                        <td>{item.table}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-4"> No schedules available. The event might not have started yet, or there may not be enough attendees checked in. </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" onClick={onClose} className="btn btn-link"> Close </button>
      </div>
    </Modal>
  );
};

export default ViewAllSchedules;
