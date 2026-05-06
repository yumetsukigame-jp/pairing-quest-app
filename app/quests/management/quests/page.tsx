"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

export default function QuestManagementListPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [pairNames, setPairNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 🔥 deadline を安全に変換
  const safeToDate = (value: any) => {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    return new Date(value);
  };

  // 🔥 全ユーザーの UID → 名前変換
  const loadUserNames = async () => {
    const snap = await getDocs(collection(db, "users"));
    const map: Record<string, string> = {};

    snap.forEach((d) => {
      const data = d.data();
      if (data.name) map[d.id] = data.name;
    });

    setUserNames(map);
  };

  // 🔥 ペアID → ペア名（UID → 名前変換）
  const loadPairNames = async () => {
    const snap = await getDocs(collection(db, "pairs"));
    const map: Record<string, string> = {};

    for (const d of snap.docs) {
      const data = d.data();
      const memberUids: string[] = data.members || [];

      if (memberUids.length < 2) continue;

      const names: string[] = [];

      for (const uid of memberUids) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const n = userSnap.data().name;
          if (n) names.push(n);
        }
      }

      map[d.id] = names.length > 0 ? names.join(" & ") : "不明なペア";
    }

    setPairNames(map);
  };

  useEffect(() => {
    const load = async () => {
      await loadUserNames();
      await loadPairNames();

      const snap = await getDocs(collection(db, "quests"));

      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .sort((a, b) => {
          const da = safeToDate(a.createdAt);
          const db = safeToDate(b.createdAt);
          if (!da) return 1;
          if (!db) return -1;
          return db.getTime() - da.getTime();
        });

      setQuests(list);
      setLoading(false);
    };

    load();
  }, []);

  // 🔥 達成取消（ポイントも戻す）
  const cancelSuccess = async (quest: any) => {
    if (!confirm("達成を取り消しますか？")) return;

    const questId = quest.id;
    const pairId = quest.targetPair;
    const executor = quest.executor;
    const points = quest.pointsSuccess || 0;

    // ① クエストを pending に戻す
    await updateDoc(doc(db, "quests", questId), {
      status: "pending",
      executor: null,
    });

    // ② ペア指定クエストのみポイントを戻す
    if (pairId !== "all" && executor) {
      const pairPointsRef = doc(db, "pairPoints", pairId);
      const pairPointsSnap = await getDoc(pairPointsRef);

      if (pairPointsSnap.exists()) {
        const data = pairPointsSnap.data();
        const current = data[executor] || { received: 0, given: 0 };

        await updateDoc(pairPointsRef, {
          [executor]: {
            received: current.received - points,
            given: current.given,
          },
        });
      }
    }

    alert("達成を取り消し、ポイントを戻しました");

    // ③ UI 更新
    setQuests((prev) =>
      prev.map((q) =>
        q.id === questId
          ? { ...q, status: "pending", executor: null }
          : q
      )
    );
  };

  // 🔥 削除
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
          const deadline = safeToDate(q.deadline);

          const deadlineStr = deadline
            ? `${deadline.getFullYear()}/${deadline.getMonth() + 1}/${deadline.getDate()}`
            : "なし";

          const targetName =
            q.targetPair === "all"
              ? "全体"
              : pairNames[q.targetPair] || "不明なペア";

          const executorName =
            q.executor ? userNames[q.executor] || "不明なユーザー" : "-";

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
                <p className="text-xs text-slate-500">
                  状態：
                  {q.status === "pending"
                    ? "進行中"
                    : q.status === "success"
                    ? "達成"
                    : "不達成"}
                </p>
                <p className="text-xs text-slate-500">達成者：{executorName}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/quests/management/quests/edit/${q.id}`}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg text-center"
                >
                  編集
                </Link>

                {q.status === "success" && (
                  <button
                    onClick={() => cancelSuccess(q)}
                    className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-lg"
                  >
                    達成取消
                  </button>
                )}

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
