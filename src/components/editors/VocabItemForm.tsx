import React, { useState } from 'react';
import type { VocabItem } from '../../types/schema';
import { validateVocabItem, hasErrors } from '../../utils/validation';

interface VocabItemFormProps {
  item: VocabItem;
  onSave: (patch: Partial<VocabItem>) => void;
  onCancel: () => void;
}

export const VocabItemForm: React.FC<VocabItemFormProps> = ({ item, onSave, onCancel }) => {
  const [word, setWord] = useState(item.word);
  const [plural, setPlural] = useState(item.plural);
  const [image, setImage] = useState(item.image);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleSave = () => {
    const validationErrors = validateVocabItem(image, word, plural);
    setErrors(validationErrors);

    if (!hasErrors(validationErrors)) {
      onSave({ word: word.trim(), plural: plural.trim(), image: image.trim() });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Word</label>
          <input 
            type="text" 
            value={word} 
            onChange={(e) => setWord(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderColor: errors.word ? 'var(--error)' : 'var(--border)' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Plural</label>
          <input 
            type="text" 
            value={plural} 
            onChange={(e) => setPlural(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderColor: errors.plural ? 'var(--error)' : 'var(--border)' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Image Path</label>
        <input 
          type="text" 
          value={image} 
          onChange={(e) => setImage(e.target.value)}
          placeholder="e.g. /assets/vocab/table.png"
          style={{ width: '100%', padding: '0.5rem', borderColor: errors.image ? 'var(--error)' : 'var(--border)' }}
        />
        {image && (
          <div style={{ marginTop: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', width: 'fit-content' }}>
            <img src={image} alt="Preview" style={{ height: '40px', display: 'block' }} onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Err'} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: 'transparent', padding: '0.4rem 0.8rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Cancel</button>
        <button onClick={handleSave} style={{ background: '#10b981', color: 'white', padding: '0.4rem 1.25rem', fontSize: '0.875rem' }}>Save</button>
      </div>
    </div>
  );
};
