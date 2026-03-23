import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'JudgeMate - 喧嘩の仲裁AI'
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
        <div style={{ fontSize: 64, fontWeight: 800, marginBottom: 16 }}>JudgeMate</div>
        <div style={{ fontSize: 28, opacity: 0.8 }}>友人・カップル・夫婦間の喧嘩をAIが公平に仲裁</div>
      </div>
    ),
    { ...size }
  )
}
