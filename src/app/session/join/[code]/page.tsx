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

const categoryIcons: Record<string, string> = {
  friends: '👫',
  couple: '💑',
  married: '💍',
  other: '💬',
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
    } finally {
      setIsJoining(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-50 to-purple-50 px-6 dark:from-zinc-900 dark:to-zinc-950">
        <p className="text-lg font-semibold text-red-500">{fetchError}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-xl bg-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-300 hover:shadow-sm dark:bg-zinc-700 dark:text-zinc-300"
        >
          ホームに戻る
        </button>
      </div>
    )
  }

  if (!sessionInfo) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-6 dark:from-zinc-900 dark:to-zinc-950">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 animate-fade-in">
        {/* Invitation card */}
        <div className="w-full rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-xl text-center dark:border-indigo-800 dark:bg-zinc-900">
          {/* Icon */}
          <div className="text-5xl mb-4 animate-float">{'⚖️'}</div>

          {/* Title */}
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
            仲裁への招待
          </h1>

          {/* Invitation message */}
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sessionInfo.nameA}</span>さんがあなたを仲裁に招待しています
          </p>

          {/* Category badge */}
          {sessionInfo.category && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              <span>{categoryIcons[sessionInfo.category] || '💬'}</span>
              {categoryLabels[sessionInfo.category] || sessionInfo.category}
            </div>
          )}

          {/* Role assignment */}
          <div className="mt-5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 dark:from-indigo-900/20 dark:to-purple-900/20">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              あなたは「<span className="font-bold">{sessionInfo.nameB}</span>」として参加します
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error === 'Already joined' ? '既に参加済みです' : error}
          </p>
        )}

        {/* Join button */}
        <button
          type="button"
          onClick={handleJoin}
          disabled={isJoining || isLoading}
          className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
