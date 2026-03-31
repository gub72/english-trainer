import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CollapsibleSection } from '../common/CollapsibleSection';
import { TranslationItemForm } from './TranslationItemForm.tsx';
import type { TranslationItem } from '../../types/schema';

export const TranslationEditor: React.FC = () => {
  const { data, addItem, updateItem, deleteItem, addCategory, deleteCategory, searchTerm } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  const filterItems = (items: TranslationItem[]) => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.text.toLowerCase().includes(lowerSearch) ||
        item.translation.toLowerCase().includes(lowerSearch)
    );
  };

  const categories = Object.keys(data.translations);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory('translations', newCatName.trim());
      setNewCatName('');
      setIsAddingNewCat(false);
    }
  };

  const renderCategory = (categoryName: string) => {
    const items = data.translations[categoryName] || [];
    const filteredItems = filterItems(items);
    const isAll = categoryName.toLowerCase() === 'all';

    return (
      <div key={categoryName} style={{ position: 'relative' }}>
        <CollapsibleSection
            id={`trans-${categoryName}`}
            title={categoryName}
            count={items.length}
            onAdd={() => setAddingCategory(categoryName)}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {addingCategory === categoryName && (
                <div
                className="glass"
                style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                    border: '2px dashed var(--accent)',
                    marginBottom: '1rem'
                }}
                >
                <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--accent)' }}>Add New Translation</h4>
                <TranslationItemForm
                    item={{ id: '', text: '', translation: '' }}
                    onSave={async (patch: Partial<TranslationItem>) => {
                    await addItem('translations', categoryName, undefined, patch);
                    setAddingCategory(null);
                    }}
                    onCancel={() => setAddingCategory(null)}
                />
                </div>
            )}
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
        {!isAll && (
            <button 
                onClick={() => { if(confirm(`Delete entire category "${categoryName}"?`)) deleteCategory('translations', categoryName); }}
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
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f59e0b' }}>🌐 Translation Editor</h2>
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
                placeholder="Category Name (e.g. Daily Phrases)" 
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

