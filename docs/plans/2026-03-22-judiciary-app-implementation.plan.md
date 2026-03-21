# Judiciary App MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** テキスト入力で動作するWeb版の判事AIアプリMVPを完成させる

**Architecture:** Next.js 16 App Router + API Routes でフルスタック構成。Zustandで状態管理、Vercel KVでセッション永続化。GPT-5.4 mini で判定処理。テキスト入力のみ（音声は後続フェーズ）。

**Tech Stack:** Next.js 16.2, TypeScript, Tailwind CSS, Zustand, Vercel KV, OpenAI API (GPT-5.4 mini), Vitest, React Testing Library

---

## Task 1: プロジェクトスキャフォールディング

**What:** Next.js 16 プロジェクトを作成し、Vitest・Zustand・Vercel KV等の依存関係をセットアップ

**Where:**
- Create: プロジェクトルート全体
- Create: `vitest.config.mts`
- Create: `.env.local`（テンプレート）
- Modify: `package.json`

**How:** `create-next-app` でApp Router + TypeScript + Tailwind + Turbopack構成を生成。追加パッケージをインストール。

**Why:** 全タスクの基盤。ここが壊れると全部止まる。

**Verify:** `npm run dev` でlocalhost起動、`npm test` でVitest実行（0 tests）

---

**Step 1: Next.jsプロジェクト作成**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --turbopack --import-alias "@/*" --use-npm
```

既にREADME.md等があるので上書き確認に注意。

**Step 2: 追加パッケージインストール**

```bash
npm install zustand openai @vercel/kv uuid
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths @types/uuid
```

**Step 3: Vitest設定ファイル作成**

`vitest.config.mts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

`vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

**Step 4: package.json にtestスクリプト追加**

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

**Step 5: .env.example 作成**

```
OPENAI_API_KEY=your-openai-api-key
KV_REST_API_URL=your-vercel-kv-url
KV_REST_API_TOKEN=your-vercel-kv-token
```

**Step 6: 動作確認**

```bash
npm run dev    # localhost:3000 確認
npm run test:run   # 0 tests, no errors
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 project with Vitest, Zustand, Vercel KV"
```

---

## Task 2: 型定義とセッション状態マシン

**What:** アプリ全体で使う型定義（Session, Message, Judgment）とセッション状態マシンを実装

**Where:**
- Create: `src/types/session.ts`
- Create: `src/types/message.ts`
- Create: `src/types/judgment.ts`
- Create: `src/lib/session-machine.ts`
- Create: `src/lib/__tests__/session-machine.test.ts`

**How:** TypeScript interfaceで型定義。状態マシンは純粋関数で実装（gathering → ready_for_judge → judging → judged）

**Why:** 全レイヤーで共有する型と、セッション進行の正しさを保証する状態マシンはアプリの基盤

**Verify:** `npm run test:run -- src/lib/__tests__/session-machine.test.ts`

---

**Step 1: 型定義のテストを書く（型チェック）**

`src/types/session.ts`:
```typescript
export type SessionStatus = 'gathering' | 'ready_for_judge' | 'judging' | 'judged'
export type Category = 'friends' | 'couple' | 'married' | 'other'
export type Speaker = 'A' | 'B'

export interface Session {
  id: string
  status: SessionStatus
  category: Category | null
  nameA: string
  nameB: string
  messages: Message[]
  summary: string | null
  judgment: Judgment | null
  createdAt: string
  updatedAt: string
}
```

`src/types/message.ts`:
```typescript
import { Speaker } from './session'

export interface Message {
  id: string
  speaker: Speaker | 'AI'
  content: string
  timestamp: string
}
```

`src/types/judgment.ts`:
```typescript
export interface IssueJudgment {
  issue: string
  summaryA: string
  summaryB: string
  verdict: 'A' | 'B'
  reason: string
}

export interface Judgment {
  issues: IssueJudgment[]
  resolution: string
  createdAt: string
}
```

**Step 2: 状態マシンのテストを書く**

`src/lib/__tests__/session-machine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { transition, canTransition } from '../session-machine'

