import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { VocabItemForm } from './VocabItemForm.tsx';
import type { VocabItem, VocabData } from '../../types/schema';

type VocabCategory = keyof VocabData;

export const VocabEditor: React.FC = () => {
  const { data, addItem, updateItem, deleteItem, searchTerm } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);

  const filterItems = (items: VocabItem[]) => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.word.toLowerCase().includes(lowerSearch) ||
        item.plural.toLowerCase().includes(lowerSearch)
    );
  };

  const categories: VocabCategory[] = ['transport', 'kitchen', 'office', 'misc'];

  const renderCategory = (category: VocabCategory) => {
    const categoryName = String(category);
    const items = data.imageVocabulary[category] || [];
    const filteredItems = filterItems(items);

    return (
      <CollapsibleSection
        key={categoryName}
        id={categoryName}
        title={`Category - ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}`}
        count={items.length}
        onAdd={() => addItem('imageVocabulary', categoryName)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredItems.map((item: VocabItem) => (
            <div 
              key={item.id} 
              className="glass" 
              style={{ 
                padding: '1rem', 
                borderRadius: 'var(--radius)',
                border: editingId === item.id ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              {editingId === item.id ? (
                <VocabItemForm 
                  item={item} 
                  onSave={(patch: Partial<VocabItem>) => {
                    updateItem('imageVocabulary', categoryName, item.id, patch);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: 'var(--bg-main)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {item.image ? (
                      <img src={item.image} alt={item.word} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0')} />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>{item.word || 'Untitled'}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', margin: 0 }}>Plural: {item.plural || '-'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setEditingId(item.id)} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--text-dim)' }}>Edit</button>
                    <button onClick={() => { if (confirm('Delete this item?')) deleteItem('imageVocabulary', categoryName, item.id); }} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--error)' }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem', gridColumn: '1 / -1' }}>
              No vocabulary items here.
            </p>
          )}
        </div>
      </CollapsibleSection>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#10b981' }}>🖼️ Image Vocabulary Editor</h2>
      {categories.map(renderCategory)}
    </div>
  );
};
