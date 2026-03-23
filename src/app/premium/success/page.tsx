'use client'

import Link from 'next/link'

export default function PremiumSuccessPage() {
  return (
    <div className="flex min-h-full flex-col items-center font-sans">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <main className="relative flex w-full max-w-lg mx-auto flex-col items-center gap-6 px-6 py-20">
          <div className="glass w-full max-w-sm rounded-2xl p-6 text-center text-white shadow-2xl">
            <div className="relative flex h-24 items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full bg-amber-300/30 blur-2xl animate-pulse" />
              <div className="absolute left-8 top-2 h-2.5 w-2.5 rounded-full bg-emerald-300/80 animate-bounce" />
              <div className="absolute right-8 bottom-3 h-3 w-3 rounded-full bg-pink-300/80 animate-ping" />
              <div className="text-5xl animate-float">{'🎉'}</div>
            </div>

            <h1 className="mt-2 text-xl font-bold">
              プレミアムにアップグレードしました！
            </h1>
            <p className="mt-2 text-sm text-white/80">
              無制限ターンと永久履歴が有効になりました
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-indigo-700 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
            >
              ホームに戻る
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
