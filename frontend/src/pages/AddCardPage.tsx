import { useState } from 'react';
import api from '../api';

export default function AddCardPage() {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/cards', { front, back, notes });
      setFront('');
      setBack('');
      setNotes('');
      setMessage('Card added!');
    } catch {
      setMessage('Failed to add card');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Add Card</h2>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Front (Japanese)</label>
          <input
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="e.g. 食べる"
            required
            style={{ fontSize: '1.5rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Back (meaning)</label>
          <input
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="e.g. to eat (たべる)"
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Ichidan verb, JLPT N5"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
        {message && <p style={{ color: message === 'Card added!' ? 'var(--success)' : 'var(--accent)' }}>{message}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          Add Card
        </button>
      </form>
    </div>
  );
}
