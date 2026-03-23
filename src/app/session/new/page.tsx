'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useSessionStore } from '@/store/session-store'
import type { Category, SessionMode } from '@/types/session'

const categories: { value: Category; label: string }[] = [
  { value: 'friends', label: '友人' },
  { value: 'couple', label: 'カップル' },
  { value: 'married', label: '夫婦' },
  { value: 'other', label: 'その他' },
]

export default function SessionNewPage() {
  const router = useRouter()
  const { createSession, isLoading, error: storeError, session } = useSessionStore()

  const [nameA, setNameA] = useState('')
  const [nameB, setNameB] = useState('')
  const [category, setCategory] = useState<Category | undefined>(undefined)
  const [mode, setMode] = useState<SessionMode>('single')
  const [errors, setErrors] = useState<{ nameA?: string; nameB?: string }>({})

  const validate = (): boolean => {
    const next: { nameA?: string; nameB?: string } = {}
    if (!nameA.trim()) {
      next.nameA = '名前を入力してください'
    }
    if (!nameB.trim()) {
      next.nameB = '名前を入力してください'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await createSession(nameA.trim(), nameB.trim(), category, mode)

    // After createSession, the store should have the session with its id.
    // We need to read it from the store after the await.
    const currentSession = useSessionStore.getState().session
    if (currentSession) {
      if (mode === 'multi') {
        router.push(`/session/${currentSession.id}/waiting`)
      } else {
        router.push(`/session/${currentSession.id}`)
      }
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col gap-8 px-6 py-16">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            仲裁セッションを設定
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            当事者の名前とカテゴリを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Category selection */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              カテゴリ（任意）
            </legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setCategory((prev) => (prev === cat.value ? undefined : cat.value))
                  }
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === cat.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-blue-400 hover:text-blue-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-500'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Mode selection */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              利用モード
            </legend>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  mode === 'single'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:border-blue-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                1台で使う（今まで通り）
              </button>
              <button
                type="button"
                onClick={() => setMode('multi')}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  mode === 'multi'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:border-blue-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                別々のデバイスで使う
              </button>
            </div>
          </fieldset>

          {/* Name A */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nameA"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              当事者A
            </label>
            <input
              id="nameA"
              type="text"
              placeholder="Aさんの名前"
              value={nameA}
              onChange={(e) => {
                setNameA(e.target.value)
                if (errors.nameA) setErrors((prev) => ({ ...prev, nameA: undefined }))
              }}
              className={`h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 ${
                errors.nameA ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600'
              }`}
            />
            {errors.nameA && (
              <p className="text-xs text-red-500">{errors.nameA}</p>
            )}
          </div>

          {/* Name B */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nameB"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              当事者B
            </label>
            <input
              id="nameB"
              type="text"
              placeholder="Bさんの名前"
              value={nameB}
              onChange={(e) => {
                setNameB(e.target.value)
                if (errors.nameB) setErrors((prev) => ({ ...prev, nameB: undefined }))
              }}
              className={`h-10 rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:text-zinc-100 ${
                errors.nameB ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600'
              }`}
            />
            {errors.nameB && (
              <p className="text-xs text-red-500">{errors.nameB}</p>
            )}
          </div>

          {/* Store error */}
          {storeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {storeError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                作成中...
              </span>
            ) : (
              '仲裁を開始する'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
