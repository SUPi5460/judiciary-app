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

  const { session, isLoading, error, loadSession, requestJudgment, generateShareLink, reopenSession } =
    useSessionStore()

  const [shareLoading, setShareLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadSession(id)
  }, [id, loadSession])

  useEffect(() => {
    if (!session) return
    if (session.status === 'ready_for_judge' || session.status === 'gathering') {
      requestJudgment()
    }
  }, [session?.status, session?.id, requestJudgment])

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
            title: '判事AI - 仲裁レポート',
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">{'⚖️'}</div>
          <p className="text-zinc-600 font-medium">判定中...</p>
          <p className="text-sm text-zinc-400">AIが公平に判定しています</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-4xl">{'⚠️'}</div>
          <p className="text-red-600 font-medium">エラーが発生しました</p>
          <p className="text-sm text-zinc-500">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    )
  }

  if (!session?.judgment) {
    return null
  }

  const { judgment, nameA, nameB } = session

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-zinc-800">
          {'⚖️'} 判定結果
        </h1>

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

        <div className="flex flex-col gap-3 pt-4">
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {shareLoading ? '共有中...' : '📤 結果を共有'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-medium text-sm hover:bg-zinc-700 transition-colors"
            >
              {'🏠'} ホームへ
            </button>
          </div>
          <button
            onClick={async () => {
              await reopenSession()
              router.push(`/session/${id}`)
            }}
            className="w-full px-6 py-3 border-2 border-amber-500 text-amber-600 rounded-xl font-medium text-sm hover:bg-amber-50 transition-colors"
          >
            🔄 議論を再開して再判定する
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-800 text-white rounded-xl shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
