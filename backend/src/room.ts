import { z } from 'zod';

export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'] as const;
export type Condition = (typeof CONDITIONS)[number];

const money = z.number().finite().min(0, 'Must be 0 or more').max(10_000_000);

/** Fields a client may send. Everything else (id, timestamps) is server-owned. */
export const roomInputSchema = z
  .object({
    roomNumber: z.string().trim().min(1, 'Room number is required').max(40),
    condition: z.enum(CONDITIONS).default('Good'),
    costPerRoom: money,
    depositMade: money.default(0),
    rentPerMonth: money,
    moneyOwed: money.default(0),
    occupants: z.number().int().min(0).max(50).default(0),
    noticeGiven: z.boolean().default(false),
    noticeDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .nullable()
      .default(null),
    notes: z.string().trim().max(500).default(''),
  })
  .superRefine((room, ctx) => {
    if (room.noticeGiven && !room.noticeDate) {
      ctx.addIssue({ code: 'custom', path: ['noticeDate'], message: 'Required when notice is given' });
    }
    if (!room.noticeGiven && room.noticeDate) {
      ctx.addIssue({ code: 'custom', path: ['noticeDate'], message: 'Remove the date or mark notice as given' });
    }
  });

export type RoomInput = z.infer<typeof roomInputSchema>;

export interface Room extends RoomInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomStatus = 'available' | 'occupied';

/** A room with nobody living in it is available to rent. */
export const statusOf = (room: Pick<Room, 'occupants'>): RoomStatus =>
  room.occupants === 0 ? 'available' : 'occupied';
