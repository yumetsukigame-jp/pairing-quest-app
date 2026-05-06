"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

export default function QuestManagementListPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [pairNames, setPairNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 🔥 ペアID → 名前の辞書を作る
  const loadPairNames = async () => {
    const snap = await getDocs(collection(db, "pairs"));
    const map: Record<string, string> = {};

    for (const d of snap.docs) {
      const data = d.data();
      const names = data.names || data.memberNames || []; // どちらでも対応
      map[d.id] = names.join(" & ");
    }

    setPairNames(map);
  };

  useEffect(() => {
    const load = async () => {
      await loadPairNames();

      const q = query(collection(db, "quests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setQuests(list);
      setLoading(false);
    };

    load();
  }, []);

  const deleteQuest = async (id: string) => {
    if (!confirm("このクエストを削除しますか？")) return;

    await deleteDoc(doc(db, "quests", id));
    alert("削除しました");

    setQuests((prev) => prev.filter((q) => q.id !== id));
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">読み込み中…</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエスト管理</h1>

      {/* 新規作成 */}
      <div className="text-right">
        <Link
          href="/quests/management/quests/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          ＋ 新規クエスト
        </Link>
      </div>

      {/* クエスト一覧 */}
      <div className="space-y-4">
        {quests.length === 0 && (
          <p className="text-slate-500 text-center">クエストがありません。</p>
        )}

        {quests.map((q) => {
          const deadline = q.deadline?.toDate
            ? q.deadline.toDate()
            : null;

          const deadlineStr = deadline
            ? `${deadline.getFullYear()}/${deadline.getMonth() + 1}/${deadline.getDate()}`
            : "なし";

          // 🔥 対象ペア名に変換
          const targetName =
            q.targetPair === "all"
              ? "全体"
              : pairNames[q.targetPair] || "不明なペア";

          return (
            <div
              key={q.id}
              className="p-4 border rounded-xl bg-white flex items-center gap-4"
            >
              {q.icon ? (
                <Image
                  src={q.icon}
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
                <p className="font-semibold">{q.title}</p>
                <p className="text-xs text-slate-500">期限：{deadlineStr}</p>
                <p className="text-xs text-slate-500">対象：{targetName}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/quests/management/quests/edit/${q.id}`}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg text-center"
                >
                  編集
                </Link>

                <button
                  onClick={() => deleteQuest(q.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
