# Phase 2: 音声入力（STT）設計ドキュメント

作成日: 2026-03-23

## 概要

既存のテキスト入力に Web Speech API ベースの音声入力を追加する。
AIの音声読み上げ・フルリアルタイム対話は Phase 4（マルチデバイス対応）で実装。

## 技術選定

- **Web Speech API（ブラウザネイティブ）**
- 追加コストゼロ、追加パッケージ不要
- Chrome/Safari対応
- 非対応ブラウザではマイクアイコン非表示（テキスト入力のみ）

## UI設計

テキスト入力欄のボタンをコンテキストで切り替え（LINEスタイル）：

| 状態 | 入力欄 | 右側ボタン |
|------|--------|-----------|
| 空 | プレースホルダー | 🎤 マイク（グレー） |
| 録音中 | interimテキスト（薄い色） | 🔴 停止（赤パルス） |
| テキストあり | 確定テキスト | 📤 送信（青） |

## 動作フロー

1. ユーザーがマイクアイコンをタップ → 録音開始
2. `webkitSpeechRecognition` がリアルタイムで音声をテキスト変換
3. 変換中のテキストを入力欄にプレビュー表示（interim results）
4. ユーザーが話し終わる → 自動停止（or もう一度タップで手動停止）
5. 最終テキストが入力欄に確定
6. ユーザーが内容を確認して送信ボタンをタップ（自動送信はしない）

**自動送信しない理由:** 音声認識は誤変換がある。確認・修正してから送る方がUXが良い。

## 実装詳細

**変更対象: `src/components/text-input.tsx` のみ**

```typescript
const recognition = new webkitSpeechRecognition()
recognition.lang = 'ja-JP'
recognition.continuous = true
recognition.interimResults = true
```

**状態: idle → listening → finished(テキストあり)**

## エラーハンドリング

- マイク権限拒否 → 「マイクの使用を許可してください」トースト表示
- 認識失敗 → 静かにidle状態に戻る
- 対応外ブラウザ → マイクアイコン非表示（`'webkitSpeechRecognition' in window` で判定）

## スコープ外

- 音声の録音・保存
- AIの音声読み上げ（Phase 4）
- 外部STTサービス（Whisper, Deepgram等）
- フルリアルタイム対話（Phase 4）
