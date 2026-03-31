import React from 'react';
import { SECTIONS } from '../../types/schema';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { data, searchTerm, setSearchTerm } = useData();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
            display: 'none' // Controlled by CSS media query
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''} glass`} style={{
        // padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '2.5rem',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid var(--border)',
        zIndex: 999
      }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Explore</h2>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              color: 'var(--text-dim)',
              fontSize: '1.5rem',
              display: 'none', // Controlled by CSS media query
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
          {SECTIONS.map((section) => {
            const sectionData = data[section.key] || {};
            const categories = Object.keys(sectionData);

            return (
              <div key={section.key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <span>{section.icon}</span>
                  {section.label}
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {categories.map((catName) => (
                    <li key={catName}>
                      <a
                        href={`#${section.key === 'imageVocabulary' ? 'vocab' : (section.key === 'translations' ? 'trans' : 'qa')}-${catName}`}
                        className="sidebar-link"
                        onClick={handleLinkClick}
                        style={{
                          display: 'block',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          color: 'var(--text-dim)',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-main)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)';
                        }}
                      >
                        {catName}
                      </a>
                    </li>
                  ))}
                  {categories.length === 0 && (
                    <li style={{ padding: '0.5rem 1rem', color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      No categories
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};


