"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Image from "next/image";

export default function QuestListPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"created" | "points" | "deadline">("created");

  const loadQuests = async () => {
    const snap = await getDocs(collection(db, "quests"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setQuests(list);
  };

  useEffect(() => {
    loadQuests().then(() => setLoading(false));
  }, []);

  const deleteQuest = async (id: string) => {
    if (!confirm("このクエストを削除しますか？")) return;
    await deleteDoc(doc(db, "quests", id));
    await loadQuests();
    alert("クエストを削除しました");
  };

  const sorted = [...quests].sort((a, b) => {
    if (sort === "points") return b.points - a.points;

    if (sort === "deadline") {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return da - db;
    }

    return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
  });

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエスト一覧</h1>

      <Link
        href="/quests/management/quests/add"
        className="block px-4 py-2 bg-indigo-600 text-white rounded-lg text-center"
      >
        ＋ クエストを作成
      </Link>

      {/* 並び替え */}
      <div className="flex gap-2">
        <button
          onClick={() => setSort("created")}
          className={`px-3 py-1 rounded-lg text-sm ${
            sort === "created" ? "bg-indigo-600 text-white" : "bg-slate-200"
          }`}
        >
          作成日順
        </button>

        <button
          onClick={() => setSort("points")}
          className={`px-3 py-1 rounded-lg text-sm ${
            sort === "points" ? "bg-indigo-600 text-white" : "bg-slate-200"
          }`}
        >
          ポイント順
        </button>

        <button
          onClick={() => setSort("deadline")}
          className={`px-3 py-1 rounded-lg text-sm ${
            sort === "deadline" ? "bg-indigo-600 text-white" : "bg-slate-200"
          }`}
        >
          締め切り順
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((q) => (
          <div
            key={q.id}
            className="p-4 border rounded-xl bg-white flex items-center gap-4"
          >
            {q.icon && (
              <Image
                src={q.icon}
                alt="quest icon"
                width={70}
                height={70}
                className="rounded-lg object-contain border bg-white"
              />
            )}

            <div className="flex-1">
              <p className="font-semibold">{q.title}</p>
              <p className="text-sm text-slate-500">{q.description}</p>
              <p className="text-sm text-indigo-600 font-bold">{q.points} pt</p>

              <p
                className={`text-xs font-bold ${
                  q.isPublic ? "text-green-600" : "text-red-500"
                }`}
              >
                {q.isPublic ? "公開" : "非公開"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/quests/management/quests/edit/${q.id}`}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg"
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
        ))}
      </div>
    </div>
  );
}
