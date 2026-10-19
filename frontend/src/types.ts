export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'] as const;
export type Condition = (typeof CONDITIONS)[number];

export interface RoomInput {
  roomNumber: string;
  condition: Condition;
  costPerRoom: number;
  depositMade: number;
  rentPerMonth: number;
  moneyOwed: number;
  occupants: number;
  noticeGiven: boolean;
  noticeDate: string | null;
  notes: string;
}

export interface Room extends RoomInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

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

export const isAvailable = (room: Pick<Room, 'occupants'>) => room.occupants === 0;
