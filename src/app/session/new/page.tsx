'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useSessionStore } from '@/store/session-store'
import type { Category, SessionMode } from '@/types/session'

const categories: { value: Category; label: string; icon: string }[] = [
  { value: 'friends', label: '友人', icon: '👫' },
  { value: 'couple', label: 'カップル', icon: '💑' },
  { value: 'married', label: '夫婦', icon: '💍' },
  { value: 'other', label: 'その他', icon: '💬' },
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
      <main className="flex w-full max-w-lg flex-col gap-8 px-6 py-12">
        {/* Header */}
        <div className="flex flex-col gap-1 animate-fade-in">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            仲裁セッションを設定
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            当事者の名前とカテゴリを入力してください
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Category selection */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
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
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      category === cat.value
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Mode selection */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                利用モード
              </legend>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                    mode === 'single'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-lg mb-1">📱</div>
                  1台で使う
                </button>
                <button
                  type="button"
                  onClick={() => setMode('multi')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                    mode === 'multi'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-lg mb-1">📲</div>
                  別々のデバイス
                </button>
              </div>
            </fieldset>

            {/* Name A */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nameA"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
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
                className={`h-11 rounded-xl border bg-zinc-50 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:ring-offset-zinc-900 ${
                  errors.nameA ? 'border-red-400 ring-2 ring-red-400/20' : 'border-zinc-200 dark:border-zinc-700'
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
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
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
                className={`h-11 rounded-xl border bg-zinc-50 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:ring-offset-zinc-900 ${
                  errors.nameB ? 'border-red-400 ring-2 ring-red-400/20' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
              {errors.nameB && (
                <p className="text-xs text-red-500">{errors.nameB}</p>
              )}
            </div>

            {/* Store error */}
            {storeError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {storeError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
        </div>
      </main>
    </div>
  )
}
