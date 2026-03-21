import { NextRequest, NextResponse } from 'next/server'
import { getShareReport } from '@/lib/storage'
import { notFound } from '@/lib/api-error'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const report = await getShareReport(id)
  if (!report) return notFound('共有レポートが見つかりません')

  return NextResponse.json(report)
}
