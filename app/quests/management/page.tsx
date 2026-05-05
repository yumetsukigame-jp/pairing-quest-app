"use client";

import Link from "next/link";

export default function ManagementTopPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">

        <h1 className="text-2xl font-bold text-center mb-4">
          クエスト管理メニュー
        </h1>

        {/* クエスト一覧 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">クエスト一覧</h2>
            <p className="text-sm text-slate-500">登録済みのクエストを確認・編集できます</p>
          </div>
          <Link
            href="/quests/management/quests"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* クエスト作成 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">クエストを作成</h2>
            <p className="text-sm text-slate-500">新しいクエストを追加します</p>
          </div>
          <Link
            href="/quests/management/quests/add"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* ペア管理 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">ペア管理</h2>
            <p className="text-sm text-slate-500">ペア申請・承認を行います</p>
          </div>
          <Link
            href="/quests/management/users"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* 報酬管理 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">報酬管理</h2>
            <p className="text-sm text-slate-500">固定・可変報酬を管理します</p>
          </div>
          <Link
            href="/quests/management/rewards"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* 承認管理 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">承認管理</h2>
            <p className="text-sm text-slate-500">報酬申請の承認を行います</p>
          </div>
          <Link
            href="/quests/management/approval"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* 承認集計 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">承認集計</h2>
            <p className="text-sm text-slate-500">承認数を期間別に集計します</p>
          </div>
          <Link
            href="/quests/management/approval/stats"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* トップへ戻る */}
        <div className="text-center mt-8 mb-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-slate-200 text-slate-800 rounded-xl text-lg shadow hover:bg-slate-300 transition"
          >
            トップへ戻る
          </Link>
        </div>

      </main>
    </div>
  );
}
