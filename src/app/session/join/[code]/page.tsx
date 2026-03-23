'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useSessionStore } from '@/store/session-store'

interface SessionInfo {
  sessionId: string
  nameA: string
  nameB: string
  category: string | null
}

const categoryLabels: Record<string, string> = {
  friends: '友人',
  couple: 'カップル',
  married: '夫婦',
  other: 'その他',
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const { joinSession, isLoading, error } = useSessionStore()

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isJoining, setIsJoining] = useState(false)

  const code = useMemo(() => {
    const codeParam = params?.code
    return Array.isArray(codeParam) ? codeParam[0] : codeParam
  }, [params])

  // Fetch session info on mount
  useEffect(() => {
    if (!code) return

    const fetchInfo = async () => {
      try {
        const response = await fetch(`/api/session/join/${code}`)
        if (!response.ok) {
          if (response.status === 404) {
            setFetchError('セッションが見つかりません')
          } else {
            const data = await response.json().catch(() => null)
            setFetchError(data?.error || 'エラーが発生しました')
          }
          return
        }
        const data: SessionInfo = await response.json()
        setSessionInfo(data)
      } catch {
        setFetchError('セッションの取得に失敗しました')
      } finally {
        setIsFetching(false)
      }
    }

    fetchInfo()
  }, [code])

  const handleJoin = async () => {
    if (!code) return
    setIsJoining(true)
    try {
      await joinSession(code)
      const currentSession = useSessionStore.getState().session
      if (currentSession) {
        router.push(`/session/${currentSession.id}`)
      }
    } catch {
      setIsJoining(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 dark:bg-black">
        <p className="text-lg font-semibold text-red-500">{fetchError}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
        >
          ホームに戻る
        </button>
      </div>
    )
  }

  if (!sessionInfo) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {/* Icon */}
        <div className="text-5xl">⚖️</div>

        {/* Title */}
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          仲裁への招待
        </h1>

        {/* Invitation message */}
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          {sessionInfo.nameA}さんがあなたを仲裁に招待しています
        </p>

        {/* Category badge */}
        {sessionInfo.category && (
          <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {categoryLabels[sessionInfo.category] || sessionInfo.category}
          </span>
        )}

        {/* Role assignment */}
        <div className="w-full rounded-lg bg-blue-50 px-4 py-3 text-center dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            あなたは「{sessionInfo.nameB}」として参加します
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error === 'Already joined' ? '既に参加済みです' : error}
          </p>
        )}

        {/* Join button */}
        <button
          type="button"
          onClick={handleJoin}
          disabled={isJoining || isLoading}
          className="w-full rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isJoining || isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              参加中...
            </span>
          ) : (
            '参加する'
          )}
        </button>
      </div>
    </div>
  )
}
