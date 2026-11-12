import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateOnly, parseDateOnly } from '../../utils/date';
import Modal from './Modal';

interface BirthdayPickerProps {
  value: string;
  onChange: (value: string) => void;
  minAge?: number;
  minYear?: number;
  startingYear?: number;
  isDateDisabled?: (date: Date) => boolean;
}

type PickerView = 'year' | 'month' | 'day';

const MONTHS = Array.from({ length: 12 }, (_, month) => new Date(2000, month).toLocaleString(undefined, { month: 'short' }));

const BirthdayPicker = ({ value, onChange, minAge = 18, minYear = 1930, startingYear = 2000, isDateDisabled }: BirthdayPickerProps) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>('year');
  const [selectedYear, setSelectedYear] = useState(startingYear);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const initialYearRef = useRef<HTMLButtonElement>(null);
  const maxDate = useMemo(() => { const today = new Date(); return new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()); }, [minAge]);
  const years = useMemo(() => Array.from({ length: new Date().getFullYear() - minYear + 1 }, (_, index) => minYear + index), [minYear]);
  const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const selectedDate = parseDateOnly(value);

  useEffect(() => {
    if (open && view === 'year') initialYearRef.current?.scrollIntoView({ block: 'center' });
  }, [open, view]);

  const openPicker = () => {
    const current = parseDateOnly(value);
    setSelectedYear(current?.getFullYear() || startingYear);
    setSelectedMonth(current?.getMonth() || 0);
    setView('year');
    setOpen(true);
  };

  const previousView = () => setView(view === 'day' ? 'month' : 'year');
  const isDisabled = (year: number, month: number, day: number) => { const date = new Date(year, month, day); return date > maxDate || Boolean(isDateDisabled?.(date)); };
  const isMonthDisabled = (year: number, month: number) => Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => index + 1).every((day) => isDisabled(year, month, day));
  const isYearDisabled = (year: number) => Array.from({ length: 12 }, (_, month) => month).every((month) => isMonthDisabled(year, month));
  const optionClass = (active: boolean, disabled: boolean) => `btn w-100 ${active ? 'btn-primary' : 'btn-outline-secondary'} ${disabled ? 'opacity-25' : ''}`;

  return (
    <>
      <button type="button" className="form-control text-start" onClick={openPicker}>{selectedDate ? selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : `Birthday${minAge ? ` (${minAge}+ only)` : ''}`}</button>
      <Modal open={open} onClose={() => setOpen(false)} size="sm">
        <div className="modal-header p-2">
          {view !== 'year' && <button type="button" className="btn btn-link text-body p-1" onClick={previousView}><i className="fa-solid fa-arrow-left" /></button>}
          <p className="modal-title fw-bold mb-0 flex-grow-1 text-center">Select {view}</p>
          <button type="button" className="btn btn-link text-body p-1" onClick={() => setOpen(false)}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body overflow-y-auto overflow-x-hidden">
          {view === 'year' && <div className="row g-2" style={{ maxHeight: '30dvh' }}>{years.map((year) => { const disabled = isYearDisabled(year); return <div key={year} className="col-4"><button ref={year === (selectedDate?.getFullYear() || startingYear) ? initialYearRef : undefined} type="button" disabled={disabled} className={optionClass(year === selectedDate?.getFullYear(), disabled)} style={{ filter: disabled ? 'blur(0.8px)' : undefined }} onClick={() => { setSelectedYear(year); setView('month'); }}>{year}</button></div>; })}</div>}
          {view === 'month' && <div className="row g-2">{MONTHS.map((month, index) => { const disabled = isMonthDisabled(selectedYear, index); return <div key={month} className="col-4"><button type="button" disabled={disabled} className={optionClass(index === selectedDate?.getMonth() && selectedYear === selectedDate?.getFullYear(), disabled)} style={{ filter: disabled ? 'blur(0.8px)' : undefined }} onClick={() => { setSelectedMonth(index); setView('day'); }}>{month}</button></div>; })}</div>}
          {view === 'day' && <div className="row g-2">{Array.from({ length: days }, (_, index) => index + 1).map((day) => { const disabled = isDisabled(selectedYear, selectedMonth, day); return <div key={day} className="col-2"><button type="button" disabled={disabled} className={`${optionClass(day === selectedDate?.getDate() && selectedMonth === selectedDate?.getMonth() && selectedYear === selectedDate?.getFullYear(), disabled)} d-flex align-items-center justify-content-center px-0`} style={{ filter: disabled ? 'blur(0.8px)' : undefined }} onClick={() => { onChange(formatDateOnly(new Date(selectedYear, selectedMonth, day))); setOpen(false); }}>{day}</button></div>; })}</div>}
        </div>
      </Modal>
    </>
  );
};

export default BirthdayPicker;
