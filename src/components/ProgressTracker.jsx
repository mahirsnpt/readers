import React from 'react';

export default function ProgressTracker({ books, progress, highlights }) {
  // Filter books in progress (progress > 0)
  const activeBookIds = Object.keys(progress);
  const booksInProgress = books.filter(b => activeBookIds.includes(b.id) && progress[b.id].percent > 0);

  // Total highlights count
  const highlightsCount = highlights.length;

  // Average progress percent
  let averagePercent = 0;
  if (booksInProgress.length > 0) {
    const total = booksInProgress.reduce((sum, b) => sum + (progress[b.id]?.percent || 0), 0);
    averagePercent = Math.round(total / booksInProgress.length);
  }

  // Calculate SVG stroke offset for the 140px diameter ring (circumference = 2 * PI * r = 2 * 3.14159 * 60 = 376.99)
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (averagePercent / 100) * circumference;

  return (
    <div className="fade-in">
      <div className="progress-grid">
        {/* Left: Overall progress circle */}
        <div className="progress-circular-wrapper glass-panel">
          <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Overall Library Compounding</h3>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <svg className="circular-progress-svg">
              <circle 
                className="circular-bg-circle" 
                cx="70" 
                cy="70" 
                r={radius} 
              />
              <circle 
                className="circular-active-circle" 
                cx="70" 
                cy="70" 
                r={radius} 
                style={{ 
                  strokeDasharray: circumference, 
                  strokeDashoffset: strokeDashoffset 
                }} 
              />
            </svg>
            <div className="circular-progress-label">
              <span className="circular-percent">{averagePercent}%</span>
              <span className="circular-desc">Completed</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Accumulated wisdom rating based on audio narration intervals and chapters loaded.
          </p>
        </div>

        {/* Right: small stats row */}
        <div className="stats-card-list">
          <div className="stat-small-card glass-panel">
            <div className="stat-small-icon blue">📚</div>
            <div className="stat-small-info">
              <h4>{booksInProgress.length} / {books.length}</h4>
              <p>Books Currently Active</p>
            </div>
          </div>

          <div className="stat-small-card glass-panel">
            <div className="stat-small-icon green">🔖</div>
            <div className="stat-small-info">
              <h4>{highlightsCount}</h4>
              <p>Knowledge Highlights Captured</p>
            </div>
          </div>

          <div className="stat-small-card glass-panel">
            <div className="stat-small-icon gold">⏱️</div>
            <div className="stat-small-info">
              <h4>
                {booksInProgress.reduce((sum, b) => sum + Math.round((progress[b.id]?.currentTime || 0) / 60), 0)} min
              </h4>
              <p>Total AI Listening Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Book-wise Progress List */}
      <div>
        <h3 className="recent-progress-title">Active Learning Progression</h3>
        {booksInProgress.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
            No active reading data. Select a book from the Library to start listening or highlighting!
          </div>
        ) : (
          <div className="recent-progress-list">
            {booksInProgress.map((book) => {
              const bookProgress = progress[book.id];
              const percent = bookProgress?.percent || 0;
              const chapterCount = book.chapters.length;
              // Estimate chapters completed: floor of percentage
              const chaptersDone = Math.max(1, Math.min(chapterCount, Math.ceil((percent / 100) * chapterCount)));

              return (
                <div key={book.id} className="recent-progress-item glass-panel fade-in">
                  <div className="progress-item-book">
                    <h4>{book.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {book.author} • {book.category}</p>
                  </div>
                  
                  <div className="progress-item-meter">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px' }}>
                      <span className="meter-percentage">{percent}% completed</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{chaptersDone}/{chapterCount} Ch</span>
                    </div>
                    <div className="meter-bar-outer">
                      <div className="meter-bar-inner" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
