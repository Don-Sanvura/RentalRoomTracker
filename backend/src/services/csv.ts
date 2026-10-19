import { statusOf, type Room } from '../room.js';

/** Quote a field, and neutralise spreadsheet formulas (CSV injection) by prefixing a quote. */
export function csvCell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const HEADER = [
  'Room', 'Condition', 'CostPerRoom', 'DepositMade', 'RentPerMonth', 'MoneyOwed',
  'PeopleLivingThere', 'Status', 'LeavingNotice', 'LeavingDate', 'Notes',
];

export function roomsToCsv(rooms: Room[]): string {
  const rows = rooms.map((r) =>
    [
      r.roomNumber, r.condition, r.costPerRoom.toFixed(2), r.depositMade.toFixed(2),
      r.rentPerMonth.toFixed(2), r.moneyOwed.toFixed(2), r.occupants, statusOf(r),
      r.noticeGiven ? 'Yes' : 'No', r.noticeDate, r.notes,
    ].map(csvCell).join(','),
  );
  return [HEADER.join(','), ...rows].join('\r\n') + '\r\n';
}
