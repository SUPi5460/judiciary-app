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
  const connectingRef = useRef(false) // Ref-based lock to prevent double connect

  const disconnect = useCallback(() => {
    connectingRef.current = false
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
    setIsConnecting(false)
  }, [])

  const connect = useCallback(async () => {
    // Ref-based guard prevents double invocation (state may not update immediately)
    if (connectingRef.current || pcRef.current) return
    connectingRef.current = true
    setIsConnecting(true)

    try {
      // 1. Get ephemeral token
      const tokenRes = await fetch('/api/realtime/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => null)
        throw new Error(errData?.error ?? `Token取得失敗 (${tokenRes.status})`)
      }
      const { token } = await tokenRes.json()

      // Check if disconnected during async operation
      if (!connectingRef.current) return

      // 2. Create peer connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // Monitor connection state for failures
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          onError('接続が切断されました')
          disconnect()
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          onError('ICE接続に失敗しました')
          disconnect()
        }
      }

      // 3. Audio playback
      const audio = document.createElement('audio')
      audio.autoplay = true
      audioRef.current = audio
      pc.ontrack = (e) => { audio.srcObject = e.streams[0] }

      // 4. Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!connectingRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      streamRef.current = stream
      pc.addTrack(stream.getTracks()[0])

      // 5. Data channel
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

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

      // 6. SDP exchange — wait for ICE gathering
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await new Promise<void>((resolve, reject) => {
        if (pc.iceGatheringState === 'complete') return resolve()
        const timeout = setTimeout(() => reject(new Error('ICE gathering タイムアウト')), 10000)
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout)
            resolve()
          }
        }
      })

      if (!connectingRef.current) return

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

      if (!connectingRef.current) {
        disconnect()
        return
      }

      setIsConnected(true)
    } catch (err) {
      onError(err instanceof Error ? err.message : '接続に失敗しました')
      disconnect()
    } finally {
      connectingRef.current = false
      setIsConnecting(false)
    }
  }, [sessionId, onTranscriptDelta, onTranscriptDone, onError, disconnect])

  useEffect(() => {
    return () => { disconnect() }
  }, [disconnect])

  return { isConnected, isConnecting, connect, disconnect }
}
