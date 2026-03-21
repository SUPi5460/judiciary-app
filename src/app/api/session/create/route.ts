import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { saveSession } from '@/lib/storage'
import { validateName, sanitizeInput } from '@/lib/validation'
import { badRequest, serverError } from '@/lib/api-error'
import type { Session, Category } from '@/types/session'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nameA, nameB, category } = body as {
      nameA?: string
      nameB?: string
      category?: Category
    }

    if (!nameA || !nameB) {
      return badRequest('nameA と nameB は必須です')
    }

    const validCategories: Category[] = ['friends', 'couple', 'married', 'other']
    if (category && !validCategories.includes(category)) {
      return badRequest('category は friends, couple, married, other のいずれかを指定してください')
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
    const session: Session = {
      id: uuidv4(),
      status: 'gathering',
      category: category ?? null,
      nameA: sanitizeInput(nameA),
      nameB: sanitizeInput(nameB),
      messages: [],
      summary: null,
      judgment: null,
      createdAt: now,
      updatedAt: now,
    }

    await saveSession(session)

    return NextResponse.json({ id: session.id }, { status: 201 })
  } catch {
    return serverError()
  }
}
