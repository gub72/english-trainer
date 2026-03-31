import React, { useState, useRef } from 'react';
import type { VocabItem } from '../../types/schema';
import { validateVocabItem, hasErrors } from '../../utils/validation';
import { api } from '../../services/api';

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const validationErrors = validateVocabItem(image, word, plural);
    setErrors(validationErrors);

    if (!hasErrors(validationErrors)) {
      onSave({ word: word.trim(), plural: plural.trim(), image: image.trim() });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await api.uploadImage(file);
      setImage(response.path);
    } catch (err) {
      alert('Error uploading image: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Image</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="text" 
            value={image} 
            onChange={(e) => setImage(e.target.value)}
            placeholder="e.g. /assets/vocab/table.png"
            style={{ flex: 1, padding: '0.5rem', borderColor: errors.image ? 'var(--error)' : 'var(--border)' }}
          />
          <button 
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)', 
              padding: '0.5rem 1rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
        {image && (
          <div style={{ 
            marginTop: '0.5rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius)', 
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '120px'
          }}>
            <img 
              src={image} 
              alt="Preview" 
              style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }} 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = 'https://placehold.co/150x150?text=Preview+Error';
              }} 
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button onClick={onCancel} style={{ background: 'transparent', padding: '0.4rem 0.8rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Cancel</button>
        <button onClick={handleSave} disabled={uploading} style={{ background: '#10b981', color: 'white', padding: '0.4rem 1.25rem', fontSize: '0.875rem', opacity: uploading ? 0.7 : 1 }}>Save</button>
      </div>
    </div>
  );
};

