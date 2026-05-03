import type { TaskStatus } from './types';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidStatus(s: string | undefined): s is TaskStatus {
  return (
    s === 'backlog' ||
    s === 'in-progress' ||
    s === 'done' ||
    s === 'cancelled'
  );
}

export function isIsoDateYYYYMMDD(s: string | undefined): boolean {
  return Boolean(s && DATE_RX.test(s));
}
