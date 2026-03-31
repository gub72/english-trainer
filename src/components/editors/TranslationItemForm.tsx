import React, { useState } from 'react';
import type { TranslationItem } from '../../types/schema';
import { validateTranslationItem, hasErrors } from '../../utils/validation';

interface TranslationItemFormProps {
  item: TranslationItem;
  onSave: (patch: Partial<TranslationItem>) => void;
  onCancel: () => void;
}

export const TranslationItemForm: React.FC<TranslationItemFormProps> = ({ item, onSave, onCancel }) => {
  const [text, setText] = useState(item.text);
  const [translation, setTranslation] = useState(item.translation);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleSave = () => {
    const validationErrors = validateTranslationItem(text, translation);
    setErrors(validationErrors);

    if (!hasErrors(validationErrors)) {
      onSave({ text: text.trim(), translation: translation.trim() });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Original Text (English)</label>
          <textarea 
            rows={2}
            value={text} 
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', borderColor: errors.text ? 'var(--error)' : 'var(--border)', resize: 'vertical' }}
            placeholder="e.g. How are you today?"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Translation (Portuguese)</label>
          <textarea 
            rows={2}
            value={translation} 
            onChange={(e) => setTranslation(e.target.value)}
            style={{ width: '100%', borderColor: errors.translation ? 'var(--error)' : 'var(--border)', resize: 'vertical' }}
            placeholder="e.g. Como você está hoje?"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: 'transparent', padding: '0.5rem 1rem', color: 'var(--text-dim)' }}>Cancel</button>
        <button onClick={handleSave} style={{ background: '#f59e0b', color: 'white', padding: '0.5rem 1.5rem' }}>Save changes</button>
      </div>
    </div>
  );
};
