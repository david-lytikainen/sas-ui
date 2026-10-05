import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useEvents } from '../../context/EventContext';
import { EventStatus } from '../../types/event';

interface CreateEventProps {
  createdEventCount: number;
  onCreated: () => void;
  onError: (message: string) => void;
}

const getDefaultStartTime = () => {
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1);
  startTime.setHours(18, 0, 0, 0);
  const offset = startTime.getTimezoneOffset() * 60000;
  return new Date(startTime.getTime() - offset).toISOString().slice(0, 16);
};

const createInitialForm = () => ({
  name: '',
  description: '',
  starts_at: getDefaultStartTime(),
  address: '',
  max_capacity: '',
  price_per_person: '',
  enforce_gender_balance: true,
});

const CreateEvent = ({ createdEventCount, onCreated, onError }: CreateEventProps) => {
  const { createEvent } = useEvents();
  const [createForm, setCreateForm] = useState(createInitialForm);
  const isIntroEvent = createdEventCount < 1;
  const fixedFee = isIntroEvent ? 1 : 1.5;
  const percentFee = isIntroEvent ? 5 : 8;
  const minimumPrice = Number((fixedFee / (1 - percentFee / 100)).toFixed(2));
  const attendeePrice = parseFloat(createForm.price_per_person || '0') || 0;
  const platformFee = attendeePrice > 0 ? fixedFee + (attendeePrice * percentFee) / 100 : 0;
  const organizerPayout = Math.max(0, attendeePrice - platformFee);

  const isCreateDisabled =
    !createForm.name ||
    !createForm.description ||
    !createForm.starts_at ||
    !createForm.address ||
    !createForm.max_capacity ||
    !createForm.price_per_person;

  const handleCreateEvent = async () => {
    if (isCreateDisabled) {
      onError('All fields are required');
      return;
    }

    try {
      await createEvent({
        name: createForm.name,
        description: createForm.description,
        starts_at: createForm.starts_at,
        address: createForm.address,
        max_capacity: createForm.max_capacity,
        price_per_person: createForm.price_per_person,
        enforce_gender_balance: createForm.enforce_gender_balance,
        status: 'Registration Open' as EventStatus,
      });

      setCreateForm(createInitialForm());
      onCreated();
    } catch (error: any) {
      onError(error.message || 'Failed to create event');
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCreateForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setCreateForm((prevForm) => ({ ...prevForm, [name]: checked }));
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value) {
      const dateObj = new Date(value);
      const year = dateObj.getFullYear();

      if (year > 9999 || year < 1000 || isNaN(year)) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        setCreateForm((form) => ({ ...form, starts_at: localDate.toISOString().slice(0, 16) }));
        return;
      }
    }

    setCreateForm((form) => ({ ...form, starts_at: value }));
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setCreateForm((form) => ({ ...form, price_per_person: value }));
    }
  };

  const handlePriceBlur = () => {
    if (!createForm.price_per_person) return;
    if (attendeePrice < minimumPrice) {
      setCreateForm((form) => ({ ...form, price_per_person: minimumPrice.toFixed(2) }));
    }
  };

  return (
    <div className="rounded mb-4 card">
      <div className="p-3 p-sm-4 card-body">
        <div className="d-flex justify-content-between align-items-center mb-2 mb-sm-3 flex-wrap gap-2">
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Event Name'}</span>
              <input className="form-control" name="name" value={createForm.name} onChange={handleChange} required />
            </label>
          </div>
        </div>
        <div className="mb-3 mb-sm-3">
          <div className="my-2 w-100">
            <label className="d-block">
              <span className="form-label d-block">{'Description'}</span>
              <textarea className="form-control" name="description" value={createForm.description} onChange={handleChange} required placeholder="Description" rows={4} />
            </label>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-12">
            <div className="my-2 w-100">
              <label className="d-block">
                <span className="form-label d-block">{'Start Date and Time'}</span>
                <input className="form-control" name="starts_at" type="datetime-local" value={createForm.starts_at} onChange={handleDateChange} required />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-1 row g-3">
          <div className="col-12 col-sm-6">
            <div className="my-2 w-100">
              <label className="d-block">
                <span className="form-label d-block">{'Max Capacity'}</span>
                <input className="form-control" name="max_capacity" type="number" value={createForm.max_capacity} onChange={handleChange} required min={1} />
              </label>
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <div className="my-2 w-100">
              <label className="d-block">
                <span className="form-label d-block">{'Price Per Person'}</span>
                <span className="input-group">
                  <input className="form-control" name="price_per_person" type="number" value={createForm.price_per_person} onChange={handlePriceChange} onBlur={handlePriceBlur} required min={minimumPrice} step={'0.01'} />
                  {attendeePrice > 0 ? <span className="input-group-text">{`Payout to you: $${organizerPayout.toFixed(2)}`}</span> : undefined}
                </span>
              </label>
              <div className="form-text"> {attendeePrice > 0 ? `Platform fee: $${platformFee.toFixed(2)} (${isIntroEvent ? '$1.00 + 5%' : '$1.50 + 8%'})` : `Platform fee: ${isIntroEvent ? '$1.00 + 5%' : '$1.50 + 8%'}.`} </div>
            </div>
          </div>
          <div className="col-12">
            <div className="my-2 w-100">
              <label className="d-block">
                <span className="form-label d-block">{'Address'}</span>
                <input className="form-control" name="address" value={createForm.address} onChange={handleChange} required />
              </label>
            </div>
          </div>
          <div className="col-12">
            <label className="form-check my-2">
              {
                <input type="checkbox" checked={createForm.enforce_gender_balance} onChange={handleCheckboxChange} name="enforce_gender_balance" className="form-check-input" />
              }
              <span className="form-check-label">{'Enforce 60/40 gender balance'}</span>
            </label>
            <p className="text-body-secondary ms-5 mb-0 small">E.g. if Max Capacity is 100, the 61st female (or male) will be waitlisted.</p>
          </div>
        </div>
      </div>
      <div className="p-3 p-sm-3 pt-2 d-block card-footer d-flex flex-wrap gap-2">
        <button type="button" onClick={handleCreateEvent} disabled={isCreateDisabled} className="py-3 btn btn-primary w-100"> Create Event </button>
      </div>
    </div>
  );
};

export default CreateEvent;
