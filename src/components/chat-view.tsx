'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/types/message'
import type { Session, SessionMode, Speaker } from '@/types/session'
import { MessageBubble } from '@/components/message-bubble'
import { SpeakerIndicator } from '@/components/speaker-indicator'
import { TextInput } from '@/components/text-input'

interface ChatViewProps {
  session: Session
  currentSpeaker: Speaker
  isLoading: boolean
  mode: SessionMode
  onSendMessage: (content: string) => void
  onSwitchSpeaker: () => void
  onFinalize: () => void
}

export function ChatView({
  session,
  currentSpeaker,
  isLoading,
  mode,
  onSendMessage,
  onSwitchSpeaker,
  onFinalize,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const messages = session?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!session) return null

  const currentSpeakerName =
    currentSpeaker === 'A' ? session.nameA : session.nameB
  const otherSpeakerName =
    currentSpeaker === 'A' ? session.nameB : session.nameA

  const hasSpokenA = messages.some(
    (message: Message) => message.speaker === 'A'
  )
  const hasSpokenB = messages.some(
    (message: Message) => message.speaker === 'B'
  )
  const canFinalize = hasSpokenA && hasSpokenB

  return (
    <div className="flex h-full flex-col gap-4">
      {mode === 'multi' ? (
        <div className="rounded-lg bg-green-100 px-4 py-2 text-center font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
          あなたは{currentSpeakerName}です
        </div>
      ) : (
        <SpeakerIndicator
          currentSpeaker={currentSpeaker}
          nameA={session.nameA}
          nameB={session.nameB}
        />
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              nameA={session.nameA}
              nameB={session.nameB}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="sticky bottom-0 flex flex-col gap-2 bg-white p-4 shadow-inner dark:bg-zinc-800">
        <TextInput
          onSend={onSendMessage}
          isLoading={isLoading}
          currentSpeakerName={currentSpeakerName}
        />
        <div className="flex gap-2">
          {mode === 'single' && (
            <button
              type="button"
              onClick={onSwitchSpeaker}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                currentSpeaker === 'A'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isLoading}
            >
              {otherSpeakerName}さんに交代
            </button>
          )}
          {canFinalize && (
            <button
              type="button"
              onClick={onFinalize}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              disabled={isLoading}
            >
              判定に進む
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
