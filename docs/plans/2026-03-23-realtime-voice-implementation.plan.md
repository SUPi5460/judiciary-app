# Realtime Voice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** マルチデバイスモード時にOpenAI Realtime API（WebRTC）でAIと音声リアルタイム対話する

**Architecture:** ブラウザがOpenAI Realtime APIにWebRTCで直接接続。サーバーはephemeral token発行 + transcript保存用APIを提供。AIの発言transcriptは専用エンドポイント（speaker制限なし）で保存し、相手デバイスにポーリング同期。テキストモードといつでも切替可能。

**重要な制約:** 既存の `POST /api/session/[id]/message` は `speaker:'AI'` をクライアントから拒否する設計。Realtime APIのtranscript保存には専用の `/api/session/[id]/transcript` エンドポイントを新設する。

**Tech Stack:** OpenAI Realtime API, WebRTC (RTCPeerConnection), gpt-realtime model

---

## Task 1: Ephemeral Token API

**What:** OpenAI Realtime API用のephemeral tokenを発行するAPIを作成

**Where:**
- Create: `src/app/api/realtime/token/route.ts`
- Create: `src/lib/__tests__/realtime-token-api.test.ts`

**How:** OpenAI REST APIにPOSTしてclient_secretsを取得。セッション情報からinstructionsを設定。

**Why:** ブラウザから直接Realtime APIに接続するためのセキュアなトークンが必要

**Verify:** `npm run test:run -- src/lib/__tests__/realtime-token-api.test.ts`

---

**Step 1: テスト作成（TDD）**

`src/lib/__tests__/realtime-token-api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/storage', () => ({
  getSession: vi.fn(),
}))

import { getSession } from '@/lib/storage'

// Mock global fetch for OpenAI API call
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('POST /api/realtime/token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
    vi.mocked(getSession).mockResolvedValue({
      id: 'test-session', status: 'gathering', category: 'couple',
      nameA: '太郎', nameB: '花子', messages: [], summary: null, judgment: null,
      mode: 'multi', joinCode: 'ABC123', participants: { A: 'joined', B: 'joined' },
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    })
  })

  it('returns ephemeral token with session config', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 'eph-token-123', expires_at: 1234567890 }),
    })

    const { POST } = await import('@/app/api/realtime/token/route')
    const req = new Request('http://localhost/api/realtime/token', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'test-session' }),
    })
    const res = await POST(req)
    const data = await res.json()

    expect(data.token).toBe('eph-token-123')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/client_secrets',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('returns 404 for missing session', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const { POST } = await import('@/app/api/realtime/token/route')
    const req = new Request('http://localhost/api/realtime/token', {
      method: 'POST',
      body: JSON.stringify({ sessionId: 'nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})
```

**Step 2: 実装**

`src/app/api/realtime/token/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/storage'
import { buildSystemPrompt } from '@/lib/llm/prompts'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return badRequest('sessionId is required')

    const session = await getSession(sessionId)
    if (!session) return notFound('セッションが見つかりません')

    const instructions = buildSystemPrompt(
      session.category ?? 'other',
      session.nameA,
      session.nameB
    )

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
          instructions,
          audio: {
            output: { voice: 'marin' },
          },
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe',
          },
          turn_detection: {
            type: 'semantic_vad',
          },
        },
      }),
    })

    if (!response.ok) {
      console.error('OpenAI token error:', await response.text())
      return serverError('Realtime tokenの取得に失敗しました')
    }

    const data = await response.json()
    return NextResponse.json({ token: data.value, expiresAt: data.expires_at })
  } catch {
    return serverError()
  }
}
```

**Step 3: テスト実行 → パス確認**

**Step 4: Commit**

