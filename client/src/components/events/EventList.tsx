import Modal from '../common/Modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import authApi, { eventsApi } from '../../services/api';
import type { Event } from '../../types/event';
import { formatUTCToLocal } from '../../utils/date';
import CreateEvent from './CreateEvent';
import EventTimer from './EventTimer';
import MySchedule from './MySchedule';
import ViewAllSchedules from './ViewAllSchedules';
import ViewRegisteredUsers from './ViewRegisteredUsers';
import ViewWaitlistedUsers from './ViewWaitlistedUsers';
import ConfirmDialog from '../common/ConfirmDialog';
import ProfilePreferences from '../profile/ProfilePreferences';
import type { ProfilePreferences as ProfilePreferenceValues } from '../../types/user';

type EventView = 'all' | 'my' | 'create';

const toLocalDateTimeInputValue = (isoDateTime: string) => {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '';

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const removeQueryParams = (pathname: string, search: string, keys: string[]) => {
  const params = new URLSearchParams(search);
  keys.forEach((key) => params.delete(key));
  const nextSearch = params.toString();
  window.history.replaceState({}, '', `${pathname}${nextSearch ? `?${nextSearch}` : ''}`);
};

const EventList = () => {
  const { refreshEvents, isRegisteredForEvent, filteredEvents, userRegisteredEvents } = useEvents();
  const { user, isAdmin, isOrganizer, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showProfilePreferences = Boolean((location.state as { showProfilePreferences?: boolean } | null)?.showProfilePreferences);
  const [profilePreferences, setProfilePreferences] = useState<ProfilePreferenceValues>({
    faith_importance: user?.faith_importance ?? null,
    traditional_roles_importance: user?.traditional_roles_importance ?? null,
    boundaries_importance: user?.boundaries_importance ?? null,
    looks_importance: user?.looks_importance ?? null,
    wants_kids: user?.wants_kids ?? null,
    age_gap: user?.age_gap ?? null,
  });
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<EventView>('my');
  const handledOrganizerReturnRef = useRef<string | null>(null);
  const [pastEventsOpen, setPastEventsOpen] = useState(false);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signUpEventId, setSignUpEventId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelEventId, setCancelEventId] = useState<string | null>(null);
  const [expandedEventControls, setExpandedEventControls] = useState<number | null>(null);
  const [viewRegisteredUsersDialogOpen, setViewRegisteredUsersDialogOpen] = useState(false);
  const [selectedEventForRegisteredUsers, setSelectedEventForRegisteredUsers] = useState<Event | null>(null);

  const [startEventDialogOpen, setStartEventDialogOpen] = useState(false);
  const [selectedEventForStarting, setSelectedEventForStarting] = useState<Event | null>(null);

  const [viewAllSchedulesDialogOpen, setViewAllSchedulesDialogOpen] = useState(false);
  const [selectedEventForAllSchedules, setSelectedEventForAllSchedules] = useState<Event | null>(null);

  const [numTables, setNumTables] = useState<number>(10);
  const [numRounds, setNumRounds] = useState<number>(10);
  const [isTableConfigOpen, setIsTableConfigOpen] = useState<boolean>(false);
  const [checkedInConfirmationOpen, setCheckedInConfirmationOpen] = useState(false);
  const [checkedInAttendeeCount, setCheckedInAttendeeCount] = useState(0);
  const [eventToRegenerate, setEventToRegenerate] = useState<Event | null>(null);

  const [editEventDialogOpen, setEditEventDialogOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<Event>>({
    name: '',
    description: '',
    starts_at: '',
    address: '',
    max_capacity: '0',
    price_per_person: '0',
    enforce_gender_balance: true,
  });

  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [eventForWaitlist, setEventForWaitlist] = useState<Event | null>(null);

  const [waitlistReason, setWaitlistReason] = useState<string>('');
  const [viewWaitlistDialogOpen, setViewWaitlistDialogOpen] = useState<boolean>(false);
  const [selectedEventForWaitlistUsers, setSelectedEventForWaitlistUsers] = useState<Event | null>(null);
  const [currentRounds, setCurrentRounds] = useState<Record<number, number>>({});
  const handledCheckoutReturnRef = useRef<string | null>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hasStartedStripeSetup = !!user?.has_started_stripe_setup;
  const organizerSetupComplete = !!user?.stripe_connect_onboarding_complete;
  const canCreateEvents = !!user && (isAdmin() || (isOrganizer() && organizerSetupComplete));

  useEffect(() => {
    const requestedView = searchParams.get('view');
    if (requestedView === 'all' || requestedView === 'my' || requestedView === 'create') {
      setActiveView(requestedView);
    }
  }, [searchParams]);

  useEffect(() => {
    const syncOrganizerState = async () => {
      if (activeView !== 'create' || !user || isAdmin()) return;
      const shouldSync = searchParams.get('stripe_connect') === 'return' || searchParams.get('checkout') === 'success';
      if (shouldSync && handledOrganizerReturnRef.current !== location.search) {
        try {
          handledOrganizerReturnRef.current = location.search;
          await authApi.refreshOrganizerStatus();
          await refreshUser();
          removeQueryParams(location.pathname, location.search, ['checkout', 'session_id', 'stripe_connect', 'organizer']);
        } catch (error: any) {
          setErrorMessage(error.message || 'Failed to refresh organizer status');
        }
      }
    };
    syncOrganizerState();
  }, [activeView, user, isAdmin, refreshUser, searchParams, location.pathname, location.search]);

  useEffect(() => {
    let isActive = true;

    const syncCheckoutReturn = async () => {
      if (!user || searchParams.get('checkout') !== 'success') return;
      if (handledCheckoutReturnRef.current === location.search) return;

      handledCheckoutReturnRef.current = location.search;
      const sessionId = searchParams.get('session_id');

      if (sessionId?.startsWith('cs_')) {
        try {
          await eventsApi.completeRegistrationCheckout(sessionId);
        } catch (error: any) {
          setErrorMessage(error.message || 'Checkout completed, but registration could not be verified automatically yet.');
        }
      } else if (sessionId) {
        setErrorMessage('Checkout completed, but the return link did not include a valid session ID.');
      }

      for (let attempt = 0; attempt < 6 && isActive; attempt += 1) {
        await refreshEvents();
        if (attempt < 5) {
          await wait(1500);
        }
      }

      if (!isActive) return;

      removeQueryParams(location.pathname, location.search, ['checkout', 'session_id']);
    };

    syncCheckoutReturn();
    return () => {
      isActive = false;
    };
  }, [location.pathname, location.search, refreshEvents, searchParams, user]);

  const handleSignUpClick = (eventId: number) => {
    const event = filteredEvents.find((e) => e.id === eventId);
    if (!event) return;

    if (event.status === 'In Progress') {
      setErrorMessage('Registration is not available for In Progress events.');
      return;
    }

    if (event.status === 'Completed') {
      setErrorMessage('Registration is not available for Completed events.');
      return;
    }

    setSignUpEventId(eventId.toString());
    setSignUpDialogOpen(true);
  };

  const handleSignUpConfirm = async () => {
    if (signUpEventId) {
      try {
        const event = filteredEvents.find((e) => e.id.toString() === signUpEventId);
        if (!event) {
          setErrorMessage('Event details could not be found.');
          return;
        }

        if (parseFloat(event.price_per_person || '0') > 0) {
          const checkout = await eventsApi.createRegistrationCheckout(signUpEventId);
          window.location.href = checkout.url;
          return;
        }

        await eventsApi.registerForEvent(signUpEventId, { join_waitlist: false });

        setSignUpDialogOpen(false);
        setSignUpEventId(null);

        try {
          await refreshEvents();
        } catch (refreshError: any) {
          const backendMsg = refreshError.response?.data?.message || refreshError.response?.data?.error; // Renamed to avoid conflict
          setErrorMessage(
            `You've been registered for the event, but we couldn't update the list automatically. Error: ${backendMsg || refreshError.message}. Please try refreshing the page.`
          );
        }
      } catch (registrationError: any) {
        const backendError = registrationError.response?.data?.error;
        const backendMsg = registrationError.response?.data?.message;
        const waitlistAvailable = registrationError.response?.data?.waitlist_available === true;

        if ((backendError === 'Event is currently full' || backendError === 'Event is currently full for this gender') && waitlistAvailable) {
          const event = filteredEvents.find((e) => e.id.toString() === signUpEventId);
          if (event) {
            setEventForWaitlist(event);
            setWaitlistReason(backendError);
            setWaitlistDialogOpen(true);
          } else {
            setErrorMessage('This event is currently full. Waitlist option available, but event details could not be found.');
          }
        } else {
          setErrorMessage(backendError || backendMsg || registrationError.message || 'An error occurred while trying to register for the event.');
        }
        setSignUpDialogOpen(false);
      }
    }
  };

  const handleJoinWaitlistConfirm = async () => {
    if (eventForWaitlist) {
      try {
        await eventsApi.registerForEvent(eventForWaitlist.id.toString(), { join_waitlist: true });
        setWaitlistDialogOpen(false);
        setEventForWaitlist(null);
        setErrorMessage(null); // Clear previous error messages
        alert(
          `Successfully joined the waitlist for "${eventForWaitlist.name}"! If a spot opens up, we will email you so you can come back and sign up.`
        );
        await refreshEvents(); // Refresh events to show waitlist status if applicable
      } catch (waitlistError: any) {
        const backendError = waitlistError.response?.data?.error;
        const backendMessage = waitlistError.response?.data?.message;
        setErrorMessage(backendError || backendMessage || waitlistError.message || 'An error occurred while trying to join the waitlist.');
        setWaitlistDialogOpen(false); // Close the dialog even on error
      }
    }
  };

  const handleCancelClick = (eventId: number) => {
    const event = filteredEvents.find((e) => e.id === eventId); // Use filteredEvents
    if (event && event.status === 'Completed') {
      setErrorMessage('Cannot cancel registration for completed events.');
      return;
    }
    setCancelEventId(eventId.toString());
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (cancelEventId) {
      try {
        await eventsApi.cancelRegistration(cancelEventId);
        setCancelDialogOpen(false);
        setCancelEventId(null);
        // Refresh events to update registration status
        await refreshEvents();
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to cancel registration');
      }
    }
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const startTimeDifference = -(new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    return startTimeDifference || a.id - b.id;
  });

  const isPastEvent = (event: Event) => {
    if (event.status === 'Completed') return true;
    const startTime = new Date(event.starts_at).getTime();
    return Date.now() - startTime > 48 * 60 * 60 * 1000;
  };

  const isMyEvent = (event: Event) => {
    if (!user) return false;
    return isRegisteredForEvent(event.id) || Number(event.creator_id) === Number(user.id);
  };

  const userHasAnyRegistrations = userRegisteredEvents.length > 0;

  const baseEvents = activeView === 'my' ? sortedEvents.filter(isMyEvent) : sortedEvents;
  const visibleEvents = baseEvents.filter((event) => !isPastEvent(event));
  const pastEvents = baseEvents.filter(isPastEvent);

  const renderActionButtons = (event: Event) => {
    const isUserRegistered = isRegisteredForEvent(event.id);
    const registrationStatus = event.registration?.status;
    if (isPastEvent(event)) return null;

    // Handle Waitlisted status first
    if (registrationStatus === 'Waitlisted') {
      return (
        <div className="d-flex flex-column gap-2 align-items-start w-100">
          <span className={'align-self-start badge rounded-pill text-bg-' + 'warning'.replace('error', 'danger')}>{'Waitlisted'}</span>
          <button type="button" onClick={() => handleCancelClick(event.id)} className="align-self-start btn btn-outline-danger btn-sm">
            <span className="me-2">{<i className="fa-solid fa-circle-xmark" aria-hidden="true" />}</span>Leave Waitlist
          </button>
        </div>
      );
    }

    // If registered (and not waitlisted) and event is not completed or in progress
    if (isUserRegistered && registrationStatus !== 'Waitlisted' && event.status !== 'Completed' && event.status !== 'In Progress') {
      if (registrationStatus === 'Checked In') return null;
      return (
        <button type="button" onClick={() => handleCancelClick(event.id)} className="btn btn-outline-danger btn-sm">
          <span className="me-2">{<i className="fa-solid fa-circle-xmark" aria-hidden="true" />}</span>Cancel Registration
        </button>
      );
    }

    // Standard Sign Up / Join Waitlist button logic refined
    const isUserNotRegisteredOrWaitlisted = !isUserRegistered && registrationStatus !== 'Waitlisted';

    if (event.status === 'Registration Open' && isUserNotRegisteredOrWaitlisted) {
      return (
        <button type="button" onClick={() => handleSignUpClick(event.id)} className="w-100 align-self-start btn btn-primary"> Sign Up </button>
      );
    }

    return null;
  };

  // Function to check if user can manage event
  const canManageEvent = (event: Event) => {
    if (!user) return false;
    return isAdmin() || (canCreateEvents && Number(event.creator_id) === Number(user.id));
  };

  const renderEventControls = (event: Event) => {
    if (!canManageEvent(event)) return null;
    const isExpanded = expandedEventControls === event.id;

    return (
      <>
        <button type="button" aria-expanded={isExpanded} onClick={() => setExpandedEventControls(isExpanded ? null : event.id)} className="btn btn-link text-body text-decoration-none text-start w-100 mt-2 pt-2 d-flex align-items-center justify-content-between" >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-gear text-body-secondary" aria-hidden="true" />
            <p className="text-body-secondary mb-0 small">Event Controls</p>
          </div>
          {isExpanded ? (
            <i className="fa-solid fa-chevron-up text-body-secondary" aria-hidden="true" />
          ) : (
            <i className="fa-solid fa-chevron-down text-body-secondary" aria-hidden="true" />
          )}
        </button>

        <div hidden={!isExpanded}>
          <div className="mt-2 d-flex flex-column gap-2">
            <button type="button" onClick={() => { setSelectedEventForRegisteredUsers(event); setViewRegisteredUsersDialogOpen(true); }} className="rounded btn btn-outline-primary btn-sm w-100" >
              <span className="me-2">{<i className="fa-solid fa-list" aria-hidden="true" />}</span>Check In Users
            </button>
            <button type="button" onClick={() => { setSelectedEventForWaitlistUsers(event); setViewWaitlistDialogOpen(true); }} className="rounded btn btn-outline-primary btn-sm w-100" >
              <span className="me-2">{<i className="fa-solid fa-list" aria-hidden="true" />}</span>View Waitlist
            </button>
            {(event.status === 'In Progress' || event.status === 'Completed') && (
              <button type="button" onClick={() => { setSelectedEventForAllSchedules(event); setViewAllSchedulesDialogOpen(true); }} className="rounded btn btn-outline-primary btn-sm w-100" >
                <span className="me-2">{<i className="fa-solid fa-eye" aria-hidden="true" />}</span>View All Schedules
              </button>
            )}
            <button type="button" onClick={() => (event.status === 'In Progress' ? setEventToRegenerate(event) : handleStartEventClick(event))} disabled={event.status === 'Completed'} className="rounded btn btn-outline-primary btn-sm w-100" >
              <span className="me-2">{<i className="fa-solid fa-play" aria-hidden="true" />}</span>
              {event.status === 'In Progress' ? 'Re-generate Schedules' : 'Generate Schedules'}
            </button>
            <button type="button" onClick={() => handleOpenEditEventDialog(event)} className="rounded mt-1 btn btn-outline-primary btn-sm w-100" >
              <span className="me-2">{<i className="fa-solid fa-pen" aria-hidden="true" />}</span>Edit Event
            </button>
          </div>
        </div>
      </>
    );
  };

  // Event status update functions
  const handleStartEventClick = async (event: Event) => {
    setSelectedEventForStarting(event);
    setNumRounds(10);
    try {
      const response = await eventsApi.getEventAttendees(event.id.toString());
      const checkedInAttendees = response.data.filter((attendee) => attendee.status === 'Checked In');
      const maleCount = checkedInAttendees.filter((attendee) => attendee.gender === 'Male').length;
      const femaleCount = checkedInAttendees.filter((attendee) => attendee.gender === 'Female').length;

      if (maleCount === 0 || femaleCount === 0) {
        setErrorMessage('Schedule generation requires at least one checked-in male and one checked-in female.');
        return;
      }

      setNumTables(Math.max(1, Math.min(maleCount, femaleCount)));
      setCheckedInAttendeeCount(checkedInAttendees.length);
      setCheckedInConfirmationOpen(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to load checked-in attendees');
    }
  };

  const handleCheckedInConfirmation = () => {
    setCheckedInConfirmationOpen(false);
    setIsTableConfigOpen(true);
  };

  const handleRegenerateConfirm = () => {
    const event = eventToRegenerate;
    setEventToRegenerate(null);
    if (event) handleStartEventClick(event);
  };

  const handleTableConfigSubmit = () => {
    setIsTableConfigOpen(false);
    setStartEventDialogOpen(true); // Now open the confirmation dialog
  };

  const handleStartEvent = async () => {
    try {
      if (!selectedEventForStarting) return;

      await eventsApi.startEvent(selectedEventForStarting.id.toString(), numTables, numRounds);
      setStartEventDialogOpen(false);
      setSelectedEventForStarting(null);
      await refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start event');
    }
  };

  const handleOpenEditEventDialog = (event: Event) => {
    setEventToEdit(event);
    setEditEventForm({
      name: event.name,
      description: event.description,
      starts_at: event.starts_at ? toLocalDateTimeInputValue(event.starts_at) : '',
      address: event.address,
      max_capacity: event.max_capacity.toString(),
      price_per_person: event.price_per_person.toString(),
      enforce_gender_balance: event.enforce_gender_balance ?? true,
      status: event.status,
    });
    setEditEventDialogOpen(true);
  };

  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement; // Type assertion
    const name = target.name;
    const value = target.value;

    setEditEventForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateEvent = async () => {
    if (!eventToEdit || !editEventForm) return;

    try {
      const dataToUpdate: Partial<Event> = { ...editEventForm };
      if (dataToUpdate.max_capacity) {
        dataToUpdate.max_capacity = dataToUpdate.max_capacity.toString();
      }
      if (dataToUpdate.price_per_person) {
        dataToUpdate.price_per_person = dataToUpdate.price_per_person.toString();
      }
      if (dataToUpdate.starts_at) {
        dataToUpdate.starts_at = new Date(dataToUpdate.starts_at).toISOString();
      }

      await eventsApi.updateEvent(eventToEdit.id.toString(), dataToUpdate);
      setEditEventDialogOpen(false);
      setEventToEdit(null);
      refreshEvents();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || error.message || 'Failed to update event');
    }
  };

  const handleConnectOnboarding = async () => {
    try {
      const onboarding = await authApi.createConnectOnboarding();
      window.location.href = onboarding.url;
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start Stripe setup.');
    }
  };

  const closeProfilePreferences = () => navigate(`${location.pathname}${location.search}`, { replace: true, state: null });

  const handleSaveProfilePreferences = async () => {
    try {
      setPreferencesSaving(true);
      setPreferencesError(null);
      await authApi.updatePreferences(profilePreferences);
      await refreshUser();
      closeProfilePreferences();
    } catch (error: any) {
      setPreferencesError(error.message || 'Failed to save profile preferences.');
    } finally {
      setPreferencesSaving(false);
    }
  };

  const renderEventCard = (event: Event) => {
    const actionButtons = renderActionButtons(event);
    return (
      <div key={event.id} className="col-12">
        <div className="rounded card">
          <div className="p-3 p-sm-4 card-body">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2 mb-sm-3">
              <h2 className="h4 fw-semibold text-break mb-0">{event.name}</h2>
              {isRegisteredForEvent(event.id) &&
                event.registration?.status !== 'Waitlisted' &&
                (event.registration?.status === 'Checked In' ? (
                  <span className={'badge rounded-pill text-bg-' + 'success'.replace('error', 'danger')}>
                    {<i className="fa-solid fa-circle-check" aria-hidden="true" />}
                    {'Checked In'}
                  </span>
                ) : (
                  <span className={'badge rounded-pill text-bg-' + 'primary'.replace('error', 'danger')}>{'Registered'}</span>
                ))}
            </div>
            {event.status !== 'In Progress' && (
              <div className="mb-3 mb-sm-3">
                <p className="text-body-secondary mb-2 mb-sm-3">{event.description}</p>
              </div>
            )}
            {event.status === 'In Progress' && (canManageEvent(event) || event.registration) && (
              <div className="mb-2 mb-sm-4">
                <hr className="mb-1 mb-sm-3" />
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="mb-1 mb-sm-3 mb-2">Round Timer</h6>
                  {isAdmin() ? (
                    <p className="text-body-secondary fw-medium mb-0 small"> Rounds: {event.num_rounds}, Tables: {event.num_tables} </p>
                  ) : (
                    <p className="text-body-secondary fw-medium mb-0 small">Rounds: {event.num_rounds}</p>
                  )}
                </div>
                <EventTimer eventId={event.id} isAdmin={canManageEvent(event)} isCheckedIn={isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In'} eventStatus={event.status} onRoundChange={(round) => { setCurrentRounds((prev) => (prev[event.id] === round ? prev : { ...prev, [event.id]: round })); }} />
              </div>
            )}
            {event.status !== 'In Progress' && (
              <div className="d-flex flex-column align-items-start gap-2">
                <p className="text-body-secondary d-flex align-items-center gap-1 mb-0 small"> <i className="fa-solid fa-calendar-days" aria-hidden="true" /> {formatUTCToLocal(event.starts_at)} </p>
                <p className="text-body-secondary d-flex align-items-center gap-1 mb-0 small"> <i className="fa-solid fa-location-dot" aria-hidden="true" /> {event.address} </p>
                {typeof event.registered_attendee_count === 'number' && event.max_capacity && (
                  <p className="text-body-secondary d-flex align-items-center gap-1 mb-0 small"> <i className="fa-solid fa-users" aria-hidden="true" /> {`${event.registered_attendee_count}/${event.max_capacity} spots filled`} </p>
                )}
                <p className="text-body-secondary d-flex align-items-center gap-1 mb-0 small"> <i className="fa-solid fa-dollar-sign" aria-hidden="true" />${parseFloat(event.price_per_person).toFixed(2)} per person </p>
              </div>
            )}
            {renderEventControls(event)}
            {isRegisteredForEvent(event.id) && event.registration?.status === 'Checked In' && (
              <MySchedule event={event} currentRound={currentRounds[event.id]} />
            )}
          </div>
          {actionButtons && <div className="p-2 p-sm-3 pt-2 d-flex gap-2 justify-content-start card-footer flex-wrap">{actionButtons}</div>}
        </div>
      </div>
    );
  };

  const renderCreateTab = () => {
    if (isAdmin() || canCreateEvents) {
      return <CreateEvent createdEventCount={user?.created_event_count || 0} onCreated={() => setActiveView('all')} onError={setErrorMessage} />;
    }

    if (user && !organizerSetupComplete) {
      return (
        <div className="rounded mb-4 card">
          <div className="p-3 p-sm-4 card-body">
            <h5 className="fw-semibold mb-2">Creating an Event</h5>
            <p className="text-body-secondary mb-3 small">Attendees will pay through Stripe, so you need an account to collect payments.</p>
            <h6 className="fw-semibold mb-0">Stripe Setup will require:</h6>
            <ol className="p-0 m-0 ps-4 mb-3">
              <li>Phone number verification</li>
              <li>Personal information</li>
              <li>Bank account information</li>
            </ol>
            <button type="button" onClick={handleConnectOnboarding} className="btn btn-outline-primary w-100"> {hasStartedStripeSetup ? 'Finish Stripe Setup' : 'Continue to Stripe Setup'} </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Modal onClose={(_, reason) => { if (reason !== 'backdropClick') closeProfilePreferences(); }} size="" open={showProfilePreferences} >
        <div className="d-flex align-items-center justify-content-between gap-3 modal-header fw-semibold">
          <span className="fw-bold mb-0">Preferences</span>
          <button type="button" onClick={closeProfilePreferences} className="text-body btn btn-link btn-sm"> Skip </button>
        </div>
        <div className="modal-body">
          {preferencesError && (
            <div role="alert" className="mb-3 alert alert-danger"> {preferencesError} </div>
          )}
          <p className="text-body-secondary mb-3 small">Your answers will not determine how many dates you go on.</p>
          <ProfilePreferences values={profilePreferences} editable onChange={(field, value) => setProfilePreferences((prev) => ({ ...prev, [field]: value }))} />
          <button type="button" onClick={handleSaveProfilePreferences} disabled={preferencesSaving} className="mt-5 btn btn-primary w-100"> {preferencesSaving ? 'Saving...' : 'Done'} </button>
        </div>
      </Modal>
      <div className="container content-medium">
        {errorMessage && (
          <div role="alert" className="mb-3 alert alert-danger alert-dismissible">
            {errorMessage}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setErrorMessage(null)} />
          </div>
        )}
        <div className="d-flex justify-content-start align-items-start mb-3 flex-column gap-2">
          <h1 className="fw-bold mb-0">Events</h1>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <button type="button" onClick={() => setActiveView('my')} aria-pressed={activeView === 'my'} className={`btn rounded-pill ${activeView === 'my' ? 'btn-primary' : 'btn-outline-secondary'}`} > My </button>
            <button type="button" onClick={() => setActiveView('all')} aria-pressed={activeView === 'all'} className={`btn rounded-pill ${activeView === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} > All </button>
            <button type="button" onClick={() => setActiveView('create')} aria-pressed={activeView === 'create'} className={`btn rounded-pill ${activeView === 'create' ? 'btn-primary' : 'btn-outline-secondary'}`} > Create </button>
          </div>
        </div>
        {activeView === 'create' && renderCreateTab()}
        {activeView !== 'create' && (
          <>
            <div className="row g-3">{visibleEvents.map(renderEventCard)}</div>

            {activeView === 'my' && visibleEvents.length === 0 && (
              <div className="mt-3">
                <p className="text-body-secondary mb-0">To sign up for an event, switch to All.</p>
              </div>
            )}

            {(activeView !== 'my' || pastEvents.length > 0 || userHasAnyRegistrations) && (
              <div className="mt-4 rounded overflow-hidden">
                <button type="button" aria-expanded={pastEventsOpen} onClick={() => setPastEventsOpen((prev) => !prev)} className="btn btn-link text-body text-decoration-none text-start w-100 px-3 py-3 d-flex align-items-center justify-content-between">
                  <h6 className="fw-semibold mb-0">Past Events</h6>
                  {pastEventsOpen ? (
                    <i className="fa-solid fa-chevron-up" aria-hidden="true" />
                  ) : (
                    <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                  )}
                </button>
                <div hidden={!pastEventsOpen}>
                  <div className="p-3 pt-0">
                    <div className="row g-3">{pastEvents.map(renderEventCard)}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <ConfirmDialog open={signUpDialogOpen} title="Sign Up for Event" confirmLabel="Continue to Checkout" onCancel={() => setSignUpDialogOpen(false)} onConfirm={handleSignUpConfirm} > Are you sure you want to sign up for this event? </ConfirmDialog>
        <ConfirmDialog open={cancelDialogOpen} title="Cancel Event Registration" confirmLabel="Yes, Cancel Registration" cancelLabel="No" confirmColor="error" onCancel={() => setCancelDialogOpen(false)} onConfirm={handleCancelConfirm} > Are you sure you want to cancel your registration? Contact your event organizer for refund questions. </ConfirmDialog>
        <ViewRegisteredUsers open={viewRegisteredUsersDialogOpen} event={selectedEventForRegisteredUsers} onClose={() => setViewRegisteredUsersDialogOpen(false)} />
        {/* Generate Schedules Dialog */}
        <ConfirmDialog open={!!eventToRegenerate} title="Re-generate Schedules" confirmLabel="Continue" confirmColor="error" onCancel={() => setEventToRegenerate(null)} onConfirm={handleRegenerateConfirm} >
          Are you sure you want to Re-generate Schedules?
          <p className="mt-2 mb-0"> This will lose <strong>all</strong> current progress and re-generate each attendee&apos;s schedule. </p>
        </ConfirmDialog>
        <ConfirmDialog open={checkedInConfirmationOpen} title="Generate Schedules" confirmLabel="Next" cancelLabel="Cancel" onCancel={() => setCheckedInConfirmationOpen(false)} onConfirm={handleCheckedInConfirmation} >
          <p className="mt-2 fw-bold mb-0">{checkedInAttendeeCount} people are currently Checked in</p>
          <p className="mt-2 mb-0">Please ask all Attendees to see if they are Checked in</p>
          <p className="mb-0">Only Checked in attendees will be included in the schedule generation</p>
        </ConfirmDialog>
        <Modal onClose={() => setIsTableConfigOpen(false)} size="sm" open={isTableConfigOpen}>
          <div className="modal-header fw-semibold">Generate Schedules</div>
          <div className="modal-body">
            <div>Please specify how many tables and rounds you want for this event.</div>
            <div className="mt-3 mb-3">
              <div className="my-2 mb-3">
                <label className="d-block">
                  <span className="form-label d-block">{'Number of Tables'}</span>
                  <input className="form-control" type="number" value={numTables} onChange={(e) => setNumTables(e.target.value as any)} min={1} />
                </label>
              </div>
              <div className="my-2 w-100">
                <label className="d-block">
                  <span className="form-label d-block">{'Number of Rounds'}</span>
                  <input className="form-control" type="number" value={numRounds} onChange={(e) => setNumRounds(e.target.value as any)} min={1} />
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsTableConfigOpen(false)} className="btn btn-link"> Cancel </button>
            <button type="button" onClick={handleTableConfigSubmit} className="btn btn-primary"> Next </button>
          </div>
        </Modal>
        {/* Start Event Confirmation Dialog */}
        <ConfirmDialog open={startEventDialogOpen} title="Generate Schedules" confirmLabel="Generate Schedules" confirmColor="success" onCancel={() => setStartEventDialogOpen(false)} onConfirm={handleStartEvent} >
          Are you sure you want to generate schedules?
          <p className="mt-2 fw-bold mb-0"> This will use {numTables} tables and {numRounds} rounds. </p>
        </ConfirmDialog>
        <ViewAllSchedules open={viewAllSchedulesDialogOpen} event={selectedEventForAllSchedules} onClose={() => setViewAllSchedulesDialogOpen(false)} />
        {/* ADD: Edit Event Dialog */}
        <Modal onClose={() => setEditEventDialogOpen(false)} size="" open={editEventDialogOpen}>
          <div className="modal-header fw-semibold">Edit Event: {eventToEdit?.name}</div>
          <div className="modal-body">
            <div className="pt-2 row g-3">
              <div className="col-12">
                <div className="my-2 w-100">
                  <label className="d-block">
                    <span className="form-label d-block">{'Event Name'}</span>
                    <input className="form-control" name="name" value={editEventForm.name || ''} onChange={handleEditEventFormChange} required />
                  </label>
                </div>
              </div>
              <div className="col-12">
                <div className="my-2 w-100">
                  <label className="d-block">
                    <span className="form-label d-block">{'Description'}</span>
                    <textarea className="form-control" name="description" value={editEventForm.description || ''} onChange={handleEditEventFormChange} rows={4} />
                  </label>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="my-2 w-100">
                  <label className="d-block">
                    <span className="form-label d-block">{'Start Date and Time'}</span>
                    <input className="form-control" name="starts_at" type="datetime-local" value={editEventForm.starts_at || ''} onChange={handleEditEventFormChange} required />
                  </label>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="my-2 w-100">
                  <label className="d-block">
                    <span className="form-label d-block">{'Address'}</span>
                    <input className="form-control" name="address" value={editEventForm.address || ''} onChange={handleEditEventFormChange} />
                  </label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-check my-2">
                  {
                    <input type="checkbox" checked={Boolean(editEventForm.enforce_gender_balance)} onChange={(e) => setEditEventForm((prev) => ({ ...prev, enforce_gender_balance: e.target.checked }))} className="form-check-input" />
                  }
                  <span className="form-check-label">{'Enforce 60/40 gender balance'}</span>
                </label>
                <p className="text-body-secondary ms-5 mb-0 small">E.g. if Max Capacity is 100, the 61st female (or male) will be waitlisted.</p>
              </div>
              <div className="col-6 col-sm-6">
                <div className="my-2 w-100">
                  <label className="d-block">
                    <span className="form-label d-block">{'Max Capacity'}</span>
                    <input className="form-control" name="max_capacity" type="number" value={editEventForm.max_capacity || ''} onChange={handleEditEventFormChange} min={0} />
                  </label>
                </div>
              </div>
              <div className="col-6 col-sm-6">
                <div className="my-2 w-100">
                  <label className="d-block">
                    <span className="form-label d-block">{'Price Per Person'}</span>
                    <input className="form-control" name="price_per_person" type="number" value={editEventForm.price_per_person || '0'} onChange={handleEditEventFormChange} min={0} step={'0.01'} />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setEditEventDialogOpen(false)} className="btn btn-link"> Cancel </button>
            <button type="button" onClick={handleUpdateEvent} className="btn btn-primary"> Update Event </button>
          </div>
        </Modal>
        <ConfirmDialog open={waitlistDialogOpen} title={`Join Waitlist for "${eventForWaitlist?.name}"?`} confirmLabel="Yes, Join Waitlist" cancelLabel="No, Thanks" onCancel={() => { setWaitlistDialogOpen(false); setEventForWaitlist(null); }} onConfirm={handleJoinWaitlistConfirm} >
          {waitlistReason}. Would you like to be added to the waitlist?
          <p className="text-body-secondary mt-2 mb-0 small">If a spot opens, we will email you so you can return and sign up yourself.</p>
        </ConfirmDialog>
        <ViewWaitlistedUsers open={viewWaitlistDialogOpen} event={selectedEventForWaitlistUsers} onClose={() => setViewWaitlistDialogOpen(false)} />
      </div>
    </>
  );
};

export default EventList;
