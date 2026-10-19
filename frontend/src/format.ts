import type { Room } from './types';

// Set VITE_CURRENCY (e.g. ZAR, GBP, EUR) to change the displayed currency.
const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: import.meta.env.VITE_CURRENCY || 'USD',
  maximumFractionDigits: 2,
});
export const formatMoney = (n: number) => money.format(n);

/** Parse a YYYY-MM-DD string as a local date (new Date('2025-01-01') would be UTC and can shift a day). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export const formatDate = (iso: string) =>
  parseDate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Whole days from `today` until the date; negative if it has passed. */
export function daysUntil(iso: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseDate(iso).getTime() - start.getTime()) / 86_400_000);
}

export function noticeLabel(room: Room, today = new Date()): string {
  if (!room.noticeGiven || !room.noticeDate) return '';
  const days = daysUntil(room.noticeDate, today);
  const when = formatDate(room.noticeDate);
  if (days < 0) return `Left ${when}`;
  if (days === 0) return `Leaving today`;
  return `Leaving ${when} (${days}d)`;
}
