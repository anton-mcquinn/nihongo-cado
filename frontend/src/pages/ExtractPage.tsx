import { useState, useRef } from 'react';
import api from '../api';
import type { ExtractVocabResponse, ExtractedVocab, CardCreatePayload } from '../types';

interface VocabRow extends ExtractedVocab {
  selected: boolean;
}

export default function ExtractPage() {
  const [rows, setRows] = useState<VocabRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('');
    setRows([]);
    setPreview('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<ExtractVocabResponse>('/extract/vocab', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      const vocabRows: VocabRow[] = res.data.words.map((w) => ({
        ...w,
        selected: !w.already_known,
      }));
      setRows(vocabRows);
      setPreview(res.data.source_text_preview);
      if (vocabRows.length === 0) {
        setMessage('No vocabulary found in PDF.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Extraction failed';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (i: number) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleImport = async () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;
    setImporting(true);
    setMessage('');
    try {
      const cards: CardCreatePayload[] = selected.map((r) => ({
        front: r.front,
        back: r.back,
        romaji: r.romaji,
        part_of_speech: r.part_of_speech,
        notes: r.notes,
      }));
      await api.post('/cards/bulk', { cards, source_name: 'AI Extract', source_type: 'pdf' });
      setMessage(`Imported ${selected.length} cards!`);
      setRows([]);
      setPreview('');
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setMessage('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  const cellStyle = { padding: '8px 12px', borderBottom: '1px solid #333', fontSize: '0.85rem' } as const;
  const thStyle = { ...cellStyle, textAlign: 'left' as const, color: 'var(--text-secondary)', fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>AI Vocabulary Extract</h2>

      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Upload a Japanese PDF or Markdown file
          </label>
          <input ref={fileRef} type="file" accept=".pdf,.md,.txt,.markdown" onChange={handleUpload} disabled={loading} style={{ padding: 8 }} />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, animation: 'spin 1s linear infinite' }}>&#9881;</div>
            <p style={{ color: 'var(--text-secondary)' }}>Extracting vocabulary with AI... This may take 10-30 seconds.</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {preview && !loading && (
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>Text preview:</strong> {preview}...
          </div>
        )}

        {rows.length > 0 && !loading && (
          <>
            <div style={{ overflowX: 'auto', border: '1px solid #333', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>
                      <input type="checkbox" checked={rows.every((r) => r.selected)} onChange={toggleAll} />
                    </th>
                    <th style={thStyle}>Front</th>
                    <th style={thStyle}>Back</th>
                    <th style={thStyle}>Romaji</th>
                    <th style={thStyle}>POS</th>
                    <th style={thStyle}>Known</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={{ opacity: row.selected ? 1 : 0.4 }}>
                      <td style={cellStyle}>
                        <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} />
                      </td>
                      <td style={cellStyle}>{row.front}</td>
                      <td style={cellStyle}>{row.back}</td>
                      <td style={cellStyle}>{row.romaji}</td>
                      <td style={cellStyle}>{row.part_of_speech}</td>
                      <td style={cellStyle}>{row.already_known ? 'Yes' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn-primary" onClick={handleImport} disabled={importing || selectedCount === 0}>
              {importing ? 'Importing...' : `Import ${selectedCount} card${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {message && (
          <p style={{ color: message.includes('Imported') ? 'var(--success)' : 'var(--accent)', textAlign: 'center' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
