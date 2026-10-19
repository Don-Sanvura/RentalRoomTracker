import { statusOf, type Room } from '../room.js';

export interface Summary {
  totalRooms: number;
  available: number;
  occupied: number;
  roomsWithArrears: number;
  totalOwed: number;
  expectedMonthlyRent: number;
  totalDeposits: number;
  occupancyRate: number;
  noticesGiven: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarise(rooms: Room[]): Summary {
  const occupiedRooms = rooms.filter((r) => statusOf(r) === 'occupied');
  return {
    totalRooms: rooms.length,
    available: rooms.length - occupiedRooms.length,
    occupied: occupiedRooms.length,
    roomsWithArrears: rooms.filter((r) => r.moneyOwed > 0).length,
    totalOwed: round2(rooms.reduce((s, r) => s + r.moneyOwed, 0)),
    expectedMonthlyRent: round2(occupiedRooms.reduce((s, r) => s + r.rentPerMonth, 0)),
    totalDeposits: round2(rooms.reduce((s, r) => s + r.depositMade, 0)),
    occupancyRate: rooms.length ? round2((occupiedRooms.length / rooms.length) * 100) : 0,
    noticesGiven: rooms.filter((r) => r.noticeGiven).length,
  };
}
