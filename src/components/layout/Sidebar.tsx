import React from 'react';
import { SECTIONS } from '../../types/schema';
import { useData } from '../../context/DataContext';

export const Sidebar: React.FC = () => {
  const { searchTerm, setSearchTerm } = useData();

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

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {SECTIONS.map((section) => (
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
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {section.categories.map((cat) => (
                <li key={cat.key}>
                  <a 
                    href={`#${cat.key}`} 
                    className="sidebar-link"
                    style={{
                      display: 'block',
                      padding: '0.625rem 1rem',
                      borderRadius: '8px',
                      color: 'var(--text-dim)',
                      textDecoration: 'none',
                      fontSize: '0.9375rem',
                      transition: 'all 0.2s ease',
                      border: '1px solid transparent'
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
                    {cat.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};
