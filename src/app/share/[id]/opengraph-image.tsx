import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'JudgeMate 仲裁レポート'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #4338ca)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>⚖️</div>
        <div style={{ fontSize: 52, fontWeight: 800, marginBottom: 16 }}>仲裁レポート</div>
        <div style={{ fontSize: 28, opacity: 0.8 }}>JudgeMate が公平に判定しました</div>
        <div style={{
          marginTop: 30,
          padding: '12px 32px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 16,
          fontSize: 22,
        }}>
          結果を見る →
        </div>
      </div>
    ),
    { ...size }
  )
}
