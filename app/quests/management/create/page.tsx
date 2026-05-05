"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CreateQuestPage() {
  const router = useRouter();

  // 入力項目
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [pointsSuccess, setPointsSuccess] = useState(1);
  const [pointsFail, setPointsFail] = useState(0);

  const [questType, setQuestType] = useState("normal"); // normal / daily
  const [deadline, setDeadline] = useState(""); // datetime-local
  const [dailyResetTime, setDailyResetTime] = useState("07:00");

  const [pairList, setPairList] = useState<any[]>([]);
  const [targetPair, setTargetPair] = useState("all");

  const [iconList, setIconList] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // 🔥 ペア一覧 & アイコン一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // ペア一覧
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userInfo = userSnap.data();
        setPairList(userInfo.pairs || []);
      }

      // アイコン一覧（public/questicon フォルダを API で読み込み）
      const res = await fetch("/api/questicons");
      const icons = await res.json();
      setIconList(icons);

      setLoading(false);
    };

    fetchData();
  }, []);

  // 🔥 クエスト作成
  const handleCreate = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // デイリーの場合は deadline を dailyResetTime から生成
    let finalDeadline: any = null;

    if (questType === "normal" && deadline) {
      finalDeadline = new Date(deadline);
    }

    if (questType === "daily") {
      const now = new Date();
      const [h, m] = dailyResetTime.split(":").map(Number);

      const next = new Date();
      next.setHours(h, m, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      finalDeadline = next;
    }

    // 🔥 executor の決定ロジック（追加）
    let executor = null;

    if (targetPair !== "all") {
      // 特定ペア → executor を決定（親ではない方）
      const pairRef = doc(db, "pairs", targetPair);
      const pairSnap = await getDoc(pairRef);

      if (pairSnap.exists()) {
        const members = pairSnap.data().members;
        executor = members.find((uid: string) => uid !== user.uid);
      }
    }
    // 家族全体（all）の場合は executor = null（達成時に決まる）

    await addDoc(collection(db, "quests"), {
      title,
      description,
      pointsSuccess,
      pointsFail,
      createdBy: user.uid,
      createdAt: serverTimestamp(),

      targetPair,
      executor, // ← ★ 追加（特定ペアならセット、all なら null）
      icon: selectedIcon || null,

      questType, // normal / daily
      deadline: finalDeadline ? finalDeadline : null,
      dailyResetTime: questType === "daily" ? dailyResetTime : null,

      status: "pending",
    });

    alert("クエストを作成しました！");
    router.push("/quests");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエストを作成</h1>

      {/* タイトル */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">タイトル</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="例：洗濯物をたたむ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">説明</label>
        <textarea
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="例：10分以内に終わらせよう！"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* アイコン選択 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">クエストアイコン</label>

        <div className="grid grid-cols-3 gap-4">
          {iconList.map((icon) => (
            <div
              key={icon}
              onClick={() => setSelectedIcon(icon)}
              className={`border rounded-xl p-2 cursor-pointer ${
                selectedIcon === icon ? "ring-4 ring-indigo-500" : ""
              }`}
            >
              <Image
                src={icon}
                alt="quest icon"
                width={100}
                height={100}
                className="rounded-lg object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ポイント（達成） */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">達成時のポイント</label>
        <input
          type="number"
          className="w-full px-3 py-2 border rounded-lg"
          value={pointsSuccess}
          onChange={(e) => setPointsSuccess(Number(e.target.value))}
        />
      </div>

      {/* ポイント（不達成） */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">不達成時のポイント（マイナス可）</label>
        <input
          type="number"
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="例：-5"
          value={pointsFail}
          onChange={(e) => setPointsFail(Number(e.target.value))}
        />
      </div>

      {/* クエストタイプ */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">クエストタイプ</label>
        <select
          className="w-full px-3 py-2 border rounded-lg"
          value={questType}
          onChange={(e) => setQuestType(e.target.value)}
        >
          <option value="normal">通常クエスト</option>
          <option value="daily">デイリークエスト</option>
        </select>
      </div>

      {/* 通常クエスト → 期限 */}
      {questType === "normal" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">期限</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      )}

      {/* デイリークエスト → リセット時間 */}
      {questType === "daily" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">毎日のリセット時間</label>
          <input
            type="time"
            className="w-full px-3 py-2 border rounded-lg"
            value={dailyResetTime}
            onChange={(e) => setDailyResetTime(e.target.value)}
          />
        </div>
      )}

      {/* 対象ペア */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">対象ペア</label>
        <select
          className="w-full px-3 py-2 border rounded-lg"
          value={targetPair}
          onChange={(e) => setTargetPair(e.target.value)}
        >
          <option value="all">全体に公開</option>
          {pairList.map((pairId) => (
            <option key={pairId} value={pairId}>
              ペアID: {pairId}
            </option>
          ))}
        </select>
      </div>

      {/* 作成ボタン */}
      <button
        onClick={handleCreate}
        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl text-lg shadow hover:bg-indigo-700 transition"
      >
        クエストを作成する
      </button>
    </div>
  );
}
