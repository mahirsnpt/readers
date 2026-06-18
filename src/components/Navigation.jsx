import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'library', name: 'Book Library', icon: '📚' },
    { id: 'takeaways', name: 'Takeaways', icon: '🧠' },
    { id: 'highlights', name: 'Highlights', icon: '🔖' },
    { id: 'quotes', name: 'Daily Quotes', icon: '📅' },
    { id: 'progress', name: 'Progress Tracker', icon: '📊' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon">✨</span>
        <span className="logo-text">BooksForLife</span>
      </div>
      <nav style={{ width: '100%' }}>
        <ul className="nav-links">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-text">{tab.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
