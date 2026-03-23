'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function PremiumPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    if (!session?.user?.email) {
      setError('ログインが必要です')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error ?? '購入に失敗しました')
        setIsLoading(false)
        return
      }

      const data = await response.json()
      if (data?.url) {
        window.location.href = data.url
        return
      }

      setError('購入に失敗しました')
    } catch {
      setError('購入に失敗しました')
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-full flex-col items-center font-sans">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <main className="relative flex w-full max-w-lg mx-auto flex-col items-center gap-6 px-6 py-20">
          <div className="animate-float text-5xl drop-shadow-lg">{'✨'}</div>
          <div className="text-center">
            <h1
              className="text-4xl font-bold tracking-tight text-white drop-shadow-sm"
              style={{ fontFamily: 'var(--font-libre-baskerville), serif' }}
            >
              Premium
            </h1>
            <p className="mt-2 text-sm text-indigo-100/80">
              JudgeMateを無制限で使える特典
            </p>
          </div>

          <div className="glass w-full max-w-sm rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-white/60">ワンタイム</p>
                <p className="text-3xl font-bold">¥500</p>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] text-white/70">
                一度のお支払い
              </span>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <span className="text-emerald-300">&#10003;</span>
                ターン数が無制限
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-300">&#10003;</span>
                履歴を永久保存
              </li>
            </ul>

            {status === 'loading' && (
              <p className="mt-4 text-xs text-white/60">ログイン状態を確認中...</p>
            )}

            {session?.user?.email ? (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isLoading}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-indigo-700 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? '処理中...' : '購入する'}
              </button>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/premium' })}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-indigo-700 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
                >
                  ログインして購入
                </button>
                <p className="text-xs text-white/70">
                  プレミアム購入にはログインが必要です
                </p>
              </div>
            )}

            {error && (
              <p className="mt-3 text-xs text-amber-200">{error}</p>
            )}

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs text-white/70 transition-colors hover:text-white"
              >
                ホームに戻る →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
