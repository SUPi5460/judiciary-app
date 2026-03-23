'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChatView } from '@/components/chat-view'
import { useSessionStore } from '@/store/session-store'
import { getSpeakerForSession } from '@/lib/speaker-storage'
import type { SessionMode } from '@/types/session'

const formatElapsed = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const hasPromptedRef = useRef(false)

  const {
    session,
    currentSpeaker,
    isLoading,
    error,
    loadSession,
    addMessage,
    switchSpeaker,
    finalize,
    requestJudgment,
    startPolling,
    stopPolling,
  } = useSessionStore()

  const sessionId = useMemo(() => {
    const idParam = params?.id
    if (Array.isArray(idParam)) {
      return idParam[0]
    }
    return idParam
  }, [params])

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [loadSession, sessionId])

  // Multi-device: start polling and set fixed speaker
  const isMulti = session?.mode === 'multi'
  const mySpeaker = sessionId ? getSpeakerForSession(sessionId) : 'A'

  useEffect(() => {
    if (isMulti) {
      startPolling()
      return () => {
        stopPolling()
      }
    }
  }, [isMulti, startPolling, stopPolling])

  // Determine effective speaker for multi mode
  const effectiveSpeaker = isMulti ? mySpeaker : currentSpeaker
  const myName = isMulti
    ? (mySpeaker === 'A' ? session?.nameA : session?.nameB)
    : undefined

  useEffect(() => {
    if (!session?.createdAt) {
      return
    }

    const createdAt = new Date(session.createdAt).getTime()
    const tick = () => {
      const now = Date.now()
      const diffSeconds = Math.max(0, Math.floor((now - createdAt) / 1000))
      setElapsedSeconds(diffSeconds)
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [session?.createdAt])

  useEffect(() => {
    if (!session || hasPromptedRef.current) {
      return
    }

    if (elapsedSeconds >= 900) {
      hasPromptedRef.current = true
      const confirmed = window.confirm('15分経過しました。判定に進みますか？')
      if (confirmed) {
        finalize()
      }
    }
  }, [elapsedSeconds, finalize, session])

  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isJudging, setIsJudging] = useState(false)

  const handleFinalize = async () => {
    if (!sessionId) return
    setIsJudging(true)
    try {
      await finalize()
      await requestJudgment()
      router.push(`/session/${sessionId}/result`)
    } catch {
      setIsJudging(false)
    }
  }

  if (isJudging) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-5xl animate-float">{'⚖️'}</div>
          <p className="text-zinc-700 font-semibold text-lg dark:text-zinc-200">判定中...</p>
          <p className="text-sm text-zinc-400">AIが公平に判定しています</p>
        </div>
      </div>
    )
  }

  if (isLoading && !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  if (!isLoading && !session) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-500">
        セッションが見つかりません
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Gradient header bar */}
      <header className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 shadow-md">
        <Link href="/" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
          ← 戻る
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">{'⚖️'}</span>
          <span className="text-sm font-bold text-white tracking-wide">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatView
          session={session}
          currentSpeaker={effectiveSpeaker}
          isLoading={isLoading}
          mode={session.mode}
          isVoiceMode={isVoiceMode}
          onToggleVoice={() => setIsVoiceMode(v => !v)}
          sessionId={sessionId!}
          onSendMessage={addMessage}
          onSwitchSpeaker={switchSpeaker}
          onFinalize={handleFinalize}
        />
      </div>
    </div>
  )
}