describe('session-machine', () => {
  it('gathering → ready_for_judge is valid', () => {
    expect(transition('gathering', 'finalize')).toBe('ready_for_judge')
  })

  it('ready_for_judge → judging is valid', () => {
    expect(transition('ready_for_judge', 'start_judge')).toBe('judging')
  })

  it('judging → judged is valid', () => {
    expect(transition('judging', 'complete_judge')).toBe('judged')
  })

  it('gathering → judging is invalid', () => {
    expect(() => transition('gathering', 'start_judge')).toThrow()
  })

  it('judged → gathering is invalid', () => {
    expect(() => transition('judged', 'finalize')).toThrow()
  })

  it('canTransition returns correct boolean', () => {
    expect(canTransition('gathering', 'finalize')).toBe(true)
    expect(canTransition('gathering', 'start_judge')).toBe(false)
  })
})
```

**Step 3: テスト実行 → 失敗確認**

```bash
npm run test:run -- src/lib/__tests__/session-machine.test.ts
```

Expected: FAIL (module not found)

**Step 4: 状態マシン実装**

`src/lib/session-machine.ts`:
```typescript
import { SessionStatus } from '@/types/session'

export type SessionAction = 'finalize' | 'start_judge' | 'complete_judge'

const transitions: Record<SessionStatus, Partial<Record<SessionAction, SessionStatus>>> = {
  gathering: { finalize: 'ready_for_judge' },
  ready_for_judge: { start_judge: 'judging' },
  judging: { complete_judge: 'judged' },
  judged: {},
}

export function transition(current: SessionStatus, action: SessionAction): SessionStatus {
  const next = transitions[current]?.[action]
  if (!next) {
    throw new Error(`Invalid transition: ${current} + ${action}`)
  }
  return next
}

export function canTransition(current: SessionStatus, action: SessionAction): boolean {
  return transitions[current]?.[action] !== undefined
}
```

**Step 5: テスト実行 → 成功確認**

```bash
npm run test:run -- src/lib/__tests__/session-machine.test.ts
```

Expected: 6 tests PASS

**Step 6: Commit**

```bash
git add src/types/ src/lib/
git commit -m "feat: add type definitions and session state machine with tests"
```

---

## Task 3: KVストレージレイヤー

**What:** Vercel KVへのCRUD操作を抽象化したストレージレイヤーを実装

**Where:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/__tests__/storage.test.ts`

**How:** Vercel KV の `@vercel/kv` をラップ。テストではモック使用。キーは `session:{id}` と `share:{id}` のプレフィックス。

**Why:** API RoutesからKVへの直接依存を避け、テスト容易性とストレージ切替の柔軟性を確保

**Verify:** `npm run test:run -- src/lib/__tests__/storage.test.ts`

---

**Step 1: テストを書く**

`src/lib/__tests__/storage.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

import { kv } from '@vercel/kv'
import { getSession, saveSession, deleteSession } from '../storage'

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSession fetches with correct key', async () => {
    const mockSession = { id: 'abc', status: 'gathering' }
    vi.mocked(kv.get).mockResolvedValue(mockSession)

    const result = await getSession('abc')
    expect(kv.get).toHaveBeenCalledWith('session:abc')
    expect(result).toEqual(mockSession)
  })

  it('saveSession stores with correct key and TTL', async () => {
    const session = { id: 'abc', status: 'gathering' } as any
    await saveSession(session)
    expect(kv.set).toHaveBeenCalledWith('session:abc', session, { ex: 86400 })
  })

  it('deleteSession removes with correct key', async () => {
    await deleteSession('abc')
    expect(kv.del).toHaveBeenCalledWith('session:abc')
  })
})
```

**Step 2: テスト実行 → 失敗確認**

**Step 3: ストレージレイヤー実装**

`src/lib/storage.ts`:
```typescript
import { kv } from '@vercel/kv'
import { Session } from '@/types/session'
import { Judgment } from '@/types/judgment'

const SESSION_TTL = 86400 // 24h
const SHARE_TTL = 604800  // 7 days

export async function getSession(id: string): Promise<Session | null> {
  return kv.get<Session>(`session:${id}`)
}

export async function saveSession(session: Session): Promise<void> {
  await kv.set(`session:${session.id}`, session, { ex: SESSION_TTL })
}

export async function deleteSession(id: string): Promise<void> {
  await kv.del(`session:${id}`)
}

export async function getShareReport(id: string): Promise<Session | null> {
  return kv.get<Session>(`share:${id}`)
}

export async function saveShareReport(id: string, session: Session): Promise<void> {
  await kv.set(`share:${id}`, session, { ex: SHARE_TTL })
}
```

