'use client'

import type { IssueJudgment } from '@/types/judgment'

interface JudgmentCardProps {
  issue: IssueJudgment
  nameA: string
  nameB: string
  index: number
}

export function JudgmentCard({ issue, nameA, nameB, index }: JudgmentCardProps) {
  const winnerName = issue.verdict === 'A' ? nameA : nameB

  return (
    <div className="animate-fade-in-up rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="font-bold text-zinc-800 text-base dark:text-zinc-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 mr-2 dark:bg-indigo-900/50 dark:text-indigo-400">{index + 1}</span>
          {issue.issue}
        </h3>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="rounded-xl bg-blue-50 px-4 py-3 border-l-4 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500">
          <p className="text-xs font-semibold text-blue-600 mb-1 dark:text-blue-400">{nameA}の主張</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{issue.summaryA}</p>
        </div>

        <div className="rounded-xl bg-rose-50 px-4 py-3 border-l-4 border-rose-400 dark:bg-rose-900/20 dark:border-rose-500">
          <p className="text-xs font-semibold text-rose-600 mb-1 dark:text-rose-400">{nameB}の主張</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{issue.summaryB}</p>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-2 border-emerald-300 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-600">
          <p className="font-bold text-emerald-700 text-sm dark:text-emerald-400">
            {'✓'} {winnerName}さんの主張が妥当
          </p>
        </div>

        <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
          <p className="text-xs font-semibold text-zinc-500 mb-1 dark:text-zinc-400">理由</p>
          <p className="text-sm text-zinc-600 leading-relaxed dark:text-zinc-300">{issue.reason}</p>
        </div>
      </div>
    </div>
  )
}
