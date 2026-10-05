import Modal from '../common/Modal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { eventsApi } from '../../services/api';
import { ScheduleItem, Timer } from '../../types/event';

type TimerStatus = 'active' | 'paused' | 'inactive' | 'ended' | 'break_time';

interface EventTimerProps {
  eventId: number;
  isAdmin: boolean;
  isCheckedIn?: boolean;
  eventStatus?: string;
  onRoundChange?: (round: number) => void;
}

const TIMER_POLL_MS = 5000;
const DEFAULT_ROUND_DURATION = 210;
const DEFAULT_BREAK_DURATION = 90;
const PREVIOUS_ROUND_THRESHOLD_SECONDS = 5;

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const getTimerStatus = (timer: Timer | null): TimerStatus => {
  if (!timer) return 'inactive';
  if (timer.is_paused) return 'paused';
  if (!timer.round_start_time) return 'inactive';

  const startedAt = new Date(timer.round_start_time).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const roundEnded = elapsedSeconds >= timer.round_duration;

  if (roundEnded && timer.current_round >= timer.final_round) return 'ended';
  if (roundEnded) return 'break_time';
  return 'active';
};

const getTimerSeconds = (timer: Timer | null): number => {
  if (!timer) return 0;

  const status = getTimerStatus(timer);
  if (status === 'paused') return timer.pause_time_remaining ?? 0;
  if (!timer.round_start_time) return 0;

  const startedAt = new Date(timer.round_start_time).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

  if (status === 'active') {
    return Math.max(0, timer.round_duration - elapsedSeconds);
  }

  if (status === 'break_time') {
    const breakElapsedSeconds = elapsedSeconds - timer.round_duration;
    return Math.max(0, timer.break_duration - breakElapsedSeconds);
  }

  return 0;
};

const getElapsedSeconds = (timer: Timer | null): number => {
  if (!timer) return 0;

  if (timer.is_paused) {
    if (timer.pause_time_remaining == null) return 0;
    return Math.max(0, timer.round_duration - timer.pause_time_remaining);
  }

  if (!timer.round_start_time) return 0;

  const startedAt = new Date(timer.round_start_time).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, elapsedSeconds);
};

