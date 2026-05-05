"use client";

import Link from "next/link";
import Image from "next/image";

export default function RewardCompletePage() {
  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-6">
      <Image
        src="/check.png"
        alt="完了"
        width={120}
        height={120}
        className="mx-auto"
      />

      <h1 className="text-2xl font-bold">承認依頼を受け付けました</h1>

      <p className="text-slate-600 leading-relaxed">
        ご褒美の承認が完了すると、アプリ内で反映されます。
        <br />
        承認状況は「申請履歴」から確認できます。
      </p>

      <Link
        href="/my-reward"
        className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-lg text-lg"
      >
        申請履歴を見る
      </Link>

      <div>
        <Link
          href="/"
          className="text-indigo-600 underline text-sm"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
