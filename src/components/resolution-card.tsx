'use client'

interface ResolutionCardProps {
  resolution: string
}

export function ResolutionCard({ resolution }: ResolutionCardProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-amber-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
        <h3 className="font-semibold text-amber-800 text-base">
          {'💡'} 解決策の提案
        </h3>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {resolution}
          </p>
        </div>
      </div>
    </div>
  )
}
