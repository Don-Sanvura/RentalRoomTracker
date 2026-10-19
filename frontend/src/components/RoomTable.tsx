import { formatMoney, noticeLabel } from '../format';
import { isAvailable, type Room } from '../types';

export type SortKey = 'roomNumber' | 'rentPerMonth' | 'moneyOwed' | 'occupants';
export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

interface Props {
  rooms: Room[];
  sort: Sort;
  onSort: (key: SortKey) => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

function SortHeader({ label, k, sort, onSort, align }: { label: string; k: SortKey; sort: Sort; onSort: (k: SortKey) => void; align?: 'right' }) {
  const active = sort.key === k;
  return (
    <th scope="col" className={align} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className="th-btn" onClick={() => onSort(k)}>
        {label}
        <span aria-hidden="true" className={active ? 'arrow on' : 'arrow'}>{active && sort.dir === 'desc' ? '↓' : '↑'}</span>
      </button>
    </th>
  );
}

function StatusPill({ room }: { room: Room }) {
  if (room.moneyOwed > 0) return <span className="pill red">Owes {formatMoney(room.moneyOwed)}</span>;
  if (room.noticeGiven) return <span className="pill amber">{noticeLabel(room)}</span>;
  return isAvailable(room) ? <span className="pill green">Available</span> : <span className="pill neutral">Paid up</span>;
}

export default function RoomTable({ rooms, sort, onSort, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <SortHeader label="Room" k="roomNumber" sort={sort} onSort={onSort} />
            <th scope="col">Status</th>
            <SortHeader label="Rent / month" k="rentPerMonth" sort={sort} onSort={onSort} align="right" />
            <SortHeader label="Owed" k="moneyOwed" sort={sort} onSort={onSort} align="right" />
            <SortHeader label="People" k="occupants" sort={sort} onSort={onSort} align="right" />
            <th scope="col">Condition</th>
            <th scope="col" className="right"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <th scope="row" data-label="Room">
                <span className="room-name">{room.roomNumber}</span>
                {room.notes && <span className="room-notes" title={room.notes}>{room.notes}</span>}
              </th>
              <td data-label="Status">
                <StatusPill room={room} />
                {room.moneyOwed > 0 && room.noticeGiven && <span className="pill amber stacked">{noticeLabel(room)}</span>}
              </td>
              <td data-label="Rent / month" className="num">{formatMoney(room.rentPerMonth)}</td>
              <td data-label="Owed" className={`num${room.moneyOwed > 0 ? ' owed' : ''}`}>{room.moneyOwed > 0 ? formatMoney(room.moneyOwed) : '—'}</td>
              <td data-label="People" className="num">{room.occupants}</td>
              <td data-label="Condition"><span className={`dot cond-${room.condition.replace(' ', '-').toLowerCase()}`} />{room.condition}</td>
              <td className="actions">
                <button className="btn small" onClick={() => onEdit(room)} aria-label={`Edit room ${room.roomNumber}`}>Edit</button>
                <button className="btn small danger-ghost" onClick={() => onDelete(room)} aria-label={`Delete room ${room.roomNumber}`}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
