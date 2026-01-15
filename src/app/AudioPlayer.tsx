'use client'

import { useState, useRef } from 'react'

interface AudioPlayerProps {
  onAudioEnd: () => void;
}

export default function AudioPlayer({ onAudioEnd }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(console.error)
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      const duration = audioRef.current.duration
      setProgress((current / duration) * 100 || 0)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(100)
    onAudioEnd()
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src="/birthday-song.mp3"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      
      <div className="audio-controls">
        <button onClick={togglePlay} className="audio-button">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="audio-info">
          {isPlaying ? 'Happy Birthday Playing...' : 'Ready to celebrate!'}
        </div>
      </div>
    </div>
  )
}