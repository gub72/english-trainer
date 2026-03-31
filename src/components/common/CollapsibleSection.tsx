import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  icon?: string;
  onAdd?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  id?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  icon,
  onAdd,
  onDelete,
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Category"
              style={{
                background: 'transparent',
                color: 'var(--error)',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius)',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--error)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              }}
            >

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          )}
        </div>
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

