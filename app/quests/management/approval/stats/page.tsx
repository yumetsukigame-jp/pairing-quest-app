"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function ApprovalStatsPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // 🔥 期間フィルター
  const [filter, setFilter] = useState<"all" | "thisMonth" | "lastMonth">("all");

  const fetchStats = async () => {
    const snap = await getDocs(collection(db, "shippingHistory"));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 先月の計算
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const countMap: any = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      const name = data.name;

      const requestedAt = data.requestedAt?.toDate
        ? data.requestedAt.toDate()
        : null;

      if (!requestedAt) return;

      // 🔥 フィルター適用
      if (filter === "thisMonth") {
        if (
          requestedAt.getMonth() !== currentMonth ||
          requestedAt.getFullYear() !== currentYear
        ) {
          return;
        }
      }

      if (filter === "lastMonth") {
        if (
          requestedAt.getMonth() !== lastMonth ||
          requestedAt.getFullYear() !== lastMonthYear
        ) {
          return;
        }
      }

      // カウント
      if (!countMap[name]) {
        countMap[name] = 0;
      }
      countMap[name] += 1;
    });

    setStats(countMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [filter]); // ← フィルター変更時に再集計

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  const entries = Object.entries(stats);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">承認済み報酬の集計</h1>

      {/* 🔥 期間フィルター */}
      <div className="flex gap-3 justify-center mb-4">
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
          onClick={() => setFilter("all")}
        >
          全期間
        </button>

        <button
          className={`px-4 py-2 rounded-lg ${
            filter === "thisMonth"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
          onClick={() => setFilter("thisMonth")}
        >
          今月
        </button>

        <button
          className={`px-4 py-2 rounded-lg ${
            filter === "lastMonth"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
          onClick={() => setFilter("lastMonth")}
        >
          先月
        </button>
      </div>

      {entries.length === 0 && (
        <p className="text-center text-slate-500">該当する承認履歴がありません。</p>
      )}

      <div className="space-y-4">
        {entries.map(([name, count]) => (
          <div
            key={name}
            className="p-4 border rounded-xl bg-white"
          >
            <p className="font-semibold">{name}</p>
            <p className="text-slate-600">承認数：{count} 件</p>
          </div>
        ))}
      </div>
    </div>
  );
}
