"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

export default function QuestListPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 フィルター
  const [statusTab, setStatusTab] = useState("pending"); // pending / success / failed / all
  const [sortType, setSortType] = useState("deadline"); // deadline / points

  // 実績
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    rate: 0,
  });

  useEffect(() => {
    const fetchQuests = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const questsRef = collection(db, "quests");

      // 自分が executor のクエスト
      const q1 = query(
        questsRef,
        where("executor", "==", user.uid)
      );
      const snap1 = await getDocs(q1);

      // 家族全体クエスト
      const q2 = query(
        questsRef,
        where("targetPair", "==", "all")
      );
      const snap2 = await getDocs(q2);

      const list = [
        ...snap1.docs.map((d) => ({ id: d.id, ...d.data(), isMine: true })),
        ...snap2.docs.map((d) => ({ id: d.id, ...d.data(), isMine: false })),
      ];

      // 実績計算
      const total = snap1.docs.length;
      const success = snap1.docs.filter((d) => d.data().status === "success").length;
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;
      setStats({ total, success, rate });

      setQuests(list);
      setLoading(false);
    };

    fetchQuests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  // 🔥 ステータスフィルター
  const filtered = quests.filter((q) => {
    if (statusTab === "all") return true;
    return q.status === statusTab;
  });

  // 🔥 ソート
  const sorted = [...filtered].sort((a, b) => {
    if (sortType === "deadline") {
      const da = a.deadline ? a.deadline.toDate() : null;
      const db = b.deadline ? b.deadline.toDate() : null;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    }

    if (sortType === "points") {
      return b.pointsSuccess - a.pointsSuccess;
    }

    return 0;
  });

  // 🔥 セクション分割
  const myQuests = sorted.filter((q) => q.isMine);
  const familyQuests = sorted.filter((q) => !q.isMine);
  const dailyQuests = sorted.filter((q) => q.questType === "daily");

  const renderQuest = (quest: any) => {
    const deadline = quest.deadline ? quest.deadline.toDate() : null;
    const deadlineStr = deadline
      ? `${deadline.getMonth() + 1}/${deadline.getDate()} ${deadline.getHours()}:${String(
          deadline.getMinutes()
        ).padStart(2, "0")}`
      : "なし";

    return (
      <Link
        key={quest.id}
        href={`/quests/${quest.id}`}
        className="flex items-center gap-4 p-4 border rounded-xl hover:bg-slate-50 transition"
      >
        {quest.icon ? (
          <Image
            src={quest.icon}
            alt="icon"
            width={60}
            height={60}
            className="rounded-lg object-contain"
          />
        ) : (
          <div className="w-[60px] h-[60px] bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
            No Icon
          </div>
        )}

        <div className="flex-1">
          <p className="font-semibold">{quest.title}</p>
          <p className="text-sm text-slate-500">期限：{deadlineStr}</p>
          <p className="text-sm text-slate-500">
            {quest.questType === "daily" ? "デイリー" : "通常"} / {quest.status}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-center">クエスト一覧</h1>

      {/* 🔥 実績表示 */}
      <section className="p-4 border rounded-xl bg-slate-50">
        <h2 className="text-lg font-semibold mb-2">あなたの実績</h2>
        <p>受注クエスト：{stats.total}件</p>
        <p>達成：{stats.success}件</p>
        <p>達成率：{stats.rate}%</p>
      </section>

      {/* 🔥 ステータスタブ */}
      <div className="flex gap-2">
        {["pending", "success", "failed", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusTab(s)}
            className={`px-3 py-1 rounded ${
              statusTab === s ? "bg-indigo-600 text-white" : "bg-slate-200"
            }`}
          >
            {s === "pending" && "進行中"}
            {s === "success" && "達成"}
            {s === "failed" && "不達成"}
            {s === "all" && "すべて"}
          </button>
        ))}
      </div>

      {/* 🔥 ソート切替 */}
      <div className="flex gap-2 items-center">
        <span className="text-sm">並び替え：</span>
        <select
          className="border p-1 rounded"
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
          <option value="deadline">期限が近い順</option>
          <option value="points">ポイントが高い順</option>
        </select>
      </div>

      {/* 🔥 デイリークエスト */}
      <section>
        <h2 className="text-xl font-semibold mb-3">デイリークエスト</h2>

        {dailyQuests.length === 0 ? (
          <p className="text-slate-500">デイリークエストはありません。</p>
        ) : (
          <div className="space-y-3">
            {dailyQuests.map((q) => renderQuest(q))}
          </div>
        )}
      </section>

      {/* 🔥 自分のクエスト */}
      <section>
        <h2 className="text-xl font-semibold mb-3">あなたのクエスト</h2>

        {myQuests.length === 0 ? (
          <p className="text-slate-500">現在、あなたのクエストはありません。</p>
        ) : (
          <div className="space-y-3">
            {myQuests.map((q) => renderQuest(q))}
          </div>
        )}
      </section>

      {/* 🔥 家族全体クエスト */}
      <section>
        <h2 className="text-xl font-semibold mb-3">家族全体のクエスト</h2>

        {familyQuests.length === 0 ? (
          <p className="text-slate-500">現在、家族全体のクエストはありません。</p>
        ) : (
          <div className="space-y-3">
            {familyQuests.map((q) => renderQuest(q))}
          </div>
        )}
      </section>
    </div>
  );
}
