import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import ReviewCard from '../components/ReviewCard';
import type { Card } from '../types';

type State = 'loading' | 'has_cards' | 'done' | 'no_cards';

export default function ReviewPage() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);

  const loadDueCards = useCallback(() => {
    setState('loading');
    api.get('/cards/due').then((res) => {
      if (res.data.length === 0) {
        setState('no_cards');
      } else {
        setQueue(res.data);
        setSessionCards(res.data);
        setCurrentIndex(0);
        setFlipped(false);
        setState('has_cards');
      }
    });
  }, []);

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  const drillAgain = () => {
    setQueue(sessionCards);
    setCurrentIndex(0);
    setFlipped(false);
    setState('has_cards');
  };

  const rate = async (quality: number) => {
    if (submitting) return;
    setSubmitting(true);
    const card = queue[currentIndex];
    await api.post(`/cards/${card.id}/review`, { quality });
    setSubmitting(false);

    let newQueue = queue;
    if (quality === 0) {
      // Again: append card to end of queue so it cycles back
      newQueue = [...queue, card];
      setQueue(newQueue);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= newQueue.length) {
      setState('done');
    } else {
      setCurrentIndex(nextIndex);
      setFlipped(false);
    }
  };

  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        Loading...
      </div>
    );
  }

  if (state === 'no_cards') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 24, gap: 16 }}>
        <p style={{ fontSize: '3rem', marginBottom: 8 }}>&#128218;</p>
        <h2>No cards due</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          You're all caught up! Check back later when more cards are due.
        </p>
        <button className="btn-primary" style={{ marginTop: 8 }} onClick={loadDueCards}>
          Check Again
        </button>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 24, gap: 16 }}>
        <p style={{ fontSize: '3rem', marginBottom: 8 }}>&#127881;</p>
        <h2>Session Complete!</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          You reviewed {sessionCards.length} card{sessionCards.length !== 1 ? 's' : ''}.
          Cards are scheduled for future review based on your ratings.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, marginTop: 8 }}>
          <button className="btn-primary" onClick={drillAgain}>
            Drill Again
          </button>
          <button className="btn-secondary" onClick={loadDueCards}>
            Check for New Reviews
          </button>
        </div>
      </div>
    );
  }

  const card = queue[currentIndex];
  const remaining = queue.length - currentIndex;
  const againCount = queue.length - sessionCards.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24, gap: 24 }}>
      <p style={{ color: 'var(--text-secondary)' }}>
        {remaining} remaining
        {againCount > 0 && (
          <span style={{ color: 'var(--accent)', marginLeft: 8 }}>
            ({againCount} again)
          </span>
        )}
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
