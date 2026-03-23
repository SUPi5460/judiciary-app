'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode'

import { useSessionStore } from '@/store/session-store'

export default function WaitingPage() {
  const params = useParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const { session, isLoading, loadSession, startPolling, stopPolling } =
    useSessionStore()

  const sessionId = useMemo(() => {
    const idParam = params?.id
    return Array.isArray(idParam) ? idParam[0] : idParam
  }, [params])

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [loadSession, sessionId])

  // Redirect if not multi mode or not found
  useEffect(() => {
    if (!isLoading && session && session.mode !== 'multi') {
      router.push('/')
    }
    if (!isLoading && !session) {
      router.push('/')
    }
  }, [isLoading, session, router])

  // Start polling on mount
  useEffect(() => {
    if (session?.mode === 'multi') {
      startPolling()
    }
    return () => {
      stopPolling()
    }
  }, [session?.id, session?.mode, startPolling, stopPolling])

  // Watch for participant B joining
  useEffect(() => {
    if (session?.participants.B === 'joined' && sessionId) {
      stopPolling()
      router.push(`/session/${sessionId}`)
    }
  }, [session?.participants.B, sessionId, stopPolling, router])

  // Generate join URL
  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined' || !session?.joinCode) return ''
    return `${window.location.origin}/session/join/${session.joinCode}`
  }, [session?.joinCode])

  // Render QR code
  useEffect(() => {
    if (canvasRef.current && joinUrl) {
      QRCode.toCanvas(canvasRef.current, joinUrl, { width: 200, margin: 2 })
    }
  }, [joinUrl])

  const handleCopy = async () => {
    if (!joinUrl) return
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading && !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const truncatedUrl =
    joinUrl.length > 50 ? joinUrl.slice(0, 47) + '...' : joinUrl

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-6 dark:from-zinc-900 dark:to-zinc-950">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="text-4xl animate-float">{'⚖️'}</div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            参加者を待っています
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {session.nameB}さんに以下のQRコードまたはリンクを共有してください
          </p>
        </div>

        {/* QR Code Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700">
          <canvas ref={canvasRef} />
        </div>

        {/* Join URL + Copy */}
        <div className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <span className="flex-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {truncatedUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              copied
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {copied ? 'コピーしました!' : 'コピー'}
          </button>
        </div>

        {/* Animated waiting indicator */}
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:300ms]" />
          </span>
          <span className="font-medium">接続を待機中</span>
        </div>
      </div>
    </div>
  )
}
