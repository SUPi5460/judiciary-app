# Multi-Device Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 2人が別々のデバイスからセッションに参加し、ポーリングでリアルタイム同期する

**Architecture:** 既存Session型を拡張（joinCode, mode, participants）。ポーリングで軽量同期。1台共有モードとの共存。QRコードはqrcodeパッケージで生成。

**Tech Stack:** Next.js 16.2, TypeScript, qrcode (npm), 既存のVercel KV + API Routes

---

## Task 1: Session型の拡張

**What:** Session型にjoinCode, mode, participantsフィールドを追加

**Where:**
- Modify: `src/types/session.ts`
- Modify: `src/lib/__tests__/session-machine.test.ts`

**How:** 既存のSession interfaceにフィールド追加。既存コードは新フィールドがオプショナルなので破壊しない。

**Why:** マルチデバイスの全機能の基盤

**Verify:** `npm run test:run` — 既存テスト全パス + 型チェック

---

**Step 1: 型を拡張**

`src/types/session.ts`:
```typescript
import { Message } from './message'
import { Judgment } from './judgment'

export type SessionStatus = 'gathering' | 'ready_for_judge' | 'judging' | 'judged'
export type Category = 'friends' | 'couple' | 'married' | 'other'
export type Speaker = 'A' | 'B'
export type SessionMode = 'single' | 'multi'
export type ParticipantStatus = 'waiting' | 'joined'

export interface Session {
  id: string
  status: SessionStatus
  category: Category | null
  nameA: string
  nameB: string
  messages: Message[]
  summary: string | null
  judgment: Judgment | null
  mode: SessionMode
  joinCode: string | null
  participants: {
    A: ParticipantStatus
    B: ParticipantStatus
  }
  createdAt: string
  updatedAt: string
}
```

**Step 2: テスト実行 → 全パス確認**

```bash
npm run test:run
```

**Step 3: Commit**

```bash
git add src/types/session.ts
git commit -m "feat: extend Session type with mode, joinCode, participants

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: セッション作成APIの更新

**What:** createエンドポイントにmode・joinCode・participants対応を追加

**Where:**
- Modify: `src/app/api/session/create/route.ts`
- Modify: `src/lib/__tests__/api-handlers.test.ts`

**How:** bodyからmodeを受け取り、multiならjoinCode生成（6文字英数字大文字）。participants初期化。

**Why:** マルチデバイスセッションの起点

**Verify:** `npm run test:run -- src/lib/__tests__/api-handlers.test.ts`

---

**Step 1: joinCode生成ユーティリティ**

`src/lib/join-code.ts`:
```typescript
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字除外(0,O,1,I)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
```

**Step 2: create API更新**

`src/app/api/session/create/route.ts` に追加:
- bodyから `mode: 'single' | 'multi'` を受け取る（デフォルト: 'single'）
- multi時: `joinCode = generateJoinCode()`, `participants = { A: 'joined', B: 'waiting' }`
- single時: `joinCode = null`, `participants = { A: 'joined', B: 'joined' }`

**Step 3: テスト追加**

- mode='multi'でjoinCodeが生成される
- mode='single'でjoinCode=null
- デフォルトはsingle

**Step 4: テスト実行 → パス確認**

**Step 5: Commit**

```bash
git add src/lib/join-code.ts src/app/api/session/create/route.ts src/lib/__tests__/api-handlers.test.ts
git commit -m "feat: add mode and joinCode to session creation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 参加API（join/poll）

**What:** joinCode検索、セッション参加、ポーリングの3エンドポイントを追加

**Where:**
- Create: `src/app/api/session/join/[code]/route.ts`
- Create: `src/app/api/session/[id]/join/route.ts`
- Create: `src/app/api/session/[id]/poll/route.ts`
- Create: `src/lib/__tests__/join-poll-api.test.ts`

**How:** joinCode → KVスキャン（全セッション検索は高コストなので、`joincode:{code}` → sessionId のインデックスをKVに保存）。

**Why:** Bさんの参加フローとリアルタイム同期の基盤

**Verify:** `npm run test:run -- src/lib/__tests__/join-poll-api.test.ts`

---

**Step 1: storageにjoinCodeインデックス関数を追加**

`src/lib/storage.ts` に追加:
```typescript
export async function saveJoinCodeIndex(code: string, sessionId: string): Promise<void> {
  // TTL: セッションと同じ24h
  if (isInMemory()) return memSet(`joincode:${code}`, sessionId, SESSION_TTL)
  const kv = await getKv()
  await kv.set(`joincode:${code}`, sessionId, { ex: SESSION_TTL })
}

export async function getSessionIdByJoinCode(code: string): Promise<string | null> {
  if (isInMemory()) return memGet<string>(`joincode:${code}`)
  const kv = await getKv()
  return kv.get<string>(`joincode:${code}`)
}
```

