export const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);

export const formatPhone = (value: string) => {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
};
