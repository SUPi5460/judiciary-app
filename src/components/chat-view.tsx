'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/types/message'
import type { Session, SessionMode, Speaker } from '@/types/session'
import { MessageBubble } from '@/components/message-bubble'
import { SpeakerIndicator } from '@/components/speaker-indicator'
import { TextInput } from '@/components/text-input'
import { VoiceCall } from '@/components/voice-call'
import { getTurnLimit } from '@/lib/constants'

interface ChatViewProps {
  session: Session
  currentSpeaker: Speaker
  isLoading: boolean
  mode: SessionMode
  isVoiceMode: boolean
  onToggleVoice: () => void
  sessionId: string
  userId: string | null
  onSendMessage: (content: string) => void
  onSwitchSpeaker: () => void
  onFinalize: () => void
}

export function ChatView({
  session,
  currentSpeaker,
  isLoading,
  mode,
  isVoiceMode,
  onToggleVoice,
  sessionId,
  userId,
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

  const turnLimit = getTurnLimit(session?.userEmail ?? null, userId)
  const userTurns = messages.filter((m: Message) => m.speaker !== 'AI').length
  const isUnlimited = turnLimit === Infinity
  const remainingTurns = isUnlimited ? Infinity : Math.max(0, turnLimit - userTurns)
  const isLimitReached = !isUnlimited && remainingTurns === 0

  const hasSpokenA = messages.some(
    (message: Message) => message.speaker === 'A'
  )
  const hasSpokenB = messages.some(
    (message: Message) => message.speaker === 'B'
  )
  const canFinalize = hasSpokenA && hasSpokenB

  return (
    <div className="flex h-full flex-col">
      {/* Speaker indicator area */}
      <div className="px-4 pt-3">
        {mode === 'multi' ? (
          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-center font-semibold text-white shadow-sm">
            あなたは{currentSpeakerName}です
          </div>
        ) : (
          <SpeakerIndicator
            currentSpeaker={currentSpeaker}
            nameA={session.nameA}
            nameB={session.nameB}
          />
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
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

      {/* Bottom bar */}
      <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-zinc-200 bg-white/80 p-4 backdrop-blur-lg dark:border-zinc-700 dark:bg-zinc-900/80">
        {/* Turn counter (hide for unlimited users) */}
        {!isUnlimited && (
          <div className="flex justify-end">
            <span
              className={`text-xs font-medium ${
                remainingTurns === 0
                  ? 'text-red-500 dark:text-red-400'
                  : remainingTurns <= 3
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              残り {remainingTurns}/{turnLimit}
            </span>
          </div>
        )}

        {isLimitReached ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              ターン上限に達しました
            </p>
            <button
              type="button"
              onClick={onFinalize}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 hover:shadow-md active:scale-[0.98]"
              disabled={isLoading}
            >
              判定に進む
            </button>
            {!userId ? (
              <p className="text-xs text-indigo-500 dark:text-indigo-400">
                ログインで20ターンに増加
              </p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                プレミアムプラン準備中
              </p>
            )}
          </div>
        ) : (
          <>
            {mode === 'multi' && isVoiceMode ? (
              <VoiceCall sessionId={sessionId} onSwitchToText={onToggleVoice} />
            ) : (
              <>
                {mode === 'multi' && !isVoiceMode && (
                  <button
                    type="button"
                    onClick={onToggleVoice}
                    className="self-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-100 hover:shadow-md dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                  >
                    🎙 音声で話す
                  </button>
                )}
                <TextInput
                  onSend={onSendMessage}
                  isLoading={isLoading}
                  currentSpeakerName={currentSpeakerName}
                />
              </>
            )}
            <div className="flex gap-2">
              {mode === 'single' && (
                <button
                  type="button"
                  onClick={onSwitchSpeaker}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                    currentSpeaker === 'A'
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
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
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 hover:shadow-md active:scale-[0.98]"
                  disabled={isLoading}
                >
                  判定に進む
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
