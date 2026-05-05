"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import Image from "next/image";

export default function QuestDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [quest, setQuest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuest = async () => {
      const ref = doc(db, "quests", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setQuest({ id: snap.id, ...snap.data() });
      }

      setLoading(false);
    };

    fetchQuest();
  }, [id]);

  // 🔥 クエスト達成処理（executor をセット）
  const handleSuccess = async () => {
    if (!quest) return;

    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "quests", quest.id);

    await updateDoc(ref, {
      status: "success",
      executor: user.uid, // ← ★ 実行者をセット
      completedAt: serverTimestamp(),
    });

    alert("クエストを達成しました！");
    router.push("/quests");
  };

  // 🔥 クエスト不達成処理（executor をセット）
  const handleFail = async () => {
    if (!quest) return;

    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "quests", quest.id);

    await updateDoc(ref, {
      status: "failed",
      executor: user.uid, // ← ★ 実行者をセット
      failedAt: serverTimestamp(),
    });

    alert("クエストを不達成にしました");
    router.push("/quests");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        クエストが見つかりません
      </div>
    );
  }

  const deadline = quest.deadline ? quest.deadline.toDate() : null;
  const deadlineStr = deadline
    ? `${deadline.getMonth() + 1}/${deadline.getDate()} ${deadline.getHours()}:${String(
        deadline.getMinutes()
      ).padStart(2, "0")}`
    : "なし";

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエスト詳細</h1>

      {/* アイコン */}
      <div className="flex justify-center">
        {quest.icon ? (
          <Image
            src={quest.icon}
            alt="icon"
            width={120}
            height={120}
            className="rounded-lg object-contain"
          />
        ) : (
          <div className="w-[120px] h-[120px] bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
            No Icon
          </div>
        )}
      </div>

      {/* タイトル */}
      <h2 className="text-xl font-semibold text-center">{quest.title}</h2>

      {/* 説明 */}
      <p className="text-slate-700 whitespace-pre-line">{quest.description}</p>

      {/* クエストタイプ */}
      <p className="text-sm text-slate-500">
        種類：{quest.questType === "daily" ? "デイリークエスト" : "通常クエスト"}
      </p>

      {/* 期限 */}
      <p className="text-sm text-slate-600">期限：{deadlineStr}</p>

      {/* ポイント */}
      <p className="text-sm text-slate-600">
        成功：+{quest.pointsSuccess}pt / 失敗：{quest.pointsFail}pt
      </p>

      {/* ステータス */}
      <p className="text-sm text-slate-600">
        ステータス：
        {quest.status === "pending"
          ? "進行中"
          : quest.status === "success"
          ? "達成"
          : "不達成"}
      </p>

      {/* ボタン（進行中のときだけ表示） */}
      {quest.status === "pending" && (
        <div className="space-y-4 mt-6">
          <button
            onClick={handleSuccess}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-xl text-lg shadow hover:bg-green-700 transition"
          >
            クエスト達成！
          </button>

          <button
            onClick={handleFail}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-lg shadow hover:bg-red-700 transition"
          >
            不達成にする
          </button>
        </div>
      )}

      {/* 戻る */}
      <div className="text-center mt-8">
        <button
          onClick={() => router.push("/quests")}
          className="text-blue-600 underline"
        >
          クエスト一覧に戻る
        </button>
      </div>
    </div>
  );
}
