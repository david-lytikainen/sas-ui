import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../services/api';
import { Event, ScheduleItem } from '../../types/event';

interface MyScheduleProps {
  event: Event;
  currentRound: number | undefined;
}

const MySchedule = ({ event, currentRound }: MyScheduleProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [attendeeSpeedDateSelections, setAttendeeSpeedDateSelections] = useState<Record<number, { eventId: number; interested: boolean | null }>>({});
  const [attendeeSelectionError, setAttendeeSelectionError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | null>(null);
  const saveQueues = useRef<Record<number, Promise<void>>>({});
  const saveSequences = useRef<Record<number, number>>({});
  const latestSaveSequence = useRef(0);
  const confirmedSelections = useRef<Record<number, boolean | null>>({});

  useEffect(() => {
    if (!expanded) return;
    if (!(event.status === 'In Progress' || event.status === 'Completed')) return;
    if (schedule !== null) return;

    const loadSchedule = async () => {
      try {
        const response = await eventsApi.getSchedule(event.id.toString());
        const nextSchedule = response?.schedule || [];
        setSchedule(nextSchedule);

        const nextSelections: Record<number, { eventId: number; interested: boolean | null }> = {};
        nextSchedule.forEach((item) => {
          if (item.event_speed_date_id) {
            const interested = item.user_interested ?? null;
            confirmedSelections.current[item.event_speed_date_id] = interested;
            if (interested !== null) nextSelections[item.event_speed_date_id] = { eventId: event.id, interested };
          }
        });
        setAttendeeSpeedDateSelections(nextSelections);
      } catch {
        setSchedule([]);
      }
    };

    loadSchedule();
  }, [event.id, event.status, expanded, schedule]);

  const handleSelectionChange = (eventSpeedDateId: number, interested: boolean) => {
    const currentValue = attendeeSpeedDateSelections[eventSpeedDateId]?.interested ?? null;
    const nextValue = currentValue === interested ? null : interested;
    const sequence = (saveSequences.current[eventSpeedDateId] || 0) + 1;
    saveSequences.current[eventSpeedDateId] = sequence;
    latestSaveSequence.current += 1;
    const requestSequence = latestSaveSequence.current;
    setAttendeeSpeedDateSelections((prev) => ({ ...prev, [eventSpeedDateId]: { eventId: event.id, interested: nextValue } }));
    setAttendeeSelectionError(null);
    setSaveStatus('saving');
    const previousRequest = saveQueues.current[eventSpeedDateId] || Promise.resolve();
    saveQueues.current[eventSpeedDateId] = previousRequest.catch(() => undefined).then(async () => {
      try {
        await eventsApi.submitSpeedDateSelections(event.id.toString(), [{ event_speed_date_id: eventSpeedDateId, interested: nextValue }]);
        confirmedSelections.current[eventSpeedDateId] = nextValue;
        if (saveSequences.current[eventSpeedDateId] === sequence) {
          setSaveStatus('saved');
          window.setTimeout(() => { if (latestSaveSequence.current === requestSequence) setSaveStatus(null); }, 1200);
        }
      } catch (error: any) {
        if (saveSequences.current[eventSpeedDateId] === sequence) {
          const backendErrorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
          setAttendeeSpeedDateSelections((prev) => ({ ...prev, [eventSpeedDateId]: { eventId: event.id, interested: confirmedSelections.current[eventSpeedDateId] ?? null } }));
          setAttendeeSelectionError(backendErrorMessage || 'Failed to save your selection. Please try again.');
          setSaveStatus(null);
        }
      }
    });
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      setAttendeeSelectionError('Failed to copy email.');
    }
  };

  const getMatchMessage = (speedDate: ScheduleItem) => {
    const isMatch = speedDate.match;
    if (!user?.gender) return isMatch ? 'You matched! Reach out with:' : 'Not a match';
    if (isMatch) return 'You matched! Reach out with:';
    if (!speedDate.user_interested) return 'You said No';
    const messages = {
      Male: [
        'Not a match, head up king 👑',
        'Not a match, stay royal 👑',
        'Not a match, you shining tho 👑',
        'Not a match, no problem 👑',
        'Not a match, still that guy 👑',
        'Not a match, you still the prize 👑',
        'Not a match, but your vibe is elite 👑',
      ],
      Female: [
        'Not a match, head up queen 👸',
        'Not a match, stay royal 👸',
        'Not a match, you shining tho 👸',
        'Not a match, no problem 👸',
        'Not a match, stay glowing 👸',
        'Not a match, royalty never settles 👸',
        'Not a match, but your worth is not up for debate 👸',
      ],
    };
    const genderMessages = messages[user.gender as 'Male' | 'Female'];
    return genderMessages[Math.floor(Math.random() * genderMessages.length)];
  };

  return (
    <>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((prev) => !prev)} className="btn btn-link text-body text-decoration-none text-start w-100 mt-2 pt-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <i className="fa-solid fa-list text-body-secondary" aria-hidden="true" />
          <p className="text-body-secondary mb-0 small">My Schedule</p>
        </div>
        {expanded ? (
          <i className="fa-solid fa-chevron-up text-body-secondary" aria-hidden="true" />
        ) : (
          <i className="fa-solid fa-chevron-down text-body-secondary" aria-hidden="true" />
        )}
      </button>

      <div hidden={!expanded}>
        <div className="p-3 mt-2 bg-body border rounded">
          {schedule && schedule.length > 0 && event.num_rounds ? (
            <>
              {Array.from({ length: Number(event.num_rounds) }, (_, i) => {
                const roundNum = i + 1;
                const speedDate = schedule.find((si) => si.round === roundNum);
                const isLast = i === Number(event.num_rounds) - 1;
                const isCurrentRound = currentRound === roundNum && event.status === 'In Progress';
                const cardClass = `p-2 rounded border-start border-3 ${isLast ? '' : 'mb-2'} ${isCurrentRound ? 'border-success bg-success-subtle' : 'border-primary bg-body-tertiary'}`;

                if (!speedDate || !speedDate.partner_id) {
                  return (
                    event.status !== 'Completed' && (
                      <div key={`break-round-${roundNum}`} className={cardClass}>
                        <div className="align-items-center row g-3">
                          <div className="col-12">
                            <div className="fw-bold mb-1 small mb-2">Round {roundNum} — Break Round</div>
                          </div>
                        </div>
                      </div>
                    )
                  );
                }

                return (
                  <div key={speedDate.event_speed_date_id || `round-${roundNum}`} className={cardClass}>
                    <div className="align-items-center row g-3">
                      <div className="col-12">
                        <div className="fw-bold mb-1 small mb-2"> {event.status !== 'Completed' ? `Round ${speedDate.round}` : speedDate.partner_name} </div>
                        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                          <div>
                            {event.status !== 'Completed' && (
                              <>
                                <p className="text-body-secondary mb-1 small">Table: {speedDate.table}</p>
                                <p className="text-body-secondary mb-0 small">Partner: {speedDate.partner_name}</p>
                              </>
                            )}
                            {event.status === 'Completed' && <p className="text-primary mt-1 fw-medium mb-0 small">{getMatchMessage(speedDate)}</p>}
                            {event.status === 'Completed' && speedDate.match && (
                              <div className="d-flex align-items-center mt-1">
                                <span onClick={() => handleCopyEmail(speedDate.partner_email)} className="d-inline-flex align-items-center text-body-secondary" >
                                  <button type="button" aria-label="Copy email" className="p-1 me-2 btn btn-outline-secondary btn-sm">
                                    <i className="fa-solid fa-copy" aria-hidden="true" />
                                  </button>
                                  {speedDate.partner_email}
                                </span>
                              </div>
                            )}
                          </div>
                          {event.status !== 'Completed' && speedDate.event_speed_date_id && (
                            <div className="d-flex gap-2 ms-3 position-relative">
                              <button type="button" aria-pressed={attendeeSpeedDateSelections[speedDate.event_speed_date_id]?.interested === true} className={`px-3 py-1 btn btn-sm ${attendeeSpeedDateSelections[speedDate.event_speed_date_id]?.interested === true ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleSelectionChange(speedDate.event_speed_date_id, true)} > Yes </button>
                              <button type="button" aria-pressed={attendeeSpeedDateSelections[speedDate.event_speed_date_id]?.interested === false} className={`px-3 py-1 btn btn-sm ${attendeeSpeedDateSelections[speedDate.event_speed_date_id]?.interested === false ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => handleSelectionChange(speedDate.event_speed_date_id, false)} > No </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {attendeeSelectionError && (
                <div role="alert" className="mt-3 alert alert-danger alert-dismissible">
                  {attendeeSelectionError}
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setAttendeeSelectionError(null)} />
                </div>
              )}
              {event.status !== 'Completed' && (
                <div className="d-flex align-items-center justify-content-end gap-2 mt-3" aria-live="polite">
                  {saveStatus === 'saving' && <p className="text-body-secondary mb-0 small">Saving…</p>}
                  {saveStatus === 'saved' && <p className="text-success mb-0 small">Saved</p>}
                </div>
              )}
            </>
          ) : (
            <p className="text-body-secondary mb-0 small">Your schedule will be populated once the organizer generates it.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default MySchedule;
