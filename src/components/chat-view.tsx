'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/types/message'
import type { Session, Speaker } from '@/types/session'
import { MessageBubble } from '@/components/message-bubble'
import { SpeakerIndicator } from '@/components/speaker-indicator'
import { TextInput } from '@/components/text-input'

interface ChatViewProps {
  session: Session
  currentSpeaker: Speaker
  isLoading: boolean
  onSendMessage: (content: string) => void
  onSwitchSpeaker: () => void
  onFinalize: () => void
}

export function ChatView({
  session,
  currentSpeaker,
  isLoading,
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

  const hasSpokenA = session.messages.some(
    (message: Message) => message.speaker === 'A'
  )
  const hasSpokenB = session.messages.some(
    (message: Message) => message.speaker === 'B'
  )
  const canFinalize = hasSpokenA && hasSpokenB

  return (
    <div className="flex h-full flex-col gap-4">
      <SpeakerIndicator
        currentSpeaker={currentSpeaker}
        nameA={session.nameA}
        nameB={session.nameB}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {session.messages.map((message) => (
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
      <div className="sticky bottom-0 flex flex-col gap-2 bg-white p-4 shadow-inner dark:bg-zinc-900">
        <TextInput
          onSend={onSendMessage}
          isLoading={isLoading}
          currentSpeakerName={currentSpeakerName}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSwitchSpeaker}
            className="rounded-lg border px-4 py-2"
            disabled={isLoading}
          >
            交代する → {otherSpeakerName}さんへ
          </button>
          {canFinalize && (
            <button
              type="button"
              onClick={onFinalize}
              className="rounded-lg bg-green-600 px-4 py-2 text-white"
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
