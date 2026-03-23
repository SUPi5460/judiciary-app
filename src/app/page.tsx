'use client'

import Link from 'next/link'

import { HistoryList } from '@/components/history-list'

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center font-sans">
      {/* Hero Section with Gradient */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <main className="relative flex w-full max-w-lg mx-auto flex-col items-center gap-8 px-6 py-20">
          {/* Animated Scale Icon */}
          <div className="animate-float text-6xl drop-shadow-lg">
            {'⚖️'}
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
              判事AI
            </h1>
            <p className="max-w-xs text-lg font-medium text-indigo-100/80">
              友人・カップル・夫婦間の喧嘩を公平に仲裁
            </p>
          </div>

          {/* Glassmorphism CTA Card */}
          <div className="glass w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl">
            <Link
              href="/session/new"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-base font-bold text-indigo-700 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 dark:bg-white dark:text-indigo-700"
            >
              仲裁を始める
            </Link>
            <p className="mt-3 text-xs text-white/60">
              AIが公平に判定します
            </p>
          </div>
        </main>
      </div>

      {/* History Section */}
      <div className="w-full max-w-lg px-6 py-10">
        <HistoryList />
      </div>
    </div>
  )
}
