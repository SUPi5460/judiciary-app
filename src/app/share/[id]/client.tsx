'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import type { Session } from '@/types/session'
import { JudgmentCard } from '@/components/judgment-card'
import { ResolutionCard } from '@/components/resolution-card'

export function ShareReportClient() {
  const params = useParams()
  const id = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/share/${id}`)
        if (!response.ok) {
          throw new Error('レポートが見つかりませんでした')
        }
        const data: Session = await response.json()
        setSession(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">{'⚖️'}</div>
          <p className="text-zinc-600 font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !session?.judgment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-4xl">{'⚠️'}</div>
          <p className="text-red-600 font-medium">エラーが発生しました</p>
          <p className="text-sm text-zinc-500">{error ?? 'レポートが見つかりませんでした'}</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    )
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

        <div className="pt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 font-medium text-sm transition-colors"
          >
            判事AIで仲裁してみる {'→'}
          </Link>
        </div>
      </div>
    </div>
  )
}
