'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? 'User'}
            width={28}
            height={28}
            className="rounded-full"
          />
        )}
        <span className="hidden text-sm font-medium text-white/90 sm:inline">
          {session.user.name}
        </span>
        <button
          onClick={() => signOut()}
          className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
    >
      ログイン
    </Link>
  )
}
