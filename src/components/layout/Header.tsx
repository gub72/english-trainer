import React, { useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { downloadJson } from '../../utils/exportJson.ts';
import { readJsonFile } from '../../utils/importJson.ts';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { data, setData, saveAll } = useData();
  const [saving, setSaving] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newData = await readJsonFile(file);
      setData(newData);
      alert('Data imported successfully!');
    } catch (err) {
      alert('Error importing JSON: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    e.target.value = '';
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveAll();
      alert('All data saved successfully!');
    } catch (err) {
      alert('Error saving data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalItems = (): number => {
    let total = 0;

    // Dynamically sum all items in all categories across all sections
    Object.values(data).forEach((section) => {
      Object.values(section as Record<string, any[]>).forEach((items) => {
        total += items.length;
      });
    });

    return total;
  };

  const totalItems = calculateTotalItems();

  return (
    <header className="glass" style={{
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      marginBottom: '1rem',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
        {/* Hamburger Menu Button (Mobile Only) */}
        <button
          onClick={onToggleSidebar}
          className="mobile-menu-btn"
          style={{
            background: 'transparent',
            color: 'var(--text-main)',
            padding: '0.5rem',
            display: 'none', // Controlled by CSS media query
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}
        >
          ☰
        </button>
        <div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>English Trainer Admin</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'end' }}>
            Managing {totalItems} entries
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <label className="button" style={{
          background: 'var(--bg-card)',
          padding: '0.5rem 1rem',
          border: '1px solid var(--border)',
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: 'var(--radius)',
          fontSize: '0.875rem'
        }}>
          Import
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>

        <button onClick={() => downloadJson(data)} style={{
          background: 'var(--accent-gradient)',
          color: 'white',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem'
        }}>
          Export
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            background: saving ? '#555' : 'var(--accent-gradient)',
            color: 'white',
            padding: '0.5rem 1rem',
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {saving ? 'Saving...' : 'Save JSON'}
        </button>
      </div>
    </header>
  );
};


