"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";

export default function QuestListPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusTab, setStatusTab] = useState("pending");
  const [sortType, setSortType] = useState("deadline");

  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    rate: 0,
  });

  const safeToDate = (value: any) => {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    return new Date(value);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const pairQuery = query(
        collection(db, "pairs"),
        where("members", "array-contains", user.uid)
      );
      const pairSnap = await getDocs(pairQuery);

      const myPairIds = pairSnap.docs.map((d) => d.id);

      const questsRef = collection(db, "quests");
      const snap = await getDocs(questsRef);

      const allQuests = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // 🔥 自分が作ったクエスト + createdBy が無い古いクエストも除外
      const list = allQuests.filter((q) => {
        const isTarget =
          q.targetPair === "all" || myPairIds.includes(q.targetPair);

        const isNotMine =
          q.createdBy && q.createdBy !== user.uid;

        return isTarget && isNotMine;
      });

      const total = list.length;
      const success = list.filter((q) => q.status === "success").length;
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;

      setStats({ total, success, rate });
      setQuests(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  const filtered = quests.filter((q) => {
    if (statusTab === "all") return true;
    return q.status === statusTab;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = safeToDate(a.deadline);
    const db = safeToDate(b.deadline);

    if (sortType === "deadline") {
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    }

    if (sortType === "points") {
      return b.point - a.point;
    }

    return 0;
  });

  const renderQuest = (quest: any) => {
    const deadline = safeToDate(quest.deadline);

    const deadlineStr = deadline
      ? `${deadline.getMonth() + 1}/${deadline.getDate()}`
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
          <p className="text-sm text-slate-500">{quest.status}</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-center">クエスト一覧</h1>

      <section className="p-4 border rounded-xl bg-slate-50">
        <h2 className="text-lg font-semibold mb-2">あなたの実績</h2>
        <p>受注クエスト：{stats.total}件</p>
        <p>達成：{stats.success}件</p>
        <p>達成率：{stats.rate}%</p>
      </section>

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

      <section>
        <h2 className="text-xl font-semibold mb-3">クエスト</h2>

        {sorted.length === 0 ? (
          <p className="text-slate-500">クエストはありません。</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((q) => renderQuest(q))}
          </div>
        )}
      </section>
    </div>
  );
}
