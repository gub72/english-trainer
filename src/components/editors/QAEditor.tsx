import React, { useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { CollapsibleSection } from '../common/CollapsibleSection.tsx';
import { QAItemForm } from './QAItemForm.tsx';
import type { QAItem } from '../../types/schema';

export const QAEditor: React.FC = () => {
  const { data, addItem, updateItem, deleteItem, addCategory, deleteCategory, searchTerm } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  const filterItems = (items: QAItem[]) => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerSearch) ||
        item.answers.some((a) => a.toLowerCase().includes(lowerSearch))
    );
  };

  const categories = Object.keys(data.qa);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory('qa', newCatName.trim());
      setNewCatName('');
      setIsAddingNewCat(false);
    }
  };

  const renderCategory = (categoryName: string) => {
    const items = data.qa[categoryName] || [];
    const filteredItems = filterItems(items);
    const isAll = categoryName.toLowerCase() === 'all';

    return (
      <div key={categoryName} style={{ position: 'relative' }}>
          <CollapsibleSection
            id={`qa-${categoryName}`}
            title={categoryName}
            count={items.length}
            onAdd={() => setAddingCategory(categoryName)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--accent)' }}>Create New Question</h4>
                  <QAItemForm
                    item={{ id: '', question: '', answers: [''] }}
                    onSave={async (patch: Partial<QAItem>) => {
                      await addItem('qa', categoryName, undefined, patch);
                      setAddingCategory(null);
                    }}
                    onCancel={() => setAddingCategory(null)}
                  />
                </div>
              )}

              {filteredItems.map((item: QAItem) => (
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
                    <QAItemForm
                      item={item}
                      onSave={(patch: Partial<QAItem>) => {
                        updateItem('qa', categoryName, item.id, patch);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div onClick={() => setEditingId(item.id)} style={{ cursor: 'pointer', flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>
                          Q: {item.question || <span style={{ color: 'var(--error)' }}>No question set</span>}
                        </p>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {item.answers.map((ans, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: 'var(--text-dim)'
                            }}>
                              {ans}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setEditingId(item.id)} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '0.4rem',
                          fontSize: '0.75rem'
                        }}>Edit</button>
                        <button onClick={() => {
                          if (confirm('Delete this item?')) {
                            deleteItem('qa', categoryName, item.id);
                          }
                        }} style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--error)',
                          padding: '0.4rem',
                          fontSize: '0.75rem'
                        }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                  No items found in this category.
                </p>
              )}
            </div>
          </CollapsibleSection>
          {!isAll && (
            <button 
                onClick={() => { if(confirm(`Delete entire category "${categoryName}"?`)) deleteCategory('qa', categoryName); }}
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
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent)' }}>💬 Question & Answer Editor</h2>
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
                placeholder="Category Name (e.g. Past Simple)" 
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

