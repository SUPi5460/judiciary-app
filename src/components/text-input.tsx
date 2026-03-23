'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { FormEvent } from 'react'

interface TextInputProps {
  onSend: (content: string) => void
  isLoading: boolean
  currentSpeakerName: string
}

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList
  resultIndex: number
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
}

export function TextInput({
  onSend,
  isLoading,
  currentSpeakerName,
}: TextInputProps) {
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null)

  useEffect(() => {
    setSpeechSupported(isSpeechSupported())
  }, [])

  // マイクエラーのトースト自動消去
  useEffect(() => {
    if (!micError) return
    const timer = setTimeout(() => setMicError(null), 3000)
    return () => clearTimeout(timer)
  }, [micError])

  const createRecognition = useCallback(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).webkitSpeechRecognition ?? (window as unknown as Record<string, unknown>).SpeechRecognition
    const recognition = new (SpeechRecognition as new () => {
      lang: string
      continuous: boolean
      interimResults: boolean
      onresult: ((e: SpeechRecognitionEvent) => void) | null
      onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
      onend: (() => void) | null
      start: () => void
      stop: () => void
      abort: () => void
    })()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    return recognition
  }, [])

  // アンマウント時にrecognitionをクリーンアップ
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!speechSupported || isLoading || isListening) return

    // 既存のインスタンスがあれば停止
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    const recognition = createRecognition()
    recognitionRef.current = recognition

    let finalTranscript = value

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
          setValue(finalTranscript)
          setInterimText('')
        } else {
          interim += transcript
        }
      }
      if (interim) {
        setInterimText(interim)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setMicError('マイクの使用を許可してください')
      }
      setIsListening(false)
      setInterimText('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      recognitionRef.current = null
    }

    try {
      recognition.start()
      setIsListening(true)
      setMicError(null)
    } catch {
      setMicError('音声認識を開始できませんでした')
    }
  }, [speechSupported, isLoading, createRecognition, value])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }, [])

  const trimmedValue = value.trim()
  const hasText = trimmedValue.length > 0
  const isDisabled = isLoading || !hasText

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isDisabled) return
    if (isListening) stopListening()
    onSend(trimmedValue)
    setValue('')
  }

  const displayValue = isListening && interimText ? value + interimText : value

  return (
    <>
      <form className="flex w-full gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          value={displayValue}
          onChange={(event) => {
            setValue(event.target.value)
            setInterimText('')
          }}
          placeholder={
            isListening
              ? '聞き取り中...'
              : `${currentSpeakerName}さんの意見を入力...`
          }
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isListening
              ? 'border-red-400 bg-red-50 text-zinc-600 dark:border-red-600 dark:bg-red-950'
              : ''
          }`}
          disabled={isLoading}
        />

        {/* 入力が空 & 録音していない → マイクボタン */}
        {!hasText && !isListening && speechSupported && (
          <button
            type="button"
            onClick={startListening}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-zinc-600 hover:bg-zinc-300 transition-colors dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            disabled={isLoading}
            aria-label="音声入力を開始"
          >
            🎤
          </button>
        )}

        {/* 録音中 → 停止ボタン */}
        {isListening && (
          <button
            type="button"
            onClick={stopListening}
            className="rounded-lg bg-red-500 px-4 py-2 text-white animate-pulse hover:bg-red-600 transition-colors"
            aria-label="録音を停止"
          >
            🔴
          </button>
        )}

        {/* テキストがある & 録音していない → 送信ボタン */}
        {hasText && !isListening && (
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-blue-500 transition-colors"
            disabled={isDisabled}
          >
            送信
          </button>
        )}

        {/* テキストがなく & 録音していない & 音声非対応 → 送信ボタン（無効） */}
        {!hasText && !isListening && !speechSupported && (
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled
          >
            送信
          </button>
        )}
      </form>

      {micError && (
        <div role="alert" className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm shadow-lg z-50">
          {micError}
        </div>
      )}
    </>
  )
}
