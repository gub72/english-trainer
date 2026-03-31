import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  icon?: string;
  onAdd?: () => void;
  children: React.ReactNode;
  id?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  count, 
  icon, 
  onAdd, 
  children,
  id 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section id={id} className="glass" style={{
      borderRadius: 'var(--radius)',
      marginBottom: '1.5rem',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        background: isOpen ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
        borderBottom: isOpen ? '1px solid var(--border)' : 'none'
      }} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ 
            transform: `rotate(${isOpen ? '90deg' : '0deg'})`, 
            transition: 'transform 0.2s ease',
            fontSize: '0.75rem',
            color: 'var(--text-dim)'
          }}>▶</span>
          {icon && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
          <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{title}</h3>
          <span style={{ 
            background: 'var(--bg-main)', 
            padding: '2px 8px', 
            borderRadius: '12px', 
            fontSize: '0.75rem',
            color: 'var(--accent)',
            fontWeight: 600,
            border: '1px solid var(--border)'
          }}>{count}</span>
        </div>

        {onAdd && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            style={{
              background: 'var(--accent)',
              color: 'white',
              padding: '0.4rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            + Add New
          </button>
        )}
      </div>

      <div style={{
        maxHeight: isOpen ? '5000px' : '0',
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </section>
  );
};
