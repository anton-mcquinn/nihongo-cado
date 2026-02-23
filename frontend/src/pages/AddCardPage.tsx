import { useState } from 'react';
import api from '../api';

const POS_OPTIONS = ['', 'noun', 'verb', 'adjective', 'adverb', 'particle', 'expression', 'counter', 'prefix', 'suffix', 'other'];

export default function AddCardPage() {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [notes, setNotes] = useState('');
  const [romaji, setRomaji] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/cards', { front, back, notes, romaji, part_of_speech: partOfSpeech, tags });
      setFront('');
      setBack('');
      setNotes('');
      setRomaji('');
      setPartOfSpeech('');
      setTags('');
      setMessage('Card added!');
    } catch {
      setMessage('Failed to add card');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Add Card</h2>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Front (Japanese)</label>
          <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="e.g. 食べる" required style={{ fontSize: '1.5rem' }} />
        </div>
        <div>
          <label style={labelStyle}>Back (meaning)</label>
          <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="e.g. to eat" required />
        </div>
        <div>
          <label style={labelStyle}>Romaji</label>
          <input value={romaji} onChange={(e) => setRomaji(e.target.value)} placeholder="e.g. taberu" />
        </div>
        <div>
          <label style={labelStyle}>Part of Speech</label>
          <select
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid #333',
              borderRadius: 8,
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              width: '100%',
            }}
          >
            {POS_OPTIONS.map((pos) => (
              <option key={pos} value={pos}>{pos || '— select —'}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. JLPT N5, food" />
        </div>
        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Ichidan verb"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
        {message && <p style={{ color: message === 'Card added!' ? 'var(--success)' : 'var(--accent)' }}>{message}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>Add Card</button>
      </form>
    </div>
  );
}
