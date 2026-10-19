import { useEffect, useRef, useState } from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="confirm" onClose={onClose} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="sheet-foot">
        <button className="btn" autoFocus onClick={() => dialog.current?.close()} disabled={busy}>Cancel</button>
        <button className="btn danger" onClick={confirm} disabled={busy}>{busy ? 'Deleting…' : confirmLabel}</button>
      </div>
    </dialog>
  );
}