const EventTimer = ({ eventId, isAdmin, isCheckedIn = false, eventStatus = 'In Progress', onRoundChange }: EventTimerProps): JSX.Element | null => {
  const isEventActive = eventStatus === 'In Progress' || eventStatus === 'Paused';
  const eventIdString = eventId.toString();
  const [timer, setTimer] = useState<Timer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newDuration, setNewDuration] = useState(DEFAULT_ROUND_DURATION);
  const [newBreakDuration, setNewBreakDuration] = useState(DEFAULT_BREAK_DURATION);
  const lastNotifiedRoundRef = useRef<number | null>(null);
  const [userSchedule, setUserSchedule] = useState<ScheduleItem[] | undefined>(undefined);

  const timerStatus = getTimerStatus(timer);
  const currentRound = timer?.current_round ?? 0;
  const roundDuration = timer?.round_duration ?? DEFAULT_ROUND_DURATION;
  const breakDuration = timer?.break_duration ?? DEFAULT_BREAK_DURATION;
  const currentRoundSchedule = userSchedule?.find((item) => item.round === currentRound);

  const isActive = timerStatus === 'active';
  const isPaused = timerStatus === 'paused';
  const isBreakTime = timerStatus === 'break_time';
  const isEnded = timerStatus === 'ended';
  const isInactive = timerStatus === 'inactive';
  const isAlmostDone = isActive && timeRemaining <= 10;
  const adminTitle = isEnded ? 'Finished' : isBreakTime ? 'Break' : `Round ${currentRound || '-'}`;
  const mainTime = isEnded ? '--:--' : isActive || isPaused || isBreakTime ? formatTime(timeRemaining) : '--:--';
  const startLabel = isBreakTime ? `Start Round ${currentRound + 1}` : 'Start Round';
  const attendeeMessage = isEnded
    ? 'Event Finished - Save your selections!'
    : isInactive
      ? 'Event will be starting shortly!'
      : isPaused && currentRoundSchedule
        ? `Round ${currentRound} paused`
        : isBreakTime
          ? `Get to your table for Round ${currentRound + 1}!`
          : currentRoundSchedule
            ? `Table ${currentRoundSchedule.table} with ${currentRoundSchedule.partner_name}`
            : currentRound > 0
              ? 'You are on break this round'
              : 'Waiting for round...';

  const fetchTimer = useCallback(async () => {
    if (!isEventActive) return;

    try {
      const nextTimer = await eventsApi.getTimer(eventIdString);
      setTimer(nextTimer);
      setTimeRemaining(getTimerSeconds(nextTimer));
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to load timer');
    } finally {
      setIsLoading(false);
    }
  }, [eventIdString, isEventActive]);

  useEffect(() => {
    if (currentRound <= 0) return;
    if (lastNotifiedRoundRef.current === currentRound) return;
    lastNotifiedRoundRef.current = currentRound;
    onRoundChange?.(currentRound);
  }, [currentRound, onRoundChange]);

  useEffect(() => {
    fetchTimer();
    const pollId = window.setInterval(fetchTimer, TIMER_POLL_MS);
    return () => window.clearInterval(pollId);
  }, [fetchTimer]);

  useEffect(() => {
    if (!isActive && !isBreakTime) return;
    if (timeRemaining <= 0) return;

    const tickId = window.setInterval(() => {
      setTimeRemaining((previousSeconds) => Math.max(0, previousSeconds - 1));
    }, 1000);

    return () => window.clearInterval(tickId);
  }, [isActive, isBreakTime, timeRemaining]);

  useEffect(() => {
    if (!isCheckedIn) {
      setUserSchedule(undefined);
      return;
    }
    const loadSchedule = async () => {
      try {
        const response = await eventsApi.getSchedule(eventIdString);
        setUserSchedule(response?.schedule || []);
      } catch {
        setUserSchedule([]);
      }
    };
    loadSchedule();
  }, [eventIdString, isCheckedIn]);

  const runTimerAction = async (action: () => Promise<unknown>) => {
    try {
      setErrorMessage(null);
      await action();
      await fetchTimer();
    } catch (error: any) {
      setErrorMessage(error.message || 'Timer action failed');
    }
  };

  const handleStartRound = () => {
    runTimerAction(async () => {
      if (isBreakTime) {
        await eventsApi.nextTimerRound(eventIdString);
      }
      await eventsApi.startTimerRound(eventIdString);
    });
  };

  const handleEndRound = () => {
    runTimerAction(() => eventsApi.endTimerRound(eventIdString));
  };

  const handleBackRound = () => {
    if (!timer || isEnded) return;

    if (isBreakTime) {
      runTimerAction(() => eventsApi.startTimerRound(eventIdString, currentRound));
      return;
    }

    const elapsedSeconds = getElapsedSeconds(timer);
    if ((isActive || isPaused) && elapsedSeconds > PREVIOUS_ROUND_THRESHOLD_SECONDS) {
      runTimerAction(() => eventsApi.startTimerRound(eventIdString, currentRound || 1));
      return;
    }

    if (currentRound > 1) {
      runTimerAction(() => eventsApi.startTimerRound(eventIdString, currentRound - 1));
      return;
    }

    runTimerAction(() => eventsApi.startTimerRound(eventIdString, 1));
  };

  const handlePauseRound = () => {
    if (!isActive) return;
    runTimerAction(() => eventsApi.pauseTimerRound(eventIdString, timeRemaining));
  };

  const handleResumeRound = () => {
    if (!isPaused) return;
    runTimerAction(() => eventsApi.resumeTimerRound(eventIdString));
  };

  const handlePrimaryControl = () => {
    if (isActive) {
      handlePauseRound();
      return;
    }
    if (isPaused) {
      handleResumeRound();
      return;
    }
    if (isInactive || isBreakTime) {
      handleStartRound();
    }
  };

  const handleForwardControl = () => {
    if (!isActive) return;
    handleEndRound();
  };

  const handleUpdateDuration = () => {
    if (newDuration === roundDuration && newBreakDuration === breakDuration) {
      setIsSettingsOpen(false);
      return;
    }

    runTimerAction(() => eventsApi.updateTimerDuration(eventIdString, { round_duration: newDuration, break_duration: newBreakDuration }));
    setIsSettingsOpen(false);
  };

  const openSettingsDialog = () => {
    setNewDuration(roundDuration);
    setNewBreakDuration(breakDuration);
    setIsSettingsOpen(true);
  };

  const tone = isAlmostDone ? 'danger' : isActive ? 'primary' : isPaused ? 'warning' : isBreakTime ? 'info' : 'secondary';
  const progressPercentage = !isActive || roundDuration <= 0 ? 0 : Math.max(0, Math.min(100, (timeRemaining / roundDuration) * 100));
  const renderLoading = () => (
    <div className="text-center">
      <div className="spinner-border spinner-border-sm" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  const renderAttendeeView = () =>
    isLoading ? (
      renderLoading()
    ) : (
      <div className={`d-flex align-items-center gap-2 p-2 my-2 border rounded border-${tone}`}>
        <i className={`fa-solid fa-stopwatch text-${tone}`} aria-hidden="true" />
        <div className="flex-grow-1">
          <p className="fw-semibold mb-0">{adminTitle}</p>
          <p className="small text-body-secondary mb-0">{attendeeMessage}</p>
        </div>
        {(isActive || isBreakTime || isPaused) && <div className="text-primary fw-bold">{mainTime}</div>}
      </div>
    );

  const renderAdminControls = () =>
    isEnded ? (
      <p className="text-center text-body-secondary mb-0">Event Finished</p>
    ) : (
      <div className="d-flex justify-content-center align-items-center gap-3">
        <button type="button" className="btn btn-outline-secondary" onClick={handleBackRound} disabled={isInactive && currentRound <= 1} aria-label={isBreakTime ? 'Restart this round' : 'Restart round or go to previous round'} title={isBreakTime ? 'Restart this round' : 'Restart round or go to previous round'} >
          <i className="fa-solid fa-backward-step" aria-hidden="true" />
        </button>
        <button type="button" className={`btn btn-lg ${isActive ? 'btn-warning' : 'btn-primary'}`} onClick={handlePrimaryControl} aria-label={isActive ? 'Pause round' : isPaused ? 'Resume round' : startLabel} title={isActive ? 'Pause round' : isPaused ? 'Resume round' : startLabel} >
          <i className={`fa-solid ${isActive ? 'fa-pause' : 'fa-play'}`} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleForwardControl} disabled={!isActive} aria-label="Skip to break" title="Skip to break" >
          <i className="fa-solid fa-forward-step" aria-hidden="true" />
        </button>
      </div>
    );

  const renderAdminView = () =>
    isLoading ? (
      renderLoading()
    ) : (
      <div className="my-2 w-100">
        {errorMessage && (
          <div className="alert alert-danger" role="alert"> {errorMessage} </div>
        )}
        <div className={`border rounded p-2 bg-${tone}-subtle border-${tone}`}>
          <div className="row align-items-center g-1">
            <div className="col-4 small">
              <i className={`fa-solid fa-stopwatch me-1 text-${tone}`} aria-hidden="true" />
              {adminTitle}
            </div>
            <div className={`col-4 fs-2 text-center fw-semibold text-${tone}`}>{mainTime}</div>
            <div className="col-4 text-end">
              {!isActive && !isPaused && (
                <button type="button" className="btn btn-outline-secondary" onClick={openSettingsDialog} aria-label="Timer settings" title="Settings">
                  <i className="fa-solid fa-gear" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {isActive && (
            <div className="progress mt-2" role="progressbar" aria-label="Round time remaining" aria-valuenow={Math.round(progressPercentage)} aria-valuemin={0} aria-valuemax={100} >
              <div className="progress-bar" style={{ width: `${progressPercentage}%` }} />
            </div>
          )}
        </div>
        <div className="border rounded p-2 mt-1">{renderAdminControls()}</div>
      </div>
    );

  if (!isEventActive && !isAdmin) return null;
  return (
    <div className="my-3">
      {isAdmin ? renderAdminView() : renderAttendeeView()}
      <Modal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} size="sm">
        <div className="modal-header">
          <h2 className="fs-5 mb-0"> <i className="fa-solid fa-gear me-2 text-primary" aria-hidden="true" /> Timer Settings </h2>
        </div>
        <div className="modal-body">
          <label className="form-label" htmlFor="round-duration-slider">
            Round Duration: <span className="text-primary">{formatTime(newDuration)}</span>
          </label>
          <input id="round-duration-slider" className="form-range" type="range" value={newDuration} min={30} max={600} step={30} onChange={(e) => setNewDuration(Number(e.target.value))} />
          <label className="form-label mt-3" htmlFor="break-duration-slider">
            Break Duration: <span className="text-primary">{formatTime(newBreakDuration)}</span>
          </label>
          <input id="break-duration-slider" className="form-range" type="range" value={newBreakDuration} min={15} max={600} step={15} onChange={(e) => setNewBreakDuration(Number(e.target.value))} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-link" onClick={() => setIsSettingsOpen(false)}> Cancel </button>
          <button type="button" className="btn btn-primary" onClick={handleUpdateDuration}> Save Settings </button>
        </div>
      </Modal>
    </div>
  );
};

export default EventTimer;
