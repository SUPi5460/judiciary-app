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
    <div className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="font-semibold text-zinc-800 text-base">
          {'📋'} 論点{index + 1}: {issue.issue}
        </h3>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="rounded-lg bg-blue-50 px-4 py-3">
          <p className="text-sm text-zinc-500 mb-1">{nameA}の主張</p>
          <p className="text-sm text-zinc-800">{issue.summaryA}</p>
        </div>

        <div className="rounded-lg bg-red-50 px-4 py-3">
          <p className="text-sm text-zinc-500 mb-1">{nameB}の主張</p>
          <p className="text-sm text-zinc-800">{issue.summaryB}</p>
        </div>

        <div
          className={`rounded-lg border-2 px-4 py-3 ${
            issue.verdict === 'A'
              ? 'border-green-400 bg-green-50'
              : 'border-green-400 bg-green-50'
          }`}
        >
          <p className="font-semibold text-green-700 text-sm">
            {'→'} {winnerName}さんの主張が妥当
          </p>
        </div>

        <div className="rounded-lg bg-zinc-50 px-4 py-3">
          <p className="text-sm text-zinc-500 mb-1">理由</p>
          <p className="text-sm text-zinc-700">{issue.reason}</p>
        </div>
      </div>
    </div>
  )
}
