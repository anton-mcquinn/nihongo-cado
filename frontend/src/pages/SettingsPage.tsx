import { useState, useEffect } from 'react';
import api from '../api';
import type { UserSettings } from '../types';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [dailyLimit, setDailyLimit] = useState(20);
  const [keyIsSet, setKeyIsSet] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserSettings>('/auth/settings')
      .then((res) => {
        setKeyIsSet(res.data.anthropic_api_key_set);
        setDailyLimit(res.data.daily_new_limit);
      })
      .catch(() => setMessage('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload: Record<string, unknown> = { daily_new_limit: dailyLimit };
      if (apiKey) {
        payload.anthropic_api_key = apiKey;
      }
      const res = await api.put<UserSettings>('/auth/settings', payload);
      setKeyIsSet(res.data.anthropic_api_key_set);
      setApiKey('');
      setMessage('Settings saved!');
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Settings</h2>

      <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Anthropic API Key {keyIsSet && <span style={{ color: 'var(--success)' }}>(set)</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keyIsSet ? 'Enter new key to replace' : 'sk-ant-...'}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Required for AI vocabulary extraction. Get yours at console.anthropic.com
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Daily new cards limit
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(parseInt(e.target.value) || 20)}
            style={{ width: 100 }}
          />
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && (
          <p style={{ color: message.includes('saved') ? 'var(--success)' : 'var(--accent)', textAlign: 'center' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
