import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [showTranslation, setShowTranslation] = useState(false);
  const [textRate, setTextRate] = useState<number>(0.9);
  
  const [isRepeating, setIsRepeating] = useState(false);
  const isRepeatingRef = useRef(false);
  const [spokenWord, setSpokenWord] = useState<{ text: string; start: number; length: number } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenTextRef = useRef<string | null>(null);

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

  const handleShowTranslation = useCallback(() => {
    setShowTranslation((prev) => !prev);
  }, []);

  const handleSpeak = useCallback((text: string, forceRate?: number) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      // Only clear if manually stopped via click, but allow new speech if a different text was clicked
      setIsRepeating(false);
      isRepeatingRef.current = false;
      setSpokenWord(null);
      
      if (lastSpokenTextRef.current === text) {
        lastSpokenTextRef.current = null;
        return; // Act as a Toggle STOP
      }
    }

    lastSpokenTextRef.current = text;
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Prevent garbage collection bug in Chrome

    // Select an English voice (prefer local service as network voices often ignore 'rate')
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    // Prefer local voices since many cloud/network TTS ignore rate settings
    const preferredVoice = englishVoices.find(v => v.localService) || englishVoices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else {
      utterance.lang = 'en-US';
    }

    const appliedRate = forceRate ?? 0.9;
    utterance.rate = appliedRate; // Slightly slower for clearer pronunciation by default
    console.log("Playing text '", text, "' at rate:", appliedRate, "Voice:", preferredVoice?.name);
    
    // Add loop and bounding logic
    utterance.onstart = () => {
      setSpokenWord({ text, start: 0, length: 0 }); // init
    };
    utterance.onboundary = (e) => {
      let length = e.charLength || 0;
      if (length === 0) {
        const match = text.slice(e.charIndex).match(/^[^\s.,;?!]+/);
        if (match) length = match[0].length;
        else length = 1;
      }
      setSpokenWord({ text, start: e.charIndex, length });
    };
    utterance.onend = () => {
      setSpokenWord(null);
      if (isRepeatingRef.current) {
        // Use a clean timeout to avoid speech API quirks on instantaneous restart
        setTimeout(() => handleSpeak(text, forceRate), 800);
      } else {
        lastSpokenTextRef.current = null;
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleNext = useCallback(() => {
    if (state.phase !== 'playing' || totalItems === 0) return;

    // Reset translation and repeating
    setShowTranslation(false);
    setIsRepeating(false);
    isRepeatingRef.current = false;
    setSpokenWord(null);
    window.speechSynthesis.cancel();

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
        // In text mode, each text is a single game, so it doesn't move to the next item
        setState((prev) => ({ ...prev, phase: 'finished' }));
        setTimerActive(false);
      }
    }
  }, [state, totalItems, currentItems, actualIndex, shuffle]);

  const handleBack = useCallback(() => {
    if (state.phase !== 'playing' || totalItems === 0) return;

    if (state.step > 0) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    } else {
      if (state.mode === 'text') {
        // Since each text is standalone, 'Back' at step 0 goes back to selection menu
        setState((prev) => ({ ...prev, phase: 'category-select' }));
        setTimerActive(false);
        setShowTranslation(false);
        setIsRepeating(false);
        isRepeatingRef.current = false;
        setSpokenWord(null);
        window.speechSynthesis.cancel();
        return;
      }

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


    }
    // Reset translation and repeating
    setShowTranslation(false);
    setIsRepeating(false);
    isRepeatingRef.current = false;
    setSpokenWord(null);
    window.speechSynthesis.cancel();
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

  // ------- rendering helpers -------

  const renderTextWithHighlight = useCallback((textToRender: string, color: string) => {
    if (!spokenWord || spokenWord.text !== textToRender || spokenWord.start >= textToRender.length) {
      return <>{textToRender}</>;
    }
    
    const { start, length } = spokenWord;
    const before = textToRender.slice(0, start);
    // If length is 0, it means we are just starting and haven't hit a boundary for word length, or it's just initializing
    const word = length > 0 ? textToRender.slice(start, start + length) : '';
    const after = length > 0 ? textToRender.slice(start + length) : textToRender.slice(start);
    
    return (
      <>
        {before}
        {length > 0 && (
          <span style={{ 
            backgroundColor: `${color}33`, 
            color: color,
            borderRadius: '4px',
            transition: 'all 0.1s ease',
          }}>{word}</span>
        )}
        {after}
      </>
    );
  }, [spokenWord]);

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

    if (state.mode === 'text') {
      // In text mode, the user wants a list of individual texts instead of categories
      const allTexts: { category: string, index: number, text: TranslationItem, globalIndex: number }[] = [];
      let globalIndex = 0;
      Object.entries(data.translations).forEach(([catKey, texts]) => {
        texts.forEach((text, catIdx) => {
          allTexts.push({
            category: catKey,
            index: catIdx + 1,
            text,
            globalIndex
          });
          globalIndex++;
        });
      });

      return (
        <div style={styles.centeredContainer}>
          <button onClick={goBack} style={styles.backBtn}>← Back</button>
          <h1 style={{ ...styles.mainTitle, color }}>📝 Text</h1>
          <p style={styles.subtitle}>Select a text to practice</p>

          <div style={{
            ...styles.categoryGrid,
            gridTemplateColumns: 'minmax(300px, 1fr)',
            maxWidth: '800px'
          }}>
            {allTexts.map((item) => (
              <button
                key={item.globalIndex}
                onClick={() => {
                  setState({
                    mode: 'text',
                    category: 'all',
                    phase: 'playing',
                    itemIndex: item.globalIndex,
                    step: 0,
                    isRandom: false
                  });
                  setTimerSeconds(0);
                  setTimerActive(true);
                }}
                style={{
                  ...styles.categoryCard,
                  borderColor: color,
                  textAlign: 'left',
                  alignItems: 'flex-start',
                  padding: '1.25rem',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  {item.category} #{item.index}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', alignSelf: 'flex-start', textAlign: 'left' }}>
                  {item.text.text.length > 100 ? item.text.text.substring(0, 100) + '...' : item.text.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

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
              ...styles.toggleSwitchThumb,
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
        {state.mode !== 'text' && (
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
        )}
      </div>

      {/* Progress bar */}
      {state.mode !== 'text' && (
        <div style={styles.progressBarBg}>
          <div style={{
            ...styles.progressBarFill,
            width: `${((state.itemIndex + 1) / totalItems) * 100}%`,
            background: modeColor,
          }} />
        </div>
      )}

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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
                  <div className="qa-text-container">
                    <p style={styles.mainText}>{renderTextWithHighlight(qaItem.question, modeColor)}</p>
                    <div className="qa-icons-container">
                      <button
                        onClick={() => handleSpeak(qaItem.question)}
                        style={styles.iconBtn}
                        title="Ouça em Inglês"
                      >
                        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 15H3C2.20435 15 1.4413 14.6839 0.878693 14.1213C0.316083 13.5587 0 12.7956 0 12V8C0 7.20435 0.316083 6.44129 0.878693 5.87868C1.4413 5.31607 2.20435 5 3 5H9V15ZM3 7C2.73478 7 2.48044 7.10536 2.29291 7.29289C2.10537 7.48043 2 7.73478 2 8V12C2 12.2652 2.10537 12.5196 2.29291 12.7071C2.48044 12.8946 2.73478 13 3 13H7V7H3Z" fill="#4F4F4D" />
                          <path d="M22 20H17V18.67L7 14.67V5.32001L17 1.32001V0H22V20ZM19 18H20V2H19V2.67L9 6.67V13.32L19 17.32V18Z" fill="#4F4F4D" />
                          <path d="M8.00001 19.94H4.32001L2.07001 14.31L3.92001 13.57L5.67001 17.94H6.00001V13.94H8.00001V19.94Z" fill="#4F4F4D" />
                          <path d="M19 1.94H17V5.94H19V1.94Z" fill="#4F4F4D" />
                          <path d="M19 7.94H17V18.94H19V7.94Z" fill="#4F4F4D" />
                          <path d="M8.00002 7.94H3.00002V9.94H8.00002V7.94Z" fill="#4F4F4D" />
                        </svg>

                      </button>
                      <button
                        onClick={handleShowTranslation}
                        style={{
                          ...styles.iconBtn,
                          background: showTranslation ? modeColor : 'var(--bg-main)',
                          borderColor: showTranslation ? modeColor : 'var(--border)',
                        }}
                        title="Mostrar Tradução"
                      >
                        {showTranslation ? (
                          <svg width="23" height="14" viewBox="0 0 23 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.27 13.98C7.35 13.98 3.61 11.77 0.449997 7.59L0 6.99001L0.449997 6.39001C3.61 2.21001 7.35 0 11.27 0C15.19 0 18.92 2.21001 22.08 6.39001L22.54 6.99001L22.08 7.59C18.92 11.76 15.18 13.98 11.27 13.98ZM2.52 6.98C5.17 10.25 8.19 11.98 11.27 11.98C14.35 11.98 17.36 10.26 20.01 6.98C17.36 3.71 14.35 1.98 11.27 1.98C8.19 1.98 5.17 3.71 2.52 6.98Z" fill="#ffffff" />
                            <path d="M11.27 11.98C10.2811 11.98 9.31438 11.6868 8.49213 11.1373C7.66989 10.5879 7.02903 9.80704 6.6506 8.89341C6.27216 7.97978 6.17314 6.97445 6.36606 6.00455C6.55899 5.03464 7.03519 4.14372 7.73446 3.44446C8.43372 2.7452 9.32463 2.269 10.2945 2.07607C11.2644 1.88315 12.2698 1.98216 13.1834 2.3606C14.097 2.73903 14.8779 3.3799 15.4273 4.20214C15.9768 5.02439 16.27 5.99109 16.27 6.98C16.27 8.30608 15.7432 9.57785 14.8055 10.5155C13.8678 11.4532 12.5961 11.98 11.27 11.98ZM11.27 3.98C10.6767 3.98 10.0966 4.15594 9.60328 4.48559C9.10993 4.81523 8.72542 5.28377 8.49836 5.83195C8.2713 6.38013 8.21187 6.98333 8.32763 7.56527C8.44338 8.14721 8.72911 8.68176 9.14867 9.10132C9.56823 9.52088 10.1028 9.80659 10.6847 9.92235C11.2667 10.0381 11.8699 9.9787 12.418 9.75163C12.9662 9.52457 13.4348 9.14005 13.7644 8.64671C14.094 8.15336 14.27 7.57334 14.27 6.98C14.27 6.18435 13.9539 5.42128 13.3913 4.85867C12.8287 4.29606 12.0656 3.98 11.27 3.98Z" fill="#ffffff" />
                          </svg>
                        ) : (
                          <svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.27 14.98C7.35 14.98 3.61 12.77 0.449997 8.59L0 7.99001L0.449997 7.39001C3.61 3.21001 7.35 1 11.27 1C15.19 1 18.92 3.21001 22.08 7.39001L22.54 7.99001L22.08 8.59C18.92 12.76 15.18 14.98 11.27 14.98ZM2.52 7.98C5.17 11.25 8.19 12.98 11.27 12.98C14.35 12.98 17.36 11.26 20.01 7.98C17.36 4.71 14.35 2.98 11.27 2.98C8.19 2.98 5.17 4.71 2.52 7.98Z" fill="#4F4F4D" />
                            <path d="M11.27 12.98C10.2811 12.98 9.31438 12.6868 8.49213 12.1373C7.66989 11.5879 7.02903 10.807 6.6506 9.89341C6.27216 8.97978 6.17314 7.97445 6.36606 7.00455C6.55899 6.03464 7.03519 5.14372 7.73446 4.44446C8.43372 3.7452 9.32463 3.269 10.2945 3.07607C11.2644 2.88315 12.2698 2.98216 13.1834 3.3606C14.097 3.73903 14.8779 4.3799 15.4273 5.20214C15.9768 6.02439 16.27 6.99109 16.27 7.98C16.27 9.30608 15.7432 10.5779 14.8055 11.5155C13.8678 12.4532 12.5961 12.98 11.27 12.98V12.98ZM11.27 4.98C10.6767 4.98 10.0966 5.15594 9.60328 5.48559C9.10993 5.81523 8.72542 6.28377 8.49836 6.83195C8.2713 7.38013 8.21187 7.98333 8.32763 8.56527C8.44338 9.14721 8.72911 9.68176 9.14867 10.1013C9.56823 10.5209 10.1028 10.8066 10.6847 10.9223C11.2667 11.0381 11.8699 10.9787 12.418 10.7516C12.9662 10.5246 13.4348 10.1401 13.7644 9.64671C14.094 9.15336 14.27 8.57334 14.27 7.98C14.27 7.18435 13.9539 6.42128 13.3913 5.85867C12.8287 5.29606 12.0656 4.98 11.27 4.98V4.98Z" fill="#4F4F4D" />
                            <path d="M17.3195 -7.5353e-06L3 14.3195L4.6805 16L19 1.6805L17.3195 -7.5353e-06Z" fill="#4F4F4D" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {showTranslation && (
                    <p style={{ ...styles.translationText, color: modeColor }}>
                      {qaItem.questao || '— Translation missing —'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="qa-text-container" style={{ marginBottom: '1.5rem' }}>
                    <p style={styles.dimText}>{renderTextWithHighlight(qaItem.question, modeColor)}</p>
                    <div className="qa-icons-container">
                      <button
                        onClick={() => handleSpeak(qaItem.question)}
                        style={{ ...styles.iconBtn }}
                        title="Ouça em Inglês"
                      >
                        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 15H3C2.20435 15 1.4413 14.6839 0.878693 14.1213C0.316083 13.5587 0 12.7956 0 12V8C0 7.20435 0.316083 6.44129 0.878693 5.87868C1.4413 5.31607 2.20435 5 3 5H9V15ZM3 7C2.73478 7 2.48044 7.10536 2.29291 7.29289C2.10537 7.48043 2 7.73478 2 8V12C2 12.2652 2.10537 12.5196 2.29291 12.7071C2.48044 12.8946 2.73478 13 3 13H7V7H3Z" fill="#4F4F4D" />
                          <path d="M22 20H17V18.67L7 14.67V5.32001L17 1.32001V0H22V20ZM19 18H20V2H19V2.67L9 6.67V13.32L19 17.32V18Z" fill="#4F4F4D" />
                          <path d="M8.00001 19.94H4.32001L2.07001 14.31L3.92001 13.57L5.67001 17.94H6.00001V13.94H8.00001V19.94Z" fill="#4F4F4D" />
                          <path d="M19 1.94H17V5.94H19V1.94Z" fill="#4F4F4D" />
                          <path d="M19 7.94H17V18.94H19V7.94Z" fill="#4F4F4D" />
                          <path d="M8.00002 7.94H3.00002V9.94H8.00002V7.94Z" fill="#4F4F4D" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
                    <div className="qa-text-container">
                      <p style={{
                        ...styles.mainText,
                        color: state.step === 1 ? '#10b981' : state.step === 2 ? '#ef4444' : modeColor,
                      }}>
                        {renderTextWithHighlight(qaItem.answers[state.step - 1] ?? '—', modeColor)}
                      </p>
                      <div className="qa-icons-container">
                        <button
                          onClick={() => handleSpeak(qaItem.answers[state.step - 1] ?? '')}
                          style={styles.iconBtn}
                          title="Ouça em Inglês"
                        >
                          <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 15H3C2.20435 15 1.4413 14.6839 0.878693 14.1213C0.316083 13.5587 0 12.7956 0 12V8C0 7.20435 0.316083 6.44129 0.878693 5.87868C1.4413 5.31607 2.20435 5 3 5H9V15ZM3 7C2.73478 7 2.48044 7.10536 2.29291 7.29289C2.10537 7.48043 2 7.73478 2 8V12C2 12.2652 2.10537 12.5196 2.29291 12.7071C2.48044 12.8946 2.73478 13 3 13H7V7H3Z" fill="#4F4F4D" />
                            <path d="M22 20H17V18.67L7 14.67V5.32001L17 1.32001V0H22V20ZM19 18H20V2H19V2.67L9 6.67V13.32L19 17.32V18Z" fill="#4F4F4D" />
                            <path d="M8.00001 19.94H4.32001L2.07001 14.31L3.92001 13.57L5.67001 17.94H6.00001V13.94H8.00001V19.94Z" fill="#4F4F4D" />
                            <path d="M19 1.94H17V5.94H19V1.94Z" fill="#4F4F4D" />
                            <path d="M19 7.94H17V18.94H19V7.94Z" fill="#4F4F4D" />
                            <path d="M8.00002 7.94H3.00002V9.94H8.00002V7.94Z" fill="#4F4F4D" />
                          </svg>
                        </button>
                        <button
                          onClick={handleShowTranslation}
                          style={{
                            ...styles.iconBtn,
                            background: showTranslation ? (state.step === 1 ? '#10b981' : state.step === 2 ? '#ef4444' : modeColor) : 'var(--bg-main)',
                            borderColor: showTranslation ? (state.step === 1 ? '#10b981' : state.step === 2 ? '#ef4444' : modeColor) : 'var(--border)',
                          }}
                          title="Mostrar Tradução"
                        >
                          {showTranslation ? (
                            <svg width="23" height="14" viewBox="0 0 23 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.27 13.98C7.35 13.98 3.61 11.77 0.449997 7.59L0 6.99001L0.449997 6.39001C3.61 2.21001 7.35 0 11.27 0C15.19 0 18.92 2.21001 22.08 6.39001L22.54 6.99001L22.08 7.59C18.92 11.76 15.18 13.98 11.27 13.98ZM2.52 6.98C5.17 10.25 8.19 11.98 11.27 11.98C14.35 11.98 17.36 10.26 20.01 6.98C17.36 3.71 14.35 1.98 11.27 1.98C8.19 1.98 5.17 3.71 2.52 6.98Z" fill="#ffffff" />
                              <path d="M11.27 11.98C10.2811 11.98 9.31438 11.6868 8.49213 11.1373C7.66989 10.5879 7.02903 9.80704 6.6506 8.89341C6.27216 7.97978 6.17314 6.97445 6.36606 6.00455C6.55899 5.03464 7.03519 4.14372 7.73446 3.44446C8.43372 2.7452 9.32463 2.269 10.2945 2.07607C11.2644 1.88315 12.2698 1.98216 13.1834 2.3606C14.097 2.73903 14.8779 3.3799 15.4273 4.20214C15.9768 5.02439 16.27 5.99109 16.27 6.98C16.27 8.30608 15.7432 9.57785 14.8055 10.5155C13.8678 11.4532 12.5961 11.98 11.27 11.98ZM11.27 3.98C10.6767 3.98 10.0966 4.15594 9.60328 4.48559C9.10993 4.81523 8.72542 5.28377 8.49836 5.83195C8.2713 6.38013 8.21187 6.98333 8.32763 7.56527C8.44338 8.14721 8.72911 8.68176 9.14867 9.10132C9.56823 9.52088 10.1028 9.80659 10.6847 9.92235C11.2667 10.0381 11.8699 9.9787 12.418 9.75163C12.9662 9.52457 13.4348 9.14005 13.7644 8.64671C14.094 8.15336 14.27 7.57334 14.27 6.98C14.27 6.18435 13.9539 5.42128 13.3913 4.85867C12.8287 4.29606 12.0656 3.98 11.27 3.98Z" fill="#ffffff" />
                            </svg>
                          ) : (
                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.27 14.98C7.35 14.98 3.61 12.77 0.449997 8.59L0 7.99001L0.449997 7.39001C3.61 3.21001 7.35 1 11.27 1C15.19 1 18.92 3.21001 22.08 7.39001L22.54 7.99001L22.08 8.59C18.92 12.76 15.18 14.98 11.27 14.98ZM2.52 7.98C5.17 11.25 8.19 12.98 11.27 12.98C14.35 12.98 17.36 11.26 20.01 7.98C17.36 4.71 14.35 2.98 11.27 2.98C8.19 2.98 5.17 4.71 2.52 7.98Z" fill="#4F4F4D" />
                              <path d="M11.27 12.98C10.2811 12.98 9.31438 12.6868 8.49213 12.1373C7.66989 11.5879 7.02903 10.807 6.6506 9.89341C6.27216 8.97978 6.17314 7.97445 6.36606 7.00455C6.55899 6.03464 7.03519 5.14372 7.73446 4.44446C8.43372 3.7452 9.32463 3.269 10.2945 3.07607C11.2644 2.88315 12.2698 2.98216 13.1834 3.3606C14.097 3.73903 14.8779 4.3799 15.4273 5.20214C15.9768 6.02439 16.27 6.99109 16.27 7.98C16.27 9.30608 15.7432 10.5779 14.8055 11.5155C13.8678 12.4532 12.5961 12.98 11.27 12.98V12.98ZM11.27 4.98C10.6767 4.98 10.0966 5.15594 9.60328 5.48559C9.10993 5.81523 8.72542 6.28377 8.49836 6.83195C8.2713 7.38013 8.21187 7.98333 8.32763 8.56527C8.44338 9.14721 8.72911 9.68176 9.14867 10.1013C9.56823 10.5209 10.1028 10.8066 10.6847 10.9223C11.2667 11.0381 11.8699 10.9787 12.418 10.7516C12.9662 10.5246 13.4348 10.1401 13.7644 9.64671C14.094 9.15336 14.27 8.57334 14.27 7.98C14.27 7.18435 13.9539 6.42128 13.3913 5.85867C12.8287 5.29606 12.0656 4.98 11.27 4.98V4.98Z" fill="#4F4F4D" />
                              <path d="M17.3195 -7.5353e-06L3 14.3195L4.6805 16L19 1.6805L17.3195 -7.5353e-06Z" fill="#4F4F4D" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {showTranslation && (
                      <p style={{
                        ...styles.translationText,
                        color: state.step === 1 ? '#059669' : state.step === 2 ? '#dc2626' : modeColor
                      }}>
                        {qaItem.respostas?.[state.step - 1] || '— Translation missing —'}
                      </p>
                    )}
                  </div>
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

              <div className="qa-text-container">
                <p style={styles.mainText}>{renderTextWithHighlight(transItem.text, modeColor)}</p>
                <div className="qa-icons-container">
                  <button
                    onClick={() => handleSpeak(transItem.text, textRate)}
                    style={styles.iconBtn}
                    title="Ouça em Inglês"
                  >
                    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 15H3C2.20435 15 1.4413 14.6839 0.878693 14.1213C0.316083 13.5587 0 12.7956 0 12V8C0 7.20435 0.316083 6.44129 0.878693 5.87868C1.4413 5.31607 2.20435 5 3 5H9V15ZM3 7C2.73478 7 2.48044 7.10536 2.29291 7.29289C2.10537 7.48043 2 7.73478 2 8V12C2 12.2652 2.10537 12.5196 2.29291 12.7071C2.48044 12.8946 2.73478 13 3 13H7V7H3Z" fill="#4F4F4D" />
                      <path d="M22 20H17V18.67L7 14.67V5.32001L17 1.32001V0H22V20ZM19 18H20V2H19V2.67L9 6.67V13.32L19 17.32V18Z" fill="#4F4F4D" />
                      <path d="M8.00001 19.94H4.32001L2.07001 14.31L3.92001 13.57L5.67001 17.94H6.00001V13.94H8.00001V19.94Z" fill="#4F4F4D" />
                      <path d="M19 1.94H17V5.94H19V1.94Z" fill="#4F4F4D" />
                      <path d="M19 7.94H17V18.94H19V7.94Z" fill="#4F4F4D" />
                      <path d="M8.00002 7.94H3.00002V9.94H8.00002V7.94Z" fill="#4F4F4D" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const nextRate = textRate === 0.9 ? 1.0 : textRate === 1.0 ? 1.5 : textRate === 1.5 ? 1.6 : 0.9;
                      setTextRate(nextRate);
                      if (window.speechSynthesis.speaking) {
                        handleSpeak(transItem.text, nextRate);
                      }
                    }}
                    style={{
                      ...styles.iconBtn,
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: modeColor,
                      borderColor: modeColor
                    }}
                    title="Mudar Velocidade"
                  >
                    {textRate}x
                  </button>
                  <button
                    onClick={() => {
                      const nextRepeating = !isRepeating;
                      setIsRepeating(nextRepeating);
                      isRepeatingRef.current = nextRepeating;
                      if (nextRepeating && !window.speechSynthesis.speaking) {
                        handleSpeak(transItem.text, textRate);
                      } else if (!nextRepeating) {
                        window.speechSynthesis.cancel();
                      }
                    }}
                    style={{
                      ...styles.iconBtn,
                      background: isRepeating ? modeColor : 'var(--bg-main)',
                      borderColor: isRepeating ? modeColor : 'var(--border)',
                    }}
                    title="Repetir Áudio"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isRepeating ? '#fff' : '#4F4F4D'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9"></polyline>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                      <polyline points="7 23 3 19 7 15"></polyline>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                  </button>
                  <button
                    onClick={handleShowTranslation}
                    style={{
                      ...styles.iconBtn,
                      background: showTranslation ? modeColor : 'var(--bg-main)',
                      borderColor: showTranslation ? modeColor : 'var(--border)',
                    }}
                    title="Mostrar Tradução"
                  >
                    {showTranslation ? (
                      <svg width="23" height="14" viewBox="0 0 23 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.27 13.98C7.35 13.98 3.61 11.77 0.449997 7.59L0 6.99001L0.449997 6.39001C3.61 2.21001 7.35 0 11.27 0C15.19 0 18.92 2.21001 22.08 6.39001L22.54 6.99001L22.08 7.59C18.92 11.76 15.18 13.98 11.27 13.98ZM2.52 6.98C5.17 10.25 8.19 11.98 11.27 11.98C14.35 11.98 17.36 10.26 20.01 6.98C17.36 3.71 14.35 1.98 11.27 1.98C8.19 1.98 5.17 3.71 2.52 6.98Z" fill="#ffffff" />
                        <path d="M11.27 11.98C10.2811 11.98 9.31438 11.6868 8.49213 11.1373C7.66989 10.5879 7.02903 9.80704 6.6506 8.89341C6.27216 7.97978 6.17314 6.97445 6.36606 6.00455C6.55899 5.03464 7.03519 4.14372 7.73446 3.44446C8.43372 2.7452 9.32463 2.269 10.2945 2.07607C11.2644 1.88315 12.2698 1.98216 13.1834 2.3606C14.097 2.73903 14.8779 3.3799 15.4273 4.20214C15.9768 5.02439 16.27 5.99109 16.27 6.98C16.27 8.30608 15.7432 9.57785 14.8055 10.5155C13.8678 11.4532 12.5961 11.98 11.27 11.98ZM11.27 3.98C10.6767 3.98 10.0966 4.15594 9.60328 4.48559C9.10993 4.81523 8.72542 5.28377 8.49836 5.83195C8.2713 6.38013 8.21187 6.98333 8.32763 7.56527C8.44338 8.14721 8.72911 8.68176 9.14867 9.10132C9.56823 9.52088 10.1028 9.80659 10.6847 9.92235C11.2667 10.0381 11.8699 9.9787 12.418 9.75163C12.9662 9.52457 13.4348 9.14005 13.7644 8.64671C14.094 8.15336 14.27 7.57334 14.27 6.98C14.27 6.18435 13.9539 5.42128 13.3913 4.85867C12.8287 4.29606 12.0656 3.98 11.27 3.98Z" fill="#ffffff" />
                      </svg>
                    ) : (
                      <svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.27 14.98C7.35 14.98 3.61 12.77 0.449997 8.59L0 7.99001L0.449997 7.39001C3.61 3.21001 7.35 1 11.27 1C15.19 1 18.92 3.21001 22.08 7.39001L22.54 7.99001L22.08 8.59C18.92 12.76 15.18 14.98 11.27 14.98ZM2.52 7.98C5.17 11.25 8.19 12.98 11.27 12.98C14.35 12.98 17.36 11.26 20.01 7.98C17.36 4.71 14.35 2.98 11.27 2.98C8.19 2.98 5.17 4.71 2.52 7.98Z" fill="#4F4F4D" />
                        <path d="M11.27 12.98C10.2811 12.98 9.31438 12.6868 8.49213 12.1373C7.66989 11.5879 7.02903 10.807 6.6506 9.89341C6.27216 8.97978 6.17314 7.97445 6.36606 7.00455C6.55899 6.03464 7.03519 5.14372 7.73446 4.44446C8.43372 3.7452 9.32463 3.269 10.2945 3.07607C11.2644 2.88315 12.2698 2.98216 13.1834 3.3606C14.097 3.73903 14.8779 4.3799 15.4273 5.20214C15.9768 6.02439 16.27 6.99109 16.27 7.98C16.27 9.30608 15.7432 10.5779 14.8055 11.5155C13.8678 12.4532 12.5961 12.98 11.27 12.98V12.98ZM11.27 4.98C10.6767 4.98 10.0966 5.15594 9.60328 5.48559C9.10993 5.81523 8.72542 6.28377 8.49836 6.83195C8.2713 7.38013 8.21187 7.98333 8.32763 8.56527C8.44338 9.14721 8.72911 9.68176 9.14867 10.1013C9.56823 10.5209 10.1028 10.8066 10.6847 10.9223C11.2667 11.0381 11.8699 10.9787 12.418 10.7516C12.9662 10.5246 13.4348 10.1401 13.7644 9.64671C14.094 9.15336 14.27 8.57334 14.27 7.98C14.27 7.18435 13.9539 6.42128 13.3913 5.85867C12.8287 5.29606 12.0656 4.98 11.27 4.98V4.98Z" fill="#4F4F4D" />
                        <path d="M17.3195 -7.5353e-06L3 14.3195L4.6805 16L19 1.6805L17.3195 -7.5353e-06Z" fill="#4F4F4D" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {((state.step === 0 && showTranslation) || state.step === 1) && (
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ ...styles.subText, color: modeColor, fontSize: '1.5rem' }}>
                    {transItem.translation || '—'}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Navigation buttons */}
      {state.mode === 'text' ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setState((prev) => ({ ...prev, phase: 'category-select' }));
            }}
            style={{ ...styles.nextBtn, background: 'transparent', border: `2px solid ${modeColor}`, color: modeColor }}
          >
            ← Voltar para Lista
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}
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
    whiteSpace: 'nowrap',
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
  toggleSwitchThumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'white',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  translationText: {
    fontSize: '1.25rem',
    fontWeight: 500,
    fontStyle: 'italic',
    animation: 'fadeIn 0.3s ease forwards',
    textAlign: 'center',
  },
  iconBtn: {
    background: 'var(--bg-main)',
    border: '1px solid var(--border)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.25rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};
