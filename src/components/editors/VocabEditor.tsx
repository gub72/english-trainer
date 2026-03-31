import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { VocabItemForm } from './VocabItemForm.tsx';
import type { VocabItem } from '../../types/schema';

export const VocabEditor: React.FC = () => {
  const { data, addItem, updateItem, deleteItem, addCategory, deleteCategory, searchTerm } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  const filterItems = (items: VocabItem[]) => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.word.toLowerCase().includes(lowerSearch) ||
        item.plural.toLowerCase().includes(lowerSearch)
    );
  };

  const categories = Object.keys(data.imageVocabulary);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory('imageVocabulary', newCatName.trim());
      setNewCatName('');
      setIsAddingNewCat(false);
    }
  };

  const renderCategory = (categoryName: string) => {
    const items = data.imageVocabulary[categoryName] || [];
    const filteredItems = filterItems(items);
    const isAll = categoryName.toLowerCase() === 'all';

    return (
      <div key={categoryName} style={{ position: 'relative' }}>
        <CollapsibleSection
            id={`vocab-${categoryName}`}
            title={categoryName}
            count={items.length}
            onAdd={() => setAddingCategory(categoryName)}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {addingCategory === categoryName && (
                <div
                className="glass"
                style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                    border: '2px dashed var(--accent)',
                    gridColumn: '1 / -1',
                    marginBottom: '1rem'
                }}
                >
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--accent)' }}>Add New Vocabulary Item</h4>
                <VocabItemForm
                    item={{ id: '', image: '', word: '', plural: '' }}
                    onSave={async (patch: Partial<VocabItem>) => {
                    await addItem('imageVocabulary', categoryName, undefined, patch);
                    setAddingCategory(null);
                    }}
                    onCancel={() => setAddingCategory(null)}
                />
                </div>
            )}
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
        {!isAll && (
            <button 
                onClick={() => { if(confirm(`Delete entire category "${categoryName}"?`)) deleteCategory('imageVocabulary', categoryName); }}
                style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '120px', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: 'var(--error)', 
                    fontSize: '0.7rem', 
                    padding: '2px 8px',
                    zIndex: 10
                }}
            >
                Delete Category
            </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#10b981' }}>🖼️ Image Vocabulary Editor</h2>
          <button
            onClick={() => setIsAddingNewCat(true)}
            style={{
              background: 'var(--accent)',
              color: 'white',
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius)',
              fontWeight: 'bold'
            }}
          >
            + Add New Category
          </button>
      </div>

      {isAddingNewCat && (
          <div className="glass" style={{ padding: '1rem', border: '1px solid var(--accent)', display: 'flex', gap: '0.5rem' }}>
              <input 
                autoFocus
                type="text" 
                placeholder="Category Name (e.g. Living Room)" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                style={{ flex: 1, padding: '0.5rem' }}
              />
              <button onClick={handleAddCategory} style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem 1rem' }}>Create</button>
              <button onClick={() => setIsAddingNewCat(false)} style={{ background: 'transparent', color: 'var(--text-dim)' }}>Cancel</button>
          </div>
      )}

      {categories.map(renderCategory)}
    </div>
  );
};

