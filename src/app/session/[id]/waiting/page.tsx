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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const truncatedUrl =
    joinUrl.length > 50 ? joinUrl.slice(0, 47) + '...' : joinUrl

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            参加者を待っています...
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {session.nameB}さんに以下のQRコードまたはリンクを共有してください
          </p>
        </div>

        {/* QR Code */}
        <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-zinc-800">
          <canvas ref={canvasRef} />
        </div>

        {/* Join URL + Copy */}
        <div className="flex w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800">
          <span className="flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {truncatedUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {copied ? 'コピーしました！' : 'コピー'}
          </button>
        </div>

        {/* Animated waiting indicator */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
          </span>
          <span>接続を待機中</span>
        </div>
      </div>
    </div>
  )
}