**Step 2: create APIでjoinCodeインデックスを保存**

multiモードのセッション作成時に `saveJoinCodeIndex(joinCode, session.id)` を呼ぶ。

**Step 3: GET /api/session/join/[code] 実装**

joinCodeでセッション検索、セッション概要（nameA, nameB, category）を返す。Bがjoinedなら「既に参加済み」エラー。

**Step 4: POST /api/session/[id]/join 実装**

participants.Bを'joined'に更新、KVに保存。

**Step 5: GET /api/session/[id]/poll 実装**

```typescript
return NextResponse.json({
  status: session.status,
  messageCount: session.messages.length,
  participants: session.participants,
  updatedAt: session.updatedAt,
})
```

**Step 6: テスト追加（TDD）**

- joinCodeでセッション検索: 正常 + 存在しないコード
- 参加: 正常 + 既に参加済み + セッション不存在
- ポーリング: 正常レスポンス

**Step 7: Commit**

```bash
git add src/lib/storage.ts src/app/api/session/join/ src/app/api/session/[id]/join/ src/app/api/session/[id]/poll/ src/lib/__tests__/join-poll-api.test.ts
git commit -m "feat: add join, poll API endpoints with joinCode index

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Zustandストア更新

**What:** ストアにcreateSession(mode対応)、joinSession、startPolling、stopPollingを追加

**Where:**
- Modify: `src/store/session-store.ts`
- Modify: `src/store/__tests__/session-store.test.ts`

**How:** createSessionにmode引数追加。ポーリングはsetIntervalで3秒ごとにpoll APIを叩き、messageCount変化時にloadSessionで全件取得。

**Why:** フロントエンドのマルチデバイス状態管理

**Verify:** `npm run test:run -- src/store/__tests__/session-store.test.ts`

---

**Step 1: インターフェース拡張**

```typescript
interface SessionState {
  // 既存...
  pollingInterval: ReturnType<typeof setInterval> | null

  createSession: (nameA: string, nameB: string, category?: Category, mode?: SessionMode) => Promise<void>
  joinSession: (code: string) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  // 既存...
}
```

**Step 2: createSession更新**

modeパラメータを受け取り、APIに渡す。multiモード時はcreate後にwaitingページへ遷移できるようにjoinCodeをレスポンスに含める。

**Step 3: joinSession実装**

1. GET /api/session/join/[code] でセッション検索
2. POST /api/session/[id]/join で参加
3. GET /api/session/[id] で全セッション取得
4. store更新

**Step 4: startPolling/stopPolling実装**

```typescript
startPolling: () => {
  const { session, pollingInterval } = get()
  if (!session || pollingInterval) return
  let lastMessageCount = session.messages.length
  const interval = setInterval(async () => {
    const { session: current } = get()
    if (!current) return
    const poll = await fetchJson<{messageCount: number, participants: any, status: string}>(
      `/api/session/${current.id}/poll`
    )
    if (poll.messageCount !== lastMessageCount || poll.participants.B !== current.participants?.B) {
      lastMessageCount = poll.messageCount
      const updated = await fetchJson<Session>(`/api/session/${current.id}`)
      set({ session: updated })
    }
  }, 3000)
  set({ pollingInterval: interval })
},
stopPolling: () => {
  const { pollingInterval } = get()
  if (pollingInterval) clearInterval(pollingInterval)
  set({ pollingInterval: null })
},
```

**Step 5: テスト追加**

**Step 6: Commit**

```bash
git add src/store/
git commit -m "feat: add joinSession, polling to Zustand store

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: セッション設定画面にモード選択追加

**What:** 「1台で使う」/「別々のデバイスで使う」の選択を追加

**Where:**
- Modify: `src/app/session/new/page.tsx`

**How:** カテゴリ選択の下にモード選択ボタン2つ追加。multi選択時は遷移先をwaiting画面に変更。

**Why:** ユーザーがモードを選べるようにする

**Verify:** ブラウザで確認

---

**Step 1: モード選択UIを追加**

カテゴリ選択の下に:
```
📱 1台で使う（今まで通り）
📲 別々のデバイスで使う（NEW）
```

デフォルト: single

**Step 2: handleSubmitの遷移先を分岐**

- single → `/session/${id}`（現行通り）
- multi → `/session/${id}/waiting`

**Step 3: Commit**