**Step 4: テスト実行 → 成功確認**

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/__tests__/storage.test.ts
git commit -m "feat: add KV storage layer with tests"
```

---

## Task 4: LLM抽象化レイヤー（JudgeClient）

**What:** GPT-5.4 miniを使った判定処理の抽象化レイヤーとプロンプトテンプレートを実装

**Where:**
- Create: `src/lib/llm/judge-client.ts`
- Create: `src/lib/llm/prompts.ts`
- Create: `src/lib/llm/types.ts`
- Create: `src/lib/llm/__tests__/judge-client.test.ts`
- Create: `src/lib/llm/__tests__/prompts.test.ts`

**How:** OpenAI SDK でGPT-5.4 miniを呼び出し。JSON mode で構造化レスポンス取得。プロンプトはテンプレート関数として実装。

**Why:** 判定ロジックをAPI Routeから分離。プロンプトの単体テストが可能に。将来のモデル切替にも対応。

**Verify:** `npm run test:run -- src/lib/llm/__tests__/`

---

**Step 1: プロンプトテンプレートのテスト**

`src/lib/llm/__tests__/prompts.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildJudgmentPrompt, buildSummaryPrompt } from '../prompts'

describe('prompts', () => {
  it('buildSystemPrompt includes category', () => {
    const prompt = buildSystemPrompt('couple', '太郎', '花子')
    expect(prompt).toContain('カップル')
    expect(prompt).toContain('太郎')
    expect(prompt).toContain('花子')
  })

  it('buildJudgmentPrompt includes summary and messages', () => {
    const prompt = buildJudgmentPrompt({
      category: 'married',
      nameA: '太郎',
      nameB: '花子',
      summary: '家事分担について争い',
      recentMessages: '太郎: 私は毎日皿洗いしている',
    })
    expect(prompt).toContain('家事分担について争い')
    expect(prompt).toContain('毎日皿洗い')
  })

  it('buildSummaryPrompt includes messages', () => {
    const prompt = buildSummaryPrompt('太郎: テスト\n花子: テスト')
    expect(prompt).toContain('太郎: テスト')
  })
})
```

**Step 2: テスト実行 → 失敗確認**

**Step 3: プロンプトテンプレート実装**

`src/lib/llm/prompts.ts`:
```typescript
import { Category } from '@/types/session'

const CATEGORY_MAP: Record<Category, string> = {
  friends: '友人',
  couple: 'カップル',
  married: '夫婦',
  other: 'その他',
}

export function buildSystemPrompt(category: Category | string, nameA: string, nameB: string): string {
  const categoryLabel = CATEGORY_MAP[category as Category] ?? category
  return `あなたは「判事AI」です。${categoryLabel}間の争いを公平に仲裁する裁判官として振る舞います。

【性格】
- 冷静かつ公平、どちらの味方もしない
- 威厳がありつつも親しみやすい口調
- 感情的な発言も受け止めるが、論点は論理的に整理する

【行動原則】
- 必ず${nameA}さんと${nameB}さんに均等に発言機会を与える
- 曖昧な主張には具体的な質問で掘り下げる
- 感情と事実を分離して整理する
- 判定は必ず理由を添える

【進行ルール】
1. まず争点の概要を${nameA}さんに聞く
2. 同じ争点について${nameB}さんの見解を聞く
3. 食い違いがある点について追加質問する
4. 十分な情報が得られたら「判定に必要な情報が揃いました」と宣言する

【注意】
- 一方が長く話しすぎたら適切に遮り、もう一方にも発言を促す
- 感情的な発言は受け止めつつ、事実確認に誘導する`
}

export function buildJudgmentPrompt(params: {
  category: string
  nameA: string
  nameB: string
  summary: string
  recentMessages: string
}): string {
  const categoryLabel = CATEGORY_MAP[params.category as Category] ?? params.category
  return `あなたは公平な裁判官です。以下の${categoryLabel}間の争いについて判定してください。

Aさん: ${params.nameA}
Bさん: ${params.nameB}

対話サマリー:
${params.summary}

直近の発言:
${params.recentMessages}

以下のJSON形式で判定してください:
{
  "issues": [
    {
      "issue": "論点の説明",
      "summaryA": "Aさんの主張の要約",
      "summaryB": "Bさんの主張の要約",
      "verdict": "A" or "B",
      "reason": "判定理由（論理的根拠）"
    }
  ],
  "resolution": "両者が納得できる具体的な解決策"
}`
}

