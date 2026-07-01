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
    registration_date?: string;
    check_in_date?: string;
  };
  num_rounds?: string;
  num_tables?: string;
}

export interface ScheduleItem {
  round: number;
  table: number;
  partner_id: number;
  partner_name: string;
  partner_age: number | null;
  partner_email: string;
  event_speed_date_id: number;
  match: boolean;
  user_interested: boolean;
}

export interface Timer {
  id: number;
  event_id: number;
  current_round: number;
  final_round: number;
  round_duration: number;
  round_start_time: string | null;
  is_paused: boolean;
  pause_time_remaining: number | null;
  break_duration: number;
}
