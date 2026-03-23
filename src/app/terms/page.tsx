import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="flex min-h-full flex-col items-center font-sans">
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950">
        <div className="mx-auto max-w-2xl px-6 py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            利用規約
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
          {/* サービス内容 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              サービス内容
            </h2>
            <p>
              JudgeMateは、AIによる喧嘩・争いの仲裁支援サービスです。当事者双方の主張をAIが分析し、公平な判定を提供します。
            </p>
          </section>

          {/* 免責事項 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              免責事項
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                AIの判定は参考意見であり、法的拘束力はありません。
              </li>
              <li>
                判定結果に基づく行動について、運営者は一切の責任を負いません。
              </li>
              <li>
                サービスの中断・停止について、事前通知なく行う場合があります。
              </li>
            </ul>
          </section>

          {/* 禁止事項 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              禁止事項
            </h2>
            <p className="mb-2">以下の行為を禁止します。</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>違法行為に関する仲裁の依頼</li>
              <li>サービスへの不正アクセス</li>
              <li>大量のリクエストによるサービスへの妨害</li>
            </ul>
          </section>

          {/* 料金 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              料金について
            </h2>
            <p>
              本サービスは現在無料で提供しています。将来的に料金体系を変更する可能性があります。
            </p>
          </section>

          {/* 変更 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              規約の変更
            </h2>
            <p>
              本利用規約は、予告なく変更する場合があります。変更後の利用規約は、本ページに掲載した時点で効力を生じるものとします。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
