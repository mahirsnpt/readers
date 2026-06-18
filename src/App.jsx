import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Library from './components/Library';
import AudiobookPlayer from './components/AudiobookPlayer';
import BookReader from './components/BookReader';
import TakeawaysDashboard from './components/TakeawaysDashboard';
import Highlights from './components/Highlights';
import DailyQuotes from './components/DailyQuotes';
import ProgressTracker from './components/ProgressTracker';
import { curatedBooks } from './data/booksData';
import './App.css';

// Converter to turn a Google Books API search result into a BooksForLife learning ecosystem structure
const createDynamicBook = (apiBook) => {
  const volume = apiBook.volumeInfo;
  const id = apiBook.id;
  const title = volume.title || "Untitled Book";
  const author = volume.authors ? volume.authors.join(", ") : "Unknown Author";
  const rating = volume.averageRating || 4.2;
  const category = volume.categories ? volume.categories[0] : "Mindset";
  
  // Clean cover url from Google Books or try Open Library
  let cover = volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail || "";
  if (cover && cover.startsWith("http://")) {
    cover = cover.replace("http://", "https://");
  }
  if (!cover) {
    const isbnObj = volume.industryIdentifiers?.find(i => i.type === 'ISBN_13' || i.type === 'ISBN_10');
    if (isbnObj) {
      cover = `https://covers.openlibrary.org/b/isbn/${isbnObj.identifier}-L.jpg`;
    } else {
      cover = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60";
    }
  }

  const desc = volume.description || "No description available for this book. Select read or listen mode to generate deep insights.";
  const cleanDesc = desc.replace(/<[^>]*>/g, ""); // Strip HTML tags
  
  // Parse description sentences to populate script/chapters
  const sentences = cleanDesc.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const introPart = sentences.slice(0, Math.min(3, sentences.length)).join(". ") + ".";
  const corePart = sentences.slice(Math.min(3, sentences.length), Math.min(7, sentences.length)).join(". ") + ".";
  const deepPart = sentences.slice(Math.min(7, sentences.length), Math.min(12, sentences.length)).join(". ") + ".";
  const concPart = sentences.slice(Math.min(12, sentences.length)).join(". ") || "In summary, this book details essential rules for personal development, optimization, and action.";

  const narration = [
    {
      time: "0:00 - 2:00",
      title: "Introduction & Context",
      content: `Welcome to the BooksForLife AI narration of ${title} by ${author}. ${introPart}`
    },
    {
      time: "2:00 - 5:00",
      title: "Core Framework & Rules",
      content: `Let's break down the core system: ${corePart || "The author details a systematic path to understand and optimize daily actions to gain maximum capability."}`
    },
    {
      time: "5:00 - 7:30",
      title: "Deep Insights & Mindset Shifts",
      content: `Going deeper: ${deepPart || "Focus on practical exercise, environment optimization, and behavioral tracking to apply these learnings in real time."}`
    },
    {
      time: "7:30 - 10:00",
      title: "Conclusion & Personal Application",
      content: `In conclusion: ${concPart} We recommend making small daily adjustments in line with these rules to witness compounding progression.`
    }
  ];

  const chapters = [
    {
      id: 1,
      title: "Introduction and Foundations",
      summary: `An essential breakdown introducing ${author}'s motivations, the book's core background, and targets.`,
      keyIdea: `All significant progress begins with establishing a strong baseline and context.`,
      realLifeMeaning: `Track your current habits or outputs before adding new systems.`,
      quote: `Understanding is the first step to change.`
    },
    {
      id: 2,
      title: "Primary Concepts & Principles",
      summary: `Explores the specific concepts, guidelines, and arguments built throughout the book.`,
      keyIdea: `Focusing on small daily parameters yields massive gains.`,
      realLifeMeaning: `Allocate 15 minutes each day to practice this book's teachings in your routine.`,
      quote: `Consistency is the compiler of success.`
    },
    {
      id: 3,
      title: "Pitfalls & Action Plan",
      summary: `Covers the primary blockages, cognitive delays, and environmental friction that hinder our development.`,
      keyIdea: `Failure points are cues for iteration, not termination.`,
      realLifeMeaning: `List your three biggest daily distractions and actively design them out of your environment.`,
      quote: `Action cures fear; systems cure friction.`
    }
  ];

  const takeaways = [
    { type: "lesson", content: `Insight from ${title}: Success is a product of systemic daily behaviors, not singular events.` },
    { type: "principle", content: `Feedback Loops: Continuous self-monitoring ensures you learn from errors and iterate.` },
    { type: "action", content: `Action: Focus on your high-cognitive tasks in the first 2 hours of your day, eliminating notifications.` }
  ];

  const speedReading = sentences.length > 2 
    ? sentences.slice(0, Math.min(6, sentences.length)) 
    : [
        `Core Message: ${title} focuses on high-impact results.`,
        "Minimize shallow distractions and optimize your immediate workspace.",
        "Use feedback loops to self-correct.",
        "Compounding results build over long time horizons."
      ];

  return {
    id,
    title,
    author,
    rating,
    cover,
    category,
    description: cleanDesc,
    narration,
    chapters,
    takeaways,
    speedReading
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState(curatedBooks);
  const [activeBook, setActiveBook] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(1);

  // Loaded states from localStorage
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('bfl_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const [highlights, setHighlights] = useState(() => {
    const saved = localStorage.getItem('bfl_highlights');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bfl_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('bfl_highlights', JSON.stringify(highlights));
  }, [highlights]);

  // Handle book selection
  const handleSelectBook = (book, mode) => {
    let finalBook = book;
    
    // If selected book is a google book search result, convert it and cache it locally
    if (book.isGoogleBook) {
      finalBook = createDynamicBook(book.rawApiBook);
      // Append if not already in books list
      if (!books.some(b => b.id === finalBook.id)) {
        setBooks(prev => [finalBook, ...prev]);
      }
    }

    setActiveBook(finalBook);
    setActiveChapterId(1);
    
    // Auto-create initial progress track if not present
    if (!progress[finalBook.id]) {
      setProgress(prev => ({
        ...prev,
        [finalBook.id]: { percent: 0, currentTime: 0 }
      }));
    }
  };

  const handleProgressUpdate = (bookId, percent, currentTime) => {
    setProgress(prev => {
      // Don't overwrite if progress would drop
      const existingPercent = prev[bookId]?.percent || 0;
      return {
        ...prev,
        [bookId]: {
          percent: Math.max(existingPercent, percent),
          currentTime
        }
      };
    });
  };

  const handleAddHighlight = (newHighlight) => {
    setHighlights(prev => [newHighlight, ...prev]);
  };

  const handleDeleteHighlight = (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        // Clear active book when changing tabs
        setActiveBook(null);
      }} />

      {/* Main Panel */}
      <main className="main-content">
        {activeBook ? (
          /* High-Fidelity Split Screen Experience Viewer (Audible + Kindle Side-by-Side) */
          <div className="experience-viewer fade-in">
            <div className="viewer-header">
              <button className="back-btn" onClick={() => setActiveBook(null)}>
                ← Library Catalog
              </button>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{activeBook.title}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>by {activeBook.author}</p>
              </div>
            </div>

            <div className="viewer-grid">
              {/* Left Pane: Kindle Reader */}
              <BookReader 
                book={activeBook}
                activeChapterId={activeChapterId}
                onChapterChange={setActiveChapterId}
                highlights={highlights}
                onAddHighlight={handleAddHighlight}
              />

              {/* Right Pane: Audible Player */}
              <AudiobookPlayer 
                book={activeBook}
                onProgressUpdate={handleProgressUpdate}
              />
            </div>
          </div>
        ) : (
          /* Normal Dashboard Views */
          <>
            <div className="dashboard-header">
              <div className="header-title">
                {activeTab === 'library' && (
                  <>
                    <h1>Explore Library</h1>
                    <p>Unlock audio summaries and text highlights of best-selling knowledge books.</p>
                  </>
                )}
                {activeTab === 'takeaways' && (
                  <>
                    <h1>Knowledge Takeaways Dashboard</h1>
                    <p>Review core lessons, life principles, and actionable rules accumulated from your library.</p>
                  </>
                )}
                {activeTab === 'highlights' && (
                  <>
                    <h1>Your Highlight Library</h1>
                    <p>Revisit text passages you saved while reading.</p>
                  </>
                )}
                {activeTab === 'quotes' && (
                  <>
                    <h1>Daily Quotes Engine</h1>
                    <p>Generate highly shareable, visual quotes and wisdom citations.</p>
                  </>
                )}
                {activeTab === 'progress' && (
                  <>
                    <h1>Compounding Analytics</h1>
                    <p>Track your reading and listening speed stats.</p>
                  </>
                )}
              </div>
            </div>

            {activeTab === 'library' && (
              <Library 
                localBooks={books}
                onSelectBook={handleSelectBook}
              />
            )}
            {activeTab === 'takeaways' && (
              <TakeawaysDashboard 
                books={books}
              />
            )}
            {activeTab === 'highlights' && (
              <Highlights 
                highlights={highlights}
                onDeleteHighlight={handleDeleteHighlight}
              />
            )}
            {activeTab === 'quotes' && (
              <DailyQuotes 
                books={books}
              />
            )}
            {activeTab === 'progress' && (
              <ProgressTracker 
                books={books}
                progress={progress}
                highlights={highlights}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