export function buildSummaryPrompt(messages: string): string {
  return `以下の対話内容を、論点ごとに構造化して要約してください。

対話ログ:
${messages}

出力形式（JSON）:
{
  "summary": "論点ごとの構造化要約テキスト"
}`
}
```

**Step 4: JudgeClient インターフェースとテスト**

`src/lib/llm/types.ts`:
```typescript
import { Judgment } from '@/types/judgment'

export interface JudgeClient {
  judge(params: JudgeParams): Promise<Judgment>
  summarize(messages: string): Promise<string>
}

export interface JudgeParams {
  category: string
  nameA: string
  nameB: string
  summary: string
  recentMessages: string
}
```

`src/lib/llm/__tests__/judge-client.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                issues: [{
                  issue: '家事分担',
                  summaryA: 'Aの主張',
                  summaryB: 'Bの主張',
                  verdict: 'B',
                  reason: '理由'
                }],
                resolution: '解決策'
              })
            }
          }]
        })
      }
    }
  }))
}))

import { OpenAIJudgeClient } from '../judge-client'

describe('OpenAIJudgeClient', () => {
  it('judge returns structured Judgment', async () => {
    const client = new OpenAIJudgeClient('fake-key')
    const result = await client.judge({
      category: 'married',
      nameA: '太郎',
      nameB: '花子',
      summary: 'テスト',
      recentMessages: 'テスト',
    })
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].verdict).toBe('B')
    expect(result.resolution).toBe('解決策')
  })
})
```

**Step 5: JudgeClient 実装**

`src/lib/llm/judge-client.ts`: OpenAI SDK使用、`response_format: { type: 'json_object' }` で構造化レスポンス取得

**Step 6: テスト実行 → 成功確認**

**Step 7: Commit**

```bash
git add src/lib/llm/
git commit -m "feat: add LLM judge client with prompts and tests"
```

---

## Task 5: 共通ユーティリティ（バリデーション・エラーレスポンス）

**What:** API共通のエラーレスポンス形式と入力バリデーションユーティリティを実装

**Where:**
- Create: `src/lib/api-error.ts`
- Create: `src/lib/validation.ts`
- Create: `src/lib/__tests__/validation.test.ts`

**How:** 統一エラーレスポンス形式を定義。入力バリデーション（空文字、長文制限、サニタイズ）を関数化。

**Why:** 全API Routeで一貫したエラーハンドリングと入力検証を行うため。XSS対策にも必要。

**Verify:** `npm run test:run -- src/lib/__tests__/validation.test.ts`

---

**Step 1: バリデーションのテスト**

`src/lib/__tests__/validation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { validateName, validateMessage, sanitizeInput } from '../validation'

describe('validation', () => {
  it('validateName rejects empty string', () => {
    expect(validateName('')).toEqual({ valid: false, error: '名前を入力してください' })
  })

  it('validateName rejects string over 20 chars', () => {
    expect(validateName('a'.repeat(21))).toEqual({ valid: false, error: '名前は20文字以内で入力してください' })
  })

  it('validateName accepts valid name', () => {
    expect(validateName('太郎')).toEqual({ valid: true })
  })

  it('validateMessage rejects empty string', () => {
    expect(validateMessage('')).toEqual({ valid: false, error: 'メッセージを入力してください' })
  })

  it('validateMessage rejects string over 2000 chars', () => {
    expect(validateMessage('a'.repeat(2001))).toEqual({ valid: false, error: 'メッセージは2000文字以内で入力してください' })
  })

  it('sanitizeInput strips HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello')
  })
})
```

**Step 2: テスト実行 → 失敗確認**

**Step 3: 実装**

`src/lib/validation.ts`:
```typescript
type ValidationResult = { valid: true } | { valid: false; error: string }

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) return { valid: false, error: '名前を入力してください' }
  if (trimmed.length > 20) return { valid: false, error: '名前は20文字以内で入力してください' }
  return { valid: true }
}

export function validateMessage(message: string): ValidationResult {
  const trimmed = message.trim()
  if (!trimmed) return { valid: false, error: 'メッセージを入力してください' }
  if (trimmed.length > 2000) return { valid: false, error: 'メッセージは2000文字以内で入力してください' }
  return { valid: true }
}

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}
```

`src/lib/api-error.ts`:
```typescript
import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  code: string
}

export function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code } satisfies ApiError, { status })
}

