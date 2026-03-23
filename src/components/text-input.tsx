'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

interface TextInputProps {
  onSend: (content: string) => void
  isLoading: boolean
  currentSpeakerName: string
}

export function TextInput({
  onSend,
  isLoading,
  currentSpeakerName,
}: TextInputProps) {
  const [value, setValue] = useState('')

  const trimmedValue = value.trim()
  const isDisabled = isLoading || trimmedValue.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isDisabled) {
      return
    }
    onSend(trimmedValue)
    setValue('')
  }

  return (
    <form className="flex w-full gap-2" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`${currentSpeakerName}さんの意見を入力...`}
        className="w-full rounded-lg border px-4 py-2"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isDisabled}
      >
        送信
      </button>
    </form>
  )
}
