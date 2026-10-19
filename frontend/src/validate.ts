import type { Condition, RoomInput } from './types';

/** Raw form state: numbers stay as strings while the user types. */
export interface RoomDraft {
  roomNumber: string;
  condition: Condition;
  costPerRoom: string;
  depositMade: string;
  rentPerMonth: string;
  moneyOwed: string;
  occupants: string;
  noticeGiven: boolean;
  noticeDate: string;
  notes: string;
}

export type FieldErrors = Partial<Record<keyof RoomDraft, string>>;

export const emptyDraft: RoomDraft = {
  roomNumber: '',
  condition: 'Good',
  costPerRoom: '',
  depositMade: '0',
  rentPerMonth: '',
  moneyOwed: '0',
  occupants: '0',
  noticeGiven: false,
  noticeDate: '',
  notes: '',
};

const moneyFields = ['costPerRoom', 'depositMade', 'rentPerMonth', 'moneyOwed'] as const;
const labels = {
  costPerRoom: 'Cost per room',
  depositMade: 'Deposit',
  rentPerMonth: 'Monthly rent',
  moneyOwed: 'Money owed',
} as const;

/** Returns either a clean API payload or per-field messages. */
export function validateDraft(
  d: RoomDraft,
): { ok: true; value: RoomInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  if (!d.roomNumber.trim()) errors.roomNumber = 'Room number is required';

  const nums: Record<string, number> = {};
  for (const f of moneyFields) {
    const n = Number(d[f]);
    if (d[f].trim() === '' || !Number.isFinite(n)) errors[f] = `${labels[f]} must be a number`;
    else if (n < 0) errors[f] = 'Must be 0 or more';
    else nums[f] = n;
  }

  const occupants = Number(d.occupants);
  if (d.occupants.trim() === '' || !Number.isInteger(occupants) || occupants < 0 || occupants > 50) {
    errors.occupants = 'Enter a whole number from 0 to 50';
  }

  if (d.noticeGiven && !d.noticeDate) errors.noticeDate = 'Pick the date they are leaving';

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      roomNumber: d.roomNumber.trim(),
      condition: d.condition,
      costPerRoom: nums.costPerRoom!,
      depositMade: nums.depositMade!,
      rentPerMonth: nums.rentPerMonth!,
      moneyOwed: nums.moneyOwed!,
      occupants,
      noticeGiven: d.noticeGiven,
      noticeDate: d.noticeGiven ? d.noticeDate : null,
      notes: d.notes.trim(),
    },
  };
}
