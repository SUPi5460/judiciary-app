'use client'

interface ResolutionCardProps {
  resolution: string
}

export function ResolutionCard({ resolution }: ResolutionCardProps) {
  return (
    <div className="animate-fade-in-up rounded-2xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md dark:border-amber-700 dark:bg-zinc-900">
      <div className="px-5 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20">
        <h3 className="font-bold text-amber-800 text-base flex items-center gap-2 dark:text-amber-300">
          <span className="text-lg">{'💡'}</span>
          解決策の提案
        </h3>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap dark:text-zinc-300">
          {resolution}
        </p>
      </div>
    </div>
  )
}
