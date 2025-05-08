export type EventStatus = 'Registration Open' | 'In Progress' | 'Completed' | 'Cancelled' | 'Paused';

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