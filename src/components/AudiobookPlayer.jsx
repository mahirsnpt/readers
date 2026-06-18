import React, { useState, useEffect, useRef } from 'react';

export default function AudiobookPlayer({ book, onProgressUpdate }) {
  const { title, author, cover, narration } = book;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Constants
  const totalDuration = 600; // 10 minutes in seconds

  // Refs
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Parse time range like "1:30 - 4:00" into seconds
  const getSegmentTimeBounds = (timeStr) => {
    const parts = timeStr.split('-').map(p => p.trim());
    
    const timeToSeconds = (str) => {
      const bits = str.split(':').map(Number);
      if (bits.length === 2) {
        return bits[0] * 60 + bits[1];
      }
      return Number(str);
    };

    return {
      start: timeToSeconds(parts[0]),
      end: timeToSeconds(parts[1])
    };
  };

  // Determine active segment index based on current time
  useEffect(() => {
    let index = 0;
    for (let i = 0; i < narration.length; i++) {
      const { start, end } = getSegmentTimeBounds(narration[i].time);
      if (currentTime >= start && currentTime < end) {
        index = i;
        break;
      }
      if (currentTime >= end) {
        index = i; // Fallback to last if beyond bounds
      }
    }
    if (index !== activeSegmentIndex) {
      setActiveSegmentIndex(index);
      // If playing and voice is enabled, speak the new segment
      if (isPlaying && voiceEnabled) {
        speakSegment(index);
      }
    }
    
    // Update progress tracker in parent
    const percent = Math.min(Math.round((currentTime / totalDuration) * 100), 100);
    onProgressUpdate(book.id, percent, currentTime);
  }, [currentTime]);

  // Handle Speech Synthesis
  const speakSegment = (index) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    if (!voiceEnabled) return;

    const segmentText = narration[index].content;
    const utterance = new SpeechSynthesisUtterance(segmentText);
    
    // Configure voice properties
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;
    
    // Fetch system voices and set a premium sounding female/male voice if available
    const voices = synthRef.current.getVoices();
    const cleanVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Natural") || v.lang === "en-US") || voices[0];
    if (cleanVoice) {
      utterance.voice = cleanVoice;
    }

    utterance.onend = () => {
      // When speech ends naturally, check if we should auto-forward to next segment
      // (This will normally happen automatically via the time-increment interval)
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (synthRef.current) synthRef.current.pause();
    } else {
      // Play
      setIsPlaying(true);
      
      // Start time interval
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            if (synthRef.current) synthRef.current.cancel();
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);

      // Start speech
      if (synthRef.current) {
        if (synthRef.current.paused) {
          synthRef.current.resume();
        } else {
          speakSegment(activeSegmentIndex);
        }
      }
    }
  };

  // Forward/Rewind
  const seekTime = (amount) => {
    setCurrentTime((prev) => {
      const target = Math.max(0, Math.min(totalDuration, prev + amount));
      
      // If playing, we need to restart speech for the new segment
      if (isPlaying && voiceEnabled) {
        // Find segment index for target time
        let targetIndex = 0;
        for (let i = 0; i < narration.length; i++) {
          const { start, end } = getSegmentTimeBounds(narration[i].time);
          if (target >= start && target < end) {
            targetIndex = i;
            break;
          }
        }
        // Force speech reload
        setTimeout(() => speakSegment(targetIndex), 50);
      }
      
      return target;
    });
  };

  // Jump to specific segment
  const jumpToSegment = (index) => {
    const { start } = getSegmentTimeBounds(narration[index].time);
    setCurrentTime(start);
    if (isPlaying && voiceEnabled) {
      setTimeout(() => speakSegment(index), 50);
    }
  };

  // Sync speed changes with TTS rate
  useEffect(() => {
    if (isPlaying && voiceEnabled) {
      speakSegment(activeSegmentIndex);
    }
  }, [playbackSpeed, voiceEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (synthRef.current) synthRef.current.cancel();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Format seconds to "MM:SS"
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const waveCount = 3;
      const colors = [
        'rgba(139, 92, 246, 0.4)',  // Violet glow
        'rgba(16, 185, 129, 0.25)', // Emerald glow
        'rgba(139, 92, 246, 0.15)'
      ];

      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 3 : 1.5;
        ctx.strokeStyle = colors[i];

        const amplitude = isPlaying ? (35 - i * 10) : 2; // Flat line if paused
        const frequency = 0.008 + i * 0.004;
        const speed = isPlaying ? (0.08 + i * 0.04) * playbackSpeed : 0;

        ctx.moveTo(0, canvas.height / 2);
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * frequency + phase) * amplitude * Math.sin(x / canvas.width * Math.PI);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        phase += speed;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  return (
    <div className="audio-panel glass-panel">
      {/* Player Header */}
      <div className="audio-header">
        <img 
          src={cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60"} 
          alt={title} 
          className="player-cover-thumbnail" 
        />
        <div className="player-title-info">
          <h3>{title}</h3>
          <p>AI Audio Narration • {author}</p>
        </div>
      </div>

      <div className="audio-body">
        {/* Visualizer */}
        <div className="visualizer-container">
          <canvas ref={canvasRef} className="visualizer-canvas" />
          <span className="visualizer-overlay-text">
            {isPlaying ? 'AI Voice Stream Active' : 'Narration Paused'}
          </span>
        </div>

        {/* Player Controls */}
        <div className="playback-controls-card">
          <div className="progress-bar-wrapper">
            <div className="progress-time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
            <input 
              type="range"
              className="custom-slider-input"
              min="0"
              max={totalDuration}
              value={currentTime}
              onChange={(e) => {
                const targetSec = Number(e.target.value);
                setCurrentTime(targetSec);
                if (isPlaying && voiceEnabled) {
                  // Find segment index
                  let index = 0;
                  for (let i = 0; i < narration.length; i++) {
                    const { start, end } = getSegmentTimeBounds(narration[i].time);
                    if (targetSec >= start && targetSec < end) {
                      index = i;
                      break;
                    }
                  }
                  speakSegment(index);
                }
              }}
            />
          </div>

          <div className="control-buttons-row">
            {/* Speed selection */}
            <select 
              className="speed-control-select"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              title="Playback Speed"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>

            {/* Rewind */}
            <button className="control-btn" onClick={() => seekTime(-15)} title="Rewind 15s">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 16.1h4m-4 0v4" />
                <path d="M12 20A8 8 0 1 0 4 12v1" />
                <text x="7" y="15" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">15</text>
              </svg>
            </button>

            {/* Play/Pause */}
            <button className="control-btn play-pause" onClick={handlePlayPause}>
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="6" y1="4" x2="6" y2="20" />
                  <line x1="18" y1="4" x2="18" y2="20" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Forward */}
            <button className="control-btn" onClick={() => seekTime(15)} title="Forward 15s">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.1A5 5 0 0 0 18.1 20M22 16.1h-4m4 0v4" />
                <path d="M12 20A8 8 0 1 1 20 12v1" />
                <text x="11" y="15" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">15</text>
              </svg>
            </button>

            {/* Narrator voice toggle */}
            <button 
              className="control-btn" 
              onClick={() => setVoiceEnabled(!voiceEnabled)} 
              title={voiceEnabled ? "Mute Voice Narrator" : "Enable Voice Narrator"}
              style={{ color: voiceEnabled ? 'var(--secondary)' : 'var(--text-muted)' }}
            >
              {voiceEnabled ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l6 6L21 20.73 4.27 3zM14 7h4V3h-6v5.18l2 2V7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Timed AI Narration Script */}
        <div className="narration-script-container">
          <div className="narration-script-header">
            <span>AI Narration Flow</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click segment to jump</span>
          </div>
          <div className="script-scroller">
            {narration.map((segment, idx) => (
              <div 
                key={idx}
                className={`script-segment ${idx === activeSegmentIndex ? 'active' : ''}`}
                onClick={() => jumpToSegment(idx)}
                style={{ cursor: 'pointer' }}
              >
                <div className="segment-time">⏰ {segment.time}</div>
                <div className="segment-title">{segment.title}</div>
                <div className="segment-content">
                  {segment.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
