# Judiciary App - 判事AI ⚖️

友人・カップル・夫婦間の喧嘩を公平に仲裁するAIアプリケーション。

## 機能

- AIが司会者として質問をコントロールし、発言量の偏りを防ぐ
- 論点ごとに「どちらの主張が妥当か」を理由付きで判定
- 具体的な解決策を提案
- 判定結果をLINE・メッセージ等で共有

## セットアップ

```bash
# インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して API キーを設定

# 開発サーバー起動
npm run dev
```

## 環境変数

| 変数 | 説明 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API キー（必須） |
| `KV_REST_API_URL` | Vercel KV URL |
| `KV_REST_API_TOKEN` | Vercel KV トークン |

## テスト

```bash
npm run test       # watch mode
npm run test:run   # single run
```

## 技術スタック

- Next.js 16.2 (App Router) + TypeScript
- Tailwind CSS
- Zustand (状態管理)
- Vercel KV (データストア)
- OpenAI GPT-5.4 mini (AI判定)
- Vitest (テスト)
