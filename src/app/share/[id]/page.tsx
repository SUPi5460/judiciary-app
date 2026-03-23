import type { Metadata } from 'next'

import { ShareReportClient } from './client'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'JudgeMate - 仲裁レポート',
    description: 'JudgeMateによる仲裁結果レポート',
    openGraph: {
      title: 'JudgeMate - 仲裁レポート',
      description: 'AIが公平に仲裁した結果をチェック！',
    },
  }
}

export default function SharePage() {
  return <ShareReportClient />
}
