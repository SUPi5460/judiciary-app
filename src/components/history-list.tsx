'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HistoryEntry {
  id: string
  nameA: string
  nameB: string
  category: string | null
  topic: string | null
  date: string
}

const categoryLabels: Record<string, string> = {
  friends: '友人',
  couple: 'カップル',
  married: '夫婦',
  other: 'その他',
}

export function HistoryList() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem('judiciary-history')
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw)
        // 重複排除（同じIDの古いエントリを除去）
        const seen = new Set<string>()
        const deduped = parsed.filter((e) => {
          if (!e.id || seen.has(e.id)) return false
          seen.add(e.id)
          return true
        })
        setHistory(deduped)
        // クリーンアップしたデータを保存
        if (deduped.length !== parsed.length) {
          localStorage.setItem('judiciary-history', JSON.stringify(deduped))
        }
      }
    } catch {
      // Ignore corrupt localStorage data.
    }
  }, [])

  if (!mounted) {
    return null
  }

  if (history.length === 0) {
    return (
      <div className="w-full text-center py-8 text-zinc-400 dark:text-zinc-500">
        まだ仲裁履歴がありません
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest dark:text-zinc-500">
        過去の仲裁
      </h2>
      <ul className="space-y-2">
        {history.map((entry, index) => (
          <li key={entry.id ?? index}>
            <Link
              href={`/session/${entry.id}/result`}
              className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700 dark:hover:bg-zinc-800"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-zinc-800 group-hover:text-indigo-700 transition-colors dark:text-zinc-100 dark:group-hover:text-indigo-400">
                  {entry.topic ?? `${entry.nameA} vs ${entry.nameB}`}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {entry.nameA} vs {entry.nameB} ・ {new Date(entry.date).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {entry.category && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {categoryLabels[entry.category] ?? entry.category}
                  </span>
                )}
                <span className="text-zinc-300 group-hover:text-indigo-400 transition-colors dark:text-zinc-600">
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
