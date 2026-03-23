'use client'

import { useState, useCallback } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getSpeakerForSession } from '@/lib/speaker-storage'

interface VoiceCallProps {
  sessionId: string
  onSwitchToText: () => void
}

export function VoiceCall({ sessionId, onSwitchToText }: VoiceCallProps) {
  const [latestText, setLatestText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const speaker = getSpeakerForSession(sessionId)

  const handleTranscriptDelta = useCallback((text: string, _role: 'user' | 'assistant') => {
    setLatestText(text)
  }, [])

  const handleTranscriptDone = useCallback((text: string, role: 'user' | 'assistant') => {
    if (!text.trim()) return
    const speakerLabel = role === 'assistant' ? 'AI' : speaker
    // Save via transcript API (allows AI speaker)
    fetch(`/api/session/${sessionId}/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: speakerLabel, content: text.trim() }),
    }).catch(() => {})
    setLatestText('')
  }, [sessionId, speaker])

  const handleError = useCallback((msg: string) => {
    setError(msg)
  }, [])

  const { isConnected, isConnecting, connect, disconnect } = useRealtime({
    sessionId,
    onTranscriptDelta: handleTranscriptDelta,
    onTranscriptDone: handleTranscriptDone,
    onError: handleError,
  })

  const handleDisconnect = () => {
    disconnect()
    onSwitchToText()
  }

  // Not connected yet - show start button
  if (!isConnected && !isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <button
          onClick={connect}
          className="rounded-full bg-green-600 px-8 py-4 text-lg font-semibold text-white hover:bg-green-700 transition-colors"
        >
          音声通話を開始
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={onSwitchToText}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          テキストに戻る
        </button>
      </div>
    )
  }

  // Connected or connecting
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {isConnecting && (
        <div className="text-center">
          <p className="text-zinc-500">接続中...</p>
        </div>
      )}

      {isConnected && (
        <>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-500 animate-pulse flex items-center justify-center">
              <span className="text-3xl">&#x1f50a;</span>
            </div>
          </div>

          <p className="text-sm font-medium text-green-600">AIと音声で対話中</p>

          {latestText && (
            <div className="max-w-sm rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">
              {latestText}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onSwitchToText}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              テキストに戻る
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
            >
              通話終了
            </button>
          </div>
        </>
      )}
    </div>
  )
}
