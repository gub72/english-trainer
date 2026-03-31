import React, { useState } from 'react';
import type { QAItem } from '../../types/schema';
import { validateQAItem, hasErrors } from '../../utils/validation';

interface QAItemFormProps {
  item: QAItem;
  onSave: (patch: Partial<QAItem>) => void;
  onCancel: () => void;
}

export const QAItemForm: React.FC<QAItemFormProps> = ({ item, onSave, onCancel }) => {
  const [question, setQuestion] = useState(item.question);
  const [answers, setAnswers] = useState(item.answers.length > 0 ? [...item.answers] : ['']);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleAddAnswer = () => setAnswers([...answers, '']);
  const handleRemoveAnswer = (idx: number) => setAnswers(answers.filter((_, i) => i !== idx));
  const handleChangeAnswer = (idx: number, val: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = val;
    setAnswers(newAnswers);
  };

  const handleSave = () => {
    const validationErrors = validateQAItem(question, answers);
    setErrors(validationErrors);

    if (!hasErrors(validationErrors)) {
      onSave({ 
        question: question.trim(), 
        answers: answers.map((a) => a.trim()).filter((a) => a.length > 0) 
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Question</label>
        <input 
          type="text" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Are you hungry?"
          style={{ width: '100%', borderColor: errors.question ? 'var(--error)' : 'var(--border)' }}
        />
        {errors.question && <small style={{ color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>{errors.question}</small>}
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Answers</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {answers.map((ans, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                value={ans} 
                onChange={(e) => handleChangeAnswer(idx, e.target.value)}
                placeholder={`Answer ${idx + 1}`}
                style={{ flex: 1 }}
              />
              {answers.length > 1 && (
                <button 
                  onClick={() => handleRemoveAnswer(idx)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.5rem' }}
                  title="Remove answer"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={handleAddAnswer}
            style={{ 
              background: 'var(--bg-main)', 
              border: '1px dashed var(--border)', 
              padding: '0.5rem',
              color: 'var(--text-dim)',
              width: '100%'
            }}
          >
            + Add another answer alternative
          </button>
        </div>
        {errors.answers && <small style={{ color: 'var(--error)', marginTop: '0.25rem', display: 'block' }}>{errors.answers}</small>}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button onClick={onCancel} style={{ background: 'transparent', padding: '0.5rem 1rem', color: 'var(--text-dim)' }}>
          Cancel
        </button>
        <button onClick={handleSave} style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem 1.5rem' }}>
          Save changes
        </button>
      </div>
    </div>
  );
};