export function notFound(message = 'リソースが見つかりません') {
  return errorResponse(message, 'NOT_FOUND', 404)
}

export function badRequest(message: string) {
  return errorResponse(message, 'BAD_REQUEST', 400)
}

export function serverError(message = 'サーバーエラーが発生しました') {
  return errorResponse(message, 'INTERNAL_ERROR', 500)
}
```

**Step 4: テスト実行 → 成功確認**

**Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/api-error.ts src/lib/__tests__/validation.test.ts
git commit -m "feat: add input validation and API error utilities with tests"
```

---

## Task 6: API Routes（セッション管理）

**What:** セッションのCRUD API Routesを実装

**Where:**
- Create: `src/app/api/session/create/route.ts`
- Create: `src/app/api/session/[id]/route.ts`
- Create: `src/app/api/session/[id]/message/route.ts`
- Create: `src/app/api/session/[id]/finalize/route.ts`
- Create: `src/app/api/session/[id]/status/route.ts`
- Create: `src/app/api/session/[id]/report/route.ts`
- Create: `src/app/api/session/[id]/ai-respond/route.ts`
- Create: `src/lib/__tests__/api-handlers.test.ts`

**How:** Next.js App Router の Route Handlers。各エンドポイントは storage レイヤー・状態マシン・バリデーションを使用。エラーは `api-error.ts` の統一形式で返却。

**Why:** フロントエンドとバックエンドの境界を明確にする。

**Verify:** `npm run test:run -- src/lib/__tests__/api-handlers.test.ts`

---

**Step 1: セッション作成のテスト**

`src/lib/__tests__/api-handlers.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/storage', () => ({
  saveSession: vi.fn(),
  getSession: vi.fn(),
}))

import { saveSession, getSession } from '@/lib/storage'

describe('POST /api/session/create', () => {
  it('creates session with valid input', async () => {
    // Import handler, call with mock Request
    // Assert: saveSession called with correct Session shape
    // Assert: response contains session id
  })

  it('rejects empty nameA', async () => {
    // Assert: 400 response with validation error
  })

  it('rejects empty nameB', async () => {
    // Assert: 400 response with validation error
  })
})
```

**Step 2: テスト実行 → 失敗確認**

