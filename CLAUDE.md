# CLAUDE.MD - Judiciary App

## プロジェクト概要
判事AIアプリ - 友人・カップル・夫婦間の喧嘩を仲裁するAIアプリケーション。
AIが司会者として両者に質問し、論点ごとに妥当性を判定し、解決策を提案する。

## 親CLAUDE.MDの継承
このプロジェクトは `/Users/koshiroshiga/Documents/claude/CLAUDE.md` のルールを継承する。

## 技術スタック
- **Frontend**: Next.js 16.2 (App Router) + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **LLM**: OpenAI GPT-5.4 mini (JSON mode)
- **Storage**: Vercel KV (session + share data)
- **Testing**: Vitest + React Testing Library
- **Deploy**: Vercel

## ディレクトリ構造
```
src/
├── app/           # Next.js App Router pages & API routes
│   ├── api/       # API endpoints
│   │   ├── session/   # Session CRUD + ai-respond
│   │   ├── judge/     # Judgment execution
│   │   └── share/     # Share link generation & retrieval
│   ├── session/   # Session pages (new, [id], [id]/result)
│   └── share/     # Public share report page
├── components/    # React components
├── lib/           # Business logic
│   ├── llm/       # LLM abstraction (JudgeClient, prompts)
│   ├── storage.ts # Vercel KV CRUD
│   ├── session-machine.ts  # State machine
│   ├── validation.ts       # Input validation
│   └── api-error.ts        # Unified error responses
├── store/         # Zustand stores
└── types/         # TypeScript type definitions
```

## 開発コマンド
```bash
npm run dev        # 開発サーバー (localhost:3000)
npm run build      # プロダクションビルド
npm run test       # Vitest (watch mode)
npm run test:run   # Vitest (single run)
```

## 環境変数
```
OPENAI_API_KEY=       # OpenAI API key (required)
KV_REST_API_URL=      # Vercel KV URL
KV_REST_API_TOKEN=    # Vercel KV token
```

## プロジェクト固有ルール
- セッション状態マシン: `gathering → ready_for_judge → judging → judged`
- LLM呼び出しはすべて `src/lib/llm/` 経由（直接OpenAI SDKを使わない）
- APIエラーは `src/lib/api-error.ts` の統一形式で返す
- 入力は必ず `validation.ts` でバリデーション + サニタイズしてから使う
- TDDで開発する（テスト先行）
