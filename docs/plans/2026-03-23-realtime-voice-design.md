# フルリアルタイム音声対話 設計ドキュメント

作成日: 2026-03-23

## 概要

マルチデバイスモード時に、各ユーザーがAIと音声でリアルタイム対話できる機能を追加。
OpenAI Realtime API（WebRTC）を使用。1台共有モードは変更なし。

## 技術選定

- OpenAI Realtime API（WebRTC接続）
- ブラウザからOpenAIに直接接続（サーバーはephemeral token発行のみ）
- Vercelサーバーレスと完全互換

## アーキテクチャ

```
ブラウザ ←WebRTC→ OpenAI Realtime API
    ↓ transcript
POST /api/session/[id]/message → Vercel KV
    ↓ polling
相手デバイスにテキスト同期
```

- サーバーの役割: ephemeral token発行 + 発言テキスト保存
- 音声データはサーバーを経由しない

## 接続フロー

1. POST /api/realtime/token でephemeral token取得
2. RTCPeerConnection でWebRTC接続確立
3. ユーザーのマイク音声を送信
4. AIの音声をスピーカーで再生
5. data channel でtranscript（テキスト）を受信
6. transcriptをmessage APIで保存 → 相手にポーリング同期

## UI

### 音声モード切り替え
- マルチデバイスモードの対話画面に「🎙️ 音声で話す」ボタン追加
- タップで音声モードON、VoiceCallコンポーネント表示
- 「テキストに戻る」で通常チャットに復帰
- いつでも切り替え可能

### VoiceCallコンポーネント
- 音声通話中の表示（波形アニメーション）
- 最新の発言テキスト表示
- 「テキストに戻る」「終了」ボタン

## API

### POST /api/realtime/token
- OpenAI APIにPOSTしてephemeral token取得
- model: Realtime API用モデル
- voice: 日本語対応ボイス
- instructions: 既存のbuildSystemPromptを流用

## 既存機能との共存

- テキストモードと音声モードはいつでも切り替え可能
- 音声のtranscriptは通常のmessageとして保存 → 判定フェーズで使用
- 1台共有モードは変更なし
- Web Speech API（STT）はテキストモード時のフォールバックとして残す

## スコープ外

- 音声の録音・保存（transcriptのみ）
- 複数人の同時音声通話
- 1台共有モードでの音声対話