```bash
git add src/app/session/new/page.tsx
git commit -m "feat: add mode selection to session setup page

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 待機画面（QR + リンク）

**What:** Bさんの参加を待つ画面を作成。QRコードとリンク表示。

**Where:**
- Create: `src/app/session/[id]/waiting/page.tsx`
- Install: `qrcode` パッケージ

**How:** qrcodeパッケージでURLをcanvasに描画。3秒ポーリングでBの参加を検知したら対話画面へ遷移。

**Why:** マルチデバイスの参加フロー

**Verify:** ブラウザで確認

---

**Step 1: qrcodeインストール**

```bash
npm install qrcode
npm install -D @types/qrcode
```

**Step 2: 待機画面実装**

`src/app/session/[id]/waiting/page.tsx`:
- セッション読み込み
- joinCodeからURL生成: `${origin}/session/join/${joinCode}`
- QRコード表示（qrcode.toCanvas）
- リンクコピーボタン
- 「Bさんの参加を待っています...」表示
- startPolling() でBの参加を検知
- B参加検知 → stopPolling() → router.push(`/session/${id}`)

**Step 3: Commit**

```bash
git add src/app/session/[id]/waiting/ package.json package-lock.json
git commit -m "feat: add waiting page with QR code and link sharing

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 参加画面

**What:** Bさんがリンク/QRから開く参加確認画面

**Where:**
- Create: `src/app/session/join/[code]/page.tsx`

**How:** joinCodeでセッション検索、概要表示、「参加する」ボタン。参加後に対話画面へ遷移。

**Why:** Bさんの参加体験

**Verify:** ブラウザで確認

---

**Step 1: 参加画面実装**

`src/app/session/join/[code]/page.tsx`:
- GET /api/session/join/[code] でセッション概要取得
- 表示: 「{nameA}さんがあなたを仲裁に招待しています」
- カテゴリ、Bさんの名前表示
- 「参加する」ボタン → joinSession(code) → router.push(`/session/${sessionId}`)
- 既に参加済みなら「既に参加しています」表示
- 不正なコードなら「セッションが見つかりません」表示

**Step 2: Commit**

```bash
git add src/app/session/join/
git commit -m "feat: add join page for participant B

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 対話画面のマルチデバイス対応

**What:** 対話画面にポーリング追加、マルチモード時の交代ボタン削除

**Where:**
- Modify: `src/app/session/[id]/page.tsx`
- Modify: `src/components/chat-view.tsx`

**How:** session.mode === 'multi' ならポーリング開始、交代ボタン非表示。speaker固定（AデバイスはAだけ、BデバイスはBだけ）。

**Why:** マルチデバイスでのリアルタイム対話体験

**Verify:** ブラウザ2タブで確認

---

**Step 1: ChatViewにmodeプロップ追加**

mode='multi'のとき:
- 交代ボタン非表示
- speaker固定（propsで渡す）

**Step 2: セッションページでポーリング**

mode='multi'のとき:
- useEffect内でstartPolling()、cleanup時にstopPolling()
- AI応答はどちらかのデバイスが送信した時にトリガー（ai-respond APIは既存）

**Step 3: Bさんのspeaker判定**

joinSession時にlocalStorageに `session:{id}:speaker = 'B'` を保存。
Aさんは作成時に `session:{id}:speaker = 'A'` を保存。
対話画面マウント時にlocalStorageからspeakerを読み取る。

**Step 4: addMessageのspeaker固定**

multiモード時、ストアのaddMessageでcurrentSpeakerではなくlocalStorageのspeakerを使う。

**Step 5: Commit**

```bash
git add src/app/session/[id]/page.tsx src/components/chat-view.tsx src/store/session-store.ts
git commit -m "feat: add polling and fixed speaker for multi-device chat

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 最終整理・デプロイ

**What:** テスト全パス確認、ビルド確認、デプロイ

**Where:**
- Modify: `CLAUDE.md`（マルチデバイス情報追記）

**How:** 全テスト実行、ビルド確認、Vercelデプロイ。

**Why:** 本番反映

**Verify:** `npm run test:run` 全パス、`npm run build` 成功、本番で2タブ動作確認

---

**Step 1: 全テスト実行**

```bash
npm run test:run
```

**Step 2: ビルド確認**

```bash
npm run build
```

**Step 3: CLAUDE.md更新**

マルチデバイス対応情報を追記。

**Step 4: Commit & Deploy**

```bash
git add -A
git commit -m "feat: Phase 4 multi-device support complete

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
npx vercel --prod
git push origin main
```

---

## タスク依存関係

```
Task 1 (型拡張)
  ├── Task 2 (create API更新)
  │     └── Task 3 (join/poll API)
  │           └── Task 4 (Zustandストア)
  │                 ├── Task 5 (設定画面モード選択)
  │                 ├── Task 6 (待機画面)
  │                 ├── Task 7 (参加画面)
  │                 └── Task 8 (対話画面マルチ対応)
  └── Task 9 (最終整理) ← 全タスク完了後
```
