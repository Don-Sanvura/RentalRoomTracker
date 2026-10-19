import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import ConfirmDialog from './components/ConfirmDialog';
import RoomForm from './components/RoomForm';
import RoomTable, { type Sort, type SortKey } from './components/RoomTable';
import { formatMoney } from './format';
import { isAvailable, type Room, type RoomInput, type Summary } from './types';

type Filter = 'all' | 'available' | 'occupied' | 'owing' | 'notice';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'owing', label: 'Owing' },
  { id: 'notice', label: 'Notice given' },
];

const matches: Record<Filter, (r: Room) => boolean> = {
  all: () => true,
  available: isAvailable,
  occupied: (r) => !isAvailable(r),
  owing: (r) => r.moneyOwed > 0,
  notice: (r) => r.noticeGiven,
};

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={`stat${tone ? ` ${tone}` : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>({ key: 'roomNumber', dir: 'asc' });
  const [editing, setEditing] = useState<Room | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.listRooms(), api.summary()]);
      setRooms(r);
      setSummary(s);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rooms.filter(
      (r) => matches[filter](r) && (!q || r.roomNumber.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q)),
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) =>
      sort.key === 'roomNumber'
        ? dir * a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
        : dir * (a[sort.key] - b[sort.key]),
    );
  }, [rooms, query, filter, sort]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, rooms.filter(matches[f.id]).length])) as Record<Filter, number>,
    [rooms],
  );

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  async function save(input: RoomInput) {
    if (editing && editing !== 'new') await api.updateRoom(editing.id, input);
    else await api.createRoom(input);
    setToast(editing === 'new' ? `Room ${input.roomNumber} added` : `Room ${input.roomNumber} updated`);
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api.deleteRoom(deleting.id);
      setToast(`Room ${deleting.roomNumber} deleted`);
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not delete');
    }
    setDeleting(null);
  }

  return (
    <>
      <a href="#rooms" className="skip">Skip to rooms</a>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">⌂</span>
          <div>
            <h1>Rental Room Tracker</h1>
            <p>Every room, rent payment and move-out notice in one place</p>
          </div>
        </div>
        <div className="top-actions">
          <a className="btn" href={api.exportUrl} download>Export CSV</a>
          <button className="btn primary" onClick={() => setEditing('new')}>+ Add room</button>
        </div>
      </header>

      <main>
        {loadError && (
          <div className="banner error" role="alert">
            {loadError} <button className="link" onClick={() => void load()}>Retry</button>
          </div>
        )}

        <section className="stats" aria-label="Summary">
          <Stat label="Total rooms" value={summary ? String(summary.totalRooms) : '–'} sub={summary ? `${summary.occupancyRate}% occupied` : undefined} />
          <Stat label="Available" value={summary ? String(summary.available) : '–'} sub={summary ? `${summary.occupied} occupied` : undefined} tone="good" />
          <Stat label="Money owed" value={summary ? formatMoney(summary.totalOwed) : '–'} sub={summary ? `${summary.roomsWithArrears} room(s) in arrears` : undefined} tone={summary && summary.totalOwed > 0 ? 'bad' : undefined} />
          <Stat label="Monthly rent expected" value={summary ? formatMoney(summary.expectedMonthlyRent) : '–'} sub={summary ? `${summary.noticesGiven} notice(s) given` : undefined} tone={summary && summary.noticesGiven > 0 ? 'warn' : undefined} />
        </section>

        <section id="rooms" className="panel" aria-label="Rooms">
          <div className="toolbar">
            <input
              type="search"
              className="search"
              placeholder="Search room or notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search rooms"
            />
            <div className="chips" role="group" aria-label="Filter rooms">
              {FILTERS.map((f) => (
                <button key={f.id} className={`chip${filter === f.id ? ' on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label} <span className="count">{counts[f.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="skeletons" aria-busy="true" aria-label="Loading rooms">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" />)}
            </div>
          ) : visible.length ? (
            <RoomTable rooms={visible} sort={sort} onSort={toggleSort} onEdit={setEditing} onDelete={setDeleting} />
          ) : (
            <div className="empty">
              <p className="empty-title">{rooms.length ? 'No rooms match your search' : 'No rooms yet'}</p>
              <p>{rooms.length ? 'Try a different filter or search term.' : 'Add your first room to start tracking rent and occupancy.'}</p>
              {rooms.length ? (
                <button className="btn" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button>
              ) : (
                <button className="btn primary" onClick={() => setEditing('new')}>+ Add room</button>
              )}
            </div>
          )}
        </section>
      </main>

      {editing && <RoomForm room={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete room ${deleting.roomNumber}?`}
          message="This permanently removes the room and its payment details. It cannot be undone."
          confirmLabel="Delete room"
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}

      <div className="toast-region" aria-live="polite">{toast && <div className="toast">{toast}</div>}</div>
    </>
  );
}
