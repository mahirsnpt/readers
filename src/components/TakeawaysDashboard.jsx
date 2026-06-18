import React, { useState } from 'react';

export default function TakeawaysDashboard({ books }) {
  const [selectedBookId, setSelectedBookId] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All'); // All, lesson, principle, action

  // Aggregate all takeaways
  const allTakeaways = books.flatMap((book) => 
    book.takeaways.map((t) => ({
      ...t,
      bookId: book.id,
      bookTitle: book.title,
      author: book.author
    }))
  );

  // Filter based on book select and category tabs
  const filteredTakeaways = allTakeaways.filter((takeaway) => {
    const matchesBook = selectedBookId === 'All' || takeaway.bookId === selectedBookId;
    const matchesType = activeFilter === 'All' || takeaway.type === activeFilter;
    return matchesBook && matchesType;
  });

  const getEmoji = (type) => {
    if (type === 'lesson') return '💡';
    if (type === 'principle') return '🧠';
    return '⚡';
  };

  return (
    <div className="takeaways-wrapper fade-in">
      {/* Filtering Header */}
      <div className="takeaways-filter-row">
        <select
          className="takeaways-selector"
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
        >
          <option value="All">All Books</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>

        <div className="reader-mode-toggles">
          <button 
            className={`mode-toggle-btn ${activeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setActiveFilter('All')}
          >
            All Takeaways
          </button>
          <button 
            className={`mode-toggle-btn ${activeFilter === 'lesson' ? 'active' : ''}`}
            onClick={() => setActiveFilter('lesson')}
            style={{ borderColor: 'var(--primary)' }}
          >
            💡 Lessons
          </button>
          <button 
            className={`mode-toggle-btn ${activeFilter === 'principle' ? 'active' : ''}`}
            onClick={() => setActiveFilter('principle')}
            style={{ borderColor: 'var(--secondary)' }}
          >
            🧠 Principles
          </button>
          <button 
            className={`mode-toggle-btn ${activeFilter === 'action' ? 'active' : ''}`}
            onClick={() => setActiveFilter('action')}
            style={{ borderColor: 'var(--accent)' }}
          >
            ⚡ Action Points
          </button>
        </div>
      </div>

      {/* Grid of takeaways */}
      {filteredTakeaways.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }} className="glass-panel">
          No takeaways found matching these criteria.
        </div>
      ) : (
        <div className="takeaways-grid">
          {filteredTakeaways.map((t, idx) => (
            <div key={idx} className="takeaway-card glass-panel fade-in">
              <span className={`takeaway-tag ${t.type}`}>
                {getEmoji(t.type)} {t.type}
              </span>
              <p className="takeaway-text">"{t.content}"</p>
              <div className="takeaway-source">
                <span>📖 {t.bookTitle}</span>
                <span style={{ color: 'var(--text-muted)' }}>by {t.author}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
