import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JudgeMate - 喧嘩の仲裁アプリ',
    short_name: 'JudgeMate',
    description: '友人・カップル・夫婦間の喧嘩をAIが公平に仲裁。論点を整理し、解決策を提案します。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
