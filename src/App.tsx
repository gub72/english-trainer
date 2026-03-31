import { useState } from 'react'
import { DataProvider, useData } from './context/DataContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { QAEditor } from './components/editors/QAEditor'
import { VocabEditor } from './components/editors/VocabEditor'
import { TranslationEditor } from './components/editors/TranslationEditor'
import { GameContainer } from './components/game/GameContainer'

type View = 'game' | 'admin';

function AppContent() {
  const [view, setView] = useState<View>('game');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data, loading, error } = useData();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading data...</div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '2rem', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>Error</div>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* View switcher (always visible) */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        gap: '0',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <button
          onClick={() => setView('game')}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: 0,
            cursor: 'pointer',
            background: view === 'game' ? 'var(--accent)' : 'transparent',
            color: view === 'game' ? 'white' : 'var(--text-dim)',
            transition: 'all 0.2s ease',
          }}
        >
          🎮 Game
        </button>
        <button
          onClick={() => setView('admin')}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: 0,
            cursor: 'pointer',
            background: view === 'admin' ? 'var(--accent)' : 'transparent',
            color: view === 'admin' ? 'white' : 'var(--text-dim)',
            transition: 'all 0.2s ease',
          }}
        >
          ⚙️ Admin
        </button>
      </div>

      {/* Game view */}
      {view === 'game' && (
        <GameContainer data={data} />
      )}

      {/* Admin view */}
      {view === 'admin' && (
        <div className="app-container">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', background: 'var(--bg-main)' }}>
            <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
            <main className="main-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '5rem' }}>
                <section id="qa-root">
                  <QAEditor />
                </section>

                <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>

                <section id="vocab-root">
                  <VocabEditor />
                </section>

                <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>

                <section id="translations-root">
                  <TranslationEditor />
                </section>
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}


function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  )
}

export default App
