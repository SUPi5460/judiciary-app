import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  code: string
}

export function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code } satisfies ApiError, { status })
}

export function notFound(message = 'リソースが見つかりません') {
  return errorResponse(message, 'NOT_FOUND', 404)
}

export function badRequest(message: string) {
  return errorResponse(message, 'BAD_REQUEST', 400)
}

export function serverError(message = 'サーバーエラーが発生しました') {
  return errorResponse(message, 'INTERNAL_ERROR', 500)
}
