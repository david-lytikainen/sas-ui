import { randomBytes } from 'crypto';

export const generateId = (): string => {
  return randomBytes(16).toString('hex');
}; 