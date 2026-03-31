import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { TranslationItemForm } from './TranslationItemForm.tsx';
import type { TranslationItem, TranslationData } from '../../types/schema';

type TranslationCategory = keyof TranslationData;

export const TranslationEditor: React.FC = () => {
  const { data, addItem, updateItem, deleteItem, searchTerm } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);

  const filterItems = (items: TranslationItem[]) => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.text.toLowerCase().includes(lowerSearch) ||
        item.translation.toLowerCase().includes(lowerSearch)
    );
  };

  const categories: TranslationCategory[] = ['easy', 'medium', 'hard'];

  const renderCategory = (category: TranslationCategory) => {
    const categoryName = String(category);
    const items = data.translations[category] || [];
    const filteredItems = filterItems(items);

    return (
      <CollapsibleSection
        key={categoryName}
        id={categoryName}
        title={`Translations - ${categoryName.toUpperCase()}`}
        count={items.length}
        onAdd={() => addItem('translations', categoryName)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredItems.map((item: TranslationItem) => (
            <div 
              key={item.id} 
              className="glass" 
              style={{ 
                padding: '1.25rem', 
                borderRadius: 'var(--radius)',
                border: editingId === item.id ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              {editingId === item.id ? (
                <TranslationItemForm 
                  item={item} 
                  onSave={(patch: Partial<TranslationItem>) => {
                    updateItem('translations', categoryName, item.id, patch);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => setEditingId(item.id)} style={{ cursor: 'pointer', flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {item.text || <span style={{ color: 'var(--error)' }}>No text set</span>}
                    </p>
                    <p style={{ fontSize: '1rem', color: 'var(--accent)', margin: 0 }}>
                      {item.translation || <span style={{ color: 'var(--text-dim)' }}>Pending translation...</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingId(item.id)} style={{ background: 'transparent', padding: '0.5rem', color: 'var(--text-dim)' }}>Edit</button>
                    <button onClick={() => { if (confirm('Delete this item?')) deleteItem('translations', categoryName, item.id); }} style={{ background: 'transparent', padding: '0.5rem', color: 'var(--error)' }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
              No translations for this level yet.
            </p>
          )}
        </div>
      </CollapsibleSection>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#f59e0b' }}>🌐 Translation Editor</h2>
      {categories.map(renderCategory)}
    </div>
  );
};
