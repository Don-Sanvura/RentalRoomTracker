import { describe, expect, it } from 'vitest';
import { daysUntil, noticeLabel } from './format';
import type { Room } from './types';
import { emptyDraft, validateDraft } from './validate';

describe('validateDraft', () => {
  it('flags missing required fields', () => {
    const r = validateDraft(emptyDraft);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toEqual(expect.arrayContaining(['roomNumber', 'costPerRoom', 'rentPerMonth']));
  });

  it('produces a typed payload and nulls the date when no notice', () => {
    const r = validateDraft({ ...emptyDraft, roomNumber: ' 12 ', costPerRoom: '5000', rentPerMonth: '900', noticeDate: '2030-01-01' });
    expect(r).toMatchObject({ ok: true, value: { roomNumber: '12', rentPerMonth: 900, noticeDate: null } });
  });

  it('requires a date when notice is given', () => {
    const r = validateDraft({ ...emptyDraft, roomNumber: '1', costPerRoom: '1', rentPerMonth: '1', noticeGiven: true });
    expect(r.ok).toBe(false);
  });

  it('rejects negatives and fractional occupants', () => {
    const r = validateDraft({ ...emptyDraft, roomNumber: '1', costPerRoom: '-1', rentPerMonth: '1', occupants: '1.5' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toEqual(expect.arrayContaining(['costPerRoom', 'occupants']));
  });
});

describe('dates', () => {
  const today = new Date(2025, 5, 10, 15, 30);
  it('counts whole days regardless of time of day', () => {
    expect(daysUntil('2025-06-13', today)).toBe(3);
    expect(daysUntil('2025-06-10', today)).toBe(0);
    expect(daysUntil('2025-06-09', today)).toBe(-1);
  });
  it('labels notices', () => {
    const base = { noticeGiven: true } as Room;
    expect(noticeLabel({ ...base, noticeDate: '2025-06-10' }, today)).toBe('Leaving today');
    expect(noticeLabel({ ...base, noticeGiven: false, noticeDate: null }, today)).toBe('');
  });
});
