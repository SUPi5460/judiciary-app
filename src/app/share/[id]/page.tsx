import type { Metadata } from 'next'

import { ShareReportClient } from './client'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '仲裁レポート',
    description: 'JudgeMateによるAI仲裁結果レポート。論点を整理し、公平に判定しました。',
    openGraph: {
      title: '仲裁レポート | JudgeMate',
      description: 'AIが公平に仲裁した結果をチェック！',
    },
    twitter: {
      card: 'summary_large_image',
      title: '仲裁レポート | JudgeMate',
      description: 'AIが公平に仲裁した結果をチェック！',
    },
  }
}

export default function SharePage() {
  return <ShareReportClient />
}
