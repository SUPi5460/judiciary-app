import type { Metadata } from 'next'

import { ShareReportClient } from './client'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '判事AI - 仲裁レポート',
    description: '判事AIによる仲裁結果レポート',
    openGraph: {
      title: '判事AI - 仲裁レポート',
      description: 'AIが公平に仲裁した結果をチェック！',
    },
  }
}

export default function SharePage() {
  return <ShareReportClient />
}
