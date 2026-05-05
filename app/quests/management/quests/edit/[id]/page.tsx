"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function EditQuestPage() {
  const router = useRouter();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [points, setPoints] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [icon, setIcon] = useState("");
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIcons = async () => {
      const res = await fetch("/api/questicons");
      const data = await res.json();
      setIcons(data);
    };
    loadIcons();
  }, []);

  useEffect(() => {
    const loadQuest = async () => {
      const snap = await getDoc(doc(db, "quests", id as string));
      if (snap.exists()) {
        const q = snap.data();
        setTitle(q.title);
        setDesc(q.description);
        setPoints(q.points);
        setDeadline(q.deadline || "");
        setIsPublic(q.isPublic ?? true);
        setIcon(q.icon);
      }
      setLoading(false);
    };
    loadQuest();
  }, [id]);

  const updateQuest = async () => {
    await updateDoc(doc(db, "quests", id as string), {
      title,
      description: desc,
      points,
      deadline: deadline || null,
      isPublic,
      icon,
    });

    alert("クエストを更新しました！");
    router.push("/quests/management/quests");
  };

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエスト編集</h1>

      <div className="flex flex-col items-center gap-3">
        <Image
          src={icon}
          alt="quest icon"
          width={120}
          height={120}
          className="rounded-xl border bg-white object-contain"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {icons.map((img) => (
          <button
            key={img}
            onClick={() => setIcon(img)}
            className={`border rounded-xl p-1 ${
              icon === img ? "border-indigo-600" : "border-slate-300"
            }`}
          >
            <Image
              src={img}
              alt="icon"
              width={80}
              height={80}
              className="rounded-lg object-contain"
            />
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded-lg"
        />

        <textarea
          placeholder="説明"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full border p-2 rounded-lg"
        />

        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-full border p-2 rounded-lg"
        />

        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full border p-2 rounded-lg"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          公開する
        </label>

        <button
          onClick={updateQuest}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg"
        >
          更新する
        </button>
      </div>
    </div>
  );
}