**Step 3: `/api/session/create` 実装**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { saveSession } from '@/lib/storage'
import { validateName } from '@/lib/validation'
import { badRequest } from '@/lib/api-error'
import { Session } from '@/types/session'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { category, nameA, nameB } = body

  const nameAResult = validateName(nameA ?? '')
  if (!nameAResult.valid) return badRequest(nameAResult.error)
  const nameBResult = validateName(nameB ?? '')
  if (!nameBResult.valid) return badRequest(nameBResult.error)

  const session: Session = {
    id: uuidv4(),
    status: 'gathering',
    category: category ?? null,
    nameA: nameA.trim(),
    nameB: nameB.trim(),
    messages: [],
    summary: null,
    judgment: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await saveSession(session)
  return NextResponse.json({ id: session.id }, { status: 201 })
}
```

**Step 4: 残りのAPIエンドポイント実装**

- `GET /api/session/[id]`: KVからセッション取得。404 if not found
- `POST /api/session/[id]/message`: バリデーション → 発言追加 → KV更新。`gathering` 状態でのみ許可
- `POST /api/session/[id]/finalize`: 状態マシンで `gathering → ready_for_judge` に遷移。メッセージ0件なら400
- `GET /api/session/[id]/status`: 現在のステータス返却
- `GET /api/session/[id]/report`: 判定結果返却（`judged` 状態のみ、それ以外は400）
- `POST /api/session/[id]/ai-respond`: 現在の対話コンテキスト → GPT-5.4 mini（司会者プロンプト）→ AI応答をメッセージ追加。OpenAI APIエラー時は `serverError()` で統一レスポンス

**Step 5: 各エンドポイントのテスト追加・実行**

テスト対象:
- 正常系（各エンドポイント）
- 存在しないセッションID → 404
- 不正な状態遷移 → 400
- 空メッセージ → 400（バリデーション）

**Step 6: Commit**

```bash
git add src/app/api/ src/lib/__tests__/api-handlers.test.ts
git commit -m "feat: add session CRUD API routes with validation and tests"
```

---

## Task 7: 判定実行・共有 API Routes

**What:** 判定実行（/api/judge）と共有リンク生成（/api/share）のAPIを実装

**Where:**
- Create: `src/app/api/judge/route.ts`
- Create: `src/app/api/share/route.ts`
- Create: `src/app/api/share/[id]/route.ts`

**How:** judge は JudgeClient を呼び出し、結果をKVに保存。share は別のUUIDでレポートを保存し、URLを返却。

**Why:** 判定と共有はコアバリュー。

**Verify:** テスト（JudgeClient モック済み）とcURLでの手動確認

---

**Step 1: 判定APIのテスト**

sessionId を受け取り、状態チェック（ready_for_judge のみ許可）→ JudgeClient呼出 → 判定結果保存 → 状態を judged に

**Step 2: 実装**

`/api/judge` POST:
```typescript
import { NextRequest } from 'next/server'
import { getSession, saveSession } from '@/lib/storage'
import { transition } from '@/lib/session-machine'
import { OpenAIJudgeClient } from '@/lib/llm/judge-client'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  const session = await getSession(sessionId)
  if (!session) return notFound('セッションが見つかりません')

  try {
    // 状態遷移: ready_for_judge → judging
    session.status = transition(session.status, 'start_judge')
    await saveSession(session)

    // サマリー生成（ローリングサマリーがなければ全メッセージから）
    const client = new OpenAIJudgeClient(process.env.OPENAI_API_KEY!)
    const messagesText = session.messages
      .map(m => `${m.speaker}: ${m.content}`)
      .join('\n')
    const summary = session.summary ?? await client.summarize(messagesText)

    // 判定実行
    const judgment = await client.judge({
      category: session.category ?? 'other',
      nameA: session.nameA,
      nameB: session.nameB,
      summary,
      recentMessages: messagesText,
    })

    // 結果保存、生メッセージ削除
    session.judgment = { ...judgment, createdAt: new Date().toISOString() }
    session.summary = summary
    session.messages = [] // 生ログ削除、サマリーのみ保持
    session.status = transition(session.status, 'complete_judge')
    session.updatedAt = new Date().toISOString()
    await saveSession(session)

    return NextResponse.json({ judgment: session.judgment })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid transition')) {
      return badRequest('この状態では判定を実行できません')
    }
    console.error('Judge API error:', error)
    return serverError('判定処理中にエラーが発生しました')
  }
}
```

**Step 3: 共有APIのテスト・実装**

`/api/share` POST: セッションIDから共有用UUIDを生成、レポートをKVに保存、共有URLを返却
`/api/share/[id]` GET: 共有レポート取得

**Step 4: テスト実行 → 成功確認**

**Step 5: Commit**

```bash
git add src/app/api/judge/ src/app/api/share/
git commit -m "feat: add judgment execution and share link API routes"
```

---

## Task 8: Zustand ストア

**What:** クライアント側の状態管理ストアを実装

**Where:**
- Create: `src/store/session-store.ts`
- Create: `src/store/__tests__/session-store.test.ts`

**How:** Zustand で セッション状態・メッセージ・現在の話者・判定結果を管理。API呼び出しはストアのアクションとして定義。

**Why:** 画面間で共有するクライアント状態を一元管理

**Verify:** `npm run test:run -- src/store/__tests__/`

---

**Step 1: ストアのテスト**

```typescript
describe('sessionStore', () => {
  it('createSession sets session data')
  it('addMessage appends to messages')
  it('switchSpeaker toggles between A and B')
  it('finalize calls API and updates status')
  it('requestJudgment calls API and stores result')
})
```

**Step 2: テスト実行 → 失敗確認**

**Step 3: ストア実装**

`src/store/session-store.ts`:
- `session`: 現在のセッション
- `currentSpeaker`: 'A' | 'B'
- `isLoading`: boolean
- アクション: `createSession()`, `addMessage()`, `switchSpeaker()`, `finalize()`, `requestJudgment()`, `generateShareLink()`
- localStorage 同期: 履歴保存用

**Step 4: テスト実行 → 成功確認**

**Step 5: Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand session store with tests"
```

---

## Task 9: ホーム画面 & セッション設定画面

**What:** ホーム画面（履歴一覧 + 開始ボタン）とセッション設定画面を実装

**Where:**
- Modify: `src/app/page.tsx`（ホーム画面）
- Create: `src/app/session/new/page.tsx`（設定画面）
- Create: `src/components/history-list.tsx`
- Create: `src/components/__tests__/history-list.test.tsx`

