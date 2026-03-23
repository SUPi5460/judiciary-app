import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { isPremiumUser } from '@/lib/storage'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ isPremium: false })
  }
  const premium = await isPremiumUser(session.user.email)
  return NextResponse.json({ isPremium: premium })
}