```bash
git add src/app/api/realtime/token/ src/lib/__tests__/realtime-token-api.test.ts
git commit -m "feat: add Realtime API ephemeral token endpoint

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Transcript保存API

**What:** Realtime APIのtranscript（AI/ユーザーの発言テキスト）を保存する専用エンドポイントを作成

**Where:**
- Create: `src/app/api/session/[id]/transcript/route.ts`

**How:** 既存のmessage APIと似た構造だが、speaker制限なし（'A', 'B', 'AI' すべて受付）。Realtime APIからのtranscript保存専用。

**Why:** 既存の `/api/session/[id]/message` は `speaker:'AI'` をクライアントから拒否する設計。Realtime APIのtranscriptはクライアント側で受信するため、AI発言もクライアントから保存する必要がある。

**Verify:** `npm run test:run`

---

**Step 1: 実装**

```typescript
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getSession, saveSession } from '@/lib/storage'
import { badRequest, notFound, serverError } from '@/lib/api-error'
import type { Speaker } from '@/types/session'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession(id)
    if (!session) return notFound('セッションが見つかりません')
    if (session.status !== 'gathering') return badRequest('gathering状態でのみ追加可能です')

    const { speaker, content } = await req.json() as { speaker?: Speaker | 'AI'; content?: string }
    if (!speaker || !content) return badRequest('speaker と content は必須です')
    if (!['A', 'B', 'AI'].includes(speaker)) return badRequest('speaker は A, B, AI のいずれかを指定してください')

    session.messages.push({
      id: uuidv4(),
      speaker,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    })
    session.updatedAt = new Date().toISOString()
    await saveSession(session)

    return NextResponse.json({ ok: true })
  } catch {
    return serverError()
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/session/[id]/transcript/
git commit -m "feat: add transcript API for Realtime voice messages

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: WebRTC接続フック

**What:** OpenAI Realtime APIへのWebRTC接続を管理するカスタムフックを作成

**Where:**
- Create: `src/hooks/use-realtime.ts`

**How:** RTCPeerConnection + DataChannel + getUserMedia をフックにまとめる。接続・切断・transcript受信を管理。

**Why:** VoiceCallコンポーネントから接続ロジックを分離し、テスト容易性を確保

**Verify:** ブラウザでマイク許可 → 接続確認

---

**Step 1: フック実装**

`src/hooks/use-realtime.ts`:
```typescript
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseRealtimeOptions {
  sessionId: string
  onTranscriptDelta: (text: string, role: 'user' | 'assistant') => void
  onTranscriptDone: (text: string, role: 'user' | 'assistant') => void
  onError: (error: string) => void
}

interface UseRealtimeReturn {
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

export function useRealtime({
  sessionId,
  onTranscriptDelta,
  onTranscriptDone,
  onError,
}: UseRealtimeOptions): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const disconnect = useCallback(() => {
    dcRef.current?.close()
    pcRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (audioRef.current) {
      audioRef.current.srcObject = null
    }
    pcRef.current = null
    dcRef.current = null
    streamRef.current = null
    setIsConnected(false)
  }, [])

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return
    setIsConnecting(true)

    try {
      // 1. Get ephemeral token
      const tokenRes = await fetch('/api/realtime/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!tokenRes.ok) throw new Error('Token取得失敗')
      const { token } = await tokenRes.json()

      // 2. Create peer connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 3. Audio playback
      const audio = document.createElement('audio')
      audio.autoplay = true
      audioRef.current = audio
      pc.ontrack = (e) => { audio.srcObject = e.streams[0] }

      // 4. Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      pc.addTrack(stream.getTracks()[0])

      // 5. Data channel
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      // Accumulate transcript parts
      let currentAssistantTranscript = ''

      dc.addEventListener('message', (e) => {
        const event = JSON.parse(e.data)

        if (event.type === 'response.output_audio_transcript.delta') {
          currentAssistantTranscript += event.delta ?? ''
          onTranscriptDelta(currentAssistantTranscript, 'assistant')
        }
        if (event.type === 'response.output_audio_transcript.done') {
          onTranscriptDone(currentAssistantTranscript || event.transcript, 'assistant')
          currentAssistantTranscript = ''
        }
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          onTranscriptDone(event.transcript, 'user')
        }
        if (event.type === 'error') {
          onError(event.error?.message ?? 'Realtime API error')
        }
      })

      // 6. SDP exchange — wait for ICE gathering to complete
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for ICE candidates to be gathered
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve()
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') resolve()
        }
      })

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: pc.localDescription?.sdp,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/sdp',
        },
      })
      if (!sdpRes.ok) throw new Error('SDP交換失敗')

      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() })
      setIsConnected(true)

    } catch (err) {
      onError(err instanceof Error ? err.message : '接続に失敗しました')
      disconnect()
    } finally {
      setIsConnecting(false)
    }
  }, [sessionId, isConnected, isConnecting, onTranscriptDelta, onTranscriptDone, onError, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnect() }
  }, [disconnect])

  return { isConnected, isConnecting, connect, disconnect }
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-realtime.ts
git commit -m "feat: add useRealtime hook for WebRTC connection management

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: VoiceCallコンポーネント

**What:** 音声通話中のUIコンポーネントを作成

**Where:**
- Create: `src/components/voice-call.tsx`

**How:** useRealtimeフックを使用。接続状態表示、transcript表示、テキストモード切替ボタン。

**Why:** 音声対話中のユーザー体験

**Verify:** ブラウザで確認

---

**Step 1: コンポーネント実装**

`src/components/voice-call.tsx`:
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { useSessionStore } from '@/store/session-store'
import { getSpeakerForSession } from '@/lib/speaker-storage'

interface VoiceCallProps {
  sessionId: string
  onSwitchToText: () => void
}

export function VoiceCall({ sessionId, onSwitchToText }: VoiceCallProps) {
  const { addMessage, session } = useSessionStore()
  const [latestText, setLatestText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const speaker = getSpeakerForSession(sessionId)

  const handleTranscriptDelta = useCallback((text: string, role: 'user' | 'assistant') => {
    setLatestText(text)
  }, [])

  const handleTranscriptDone = useCallback((text: string, role: 'user' | 'assistant') => {
    if (!text.trim()) return
    // Save transcript via dedicated transcript API (allows AI speaker)
    const speakerLabel = role === 'assistant' ? 'AI' : speaker
    fetch(`/api/session/${sessionId}/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: speakerLabel, content: text.trim() }),
    }).catch(() => {
      // Message save failed - not critical for voice flow
    })
    setLatestText('')
  }, [sessionId, speaker])

  const handleError = useCallback((msg: string) => {
    setError(msg)
  }, [])

  const { isConnected, isConnecting, connect, disconnect } = useRealtime({
    sessionId,
    onTranscriptDelta: handleTranscriptDelta,
    onTranscriptDone: handleTranscriptDone,
    onError: handleError,
  })

  const handleDisconnect = () => {
    disconnect()
    onSwitchToText()
  }

  if (!isConnected && !isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <button
          onClick={connect}
          className="rounded-full bg-green-600 px-8 py-4 text-lg font-semibold text-white hover:bg-green-700 transition-colors"
        >
          🎙️ 音声通話を開始
        </button>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <button
          onClick={onSwitchToText}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          テキストに戻る
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {isConnecting && (
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-2">🎤</div>
          <p className="text-zinc-500">接続中...</p>
        </div>
      )}

      {isConnected && (
        <>
          {/* Pulsing animation */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-500 animate-pulse flex items-center justify-center">
              <span className="text-3xl">🔊</span>
            </div>
          </div>

          <p className="text-sm font-medium text-green-600">AIと音声で対話中</p>

          {/* Latest transcript */}
          {latestText && (
            <div className="max-w-sm rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {latestText}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onSwitchToText}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors dark:border-zinc-600 dark:text-zinc-300"
            >
              テキストに戻る
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
            >
              通話終了
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/voice-call.tsx
git commit -m "feat: add VoiceCall component for realtime audio UI

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 対話画面に音声モード切替を追加

**What:** マルチデバイスモードの対話画面に「🎙️ 音声で話す」ボタンとVoiceCall表示を追加

**Where:**
- Modify: `src/app/session/[id]/page.tsx`
- Modify: `src/components/chat-view.tsx`

**How:** ChatViewにvoiceModeプロップ追加。音声モード時はVoiceCallコンポーネントを表示、テキスト入力エリアを非表示に。

**Why:** テキストと音声のシームレスな切り替え体験

**Verify:** ブラウザでマルチデバイスモード → 「音声で話す」→ マイク許可 → AIと対話

---

**Step 1: ChatViewに音声モード切替を追加**

ChatViewProps に追加:
```typescript
interface ChatViewProps {
  // 既存...
  isVoiceMode: boolean      // 音声モードかどうか
  onToggleVoice: () => void // 音声モード切替
  sessionId: string         // VoiceCallに渡す
}
```

マルチモード時のみ、テキスト入力エリアの上に「🎙️ 音声で話す」ボタンを表示。
isVoiceMode=true のとき、テキスト入力エリアの代わりにVoiceCallコンポーネントを表示。

**Step 2: セッションページでvoiceMode状態管理**

```typescript
const [isVoiceMode, setIsVoiceMode] = useState(false)
```

ChatViewに `isVoiceMode`, `onToggleVoice`, `sessionId` を渡す。
1台共有モードでは音声ボタン非表示。

**Step 3: Commit**

```bash
git add src/app/session/[id]/page.tsx src/components/chat-view.tsx
git commit -m "feat: add voice mode toggle to multi-device chat

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 最終整理・デプロイ

**What:** テスト全パス確認、ビルド確認、デプロイ

**Where:**
- 全ファイル

**Verify:** `npm run test:run` 全パス、`npm run build` 成功、本番デプロイ後にマルチデバイスで音声対話確認

---

**Step 1: 全テスト実行**

```bash
npm run test:run
```

**Step 2: ビルド確認**

```bash
npm run build
```

**Step 3: Commit & Deploy**

```bash
git add -A
git commit -m "feat: realtime voice support complete

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
npx vercel --prod
git push origin main
```

---

## タスク依存関係

```
Task 1 (Token API)
  └── Task 2 (Transcript API)
        └── Task 3 (WebRTC Hook)
              └── Task 4 (VoiceCall UI)
                    └── Task 5 (Chat画面統合)
                          └── Task 6 (デプロイ)
```

すべて順次依存。並列実行不可。
