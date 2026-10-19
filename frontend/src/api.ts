import type { Room, RoomInput, Summary } from './types';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.fields);
  return body as T;
}

export const api = {
  listRooms: () => request<Room[]>('/api/rooms'),
  summary: () => request<Summary>('/api/summary'),
  createRoom: (input: RoomInput) => request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(input) }),
  updateRoom: (id: string, input: RoomInput) =>
    request<Room>(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteRoom: (id: string) => request<void>(`/api/rooms/${id}`, { method: 'DELETE' }),
  exportUrl: `${BASE}/api/rooms/export.csv`,
};
