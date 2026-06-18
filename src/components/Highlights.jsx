import React from 'react';

export default function Highlights({ highlights, onDeleteHighlight }) {
  // Group highlights by book
  const groupedHighlights = highlights.reduce((acc, hl) => {
    if (!acc[hl.bookId]) {
      acc[hl.bookId] = {
        bookTitle: hl.bookTitle,
        chapters: {}
      };
    }
    if (!acc[hl.bookId].chapters[hl.chapterId]) {
      acc[hl.bookId].chapters[hl.chapterId] = {
        chapterTitle: hl.chapterTitle,
        items: []
      };
    }
    acc[hl.bookId].chapters[hl.chapterId].items.push(hl);
    return acc;
  }, {});

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Highlight copied to clipboard! 📋');
  };

  const bookIds = Object.keys(groupedHighlights);

  return (
    <div className="fade-in">
      {bookIds.length === 0 ? (
        <div className="highlights-empty glass-panel">
          <div className="highlights-empty-icon">🔖</div>
          <h3>Your Highlight Library is Empty</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            To save quotes or passages, read any book, select a block of text, and choose a color highlight.
          </p>
        </div>
      ) : (
        bookIds.map((bookId) => {
          const bookGroup = groupedHighlights[bookId];
          const chapterIds = Object.keys(bookGroup.chapters);

          return (
            <div key={bookId} className="highlights-book-group">
              <h2 className="highlights-book-title">📖 {bookGroup.bookTitle}</h2>
              
              {chapterIds.map((chapId) => {
                const chapterGroup = bookGroup.chapters[chapId];
                return (
                  <div key={chapId} style={{ marginBottom: '24px', paddingLeft: '16px' }}>
                    <h3 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '12px', opacity: 0.9 }}>
                      Chapter {chapId}: {chapterGroup.chapterTitle}
                    </h3>
                    
                    <div className="highlights-list">
                      {chapterGroup.items.map((hl) => (
                        <div key={hl.id} className={`highlight-card glass-panel color-${hl.color}`}>
                          <p className="highlight-text-quote">"{hl.text}"</p>
                          <div className="highlight-meta-row">
                            <span>Saved on {new Date(hl.timestamp).toLocaleDateString()}</span>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <button className="highlight-delete-btn" onClick={() => handleCopy(hl.text)}>
                                Copy
                              </button>
                              <button className="highlight-delete-btn" onClick={() => onDeleteHighlight(hl.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
