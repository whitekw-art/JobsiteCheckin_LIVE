'use client'

import { useEffect, useRef, useState } from 'react'

interface BeforeAfterCameraProps {
  beforePhotoUrl: string
  onCapture: (file: File) => void
  onClose: () => void
}

export default function BeforeAfterCamera({ beforePhotoUrl, onCapture, onClose }: BeforeAfterCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opacity, setOpacity] = useState(35)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setReady(true)
          }
        }
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setError('Camera access denied. Please allow camera access in your browser settings, then try again.')
        } else {
          setError('Unable to access camera. Try uploading from your library instead.')
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !ready) return

    setCapturing(true)

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) { setCapturing(false); return }
        const file = new File([blob], `after-${Date.now()}.jpg`, { type: 'image/jpeg' })
        streamRef.current?.getTracks().forEach(t => t.stop())
        onCapture(file)
      },
      'image/jpeg',
      0.92
    )
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.7)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
      }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
          After Photo — line up with ghost
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}
          aria-label="Close camera"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera view */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Live feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Ghost overlay */}
        {ready && (
          <img
            src={beforePhotoUrl}
            alt="before photo ghost"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: opacity / 100,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}

        {/* Error state */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center',
          }}>
            <p style={{ color: '#fff', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 20 }}>{error}</p>
            <button
              onClick={onClose}
              style={{
                background: '#fff', color: '#111', fontWeight: 600,
                border: 'none', borderRadius: 8, padding: '10px 24px',
                fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          </div>
        )}

        {/* Loading state */}
        {!ready && !error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ color: '#fff', fontSize: '0.9rem' }}>Starting camera...</p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {ready && !error && (
        <div style={{
          background: 'rgba(0,0,0,0.85)',
          padding: '16px 24px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          {/* Opacity slider */}
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              Ghost
            </span>
            <input
              type="range"
              min={10}
              max={70}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#e8a83a' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              {opacity}%
            </span>
          </div>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={capturing}
            style={{
              width: 68, height: 68, borderRadius: '50%',
              background: capturing ? '#666' : '#fff',
              border: '4px solid rgba(255,255,255,0.4)',
              cursor: capturing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            aria-label="Capture photo"
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: capturing ? '#999' : '#fff',
              border: '2px solid #ccc',
            }} />
          </button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
