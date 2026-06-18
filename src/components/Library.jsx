import React, { useState, useEffect, useRef } from 'react';
import BookCard from './BookCard';
import { fallbackBooks } from '../data/fallbackBooksData';

export default function Library({ localBooks, onSelectBook }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Dynamic API Catalog States
  const [apiBooks, setApiBooks] = useState([]);
  const [apiPage, setApiPage] = useState(0);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiHasMore, setApiHasMore] = useState(true);

  // Dynamic Search Pagination States
  const [searchPage, setSearchPage] = useState(0);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(true);

  // Refs to prevent duplicate trigger fetches in async callbacks
  const isFetchingRef = useRef(false);
  const isSearchingRef = useRef(false);

  const categories = [
    'All',
    'Productivity',
    'Mindset',
    'Psychology',
    'Philosophy',
    'Spiritual',
    'Self-help',
    'Finance',
    'Fiction'
  ];

  // Helper function to fetch dynamic catalog books
  const fetchApiBooks = async (pageToLoad, cat, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setApiLoading(true);

    // Initial page load gets 40 books, subsequent fetches get 20
    const pageSize = pageToLoad === 0 ? 40 : 20;

    // Map categories to high-yield keyword queries
    let query = 'self improvement';
    if (cat === 'Productivity') query = 'productivity';
    else if (cat === 'Mindset') query = 'mindset OR motivation';
    else if (cat === 'Psychology') query = 'psychology';
    else if (cat === 'Philosophy') query = 'philosophy OR stoicism';
    else if (cat === 'Spiritual') query = 'spiritual OR spirituality';
    else if (cat === 'Self-help') query = 'self help OR self improvement';
    else if (cat === 'Finance') query = 'finance OR business OR economics';
    else if (cat === 'Fiction') query = 'fiction OR literature';
    else if (cat === 'All') query = 'self improvement OR business OR psychology OR finance OR productivity';

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${pageToLoad}&maxResults=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API response status: ${response.status}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        // Map data to local book structure
        const newBooks = data.items.map(item => {
          const volume = item.volumeInfo;
          let cover = volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail || "";
          if (cover && cover.startsWith("http://")) {
            cover = cover.replace("http://", "https://");
          }
          return {
            id: item.id,
            title: volume.title || "Untitled Book",
            author: volume.authors ? volume.authors.join(", ") : "Unknown Author",
            rating: volume.averageRating || 4.2,
            cover: cover || `https://covers.openlibrary.org/b/isbn/${volume.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier}-L.jpg`,
            category: cat === 'All' ? (volume.categories ? volume.categories[0] : 'Mindset') : cat,
            description: volume.description ? volume.description.replace(/<[^>]*>/g, "") : "Ready to unpack.",
            isGoogleBook: true,
            rawApiBook: item
          };
        });

        // Filter out books already in the curated lists
        const filteredNewBooks = newBooks.filter(ab => !localBooks.some(lb => lb.title.toLowerCase() === ab.title.toLowerCase()));

        setApiBooks(prev => append ? [...prev, ...filteredNewBooks] : filteredNewBooks);
        setApiHasMore(data.items.length === pageSize);
      } else {
        // If items are empty, trigger fallback loading
        loadFallbackBooks(pageToLoad, cat, append, pageSize);
      }
    } catch (error) {
      console.warn("Google Books API query failed. Activating local fallback database...", error);
      loadFallbackBooks(pageToLoad, cat, append, pageSize);
    } finally {
      setApiLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Fallback engine: filters and loads books from local static database
  const loadFallbackBooks = (pageToLoad, cat, append, pageSize) => {
    // Filter by category
    const filteredFallbacks = cat === 'All' 
      ? fallbackBooks 
      : fallbackBooks.filter(b => b.category === cat);
    
    // Paginate fallback array
    const slicedFallbacks = filteredFallbacks.slice(pageToLoad, pageToLoad + pageSize);
    
    // Exclude any curated books that match titles
    const cleanFallbacks = slicedFallbacks.filter(fb => !localBooks.some(lb => lb.title.toLowerCase() === fb.title.toLowerCase()));

    setApiBooks(prev => append ? [...prev, ...cleanFallbacks] : cleanFallbacks);
    setApiHasMore(pageToLoad + pageSize < filteredFallbacks.length);
  };

  // Fetch first page on mount and activeCategory change
  useEffect(() => {
    if (!searched) {
      setApiPage(0);
      setApiHasMore(true);
      fetchApiBooks(0, activeCategory, false);
    }
  }, [activeCategory, searched]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const handleScroll = () => {
      if (loading || apiLoading || searchLoadingMore) return;

      const threshold = 200; // px from bottom of screen
      const position = window.innerHeight + window.scrollY;
      const height = document.documentElement.scrollHeight;

      if (position >= height - threshold) {
        if (searched && searchHasMore) {
          loadMoreSearchResults();
        } else if (!searched && apiHasMore) {
          // Calculate next offset based on current count
          const nextPage = apiBooks.length;
          setApiPage(nextPage);
          fetchApiBooks(nextPage, activeCategory, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, apiLoading, searchLoadingMore, searched, apiHasMore, searchHasMore, apiPage, searchPage, activeCategory, searchQuery, apiBooks]);

  // Handler for google books API search (First page)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    
    setLoading(true);
    setSearchPage(0);
    setSearchHasMore(true);
    isSearchingRef.current = true;

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&startIndex=0&maxResults=20`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API response status: ${response.status}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const mapped = data.items.map(item => {
          const volume = item.volumeInfo;
          let cover = volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail || "";
          if (cover && cover.startsWith("http://")) {
            cover = cover.replace("http://", "https://");
          }
          return {
            id: item.id,
            title: volume.title || "Untitled Book",
            author: volume.authors ? volume.authors.join(", ") : "Unknown Author",
            rating: volume.averageRating || 4.0,
            cover: cover || `https://covers.openlibrary.org/b/isbn/${volume.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier}-L.jpg`,
            category: volume.categories ? volume.categories[0] : "Mindset",
            description: volume.description ? volume.description.replace(/<[^>]*>/g, "") : "Ready to unpack.",
            isGoogleBook: true,
            rawApiBook: item
          };
        });
        setSearchResults(mapped);
        setSearchHasMore(data.items.length === 20);
      } else {
        // Fallback search inside our local fallback database
        loadFallbackSearch(searchQuery, false);
      }
      setSearched(true);
    } catch (error) {
      console.warn("Search query failed. Searching local fallback database...", error);
      loadFallbackSearch(searchQuery, false);
      setSearched(true);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  };

  // Fallback search loader
  const loadFallbackSearch = (query, append) => {
    const q = query.toLowerCase();
    const matches = fallbackBooks.filter(
      b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
    setSearchResults(prev => append ? [...prev, ...matches] : matches);
    setSearchHasMore(false);
  };

  // Load more search results pagination
  const loadMoreSearchResults = async () => {
    if (searchLoadingMore || !searchHasMore || isSearchingRef.current) return;
    searchLoadingMore || setSearchLoadingMore(true);
    isSearchingRef.current = true;
    const nextPage = searchResults.length;
    setSearchPage(nextPage);

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&startIndex=${nextPage}&maxResults=20`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const mapped = data.items.map(item => {
          const volume = item.volumeInfo;
          let cover = volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail || "";
          if (cover && cover.startsWith("http://")) {
            cover = cover.replace("http://", "https://");
          }
          return {
            id: item.id,
            title: volume.title || "Untitled Book",
            author: volume.authors ? volume.authors.join(", ") : "Unknown Author",
            rating: volume.averageRating || 4.0,
            cover: cover || `https://covers.openlibrary.org/b/isbn/${volume.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier}-L.jpg`,
            category: volume.categories ? volume.categories[0] : "Mindset",
            description: volume.description ? volume.description.replace(/<[^>]*>/g, "") : "Ready to unpack.",
            isGoogleBook: true,
            rawApiBook: item
          };
        });
        setSearchResults(prev => [...prev, ...mapped]);
        setSearchHasMore(data.items.length === 20);
      } else {
        setSearchHasMore(false);
      }
    } catch (error) {
      console.warn("Failed to load more search results:", error);
      setSearchHasMore(false);
    } finally {
      setSearchLoadingMore(false);
      isSearchingRef.current = false;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearched(false);
  };

  // Filter curated local books
  const filteredLocalBooks = localBooks.filter((book) => {
    const matchesCategory = activeCategory === 'All' || book.category === activeCategory;
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fade-in">
      <form className="library-search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <svg className="search-icon-svg" viewBox="0 0 24 24">
            <path d="M9.5 3A6.5 6.5 0 0116 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 019.5 16 6.5 6.5 0 013 9.5 6.5 6.5 0 019.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search millions of books by title, author, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                color: 'var(--text-muted)',
                fontSize: '18px',
                fontWeight: 'normal'
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>

      {/* Category Tabs */}
      <div className="categories-container">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              // Clear external search when browsing local categories
              setSearchResults([]);
              setSearched(false);
            }}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--primary)', fontWeight: '600' }}>
          <div className="pulse" style={{ fontSize: '24px' }}>🔮 Connecting to Google Books Database...</div>
        </div>
      )}

      {/* Google Books Search Results */}
      {searched && searchResults.length > 0 && !loading && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '20px', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
            Live Search Results ({searchResults.length})
          </h2>
          <div className="books-grid">
            {searchResults.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b, mode) => onSelectBook(b, mode)}
              />
            ))}
          </div>

          {searchHasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                type="button" 
                className="search-btn" 
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                onClick={loadMoreSearchResults}
                disabled={searchLoadingMore}
              >
                {searchLoadingMore ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Local Curated Library + Dynamic API Catalog */}
      {!searched && (
        <div>
          <h2 style={{ fontSize: '22px', marginBottom: '20px', borderLeft: '4px solid var(--secondary)', paddingLeft: '12px' }}>
            Featured Learning Experiences
          </h2>
          {filteredLocalBooks.length === 0 ? (
            <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No local books matches the filters. Try searching above!
            </div>
          ) : (
            <div className="books-grid" style={{ marginBottom: '48px' }}>
              {filteredLocalBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelect={(b, mode) => onSelectBook(b, mode)}
                />
              ))}
            </div>
          )}

          {/* Dynamic Books Grid appended underneath */}
          <h2 style={{ fontSize: '22px', marginBottom: '20px', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
            Dynamic Books Library
          </h2>
          
          {apiBooks.length === 0 && apiLoading ? (
            <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Loading dynamic catalog...
            </div>
          ) : (
            <>
              <div className="books-grid">
                {apiBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onSelect={(b, mode) => onSelectBook(b, mode)}
                  />
                ))}
              </div>

              {/* Load More Fallback / Alternative Pagination */}
              {apiHasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                  <button 
                    type="button" 
                    className="search-btn" 
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                    onClick={() => {
                      const nextPage = apiBooks.length;
                      setApiPage(nextPage);
                      fetchApiBooks(nextPage, activeCategory, true);
                    }}
                    disabled={apiLoading}
                  >
                    {apiLoading ? 'Loading...' : 'Load More Books'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {searched && searchResults.length === 0 && !loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h3>No books found matching "{searchQuery}"</h3>
          <p style={{ marginTop: '8px' }}>Please double check the spelling or search for another title.</p>
        </div>
      )}
    </div>
  );
}
