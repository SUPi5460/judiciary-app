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
  const label = isSpeakerA ? `🔵 ${nameA}さんの番` : `🔴 ${nameB}さんの番`
  const classes = isSpeakerA
    ? 'bg-blue-100 text-blue-800'
    : 'bg-red-100 text-red-800'

  return (
    <div
      className={`rounded-lg px-4 py-2 text-center font-semibold ${classes}`}
    >
      {label}
    </div>
  )
}
