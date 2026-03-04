import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import ReviewCard from '../components/ReviewCard';
import type { Card } from '../types';

type State = 'loading' | 'has_cards' | 'done' | 'all_mastered' | 'no_cards';

export default function ReviewPage() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const loadSession = useCallback(() => {
    setState('loading');
    api.get('/cards/learning').then((res) => {
      if (res.data.length === 0) {
        setState('no_cards');
      } else {
        setQueue(res.data);
        setSessionCards(res.data);
        setCurrentIndex(0);
        setFlipped(false);
        setMasteredCount(0);
        setState('has_cards');
      }
    });
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

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
    const res = await api.post(`/cards/${card.id}/review`, { quality });
    const updated: Card = res.data;

    setSubmitting(false);
    setFlipped(false);

    if (updated.review_log?.status === 'known') {
      // Card mastered — remove it from session and try to rotate in a replacement
      const filteredQueue = queue.filter((c) => c.id !== card.id);
      const filteredSession = sessionCards.filter((c) => c.id !== card.id);
      const sessionIds = new Set(filteredSession.map((c) => c.id));

      const learningRes = await api.get('/cards/learning');
      const replacement: Card | undefined = learningRes.data.find(
        (c: Card) => !sessionIds.has(c.id)
      );

      const newQueue = replacement ? [...filteredQueue, replacement] : filteredQueue;
      const newSession = replacement ? [...filteredSession, replacement] : filteredSession;

      setMasteredCount((n) => n + 1);
      setSessionCards(newSession);
      setQueue(newQueue);

      if (newQueue.length === 0) {
        setState('all_mastered');
      } else if (currentIndex >= newQueue.length) {
        setCurrentIndex(0);
      }
      // else currentIndex stays — now points to the next card since current was removed
      return;
    }

    // Not mastered yet
    if (quality === 0) {
      // Again: cycle this card back to the end
      const newQueue = [...queue, card];
      setQueue(newQueue);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= newQueue.length) {
        setState('done');
      } else {
        setCurrentIndex(nextIndex);
      }
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        setState('done');
      } else {
        setCurrentIndex(nextIndex);
      }
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
        <p style={{ fontSize: '3rem', marginBottom: 8 }}>&#127881;</p>
        <h2>All cards mastered!</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          No cards left to learn. Add more cards to keep studying.
        </p>
        <button className="btn-primary" style={{ marginTop: 8 }} onClick={loadSession}>
          Check Again
        </button>
      </div>
    );
  }

  if (state === 'all_mastered') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 24, gap: 16 }}>
        <p style={{ fontSize: '3rem', marginBottom: 8 }}>&#11088;</p>
        <h2>Session mastered!</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          You mastered all {masteredCount} card{masteredCount !== 1 ? 's' : ''} in this session.
        </p>
        <button className="btn-primary" style={{ marginTop: 8 }} onClick={loadSession}>
          Start New Session
        </button>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 24, gap: 16 }}>
        <p style={{ fontSize: '3rem', marginBottom: 8 }}>&#127881;</p>
        <h2>Round complete!</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          {masteredCount > 0 && `${masteredCount} card${masteredCount !== 1 ? 's' : ''} mastered. `}
          {sessionCards.length} card{sessionCards.length !== 1 ? 's' : ''} still in progress.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, marginTop: 8 }}>
          <button className="btn-primary" onClick={drillAgain}>
            Keep Drilling
          </button>
          <button className="btn-secondary" onClick={loadSession}>
            New Session
          </button>
        </div>
      </div>
    );
  }

  const card = queue[currentIndex];
  const againCount = queue.length - sessionCards.length;
  const remaining = queue.length - currentIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24, gap: 24 }}>
      <p style={{ color: 'var(--text-secondary)' }}>
        {remaining} remaining
        {againCount > 0 && (
          <span style={{ color: 'var(--accent)', marginLeft: 8 }}>
            ({againCount} again)
          </span>
        )}
        {masteredCount > 0 && (
          <span style={{ color: 'var(--success)', marginLeft: 8 }}>
            &#10003; {masteredCount} mastered
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
