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
  const [questao, setQuestao] = useState(item.questao || '');
  const [answers, setAnswers] = useState(item.answers.length > 0 ? [...item.answers] : ['']);
  const [respostas, setRespostas] = useState(item.respostas && item.respostas.length > 0 ? [...item.respostas] : ['']);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleAddAnswer = () => {
    setAnswers([...answers, '']);
    setRespostas([...respostas, '']);
  };
  const handleRemoveAnswer = (idx: number) => {
    setAnswers(answers.filter((_, i) => i !== idx));
    setRespostas(respostas.filter((_, i) => i !== idx));
  };
  const handleChangeAnswer = (idx: number, val: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = val;
    setAnswers(newAnswers);
  };
  const handleChangeResposta = (idx: number, val: string) => {
    const newRespostas = [...respostas];
    newRespostas[idx] = val;
    setRespostas(newRespostas);
  };

  const handleSave = () => {
    const validationErrors = validateQAItem(question, answers);
    setErrors(validationErrors);

    if (!hasErrors(validationErrors)) {
      const validAnswers = answers.map((a) => a.trim());
      const validRespostas = respostas.map((r) => r.trim());

      // Filter out empty answers and their corresponding translations
      const filteredAnswers: string[] = [];
      const filteredRespostas: string[] = [];

      validAnswers.forEach((ans, idx) => {
        if (ans.length > 0) {
          filteredAnswers.push(ans);
          filteredRespostas.push(validRespostas[idx] || ''); // Keep string, even if empty
        }
      });

      onSave({ 
        question: question.trim(), 
        questao: questao.trim() || undefined,
        answers: filteredAnswers,
        respostas: filteredRespostas.some(r => r) ? filteredRespostas : undefined
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Question (English)</label>
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-dim)' }}>Translation (Portuguese)</label>
          <input 
            type="text" 
            value={questao} 
            onChange={(e) => setQuestao(e.target.value)}
            placeholder="e.g. Você está com fome?"
            style={{ width: '100%', borderColor: 'var(--border)' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Answers & Translations</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {answers.map((ans, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', flex: 1 }}>
                <input 
                  type="text" 
                  value={ans} 
                  onChange={(e) => handleChangeAnswer(idx, e.target.value)}
                  placeholder={`Answer ${idx + 1}`}
                  style={{ width: '100%' }}
                />
                <input 
                  type="text" 
                  value={respostas[idx] || ''} 
                  onChange={(e) => handleChangeResposta(idx, e.target.value)}
                  placeholder={`Tradução ${idx + 1}`}
                  style={{ width: '100%' }}
                />
              </div>
              {answers.length > 1 && (
                <button 
                  onClick={() => handleRemoveAnswer(idx)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.5rem', height: '42px' }}
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
