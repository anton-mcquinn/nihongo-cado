import { useState, useRef } from 'react';
import api from '../api';
import type { CardCreatePayload } from '../types';

interface ParsedRow {
  front: string;
  back: string;
  romaji: string;
  part_of_speech: string;
  tags: string;
  notes: string;
  selected: boolean;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = header.split(',').map((c) => c.trim());

  const idx = (names: string[]) => {
    for (const n of names) {
      const i = cols.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const fi = idx(['front', 'japanese', 'word', 'kanji']);
  const bi = idx(['back', 'meaning', 'english', 'definition']);
  const ri = idx(['romaji', 'reading', 'kana']);
  const pi = idx(['part_of_speech', 'pos', 'type']);
  const ti = idx(['tags', 'tag']);
  const ni = idx(['notes', 'note']);

  if (fi === -1 || bi === -1) return [];

  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const parts = line.split(',').map((c) => c.trim());
    return {
      front: parts[fi] || '',
      back: parts[bi] || '',
      romaji: ri >= 0 ? parts[ri] || '' : '',
      part_of_speech: pi >= 0 ? parts[pi] || '' : '',
      tags: ti >= 0 ? parts[ti] || '' : '',
      notes: ni >= 0 ? parts[ni] || '' : '',
      selected: true,
    };
  }).filter((r) => r.front && r.back);
}

function parseMarkdown(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  // Find header row (first line with |)
  const headerIdx = lines.findIndex((l) => l.includes('|'));
  if (headerIdx === -1) return [];

  const parseRow = (line: string) =>
    line.split('|').map((c) => c.trim()).filter((c) => c && !c.match(/^-+$/));

  const headers = parseRow(lines[headerIdx]).map((h) => h.toLowerCase());

  const idx = (names: string[]) => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const fi = idx(['front', 'japanese', 'word', 'kanji']);
  const bi = idx(['back', 'meaning', 'english', 'definition']);
  const ri = idx(['romaji', 'reading', 'kana']);
  const pi = idx(['part_of_speech', 'pos', 'type']);
  const ti = idx(['tags', 'tag']);
  const ni = idx(['notes', 'note']);

  if (fi === -1 || bi === -1) return [];

  // Skip header and separator rows
  const dataStart = headerIdx + 1;
  return lines.slice(dataStart)
    .filter((l) => l.includes('|') && !l.match(/^\s*\|?\s*[-:]+/))
    .map((line) => {
      const parts = parseRow(line);
      return {
        front: parts[fi] || '',
        back: parts[bi] || '',
        romaji: ri >= 0 ? parts[ri] || '' : '',
        part_of_speech: pi >= 0 ? parts[pi] || '' : '',
        tags: ti >= 0 ? parts[ti] || '' : '',
        notes: ni >= 0 ? parts[ni] || '' : '',
        selected: true,
      };
    })
    .filter((r) => r.front && r.back);
}

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMessage('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      let parsed: ParsedRow[];
      if (file.name.endsWith('.csv')) {
        parsed = parseCSV(text);
      } else {
        parsed = parseMarkdown(text);
      }
      if (parsed.length === 0) {
        setMessage('No valid rows found. CSV needs front,back columns. Markdown needs | front | back | table.');
      }
      setRows(parsed);
      if (!sourceName) setSourceName(file.name.replace(/\.\w+$/, ''));
    };
    reader.readAsText(file);
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
    setSubmitting(true);
    setMessage('');
    try {
      const cards: CardCreatePayload[] = selected.map((r) => ({
        front: r.front,
        back: r.back,
        romaji: r.romaji,
        part_of_speech: r.part_of_speech,
        tags: r.tags,
        notes: r.notes,
      }));
      const ext = fileName.endsWith('.csv') ? 'csv' : 'markdown';
      await api.post('/cards/bulk', { cards, source_name: sourceName, source_type: ext });
      setMessage(`Imported ${selected.length} cards!`);
      setRows([]);
      setFileName('');
      setSourceName('');
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setMessage('Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  const cellStyle = { padding: '8px 12px', borderBottom: '1px solid #333', fontSize: '0.85rem' } as const;
  const thStyle = { ...cellStyle, textAlign: 'left' as const, color: 'var(--text-secondary)', fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Import Cards</h2>

      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose file (.csv, .md, .txt)
          </label>
          <input ref={fileRef} type="file" accept=".csv,.md,.txt" onChange={handleFile} style={{ padding: 8 }} />
        </div>

        {rows.length > 0 && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Source name</label>
              <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Genki Ch.1" />
            </div>

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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn-primary" onClick={handleImport} disabled={submitting || selectedCount === 0}>
              Import {selectedCount} card{selectedCount !== 1 ? 's' : ''}
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
