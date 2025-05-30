export type EventStatus = 'Registration Open' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Event {
  id: number;
  name: string;
  description?: string;
  creator_id: number;
  starts_at: string;
  address: string;
  max_capacity: string;
  status: EventStatus;
  price_per_person: string;
  registration_deadline: string;
  registered_attendee_count?: number;
  registration?: {
    status: string;
    pin?: string;
    registration_date?: string;
    check_in_date?: string;
  };
}

export interface ScheduleItem {
  round: number;
  table: number;
  partner_id: number;
  partner_name: string;
  partner_age: number | null;
  event_speed_date_id: number;
}

export interface TimerState {
  has_timer: boolean;
  message: string;
  status: 'active' | 'paused' | 'inactive' | 'ended' | 'break_time';
  time_remaining: number;
  timer: {
    id: number;
    event_id: number;
    current_round: number;
    final_round: number;
    round_duration: number;
    round_start_time: string | null;
    is_paused: boolean;
    pause_time_remaining: number | null;
    break_duration: number;
  };
}