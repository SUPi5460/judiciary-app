# Phase 4: マルチデバイス対応 設計ドキュメント

作成日: 2026-03-23

## 概要

2人が別々のデバイスからセッションに参加し、リアルタイムで仲裁を行えるようにする。
フルリアルタイム音声（OpenAI Realtime API）は次フェーズに延期。

## 設計方針

- ポーリングベースのリアルタイム同期（3秒間隔）
- ゆるいターン制（AIが司会としてコントロール、サーバーは制限しない）
- 両者とも同じ画面を見る
- 1台共有モードとの共存

## 参加フロー

1. Aさんがセッション作成（カテゴリ・両者の名前入力）
2. 待機画面にリンクとQRコードが表示される
3. Bさんがリンク/QRで参加画面を開き「参加する」をタップ
4. Aさんの待機画面がBの参加を検知（ポーリング）
5. 両者とも対話画面に自動遷移
6. AIが司会として質問を開始

## データモデル変更

Session型に追加:
```typescript
joinCode: string                          // 参加コード（例: "ABC123"）
mode: 'single' | 'multi'                  // 1台共有 or マルチデバイス
participants: {
  A: 'waiting' | 'joined'
  B: 'waiting' | 'joined'
}
```

## API変更

新規:
- GET  /api/session/join/[code] — 参加コードでセッション検索
- POST /api/session/[id]/join — Bとしてセッションに参加
- GET  /api/session/[id]/poll — 軽量ポーリング（messageCount + participants + updatedAt）

既存変更:
- POST /api/session/create — joinCode自動生成、mode・participants追加

## ポーリング設計

```
GET /api/session/[id]/poll
→ { status, messageCount, participants, updatedAt }
```

クライアント: 3秒ごとにpoll → messageCount変化時のみ全件取得

## 画面変更

新規:
- /session/[id]/waiting — リンク・QR表示、参加待ち
- /session/join/[code] — Bさん参加確認画面

既存変更:
- セッション設定 — 「1台で使う」/「別々のデバイスで使う」選択肢追加
- 対話画面 — マルチモード時: ポーリング追加、交代ボタン削除、接続状態表示

## 1台共有モードとの共存

- 設定画面でモード選択
- single: 交代ボタンあり、ポーリングなし（現行動作）
- multi: 待機画面→QR/リンク→ポーリング有効、交代ボタンなし

## QRコード

`qrcode` npmパッケージでURLをcanvasに描画
