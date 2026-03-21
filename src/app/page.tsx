'use client'

import Link from 'next/link'

import { HistoryList } from '@/components/history-list'

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-10 px-6 py-16">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            判事AI
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            友人・カップル・夫婦間の喧嘩を公平に仲裁
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/session/new"
          className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-blue-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          仲裁を始める
        </Link>

        {/* History */}
        <HistoryList />
      </main>
    </div>
  )
}
