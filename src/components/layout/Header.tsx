import React, { useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { downloadJson } from '../../utils/exportJson.ts';
import { readJsonFile } from '../../utils/importJson.ts';

export const Header: React.FC = () => {
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

    // QA
    total += data.qa.verbToBe.singular.length;
    total += data.qa.verbToBe.plural.length;
    total += data.qa.questions.what.length;
    total += data.qa.questions.where.length;
    total += data.qa.questions.which.length;
    total += data.qa.questions.will.length;

    // Vocab
    total += data.imageVocabulary.transport.length;
    total += data.imageVocabulary.kitchen.length;
    total += data.imageVocabulary.office.length;
    total += data.imageVocabulary.misc.length;

    // Translations
    total += data.translations.easy.length;
    total += data.translations.medium.length;
    total += data.translations.hard.length;

    return total;
  };

  const totalItems = calculateTotalItems();

  return (
    <header className="glass" style={{
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      marginBottom: '1rem'
    }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>English Trainer Admin</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
          Managing {totalItems} entries
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <label className="button" style={{
          background: 'var(--bg-card)',
          padding: '0.5rem 1rem',
          border: '1px solid var(--border)',
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: 'var(--radius)'
        }}>
          Import JSON
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>

        <button onClick={() => downloadJson(data)} style={{
          background: 'var(--accent-gradient)',
          color: 'white',
          padding: '0.5rem 1rem'
        }}>
          Export JSON
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            background: saving ? '#555' : 'var(--accent-gradient)',
            color: 'white',
            padding: '0.5rem 1rem',
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save JSON'}
        </button>
      </div>
    </header>
  );
};

