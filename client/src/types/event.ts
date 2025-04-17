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
}
