'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useSessionStore } from '@/store/session-store'
import { JudgmentCard } from '@/components/judgment-card'
import { ResolutionCard } from '@/components/resolution-card'

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { session, isLoading, error, loadSession, generateShareLink, reopenSession } =
    useSessionStore()

  const [shareLoading, setShareLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadSession(id)
  }, [id, loadSession])

  // 判定は対話ページ（handleFinalize）で実行済み
  // 結果ページは表示のみ

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleShare = async () => {
    setShareLoading(true)
    try {
      const shareUrl = await generateShareLink()
      if (!shareUrl) {
        showToast('共有リンクの生成に失敗しました')
        return
      }

      const fullUrl = `${window.location.origin}${shareUrl}`

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'JudgeMate - 仲裁レポート',
            text: 'AIが公平に仲裁した結果をチェック！',
            url: fullUrl,
          })
          return
        } catch {
          // User cancelled or Web Share API not available, fall through to clipboard
        }
      }

      await navigator.clipboard.writeText(fullUrl)
      showToast('コピーしました！')
    } catch {
      showToast('共有に失敗しました')
    } finally {
      setShareLoading(false)
    }
  }

  if (isLoading && !session?.judgment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-5xl animate-float">{'⚖️'}</div>
          <p className="text-zinc-700 font-semibold text-lg dark:text-zinc-200">判定中...</p>
          <p className="text-sm text-zinc-400">AIが公平に判定しています</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center space-y-4 max-w-md px-4 animate-fade-in">
          <div className="text-4xl">{'⚠️'}</div>
          <p className="text-red-600 font-semibold dark:text-red-400">エラーが発生しました</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-700 transition-all duration-200 hover:shadow-md dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    )
  }

  if (!isLoading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center space-y-4 max-w-md px-4 animate-fade-in">
          <div className="text-4xl">📋</div>
          <p className="text-zinc-700 font-semibold dark:text-zinc-200">セッションが見つかりません</p>
          <p className="text-sm text-zinc-400">セッションの有効期限が切れたか、サーバーが再起動された可能性があります</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-700 transition-all duration-200 hover:shadow-md dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    )
  }

  if (!session?.judgment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center space-y-4 max-w-md px-4 animate-fade-in">
          <div className="text-4xl">{'⚖️'}</div>
          <p className="text-zinc-700 font-semibold dark:text-zinc-200">判定結果がありません</p>
          <p className="text-sm text-zinc-400">議論を再開したか、まだ判定が完了していません</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push(`/session/${id}`)}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              議論に戻る
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-zinc-700 transition-all duration-200 dark:bg-zinc-700"
            >
              ホームへ
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { judgment, nameA, nameB } = session

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-indigo-50/30 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in space-y-2">
          <div className="text-4xl">{'⚖️'}</div>
          <h1 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">
            判定結果
          </h1>
          <p className="text-sm text-zinc-400">{nameA} vs {nameB}</p>
        </div>

        {/* Issue cards */}
        <div className="space-y-4">
          {judgment.issues.map((issue, index) => (
            <JudgmentCard
              key={index}
              issue={issue}
              nameA={nameA}
              nameB={nameB}
              index={index}
            />
          ))}
        </div>

        <ResolutionCard resolution={judgment.resolution} />

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50"
            >
              {shareLoading ? '共有中...' : '結果を共有'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 hover:bg-zinc-700 hover:shadow-md active:scale-[0.98] dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              ホームへ
            </button>
          </div>
          <button
            onClick={async () => {
              await reopenSession()
              router.push(`/session/${id}`)
            }}
            className="w-full px-6 py-3 border-2 border-amber-400 text-amber-600 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-amber-50 hover:shadow-sm active:scale-[0.98] dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-900/10"
          >
            議論を再開して再判定する
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-800 text-white rounded-xl shadow-2xl text-sm animate-fade-in dark:bg-zinc-700">
          {toast}
        </div>
      )}
    </div>
  )
}