**How:** App Router のページコンポーネント。Tailwind CSSでスタイリング。履歴はlocalStorageから取得。

**Why:** ユーザーがアプリに入って最初に触れる画面

**Verify:** `npm run dev` でブラウザ確認 + コンポーネントテスト

---

**Step 1: HistoryList コンポーネントのテスト**

localStorage から履歴取得、リスト表示、空の場合のメッセージ表示を検証

**Step 2: コンポーネント実装**

**Step 3: ホーム画面（page.tsx）実装**

- 「仲裁を始める」ボタン → `/session/new` へ遷移
- HistoryList コンポーネント配置

**Step 4: セッション設定画面実装**

- カテゴリ選択（友人/カップル/夫婦/その他）
- 名前入力（Aさん・Bさん）
- 「仲裁を開始する」ボタン → セッション作成API呼出 → `/session/[id]` へ遷移

**Step 5: ブラウザで動作確認**

**Step 6: Commit**

```bash
git add src/app/page.tsx src/app/session/ src/components/
git commit -m "feat: add home page and session setup page"
```

---

## Task 10: 対話画面（テキスト入力）

**What:** AIとの対話画面を実装（テキスト入力モード）

**Where:**
- Create: `src/app/session/[id]/page.tsx`
- Create: `src/components/chat-view.tsx`
- Create: `src/components/message-bubble.tsx`
- Create: `src/components/speaker-indicator.tsx`
- Create: `src/components/text-input.tsx`
- Create: `src/components/__tests__/chat-view.test.tsx`

**How:** チャットUI。Zustandストアから状態取得。メッセージ送信→API Route→GPT-5.4 miniでAI応答生成→表示。話者切替ボタンで色が変わる（A=青、B=赤）。

**Why:** アプリのコア体験。ここが全体の価値を決める。

**Verify:** ブラウザで対話フロー確認 + コンポーネントテスト

---

**Step 1: ChatView コンポーネントのテスト**

メッセージ表示、送信、話者切替、判定ボタンの表示を検証

**Step 2: UIコンポーネント群を実装**

- `speaker-indicator.tsx`: 「🔵 太郎さんの番」/ 「🔴 花子さんの番」表示
- `message-bubble.tsx`: 話者ごとに色分けされた吹き出し（A=青、B=赤、AI=グレー）
- `text-input.tsx`: テキスト入力フォーム + 送信ボタン
- `chat-view.tsx`: 上記を組み合わせたチャット画面

**Step 3: 対話ページ実装**

`src/app/session/[id]/page.tsx`:
- セッションIDでデータ取得
- ChatView コンポーネント配置
- 「交代する」ボタン
- 「判定に進む」ボタン（finalize API呼出）

**Step 4: AI応答のAPI Route（既にTask 6で作成済み）**

`src/app/api/session/[id]/ai-respond/route.ts` は Task 6 で実装済み。
対話画面からの呼び出しを接続する。

**Step 5: ローリングサマリーの組み込み**

対話中、**6メッセージごと**（A3回+B3回）に自動でローリングサマリーを実行:
- `ai-respond` API内で `session.messages.length % 6 === 0` のタイミングで `JudgeClient.summarize()` を呼出
- サマリーを `session.summary` に保存
- サマリー対象のメッセージはKVから削除（直近6件のみ保持）

**Step 6: セッション時間上限の実装**

対話画面に15分タイマーを表示:
- セッション作成時の `createdAt` から15分経過で自動的に「判定に進みますか？」ダイアログ表示
- 強制終了ではなく促し（ユーザーが続行も可能）
- タイマーはクライアント側（Zustandストア）で管理

**Step 7: ブラウザで対話フロー確認**

```
設定 → 対話開始 → Aのメッセージ送信 → AI応答
→ 交代 → Bのメッセージ送信 → AI応答
→ 「判定に進む」クリック
```

**Step 6: Commit**

```bash
git add src/app/session/ src/components/ src/app/api/session/
git commit -m "feat: add chat dialogue page with text input"
```

---

## Task 11: 判定画面

**What:** 判定結果の表示画面を実装

**Where:**
- Create: `src/app/session/[id]/result/page.tsx`
- Create: `src/components/judgment-card.tsx`
- Create: `src/components/resolution-card.tsx`
- Create: `src/components/__tests__/judgment-card.test.tsx`

**How:** finalize 後に `/api/judge` を呼び出し、結果を表示。各論点をカード形式で表示。

