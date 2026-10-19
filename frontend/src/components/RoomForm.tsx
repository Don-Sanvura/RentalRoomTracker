import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../api';
import { CONDITIONS, type Room, type RoomInput } from '../types';
import { emptyDraft, validateDraft, type FieldErrors, type RoomDraft } from '../validate';

interface Props {
  /** The room being edited, or null when adding a new one. */
  room: Room | null;
  onClose: () => void;
  onSave: (input: RoomInput) => Promise<void>;
}

const toDraft = (r: Room): RoomDraft => ({
  roomNumber: r.roomNumber,
  condition: r.condition,
  costPerRoom: String(r.costPerRoom),
  depositMade: String(r.depositMade),
  rentPerMonth: String(r.rentPerMonth),
  moneyOwed: String(r.moneyOwed),
  occupants: String(r.occupants),
  noticeGiven: r.noticeGiven,
  noticeDate: r.noticeDate ?? '',
  notes: r.notes,
});

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error ? <p className="field-msg error" role="alert">{error}</p> : hint ? <p className="field-msg">{hint}</p> : null}
    </div>
  );
}

export default function RoomForm({ room, onClose, onSave }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<RoomDraft>(room ? toDraft(room) : emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const set = <K extends keyof RoomDraft>(key: K, value: RoomDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSave(result.value);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields as FieldErrors);
      else if (err instanceof ApiError && err.status === 409) setErrors({ roomNumber: err.message });
      else setFormError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} onCancel={saving ? (e) => e.preventDefault() : undefined} aria-labelledby="form-title">
      <form onSubmit={submit} noValidate>
        <header className="sheet-head">
          <h2 id="form-title">{room ? `Edit room ${room.roomNumber}` : 'Add a room'}</h2>
          <button type="button" className="icon-btn" onClick={() => dialog.current?.close()} aria-label="Close">✕</button>
        </header>

        <div className="sheet-body">
          <div className="grid-2">
            <Field label="Room number / name" error={errors.roomNumber}>
              {(id) => <input id={id} value={draft.roomNumber} onChange={(e) => set('roomNumber', e.target.value)} autoFocus maxLength={40} />}
            </Field>
            <Field label="Condition">
              {(id) => (
                <select id={id} value={draft.condition} onChange={(e) => set('condition', e.target.value as RoomDraft['condition'])}>
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}
            </Field>
          </div>

          <fieldset>
            <legend>Money</legend>
            <div className="grid-2">
              <Field label="Monthly rent" error={errors.rentPerMonth}>
                {(id) => <input id={id} type="number" inputMode="decimal" min="0" step="0.01" value={draft.rentPerMonth} onChange={(e) => set('rentPerMonth', e.target.value)} />}
              </Field>
              <Field label="Cost per room" error={errors.costPerRoom} hint="What the room is priced or worth">
                {(id) => <input id={id} type="number" inputMode="decimal" min="0" step="0.01" value={draft.costPerRoom} onChange={(e) => set('costPerRoom', e.target.value)} />}
              </Field>
              <Field label="Deposit paid" error={errors.depositMade}>
                {(id) => <input id={id} type="number" inputMode="decimal" min="0" step="0.01" value={draft.depositMade} onChange={(e) => set('depositMade', e.target.value)} />}
              </Field>
              <Field label="Money owed" error={errors.moneyOwed} hint="0 means fully paid up">
                {(id) => <input id={id} type="number" inputMode="decimal" min="0" step="0.01" value={draft.moneyOwed} onChange={(e) => set('moneyOwed', e.target.value)} />}
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend>Occupancy</legend>
            <Field label="People living there" error={errors.occupants} hint="0 marks the room as available">
              {(id) => <input id={id} type="number" inputMode="numeric" min="0" max="50" step="1" value={draft.occupants} onChange={(e) => set('occupants', e.target.value)} />}
            </Field>
            <label className="check">
              <input type="checkbox" checked={draft.noticeGiven} onChange={(e) => set('noticeGiven', e.target.checked)} />
              Tenant has given notice to leave
            </label>
            {draft.noticeGiven && (
              <Field label="Leaving on" error={errors.noticeDate}>
                {(id) => <input id={id} type="date" value={draft.noticeDate} onChange={(e) => set('noticeDate', e.target.value)} />}
              </Field>
            )}
          </fieldset>

          <Field label="Notes" hint={`${draft.notes.length}/500`}>
            {(id) => <textarea id={id} rows={3} maxLength={500} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />}
          </Field>

          {formError && <p className="banner error" role="alert">{formError}</p>}
        </div>

        <footer className="sheet-foot">
          <button type="button" className="btn" onClick={() => dialog.current?.close()} disabled={saving}>Cancel</button>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : room ? 'Save changes' : 'Add room'}</button>
        </footer>
      </form>
    </dialog>
  );
}
