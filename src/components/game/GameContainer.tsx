import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppData, QAItem, VocabItem, TranslationItem } from '../../types/schema';

type GameMode = 'qa' | 'image' | 'text';
type GamePhase = 'mode-select' | 'category-select' | 'playing' | 'finished';

interface GameState {
  mode: GameMode | null;
  category: string | null;
  phase: GamePhase;
  itemIndex: number;
  step: number;
  isRandom: boolean;
}

interface Props {
  data: AppData;
}

export const GameContainer: React.FC<Props> = ({ data }) => {
  const [state, setState] = useState<GameState>({
    mode: null,
    category: null,
    phase: 'mode-select',
    itemIndex: 0,
    step: 0,
    isRandom: false,
  });

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // ------- helpers to get items based on mode + category -------

  const getQAItems = useCallback((cat: string): QAItem[] => {
    if (cat === 'all') {
      return Object.values(data.qa).flat();
    }
    return data.qa[cat] || [];
  }, [data]);

  const getVocabItems = useCallback((cat: string): VocabItem[] => {
    if (cat === 'all') {
      return Object.values(data.imageVocabulary).flat();
    }
    return data.imageVocabulary[cat] || [];
  }, [data]);

  const getTranslationItems = useCallback((cat: string): TranslationItem[] => {
    if (cat === 'all') {
      return Object.values(data.translations).flat();
    }
    return data.translations[cat] || [];
  }, [data]);

  const currentItems = useMemo(() => {
    if (!state.mode || !state.category) return [];
    if (state.mode === 'qa') return getQAItems(state.category);
    if (state.mode === 'image') return getVocabItems(state.category);
    return getTranslationItems(state.category);
  }, [state.mode, state.category, getQAItems, getVocabItems, getTranslationItems]);

  const totalItems = currentItems.length;

  const actualIndex = useMemo(() => {
    if (state.isRandom && shuffledIndices.length > 0) {
      return shuffledIndices[state.itemIndex % shuffledIndices.length] ?? state.itemIndex;
    }
    return state.itemIndex;
  }, [state.itemIndex, state.isRandom, shuffledIndices]);

  // ------- timer for text mode -------

  useEffect(() => {
    let interval: number | undefined;
    if (timerActive) {
      interval = window.setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive]);

  // ------- shuffle helper -------

  const shuffle = useCallback((length: number) => {
    const arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  // ------- categories for each mode -------

  const getCategoriesForMode = useCallback((mode: GameMode) => {
    if (mode === 'qa') {
      const cats = Object.keys(data.qa).map(key => ({
        key,
        label: key,
        count: (data.qa[key] || []).length
      }));
      return [
        { key: 'all', label: '🔀 All', count: Object.values(data.qa).flat().length },
        ...cats
      ];
    }
    if (mode === 'image') {
      const cats = Object.keys(data.imageVocabulary).map(key => ({
        key,
        label: key,
        count: (data.imageVocabulary[key] || []).length
      }));
      return [
        { key: 'all', label: '🔀 All', count: Object.values(data.imageVocabulary).flat().length },
        ...cats
      ];
    }
    const cats = Object.keys(data.translations).map(key => ({
      key,
      label: key,
      count: (data.translations[key] || []).length
    }));
    return [
      { key: 'all', label: '🔀 All', count: Object.values(data.translations).flat().length },
      ...cats
    ];
  }, [data]);


  // ------- actions -------

  const selectMode = useCallback((mode: GameMode) => {
    setState({ mode, category: null, phase: 'category-select', itemIndex: 0, step: 0, isRandom: false });
    setTimerSeconds(0);
    setTimerActive(false);
  }, []);

  const selectCategory = useCallback((category: string) => {
    setState((prev) => {
      const newState = { ...prev, category, phase: 'playing' as const, itemIndex: 0, step: 0 };
      return newState;
    });
    setTimerSeconds(0);
    if (state.mode === 'text') setTimerActive(true);

    // Build shuffle order
    const items = (() => {
      if (state.mode === 'qa') return getQAItems(category);
      if (state.mode === 'image') return getVocabItems(category);
      return getTranslationItems(category);
    })();
    
    if (state.isRandom) {
      setShuffledIndices(shuffle(items.length));
    } else {
      setShuffledIndices(Array.from({ length: items.length }, (_, i) => i));
    }
  }, [state.mode, state.isRandom, getQAItems, getVocabItems, getTranslationItems, shuffle]);

  const toggleRandom = useCallback(() => {
    setState((prev) => {
      const newRandom = !prev.isRandom;
      if (newRandom) {
        setShuffledIndices(shuffle(currentItems.length));
      }
      return { ...prev, isRandom: newRandom };
    });
  }, [currentItems.length, shuffle]);

  const goBack = useCallback(() => {
    if (state.phase === 'category-select') {
      setState({ mode: null, category: null, phase: 'mode-select', itemIndex: 0, step: 0, isRandom: false });
    } else if (state.phase === 'playing' || state.phase === 'finished') {
      setState((prev) => ({ ...prev, category: null, phase: 'category-select', itemIndex: 0, step: 0 }));
      setTimerActive(false);
      setTimerSeconds(0);
    }
  }, [state.phase]);

  const restartGame = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'playing', itemIndex: 0, step: 0 }));
    setTimerSeconds(0);
    if (state.mode === 'text') setTimerActive(true);
    if (state.isRandom) {
      setShuffledIndices(shuffle(totalItems));
    }
  }, [state.mode, state.isRandom, totalItems, shuffle]);

  const handleNext = useCallback(() => {
    if (state.phase !== 'playing' || totalItems === 0) return;

    const item = currentItems[actualIndex];
    if (!item) return;

    if (state.mode === 'qa') {
      const qaItem = item as QAItem;
      const maxSteps = qaItem.answers.length; // step 0 = question, step 1..N = answers
      if (state.step < maxSteps) {
        setState((prev) => ({ ...prev, step: prev.step + 1 }));
      } else {
        // next question
        if (state.itemIndex < totalItems - 1) {
          setState((prev) => ({ ...prev, itemIndex: prev.itemIndex + 1, step: 0 }));
        } else {
          setState((prev) => ({ ...prev, phase: 'finished' }));
        }
      }
    } else if (state.mode === 'image') {
      const vocabItem = item as VocabItem;
      const maxSteps = vocabItem.plural ? 2 : 1; // step 0 = image, step 1 = word, step 2 = plural
      if (state.step < maxSteps) {
        setState((prev) => ({ ...prev, step: prev.step + 1 }));
      } else {
        if (state.itemIndex < totalItems - 1) {
          setState((prev) => ({ ...prev, itemIndex: prev.itemIndex + 1, step: 0 }));
        } else {
          setState((prev) => ({ ...prev, phase: 'finished' }));
        }
      }
    } else {
      // text mode
      if (state.step === 0) {
        setState((prev) => ({ ...prev, step: 1 }));
        setTimerActive(false);
      } else {
        if (state.itemIndex < totalItems - 1) {
          setState((prev) => ({ ...prev, itemIndex: prev.itemIndex + 1, step: 0 }));
          setTimerSeconds(0);
          setTimerActive(true);
        } else {
          setState((prev) => ({ ...prev, phase: 'finished' }));
          setTimerActive(false);
        }
      }
    }
  }, [state, totalItems, currentItems, actualIndex, shuffle]);

  const handleBack = useCallback(() => {
    if (state.phase !== 'playing' || totalItems === 0) return;

    if (state.step > 0) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    } else {
      // Go to previous question
      let prevIndex = state.itemIndex - 1;
      if (prevIndex < 0) prevIndex = totalItems - 1;

      const prevActualIndex = state.isRandom && shuffledIndices.length > 0
        ? (shuffledIndices[prevIndex % shuffledIndices.length] ?? prevIndex)
        : prevIndex;

      const prevItem = currentItems[prevActualIndex];
      if (!prevItem) return;

      let prevMaxSteps = 0;
      if (state.mode === 'qa') {
        prevMaxSteps = (prevItem as QAItem).answers.length;
      } else if (state.mode === 'image') {
        prevMaxSteps = (prevItem as VocabItem).plural ? 2 : 1;
      } else {
        prevMaxSteps = 1; // text mode
      }

      setState((prev) => ({
        ...prev,
        itemIndex: prevIndex,
        step: prevMaxSteps,
      }));

      // reset or handle timer for text mode
      if (state.mode === 'text') {
        setTimerSeconds(0);
        setTimerActive(true);
      }
    }
  }, [state.phase, state.step, state.itemIndex, state.mode, state.isRandom, totalItems, currentItems, shuffledIndices]);

  // ------- keyboard support -------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'Backspace') {
        e.preventDefault();
        handleBack();
      } else if (e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        if (state.phase === 'finished') {
          restartGame();
        } else {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handleBack, restartGame, state.phase]);

  // ------- format timer -------

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ===================== RENDER =====================

  // Mode selection
  if (state.phase === 'mode-select') {
    const modes: { key: GameMode; icon: string; label: string; desc: string; color: string }[] = [
      { key: 'qa', icon: '💬', label: 'Questions', desc: 'Practice Q&A with verb to be and question words', color: '#7c3aed' },
      { key: 'image', icon: '🖼️', label: 'Image', desc: 'Learn vocabulary with images', color: '#10b981' },
      { key: 'text', icon: '📝', label: 'Text', desc: 'Read and translate sentences', color: '#f59e0b' },
    ];

    return (
      <div style={styles.centeredContainer}>
        <h1 style={styles.mainTitle}>English Trainer</h1>
        <p style={styles.subtitle}>Choose a game mode to begin</p>
        <div style={styles.modeGrid}>
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => selectMode(m.key)}
              style={{
                ...styles.modeCard,
                borderColor: m.color,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px) scale(1.02)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px ${m.color}33`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '3rem' }}>{m.icon}</span>
              <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: m.color }}>{m.label}</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Category selection
  if (state.phase === 'category-select' && state.mode) {
    const categories = getCategoriesForMode(state.mode);
    const modeColors: Record<GameMode, string> = { qa: '#7c3aed', image: '#10b981', text: '#f59e0b' };
    const color = modeColors[state.mode];

    return (
      <div style={styles.centeredContainer}>
        <button onClick={goBack} style={styles.backBtn}>← Back</button>
        <h1 style={{ ...styles.mainTitle, color }}>
          {state.mode === 'qa' ? '💬 Questions' : state.mode === 'image' ? '🖼️ Image' : '📝 Text'}
        </h1>
        <p style={styles.subtitle}>Select a category</p>

        {/* Randomness Toggle */}
        <div style={styles.toggleWrapper}>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Sequential</span>
          <button
            onClick={toggleRandom}
            style={{
              ...styles.toggleSwitch,
              background: state.isRandom ? color : 'var(--border)',
            }}
          >
            <div style={{
              ...styles.toggleThumb,
              transform: state.isRandom ? 'translateX(24px)' : 'translateX(0)',
            }} />
          </button>
          <span style={{ color: state.isRandom ? color : 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600 }}>
            🔀 Random
          </span>
        </div>

        <div style={styles.categoryGrid}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => cat.count > 0 && selectCategory(cat.key)}
              disabled={cat.count === 0}
              style={{
                ...styles.categoryCard,
                opacity: cat.count === 0 ? 0.4 : 1,
                cursor: cat.count === 0 ? 'not-allowed' : 'pointer',
                borderColor: cat.count > 0 ? color : 'var(--border)',
              }}
              onMouseEnter={(e) => {
                if (cat.count > 0) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{cat.label}</span>
              <span style={{
                fontSize: '0.8rem',
                color: cat.count > 0 ? color : 'var(--text-dim)',
                background: `${color}15`,
                padding: '2px 10px',
                borderRadius: '12px',
              }}>
                {cat.count} items
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Playing
  if (state.phase === 'playing' && totalItems === 0) {
    return (
      <div style={styles.centeredContainer}>
        <button onClick={goBack} style={styles.backBtn}>← Back</button>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-dim)' }}>No items in this category. Add some in the Admin!</p>
      </div>
    );
  }

  // Finished
  if (state.phase === 'finished') {
    const modeColor = state.mode === 'qa' ? '#7c3aed' : state.mode === 'image' ? '#10b981' : '#f59e0b';
    return (
      <div style={styles.centeredContainer}>
        <div style={{ ...styles.gameCard, borderColor: modeColor, padding: '4rem 2rem' }}>
          <div style={styles.cardContent}>
            <span style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎯</span>
            <h1 style={{ ...styles.mainTitle, color: modeColor, marginBottom: '1rem' }}>Success!</h1>
            <p style={{ ...styles.subtitle, marginBottom: '2rem' }}>
              You've completed all {totalItems} items in {state.category}.
            </p>
            
            <div style={styles.buttonGroup}>
              <button
                onClick={goBack}
                style={{ ...styles.nextBtn, background: 'transparent', border: `2px solid ${modeColor}`, color: modeColor }}
              >
                Category Menu
              </button>
              <button
                onClick={restartGame}
                style={{ ...styles.nextBtn, background: modeColor }}
              >
                Restart Game
              </button>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
              or press <kbd style={styles.kbd}>ENTER</kbd> to Restart
            </p>
          </div>
        </div>
      </div>
    );
  }

  const item = currentItems[actualIndex];
  const modeColor = state.mode === 'qa' ? '#7c3aed' : state.mode === 'image' ? '#10b981' : '#f59e0b';

  return (
    <div style={styles.centeredContainer}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button onClick={goBack} style={styles.backBtn}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
            {state.itemIndex + 1} / {totalItems}
          </span>
          <button
            onClick={toggleRandom}
            style={{
              ...styles.toggleBtn,
              background: state.isRandom ? modeColor : 'transparent',
              color: state.isRandom ? 'white' : 'var(--text-dim)',
              border: `1px solid ${state.isRandom ? modeColor : 'var(--border)'}`,
            }}
          >
            🔀 {state.isRandom ? 'Random' : 'Sequential'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBarBg}>
        <div style={{
          ...styles.progressBarFill,
          width: `${((state.itemIndex + 1) / totalItems) * 100}%`,
          background: modeColor,
        }} />
      </div>

      {/* Game card */}
      <div style={{ ...styles.gameCard, borderColor: modeColor }}>
        {/* QA mode */}
        {state.mode === 'qa' && item && (() => {
          const qaItem = item as QAItem;
          return (
            <div style={styles.cardContent}>
              <div style={styles.stepBadge}>
                {state.step === 0 ? 'QUESTION' : `ANSWER ${state.step}`}
              </div>
              {state.step === 0 ? (
                <p style={styles.mainText}>{qaItem.question}</p>
              ) : (
                <>
                  <p style={{ ...styles.dimText, marginBottom: '1.5rem' }}>{qaItem.question}</p>
                  <p style={{
                    ...styles.mainText,
                    color: state.step === 1 ? '#10b981' : state.step === 2 ? '#ef4444' : modeColor,
                  }}>
                    {qaItem.answers[state.step - 1] ?? '—'}
                  </p>
                </>
              )}
            </div>
          );
        })()}

        {/* Image mode */}
        {state.mode === 'image' && item && (() => {
          const vocabItem = item as VocabItem;
          return (
            <div style={styles.cardContent}>
              <div style={styles.stepBadge}>
                {state.step === 0 ? 'IMAGE' : state.step === 1 ? 'WORD' : 'PLURAL'}
              </div>

              {/* Always show image */}
              <div style={styles.imageWrapper}>
                {vocabItem.image ? (
                  <img
                    src={vocabItem.image}
                    alt="vocabulary"
                    style={styles.vocabImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>🖼️</div>
                )}
              </div>

              {/* Show word on step >= 1 */}
              {state.step >= 1 && (
                <p style={{ ...styles.mainText, marginTop: '1.5rem' }}>{vocabItem.word}</p>
              )}

              {/* Show plural on step >= 2 */}
              {state.step >= 2 && vocabItem.plural && (
                <p style={{ ...styles.subText, color: '#10b981' }}>
                  Plural: {vocabItem.plural}
                </p>
              )}
            </div>
          );
        })()}

        {/* Text mode */}
        {state.mode === 'text' && item && (() => {
          const transItem = item as TranslationItem;
          return (
            <div style={styles.cardContent}>
              <div style={styles.stepBadge}>
                {state.step === 0 ? 'READ' : 'TRANSLATION'}
              </div>

              <p style={styles.mainText}>{transItem.text}</p>

              {state.step === 0 && (
                <div style={styles.timer}>
                  <span style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums', color: modeColor }}>
                    {formatTime(timerSeconds)}
                  </span>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Read as fast as you can!
                  </p>
                </div>
              )}

              {state.step === 1 && (
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ ...styles.subText, color: modeColor, fontSize: '1.5rem' }}>
                    {transItem.translation}
                  </p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Time: {formatTime(timerSeconds)}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Navigation buttons */}
      <div style={styles.buttonGroup}>
        <button
          onClick={handleBack}
          style={{ ...styles.nextBtn, background: 'transparent', border: `2px solid ${modeColor}`, color: modeColor }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          style={{ ...styles.nextBtn, background: modeColor }}
        >
          Next →
        </button>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
        <kbd style={styles.kbd}>SPACE</kbd> or <kbd style={styles.kbd}>→</kbd> to Next | <kbd style={styles.kbd}>←</kbd> to Back
      </p>
    </div>
  );
};

// ===================== STYLES =====================

const styles: Record<string, React.CSSProperties> = {
  centeredContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
    position: 'relative',
  },
  mainTitle: {
    fontSize: '2.5rem',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: 'var(--text-main)',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: 'var(--text-dim)',
    marginBottom: '3rem',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '900px',
  },
  modeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2.5rem 1.5rem',
    borderRadius: '16px',
    background: 'var(--bg-card)',
    border: '2px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: 'var(--text-main)',
    textAlign: 'center',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    width: '100%',
    maxWidth: '700px',
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.5rem 1rem',
    borderRadius: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    transition: 'all 0.2s ease',
    color: 'var(--text-main)',
  },
  backBtn: {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    background: 'transparent',
    color: 'var(--text-dim)',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '700px',
    marginBottom: '1rem',
  },
  toggleBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  progressBarBg: {
    width: '100%',
    maxWidth: '700px',
    height: '4px',
    background: 'var(--border)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '2rem',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  gameCard: {
    width: '100%',
    maxWidth: '700px',
    minHeight: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    borderRadius: '20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    marginBottom: '2rem',
    transition: 'all 0.3s ease',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  stepBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    background: 'var(--bg-main)',
    padding: '4px 14px',
    borderRadius: '20px',
    marginBottom: '1.5rem',
    border: '1px solid var(--border)',
  },
  mainText: {
    fontSize: '2rem',
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
    color: 'var(--text-main)',
    lineHeight: 1.4,
    margin: 0,
  },
  dimText: {
    fontSize: '1rem',
    color: 'var(--text-dim)',
    margin: 0,
  },
  subText: {
    fontSize: '1.25rem',
    fontWeight: 500,
    margin: 0,
  },
  imageWrapper: {
    width: '240px',
    height: '240px',
    borderRadius: '16px',
    overflow: 'hidden',
    background: 'var(--bg-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
  },
  vocabImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    fontSize: '4rem',
  },
  timer: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  nextBtn: {
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: 600,
    padding: '1rem 3rem',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '160px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbd: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
  },
  toggleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    background: 'var(--bg-card)',
    padding: '0.75rem 1.5rem',
    borderRadius: '30px',
    border: '1px solid var(--border)',
  },
  toggleSwitch: {
    width: '48px',
    height: '24px',
    borderRadius: '12px',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  toggleThumb: {
    width: '20px',
    height: '20px',
    background: 'white',
    borderRadius: '50%',
    transition: 'transform 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
};
