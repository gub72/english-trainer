import React from 'react';
import { SECTIONS } from '../../types/schema';
import { useData } from '../../context/DataContext';

export const Sidebar: React.FC = () => {
  const { data, searchTerm, setSearchTerm } = useData();

  return (
    <aside className="glass" style={{
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      height: '100vh',
      position: 'sticky',
      top: 0,
      borderRight: '1px solid var(--border)'
    }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Explore</h2>
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
                      href={`#${section.key}-${catName}`} 
                      className="sidebar-link"
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
                        (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                        (e.target as HTMLElement).style.color = 'var(--text-main)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background = 'transparent';
                        (e.target as HTMLElement).style.color = 'var(--text-dim)';
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
  );
};

