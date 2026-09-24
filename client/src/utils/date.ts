export const formatUTCToLocal = (utcDateString: string, includeTime = true) => {
  try {
    if (!includeTime && /^\d{4}-\d{2}-\d{2}$/.test(utcDateString)) {
      const [year, month, day] = utcDateString.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const date = new Date(utcDateString);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: includeTime ? '2-digit' : undefined, minute: includeTime ? '2-digit' : undefined });
  } catch {
    return 'Invalid date';
  }
};

export const parseDateOnly = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

export const formatDateOnly = (value: Date) => `${value.getFullYear()}-${`${value.getMonth() + 1}`.padStart(2, '0')}-${`${value.getDate()}`.padStart(2, '0')}`;
