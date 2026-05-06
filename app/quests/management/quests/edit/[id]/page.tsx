"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import Image from "next/image";

export default function EditQuestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [point, setPoint] = useState(0);
  const [pointsSuccess, setPointsSuccess] = useState(0);
  const [pointsFail, setPointsFail] = useState(0);

  const [deadline, setDeadline] = useState<string | null>(null);

  const [questType, setQuestType] = useState<"normal" | "daily">("normal");
  const [dailyResetTime, setDailyResetTime] = useState("00:00");

  const [targetPair, setTargetPair] = useState("all");
  const [pairList, setPairList] = useState<any[]>([]);

  const [iconList, setIconList] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // 🔥 deadline を安全に変換
  const safeToDate = (value: any) => {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    return new Date(value);
  };

  useEffect(() => {
    const load = async () => {
      // 🔥 ペア一覧読み込み
      const pairSnap = await getDocs(collection(db, "pairs"));
      const pairs = pairSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setPairList(pairs);

      // 🔥 アイコン一覧
      const res = await fetch("/api/rewards-images");
      const icons = await res.json();
      setIconList(icons);

      // 🔥 クエスト読み込み
      const ref = doc(db, "quests", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const q = snap.data();

        setTitle(q.title || "");
        setDetail(q.detail || "");
        setPoint(q.point ?? 0);
        setPointsSuccess(q.pointsSuccess ?? q.point ?? 0);
        setPointsFail(q.pointsFail ?? 0);

        const d = safeToDate(q.deadline);
        setDeadline(d ? d.toISOString().slice(0, 16) : null);

        setQuestType(q.questType || "normal");
        setDailyResetTime(q.dailyResetTime || "00:00");

        setTargetPair(q.targetPair || "all");
        setSelectedIcon(q.icon || null);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  const handleSave = async () => {
    const ref = doc(db, "quests", id as string);

    const data: any = {
      title,
      detail,
      point,
      pointsSuccess,
      pointsFail,
      questType,
      targetPair,
      icon: selectedIcon,
    };

    // 🔥 deadline を Timestamp で保存（重要）
    data.deadline = deadline
      ? Timestamp.fromDate(new Date(deadline))
      : null;

    if (questType === "daily") {
      data.dailyResetTime = dailyResetTime;
    }

    await updateDoc(ref, data);

    alert("更新しました！");
    router.push("/quests/management/quests");
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">読み込み中…</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエスト編集</h1>

      {/* 戻る */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/quests/management/quests")}
          className="text-indigo-600 underline"
        >
          ← クエスト一覧に戻る
        </button>
      </div>

      {/* タイトル */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">タイトル</label>
        <input
          className="w-full border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">説明</label>
        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>

      {/* クエストタイプ */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">クエストタイプ</label>
        <select
          className="w-full border p-2 rounded"
          value={questType}
          onChange={(e) => setQuestType(e.target.value as any)}
        >
          <option value="normal">通常クエスト</option>
          <option value="daily">デイリークエスト</option>
        </select>
      </div>

      {/* デイリーリセット */}
      {questType === "daily" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">デイリーリセット時刻</label>
          <input
            type="time"
            className="w-full border p-2 rounded"
            value={dailyResetTime}
            onChange={(e) => setDailyResetTime(e.target.value)}
          />
        </div>
      )}

      {/* ポイント */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">成功ポイント</label>
        <input
          type="number"
          className="w-full border p-2 rounded"
          value={pointsSuccess}
          onChange={(e) => setPointsSuccess(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">失敗ポイント</label>
        <input
          type="number"
          className="w-full border p-2 rounded"
          value={pointsFail}
          onChange={(e) => setPointsFail(Number(e.target.value))}
        />
      </div>

      {/* 期限 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">期限</label>
        <input
          type="datetime-local"
          className="w-full border p-2 rounded"
          value={deadline ?? ""}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      {/* 対象ペア */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">対象ペア</label>
        <select
          className="w-full border p-2 rounded"
          value={targetPair}
          onChange={(e) => setTargetPair(e.target.value)}
        >
          <option value="all">全体</option>
          {pairList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.members?.join(" & ") || "不明なペア"}
            </option>
          ))}
        </select>
      </div>

      {/* アイコン */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">アイコン</label>

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
                alt="icon"
                width={80}
                height={80}
                className="rounded-lg object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 保存 */}
      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 text-white p-3 rounded-lg text-lg"
      >
        保存する
      </button>
    </div>
  );
}
