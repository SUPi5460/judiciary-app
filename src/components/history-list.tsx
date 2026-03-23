'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HistoryEntry {
  id: string
  nameA: string
  nameB: string
  category: string | null
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
        setHistory(JSON.parse(raw))
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
      <div className="w-full text-center py-8 text-zinc-400">
        まだ仲裁履歴がありません
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
        過去の仲裁
      </h2>
      <ul className="space-y-2">
        {history.map((entry, index) => (
          <li key={entry.id ?? index}>
            <Link
              href={`/session/${entry.id}/result`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-zinc-800"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.nameA} vs {entry.nameB}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(entry.date).toLocaleDateString('ja-JP')}
                </span>
              </div>
              {entry.category && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {categoryLabels[entry.category] ?? entry.category}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
