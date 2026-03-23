'use client'

import type { Message } from '@/types/message'

interface MessageBubbleProps {
  message: Message
  nameA: string
  nameB: string
}

export function MessageBubble({
  message,
  nameA,
  nameB,
}: MessageBubbleProps) {
  const isSpeakerA = message.speaker === 'A'
  const isSpeakerB = message.speaker === 'B'
  const isSpeakerAI = message.speaker === 'AI'

  const label = isSpeakerA ? nameA : isSpeakerB ? nameB : '判事AI'
  const bubbleClassName = isSpeakerA
    ? 'bg-blue-500 text-white self-start'
    : isSpeakerB
      ? 'bg-red-500 text-white self-end'
      : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 self-center'

  const wrapperAlignment = isSpeakerB
    ? 'items-end'
    : isSpeakerAI
      ? 'items-center'
      : 'items-start'

  return (
    <div className={`flex flex-col gap-1 ${wrapperAlignment}`}>
      <span className="text-xs text-zinc-500">{label}</span>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${bubbleClassName}`}>
        {message.content}
      </div>
      <span className="text-xs text-zinc-400">
        {new Date(message.timestamp).toLocaleTimeString('ja-JP')}
      </span>
    </div>
  )
}
