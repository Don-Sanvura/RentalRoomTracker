import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../errors.js';
import type { Room, RoomInput } from '../room.js';

export interface RoomStore {
  list(): Promise<Room[]>;
  get(id: string): Promise<Room | undefined>;
  create(input: RoomInput): Promise<Room>;
  update(id: string, input: RoomInput): Promise<Room>;
  remove(id: string): Promise<boolean>;
}

const sameNumber = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Rooms held in memory and persisted to a JSON file. Writes are serialised through a
 * promise chain and land via write-temp-then-rename, so a crash can't truncate the file.
 * Pass `file = null` for a purely in-memory store (used by tests).
 */
export class JsonRoomStore implements RoomStore {
  private rooms: Room[] = [];
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string | null) {}

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (this.file) {
      try {
        this.rooms = JSON.parse(await readFile(this.file, 'utf8')) as Room[];
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    }
    this.loaded = true;
  }

  /** Run a mutation exclusively: validate, apply, then persist. Rolls back if persisting fails. */
  private mutate<T>(fn: () => T): Promise<T> {
    const run = async () => {
      await this.ensureLoaded();
      const snapshot = this.rooms;
      try {
        const result = fn();
        await this.persist();
        return result;
      } catch (err) {
        this.rooms = snapshot;
        throw err;
      }
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async persist(): Promise<void> {
    if (!this.file) return;
    await mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(this.rooms, null, 2), 'utf8');
    await rename(tmp, this.file);
  }

  private assertUnique(roomNumber: string, ignoreId?: string): void {
    if (this.rooms.some((r) => r.id !== ignoreId && sameNumber(r.roomNumber, roomNumber))) {
      throw new HttpError(409, `Room "${roomNumber}" already exists`);
    }
  }

  async list(): Promise<Room[]> {
    await this.ensureLoaded();
    return [...this.rooms];
  }

  async get(id: string): Promise<Room | undefined> {
    await this.ensureLoaded();
    return this.rooms.find((r) => r.id === id);
  }

  create(input: RoomInput): Promise<Room> {
    return this.mutate(() => {
      this.assertUnique(input.roomNumber);
      const now = new Date().toISOString();
      const room: Room = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
      this.rooms = [...this.rooms, room];
      return room;
    });
  }

  update(id: string, input: RoomInput): Promise<Room> {
    return this.mutate(() => {
      const existing = this.rooms.find((r) => r.id === id);
      if (!existing) throw new HttpError(404, 'Room not found');
      this.assertUnique(input.roomNumber, id);
      const room: Room = { ...existing, ...input, updatedAt: new Date().toISOString() };
      this.rooms = this.rooms.map((r) => (r.id === id ? room : r));
      return room;
    });
  }

  remove(id: string): Promise<boolean> {
    return this.mutate(() => {
      const before = this.rooms.length;
      this.rooms = this.rooms.filter((r) => r.id !== id);
      return this.rooms.length < before;
    });
  }
}
