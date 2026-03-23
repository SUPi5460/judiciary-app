import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { saveSession, saveJoinCodeIndex } from '@/lib/storage'
import { validateName, sanitizeInput } from '@/lib/validation'
import { badRequest, serverError } from '@/lib/api-error'
import { generateUniqueJoinCode } from '@/lib/join-code'
import { AUTH_SESSION_TTL } from '@/lib/constants'
import type { Session, Category, SessionMode } from '@/types/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nameA, nameB, category, mode: rawMode } = body as {
      nameA?: string
      nameB?: string
      category?: Category
      mode?: string
    }

    if (!nameA || !nameB) {
      return badRequest('nameA と nameB は必須です')
    }

    const validCategories: Category[] = ['friends', 'couple', 'married', 'other']
    if (category && !validCategories.includes(category)) {
      return badRequest('category は friends, couple, married, other のいずれかを指定してください')
    }

    const mode: SessionMode = rawMode === 'multi' ? 'multi' : 'single'
    if (rawMode && rawMode !== 'single' && rawMode !== 'multi') {
      return badRequest('mode は single または multi を指定してください')
    }

    const nameAResult = validateName(nameA)
    if (!nameAResult.valid) {
      return badRequest(nameAResult.error)
    }

    const nameBResult = validateName(nameB)
    if (!nameBResult.valid) {
      return badRequest(nameBResult.error)
    }

    const now = new Date().toISOString()
    const joinCode = mode === 'multi' ? await generateUniqueJoinCode() : null

    const serverSession = await getServerSession(authOptions)
    const userId = serverSession?.user?.id ?? null

    const session: Session = {
      id: uuidv4(),
      userId,
      status: 'gathering',
      category: category ?? null,
      nameA: sanitizeInput(nameA),
      nameB: sanitizeInput(nameB),
      messages: [],
      summary: null,
      judgment: null,
      mode,
      joinCode,
      participants: {
        A: 'joined',
        B: mode === 'multi' ? 'waiting' : 'joined',
      },
      createdAt: now,
      updatedAt: now,
    }

    await saveSession(session, userId ? AUTH_SESSION_TTL : undefined)

    if (mode === 'multi' && joinCode) {
      await saveJoinCodeIndex(joinCode, session.id)
    }

    return NextResponse.json({ id: session.id, joinCode }, { status: 201 })
  } catch {
    return serverError()
  }
}
