import Link from 'next/link'

const steps = [
  {
    number: 1,
    title: 'セッションを作成',
    items: [
      'ホーム画面の「仲裁を始める」をタップ',
      '当事者2人の名前を入力（ニックネームOK）',
      'カテゴリを選択（任意）',
      '「1台で使う」か「別々のデバイスで使う」を選択',
    ],
  },
  {
    number: 2,
    title: 'AIと対話',
    items: [
      'AIが司会者として質問します',
      '質問に答えてください（テキスト入力 or マイクボタンで音声入力）',
      '1台モード: 「交代する」ボタンで相手にデバイスを渡す',
      'マルチデバイスモード: QRコード/リンクで相手を招待。各自のスマホから参加',
    ],
  },
  {
    number: 3,
    title: '判定を受ける',
    items: [
      '十分に対話したら「判定に進む」をタップ',
      'AIが論点ごとに判定し、解決策を提案します',
    ],
  },
  {
    number: 4,
    title: '結果を共有',
    items: [
      '判定結果をLINEやメッセージで共有できます',
      '「議論を再開して再判定する」で何度でもやり直せます',
    ],
  },
]

const faqs = [
  {
    q: '無料で使えますか？',
    a: 'はい、ログインなしでも無料で使えます。ログインするとターン数が増えるなどの特典があります。',
  },
  {
    q: 'AIの判定には法的効力がありますか？',
    a: 'いいえ。AIの判定は参考意見です。法的な拘束力はありません。',
  },
  {
    q: '会話内容は保存されますか？',
    a: 'セッションデータは24時間（ログインユーザーは30日間）で自動削除されます。詳しくはプライバシーポリシーをご覧ください。',
  },
  {
    q: 'LINEやInstagramからログインできません',
    a: 'アプリ内ブラウザではGoogleログインが利用できません。SafariやChromeで直接URLを開いてください。',
  },
  {
    q: 'マルチデバイスモードとは？',
    a: '2人が別々のスマホから同じセッションに参加できる機能です。QRコードまたはリンクで招待します。',
  },
  {
    q: '音声入力がうまく動きません',
    a: 'ブラウザのマイク許可を確認してください。Chrome/Safariを推奨しています。',
  },
  {
    q: 'ターン数の上限に達しました',
    a: 'ゲストは10回、ログインユーザーは20回が上限です。上限に達しても「判定に進む」は可能です。',
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-full flex-col items-center font-sans">
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-950">
        <div className="mx-auto max-w-2xl px-6 py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            使い方ガイド
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

        <div className="space-y-10 leading-relaxed text-zinc-700 dark:text-zinc-300">
          {/* JudgeMateとは */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              JudgeMateとは
            </h2>
            <p>
              友人・カップル・夫婦間の喧嘩をAIが公平に仲裁するアプリです。
              両者の意見を聞き、論点ごとに判定し、解決策を提案します。
            </p>
          </section>

          {/* 使い方 */}
          <section>
            <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              使い方
            </h2>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {step.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 音声機能について */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              音声機能について
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>テキスト入力欄のマイクボタンで音声入力できます</li>
              <li>
                マルチデバイスモードでは「音声で話す」ボタンでAIとリアルタイム音声対話も可能です
              </li>
            </ul>
          </section>

          {/* アカウントについて */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              アカウントについて
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-2 pr-4 text-left font-bold text-zinc-900 dark:text-zinc-100" />
                    <th className="py-2 px-4 text-left font-bold text-zinc-900 dark:text-zinc-100">
                      ゲスト
                    </th>
                    <th className="py-2 pl-4 text-left font-bold text-zinc-900 dark:text-zinc-100">
                      ログイン（無料）
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                      ターン数
                    </td>
                    <td className="py-2 px-4">10回/セッション</td>
                    <td className="py-2 pl-4">20回/セッション</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                      履歴保存
                    </td>
                    <td className="py-2 px-4">端末のみ</td>
                    <td className="py-2 pl-4">クラウド（30日間）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* よくある質問 */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              よくある質問（FAQ）
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <h3 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                    Q: {faq.q}
                  </h3>
                  <p className="text-sm">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom link */}
        <div className="mt-10 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            &larr; ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
