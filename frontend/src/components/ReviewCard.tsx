interface Props {
  front: string;
  back: string;
  romaji?: string;
  flipped: boolean;
  onFlip: () => void;
}

export default function ReviewCard({ front, back, romaji, flipped, onFlip }: Props) {
  return (
    <div
      onClick={onFlip}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 32,
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        width: '100%',
        maxWidth: 480,
      }}
    >
      <p style={{
        fontSize: flipped ? '1.5rem' : '3rem',
        textAlign: 'center',
        lineHeight: 1.4,
        wordBreak: 'keep-all',
      }}>
        {flipped ? back : front}
      </p>
      {flipped && romaji && (
        <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '1rem' }}>
          {romaji}
        </p>
      )}
      {!flipped && (
        <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontSize: '0.9rem' }}>
          Tap to reveal
        </p>
      )}
    </div>
  );
}
