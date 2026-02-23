import { useState, useEffect } from 'react';
import api from '../api';
import ReviewCard from '../components/ReviewCard';
import type { Card } from '../types';

type State = 'loading' | 'has_cards' | 'done';

export default function ReviewPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/cards/due').then((res) => {
      if (res.data.length === 0) {
        setState('done');
      } else {
        setCards(res.data);
        setState('has_cards');
      }
    });
  }, []);

  const rate = async (quality: number) => {
    if (submitting) return;
    setSubmitting(true);
    const card = cards[currentIndex];
    await api.post(`/cards/${card.id}/review`, { quality });
    setSubmitting(false);

    if (currentIndex + 1 >= cards.length) {
      setState('done');
    } else {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  if (state === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>Loading...</div>;
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 24 }}>
        <p style={{ fontSize: '3rem', marginBottom: 16 }}>&#127881;</p>
        <h2>All done!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>No more cards to review right now.</p>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24, gap: 24 }}>
      <p style={{ color: 'var(--text-secondary)' }}>
        Card {currentIndex + 1} of {cards.length}
      </p>

      <ReviewCard
        front={card.front}
        back={card.back}
        romaji={card.romaji}
        flipped={flipped}
        onFlip={() => setFlipped(true)}
      />

      {flipped && card.notes && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
          {card.notes}
        </p>
      )}

      {flipped && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 480 }}>
          <button className="btn-secondary" style={{ background: '#c0392b' }} onClick={() => rate(0)} disabled={submitting}>
            Again
          </button>
          <button className="btn-secondary" style={{ background: '#e67e22' }} onClick={() => rate(3)} disabled={submitting}>
            Hard
          </button>
          <button className="btn-secondary" style={{ background: 'var(--success)' }} onClick={() => rate(4)} disabled={submitting}>
            Good
          </button>
          <button className="btn-secondary" style={{ background: '#3498db' }} onClick={() => rate(5)} disabled={submitting}>
            Easy
          </button>
        </div>
      )}
    </div>
  );
}
