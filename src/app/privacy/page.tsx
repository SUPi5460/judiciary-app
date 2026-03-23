import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-full flex-col items-center font-sans">
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950">
        <div className="mx-auto max-w-2xl px-6 py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            プライバシーポリシー
          </h1>
          <p className="mt-2 text-sm text-indigo-100/70">JudgeMate</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          &larr; ホームに戻る
        </Link>

        <div className="space-y-8 leading-relaxed text-zinc-700 dark:text-zinc-300">
          {/* 運営者 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              運営者について
            </h2>
            <p>
              本アプリ「JudgeMate」は個人開発者により運営されています。
            </p>
          </section>

          {/* 収集する情報 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              収集する情報
            </h2>
            <p className="mb-2">
              本サービスでは、仲裁セッションの提供に必要な以下の情報を収集します。
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>セッション中の対話内容（テキスト・音声テキスト化データ）</li>
              <li>カテゴリ選択</li>
              <li>当事者名（ニックネーム可）</li>
            </ul>
          </section>

          {/* 収集しない情報 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              収集しない情報
            </h2>
            <p className="mb-2">
              本サービスはユーザー認証を行わないため、以下の情報は収集しません。
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>本名</li>
              <li>メールアドレス</li>
              <li>電話番号</li>
              <li>位置情報</li>
            </ul>
          </section>

          {/* 利用目的 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              利用目的
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>AI仲裁サービスの提供</li>
              <li>セッション結果の共有リンク生成</li>
            </ul>
          </section>

          {/* データ保持 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              データの保持期間
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>セッションデータ: 24時間で自動削除</li>
              <li>共有レポート: 7日間で自動削除</li>
            </ul>
          </section>

          {/* 第三者提供 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              第三者への情報提供
            </h2>
            <p>
              AI判定のため、対話データをOpenAI
              APIに送信します。それ以外の第三者への情報提供は行いません。
            </p>
          </section>

          {/* Cookie */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Cookie・ローカルストレージについて
            </h2>
            <p>
              本サービスではCookieを使用しません。セッション履歴の保存にはlocalStorageを使用しており、データはご利用端末内にのみ保存されます。
            </p>
          </section>

          {/* お問い合わせ */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              お問い合わせ
            </h2>
            <p>
              本ポリシーに関するお問い合わせは、GitHubリポジトリのIssueにて受け付けています。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
