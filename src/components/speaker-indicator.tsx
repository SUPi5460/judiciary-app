'use client'

import type { Speaker } from '@/types/session'

interface SpeakerIndicatorProps {
  currentSpeaker: Speaker
  nameA: string
  nameB: string
}

export function SpeakerIndicator({
  currentSpeaker,
  nameA,
  nameB,
}: SpeakerIndicatorProps) {
  const isSpeakerA = currentSpeaker === 'A'
  const label = isSpeakerA ? `${nameA}さんの番` : `${nameB}さんの番`
  const classes = isSpeakerA
    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold shadow-sm transition-all duration-300 ${classes}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>
      {label}
    </div>
  )
}
