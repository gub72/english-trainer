import React, { useState } from 'react';
import { useData } from '../../context/DataContext.tsx';
import { CollapsibleSection } from '../common/CollapsibleSection.tsx';
import { QAItemForm } from './QAItemForm.tsx';
import type { QAItem } from '../../types/schema';

export const QAEditor: React.FC = () => {
  const { data, addItem, updateItem, deleteItem, searchTerm } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<{parent: string, category: string} | null>(null);

  const filterItems = (items: QAItem[]) => {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerSearch) ||
        item.answers.some((a) => a.toLowerCase().includes(lowerSearch))
    );
  };

  const renderCategory = (parent: 'verbToBe' | 'questions', category: string) => {
    const items = (data.qa as any)[parent][category] || [];
    const filteredItems = filterItems(items);
    const isAdding = addingCategory?.parent === parent && addingCategory?.category === category;

    return (
      <CollapsibleSection
        key={`${parent}-${category}`}
        id={category}
        title={`${parent === 'verbToBe' ? 'Verb To Be' : 'Questions'} - ${category.toUpperCase()}`}
        count={items.length}
        onAdd={() => setAddingCategory({ parent, category })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isAdding && (
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
                  await addItem('qa', category, parent, patch);
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
                    updateItem('qa', category, item.id, patch, parent);
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
                        deleteItem('qa', category, item.id, parent);
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
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--accent)' }}>💬 Question & Answer Editor</h2>
      {renderCategory('verbToBe', 'singular')}
      {renderCategory('verbToBe', 'plural')}
      {renderCategory('questions', 'what')}
      {renderCategory('questions', 'where')}
      {renderCategory('questions', 'which')}
      {renderCategory('questions', 'will')}
    </div>
  );
};
