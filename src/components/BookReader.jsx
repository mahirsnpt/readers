import React, { useState, useEffect, useRef } from 'react';

export default function BookReader({ book, activeChapterId, onChapterChange, highlights, onAddHighlight }) {
  const { title, chapters, speedReading } = book;
  
  const [activeReaderTab, setActiveReaderTab] = useState('summary');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState({ top: 0, left: 0, text: '' });
  
  const readerRef = useRef(null);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

  // Close highlight menu on click elsewhere
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (e.target.closest('.highlight-menu-popup')) return;
      setShowHighlightMenu(false);
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Capture selection on text area
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Check if valid length selection
    if (selectedText.length > 2) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate coordinates to float popup centered above selection
      setSelectionCoords({
        top: rect.top + window.scrollY - 50,
        left: rect.left + window.scrollX + (rect.width / 2) - 80,
        text: selectedText
      });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  };

  const applyHighlight = (color) => {
    if (!selectionCoords.text) return;
    
    // Call parent trigger to save to database
    onAddHighlight({
      id: Math.random().toString(36).substr(2, 9),
      bookId: book.id,
      bookTitle: title,
      chapterId: activeChapter.id,
      chapterTitle: activeChapter.title,
      text: selectionCoords.text,
      color: color,
      timestamp: Date.now()
    });

    // Clear selection
    window.getSelection().removeAllRanges();
    setShowHighlightMenu(false);
  };

  // Helper function to render text with saved highlights overlaid
  const renderHighlightedText = (text, chapterHighlights) => {
    if (!chapterHighlights || chapterHighlights.length === 0) return text;
    
    // Sort highlights by length descending to prevent shorter matches inside longer ones from breaking first
    const sorted = [...chapterHighlights].sort((a, b) => b.text.length - a.text.length);
    
    let partsArray = [text];
    
    sorted.forEach((hl) => {
      const tempArray = [];
      partsArray.forEach((part) => {
        if (typeof part !== 'string') {
          tempArray.push(part);
          return;
        }
        
        const idx = part.toLowerCase().indexOf(hl.text.toLowerCase());
        if (idx !== -1) {
          const splitParts = [];
          let remaining = part;
          
          while (true) {
            const matchIndex = remaining.toLowerCase().indexOf(hl.text.toLowerCase());
            if (matchIndex === -1) {
              splitParts.push(remaining);
              break;
            }
            splitParts.push(remaining.substring(0, matchIndex));
            const exactText = remaining.substring(matchIndex, matchIndex + hl.text.length);
            splitParts.push(
              <span key={hl.id + Math.random()} className={`highlight-${hl.color}`}>
                {exactText}
              </span>
            );
            remaining = remaining.substring(matchIndex + hl.text.length);
          }
          tempArray.push(...splitParts);
        } else {
          tempArray.push(part);
        }
      });
      partsArray = tempArray;
    });

    return partsArray;
  };

  // Get highlights for this specific book & chapter
  const currentChapterHighlights = highlights.filter(
    h => h.bookId === book.id && h.chapterId === activeChapter.id
  );

  return (
    <div className="reader-panel glass-panel" ref={readerRef}>
      {/* Reader Controls */}
      <div className="reader-header">
        {activeReaderTab === 'chapters' ? (
          <select 
            className="reader-chapter-select"
            value={activeChapterId}
            onChange={(e) => onChapterChange(Number(e.target.value))}
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                Chapter {ch.id}: {ch.title.substring(0, 30)}...
              </option>
            ))}
          </select>
        ) : (
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', fontSize: '15px', color: 'var(--primary)' }}>
            {activeReaderTab === 'summary' ? '📖 Book Summary Hub' : '⚡ Speed Reading Mode'}
          </div>
        )}

        <div className="reader-mode-toggles">
          <button 
            className={`mode-toggle-btn ${activeReaderTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveReaderTab('summary')}
          >
            📖 Summary
          </button>
          <button 
            className={`mode-toggle-btn ${activeReaderTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveReaderTab('chapters')}
          >
            📝 Chapters
          </button>
          <button 
            className={`mode-toggle-btn ${activeReaderTab === 'speed' ? 'active' : ''}`}
            onClick={() => setActiveReaderTab('speed')}
          >
            ⚡ Speed Read
          </button>
        </div>
      </div>

      {/* Floating Highlight Menu Popup */}
      {showHighlightMenu && (
        <div 
          className="highlight-menu-popup"
          style={{ top: `${selectionCoords.top}px`, left: `${selectionCoords.left}px` }}
        >
          <span className="highlight-menu-title">Highlight:</span>
          <button className="color-pill violet" onClick={() => applyHighlight('violet')} title="Violet" />
          <button className="color-pill emerald" onClick={() => applyHighlight('emerald')} title="Emerald" />
          <button className="color-pill gold" onClick={() => applyHighlight('gold')} title="Gold" />
          <button className="color-pill rose" onClick={() => applyHighlight('rose')} title="Rose" />
        </div>
      )}

      {/* Reader Content Body */}
      <div className="reader-body" onMouseUp={handleMouseUp}>
        {activeReaderTab === 'summary' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <h2 className="chapter-title-display">📖 Comprehensive Book Summary: {title}</h2>
            
            {/* Overview */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--primary)' }}>
                Overview & Core Premise
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7' }}>
                {book.description || "In this summary, we explore the core systems, frameworks, and insights detailing personal optimization, performance gains, and daily action rules."}
              </p>
            </div>

            {/* Key Ideas */}
            {chapters.length > 0 && (
              <div className="chapter-meta-card" style={{ background: 'rgba(139, 92, 246, 0.04)', borderColor: 'rgba(139, 92, 246, 0.1)' }}>
                <div className="meta-card-title key-idea" style={{ color: 'var(--primary)' }}>
                  💡 Key Foundational Ideas
                </div>
                <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)', fontSize: '14.5px' }}>
                  {chapters.map((ch, idx) => (
                    <li key={idx}>
                      <strong>{ch.title}:</strong> {ch.keyIdea}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Lessons & Concepts */}
            {book.takeaways && book.takeaways.length > 0 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--secondary)' }}>
                  Main Lessons & Key Concepts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {book.takeaways.filter(t => t.type === 'lesson' || t.type === 'principle').map((t, idx) => (
                    <div key={idx} className="chapter-meta-card" style={{ background: 'rgba(255, 255, 255, 0.01)', margin: 0 }}>
                      <div className="meta-card-title" style={{ fontSize: '13px', color: t.type === 'lesson' ? 'var(--primary)' : 'var(--secondary)', textTransform: 'uppercase' }}>
                        {t.type === 'lesson' ? 'Core Lesson' : 'Fundamental Principle'}
                      </div>
                      <p style={{ color: 'var(--text-primary)', fontSize: '14.5px', marginTop: '6px' }}>{t.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Takeaways */}
            <div className="chapter-meta-card" style={{ background: 'rgba(245, 158, 11, 0.04)', borderColor: 'rgba(245, 158, 11, 0.1)' }}>
              <div className="meta-card-title real-life" style={{ color: 'var(--accent)' }}>
                🌱 Practical & Actionable Takeaways
              </div>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)', fontSize: '14.5px' }}>
                {book.takeaways && book.takeaways.filter(t => t.type === 'action').map((t, idx) => (
                  <li key={idx}>{t.content}</li>
                ))}
                {chapters.map((ch, idx) => (
                  <li key={idx + 100}>
                    <strong>Actionable (Ch {ch.id}):</strong> {ch.realLifeMeaning}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chapter-wise Insights */}
            {chapters.length > 0 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Chapter-Wise Deep Analysis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {chapters.map((ch) => (
                    <div key={ch.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '16px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>
                        Chapter {ch.id}: {ch.title}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        {ch.summary}
                      </p>
                      {ch.quote && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', marginTop: '6px' }}>
                          "{ch.quote}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeReaderTab === 'chapters' && (
          // Normal Kindle Mode
          <div className="fade-in">
            <h2 className="chapter-title-display">Chapter {activeChapter.id}: {activeChapter.title}</h2>
            
            {activeChapter.quote && (
              <div className="chapter-quote-block">
                “{activeChapter.quote}”
                <span className="chapter-quote-author">— Quote from Chapter</span>
              </div>
            )}

            <div className="reader-p">
              {renderHighlightedText(
                activeChapter.summary || "Chapter content summary details loading.",
                currentChapterHighlights
              )}
            </div>

            {/* Structured Insights Card Panel */}
            <div className="chapter-meta-sections">
              <div className="chapter-meta-card">
                <div className="meta-card-title key-idea">💡 Core Chapter Idea</div>
                <div className="meta-card-content">{activeChapter.keyIdea}</div>
              </div>

              <div className="chapter-meta-card">
                <div className="meta-card-title real-life">🌱 Real-Life Application</div>
                <div className="meta-card-content">{activeChapter.realLifeMeaning}</div>
              </div>
            </div>
          </div>
        )}

        {activeReaderTab === 'speed' && (
          // Speed Reading Mode
          <div className="fade-in">
            <h2 className="chapter-title-display">⚡ Speed Learning Mode: {title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '15px' }}>
              All fluff has been stripped. Here are the core conceptual pillars for this book:
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {speedReading.map((pt, idx) => (
                <li key={idx} style={{ color: '#fff', fontSize: '16px', lineHeight: '1.6' }}>
                  <strong>Key Point:</strong> {pt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
