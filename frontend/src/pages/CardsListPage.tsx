import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { Card, Source } from '../types';

const POS_OPTIONS = ['', 'noun', 'verb', 'adjective', 'adverb', 'particle', 'expression', 'counter', 'prefix', 'suffix', 'other'];

export default function CardsListPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Bulk select
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Edit modal
  const [editing, setEditing] = useState<Card | null>(null);
  const [editForm, setEditForm] = useState({ front: '', back: '', romaji: '', part_of_speech: '', tags: '', notes: '' });

  const fetchCards = useCallback(async () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (sourceFilter) params.source_id = sourceFilter;
    if (posFilter) params.part_of_speech = posFilter;
    const res = await api.get('/cards', { params });
    setCards(res.data);
    setLoading(false);
  }, [search, sourceFilter, posFilter]);

  useEffect(() => {
    fetchCards();
    api.get('/sources').then((res) => setSources(res.data));
  }, [fetchCards]);

  const openEdit = (card: Card) => {
    setEditing(card);
    setEditForm({
      front: card.front,
      back: card.back,
      romaji: card.romaji || '',
      part_of_speech: card.part_of_speech || '',
      tags: card.tags || '',
      notes: card.notes || '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await api.put(`/cards/${editing.id}`, {
      front: editForm.front,
      back: editForm.back,
      romaji: editForm.romaji,
      part_of_speech: editForm.part_of_speech,
      tags: editForm.tags,
      notes: editForm.notes,
    });
    setEditing(null);
    fetchCards();
  };

  const deleteCard = async (id: number) => {
    await api.delete(`/cards/${id}`);
    fetchCards();
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    await api.delete('/cards/bulk', { data: { card_ids: Array.from(selected) } });
    setSelected(new Set());
    setBulkMode(false);
    fetchCards();
  };

  const selectStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  } as const;

  const labelStyle = { display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' } as const;

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 24, gap: 16, alignItems: 'center' }}>
      <h2>Cards ({cards.length})</h2>

      {/* Filters */}
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{ flex: 1, minWidth: 150 }}
        />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={selectStyle}>
          <option value="">All sources</option>
          {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} style={selectStyle}>
          <option value="">All POS</option>
          {POS_OPTIONS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Bulk controls */}
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', gap: 8 }}>
        <button
          className="btn-secondary"
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}
        >
          {bulkMode ? 'Cancel' : 'Select'}
        </button>
        {bulkMode && selected.size > 0 && (
          <button
            style={{ fontSize: '0.85rem', padding: '8px 16px', background: '#c0392b', color: 'white', borderRadius: 8, border: 'none' }}
            onClick={bulkDelete}
          >
            Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* Card list */}
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No cards found.</p>}
        {cards.map((card) => (
          <div
            key={card.id}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: bulkMode && !selected.has(card.id) ? 0.7 : 1,
            }}
          >
            {bulkMode && (
              <input type="checkbox" checked={selected.has(card.id)} onChange={() => toggleSelect(card.id)} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{card.front}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{card.back}</div>
              {card.romaji && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 }}>{card.romaji}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {card.part_of_speech && (
                  <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {card.part_of_speech}
                  </span>
                )}
                {card.tags && card.tags.split(',').map((t) => (
                  <span key={t.trim()} style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', color: 'var(--success)' }}>
                    {t.trim()}
                  </span>
                ))}
                {card.review_log && (
                  <span style={{
                    background: 'var(--bg-secondary)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    color: card.review_log.status === 'known' ? 'var(--success)' : card.review_log.status === 'learning' ? 'var(--warning)' : 'var(--text-secondary)',
                  }}>
                    {card.review_log.status}
                  </span>
                )}
              </div>
            </div>
            {!bulkMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={() => openEdit(card)}
                >
                  Edit
                </button>
                <button
                  style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#c0392b', color: 'white', borderRadius: 8, border: 'none' }}
                  onClick={() => deleteCard(card.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3>Edit Card</h3>
            <div>
              <label style={labelStyle}>Front</label>
              <input value={editForm.front} onChange={(e) => setEditForm({ ...editForm, front: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Back</label>
              <input value={editForm.back} onChange={(e) => setEditForm({ ...editForm, back: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Romaji</label>
              <input value={editForm.romaji} onChange={(e) => setEditForm({ ...editForm, romaji: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Part of Speech</label>
              <select
                value={editForm.part_of_speech}
                onChange={(e) => setEditForm({ ...editForm, part_of_speech: e.target.value })}
                style={selectStyle}
              >
                {POS_OPTIONS.map((pos) => <option key={pos} value={pos}>{pos || '— select —'}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tags</label>
              <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={saveEdit} style={{ flex: 1 }}>Save</button>
              <button className="btn-secondary" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