**Why:** 仲裁の成果物。ここがアプリの最終的な価値

**Verify:** ブラウザでfinalizeから判定結果表示まで確認

---

**Step 1: JudgmentCard コンポーネントのテスト**

論点名、A/Bの主張要約、判定、理由の表示を検証

**Step 2: コンポーネント実装**

- `judgment-card.tsx`: 論点ごとのカード。判定された側をハイライト
- `resolution-card.tsx`: 総合解決策の表示

**Step 3: 判定結果ページ実装**

`src/app/session/[id]/result/page.tsx`:
- セッションIDで判定結果取得
- ローディング表示（judging中）
- JudgmentCard × N + ResolutionCard
- 「結果を共有」ボタン
- 「ホームへ」ボタン

**Step 4: ブラウザでE2Eフロー確認**

**Step 5: Commit**

```bash
git add src/app/session/[id]/result/ src/components/judgment-card.tsx src/components/resolution-card.tsx src/components/__tests__/
git commit -m "feat: add judgment result page"
```

---

## Task 12: 共有機能

**What:** 判定結果の共有リンク生成と共有レポート画面を実装

**Where:**
- Create: `src/app/share/[id]/page.tsx`
- Modify: `src/app/session/[id]/result/page.tsx`（共有ボタン接続）

**How:** 判定画面の「共有」ボタン → share API呼出 → 共有URLをクリップボードにコピー + LINE/メッセージ共有。共有レポート画面は読み取り専用。

**Why:** バイラル効果とユーザー体験の完成

**Verify:** 共有リンク生成 → 別タブで開いてレポート表示確認

---

**Step 1: 共有レポート画面実装**

`src/app/share/[id]/page.tsx`:
- share APIからレポート取得
- 判定画面と同じレイアウト（読み取り専用）
- アプリへの導線リンク
- OGP メタタグ設定（SNS共有時のプレビュー）

**Step 2: 共有ボタンの接続**

判定画面の「共有」ボタン:
- share API 呼出
- Web Share API 対応ブラウザ: ネイティブ共有シート表示
- 非対応: クリップボードにURLコピー + トースト表示

**Step 3: ブラウザで確認**

**Step 4: Commit**

```bash
git add src/app/share/ src/app/session/[id]/result/
git commit -m "feat: add share functionality with public report page"
```

---

## Task 13: CLAUDE.md更新 & 最終整理

**What:** プロジェクト固有のルールをCLAUDE.mdに追記、全テスト実行、Vercelデプロイ設定確認

**Where:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**How:** 技術スタック情報、ディレクトリ構造、開発コマンドをCLAUDE.mdに追記

**Why:** 将来のセッションで開発者（人間 or AI）が即座にキャッチアップできるように

**Verify:** `npm run test:run` 全テスト成功、`npm run build` ビルド成功

---

**Step 1: CLAUDE.md 更新**

技術スタック、ディレクトリ構造、開発コマンド、環境変数の説明を追記

**Step 2: README.md 更新**

セットアップ手順、開発方法、デプロイ方法を追記

**Step 3: 全テスト実行**

```bash
npm run test:run
```

**Step 4: ビルド確認**

```bash
npm run build
```

**Step 5: Commit & Push**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md and README.md with project details"
git push origin main
```

---

## タスク依存関係

```
Task 1 (スキャフォールド)
  ├── Task 2 (型定義・状態マシン)
  │     ├── Task 3 (KVストレージ)
  │     └── Task 4 (LLM JudgeClient)
  ├── Task 5 (バリデーション・エラー) ← Task 1のみに依存
  │
  └── Task 2 + 3 + 5 完了後 ──┐
      Task 6 (Session API Routes)
      Task 2 + 4 + 5 完了後 ──┤
      Task 7 (Judge/Share API)
      └── Task 6 + 7 完了後
          Task 8 (Zustand ストア)
          └── Task 9 (ホーム・設定画面)
              └── Task 10 (対話画面)
                  └── Task 11 (判定画面)
                      └── Task 12 (共有機能)
                          └── Task 13 (最終整理)
```

## 並列実行可能なタスク

- Task 2, 5 は Task 1 完了後に並列実行可能
- Task 3, 4 は Task 2 完了後に並列実行可能
- Task 6, 7 は依存が揃い次第に並列実行可能
- Task 9 の UIは Task 8 完了後すぐ着手可能（APIモック可）
