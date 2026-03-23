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
    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 self-start'
    : isSpeakerB
      ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20 self-end'
      : 'bg-white text-zinc-700 border border-zinc-200 shadow-sm self-center dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'

  const wrapperAlignment = isSpeakerB
    ? 'items-end'
    : isSpeakerAI
      ? 'items-center'
      : 'items-start'

  const labelClassName = isSpeakerA
    ? 'text-blue-600 dark:text-blue-400'
    : isSpeakerB
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-zinc-500 dark:text-zinc-400'

  return (
    <div className={`flex flex-col gap-1 ${wrapperAlignment} animate-fade-in`}>
      <span className={`text-xs font-semibold ${labelClassName}`}>{label}</span>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${bubbleClassName}`}>
        {message.content}
      </div>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
        {new Date(message.timestamp).toLocaleTimeString('ja-JP')}
      </span>
    </div>
  )
}
