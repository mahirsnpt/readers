import React, { useState, useRef } from 'react';

export default function DailyQuotes({ books }) {
  // Extract all quotes from all chapters across all books
  const allQuotes = [
    {
      text: "Success is the product of daily habits—not once-in-a-lifetime transformations.",
      author: "James Clear",
      book: "Atomic Habits"
    },
    {
      text: "Your identity emerges out of your habits. Every action is a vote for the type of person you wish to become.",
      author: "James Clear",
      book: "Atomic Habits"
    },
    {
      text: "Be the designer of your world and not merely the consumer of it.",
      author: "James Clear",
      book: "Atomic Habits"
    },
    {
      text: "The poor and the middle class work for money. The rich have money work for them.",
      author: "Robert Kiyosaki",
      book: "Rich Dad Poor Dad"
    },
    {
      text: "An asset puts money in my pocket. A liability takes money out of my pocket.",
      author: "Robert Kiyosaki",
      book: "Rich Dad Poor Dad"
    },
    {
      text: "No one is crazy. We all make decisions based on our unique experiences.",
      author: "Morgan Housel",
      book: "The Psychology of Money"
    },
    {
      text: "Using your money to buy time and options has a lifestyle benefit few luxury goods can compete with.",
      author: "Morgan Housel",
      book: "The Psychology of Money"
    },
    {
      text: "The ability to perform deep work is becoming increasingly rare at the exact same time it is becoming increasingly valuable.",
      author: "Cal Newport",
      book: "Deep Work"
    },
    {
      text: "Always make those above you feel comfortably superior.",
      author: "Robert Greene",
      book: "The 48 Laws of Power"
    },
    {
      text: "Money is the most universal and most efficient system of mutual trust ever devised.",
      author: "Yuval Noah Harari",
      book: "Sapiens"
    },
    {
      text: "It's the possibility of having a dream come true that makes life interesting.",
      author: "Paulo Coelho",
      book: "The Alchemist"
    },
    {
      text: "When you want something, all the universe conspires in helping you to achieve it.",
      author: "Paulo Coelho",
      book: "The Alchemist"
    }
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [activeGradient, setActiveGradient] = useState('gradient-galaxy');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);

  const quote = allQuotes[currentQuoteIndex];

  const handleNextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % allQuotes.length);
  };

  const handleCopyText = () => {
    const textToCopy = `"${quote.text}" — ${quote.author} (from "${quote.book}")`;
    navigator.clipboard.writeText(textToCopy);
    alert('Quote copied to clipboard! 📋');
  };

  // Render quotes onto canvas and download as PNG image
  const handleDownloadImage = () => {
    setDownloading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 500;

    // 1. Draw Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (activeGradient === 'gradient-galaxy') {
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.5, '#1e1b4b');
      gradient.addColorStop(1, '#311042');
    } else if (activeGradient === 'gradient-sunset') {
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(0.4, '#581c87');
      gradient.addColorStop(1, '#881337');
    } else if (activeGradient === 'gradient-emerald') {
      gradient.addColorStop(0, '#022c22');
      gradient.addColorStop(0.6, '#064e3b');
      gradient.addColorStop(1, '#172554');
    } else {
      gradient.addColorStop(0, '#090d16');
      gradient.addColorStop(1, '#020617');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Decorative Quote Marks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.font = '240px Georgia, serif';
    ctx.fillText('“', 30, 180);

    // 3. Draw Quote Text (With Word Wrapping)
    ctx.fillStyle = '#f3f4f6';
    ctx.font = '600 28px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = quote.text.split(' ');
    let lines = [];
    let currentLine = '';
    const maxWidth = 640;

    for (let n = 0; n < words.length; n++) {
      let testLine = currentLine + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(currentLine.trim());
        currentLine = words[n] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    // Write text lines centered vertically
    const lineHeight = 38;
    const startY = (canvas.height / 2) - ((lines.length * lineHeight) / 2) - 10;
    
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvas.width / 2, startY + (i * lineHeight));
    }

    // 4. Draw Citation Info
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = '#8b5cf6'; // Violet
    const citationY = startY + (lines.length * lineHeight) + 30;
    ctx.fillText(`— ${quote.author}`, canvas.width / 2, citationY);

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af'; // Gray
    ctx.fillText(`Book: ${quote.book}`, canvas.width / 2, citationY + 28);

    // 5. Draw Watermark
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillText('✨ BOOKSFORLIFE PLATFORM', canvas.width / 2, canvas.height - 40);

    // 6. Download Trigger
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${quote.book.replace(/\s+/g, '_')}_Quote.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to compile image download:", err);
    } finally {
      setDownloading(false);
    }
  };

  const gradients = [
    { id: 'gradient-galaxy', name: 'Galaxy Aura' },
    { id: 'gradient-sunset', name: 'Sunset purple' },
    { id: 'gradient-emerald', name: 'Deep Emerald' },
    { id: 'gradient-cyber', name: 'Obsidian Glow' }
  ];

  return (
    <div className="fade-in">
      <div className="quotes-card-generator">
        {/* Quote Card Display */}
        <div className={`quote-canvas-card ${activeGradient}`}>
          <div className="canvas-quote-text">“{quote.text}”</div>
          <div className="canvas-quote-author">— {quote.author}</div>
          <div className="canvas-quote-source">Book: {quote.book}</div>
          <span className="canvas-watermark">BooksForLife</span>
        </div>

        {/* Editor Controls */}
        <div className="quote-editor-panel glass-panel" style={{ padding: '24px' }}>
          <div>
            <h4 className="editor-section-title">Select Aesthetic Gradient</h4>
            <div className="gradient-selector-row">
              {gradients.map((g) => (
                <button
                  key={g.id}
                  className={`gradient-pill ${g.id} ${activeGradient === g.id ? 'active' : ''}`}
                  onClick={() => setActiveGradient(g.id)}
                  title={g.name}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <h4 className="editor-section-title">Actions</h4>
            <div className="quote-action-row">
              <button className="quote-action-btn share" onClick={handleDownloadImage} disabled={downloading}>
                {downloading ? 'Compiling PNG...' : '📥 Save Image'}
              </button>
              <button className="quote-action-btn next" onClick={handleCopyText}>
                📋 Copy Text
              </button>
            </div>
            <button className="quote-action-btn next" onClick={handleNextQuote} style={{ width: '100%' }}>
              🎲 Load Next Quote
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for PNG exporter */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
