"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, updateDoc, getDocs, collection, where, query } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function EditQuestPage() {
  const router = useRouter();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [point, setPoint] = useState(10);
  const [deadline, setDeadline] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [targetPair, setTargetPair] = useState("all");

  const [icon, setIcon] = useState("");
  const [icons, setIcons] = useState<string[]>([]);
  const [pairs, setPairs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // 🔥 アイコン一覧
  useEffect(() => {
    const loadIcons = async () => {
      const res = await fetch("/questicon/list.json");
      const data = await res.json();
      setIcons(data);
    };
    loadIcons();
  }, []);

  // 🔥 ペア一覧
  useEffect(() => {
    const loadPairs = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "pairs"),
        where("members", "array-contains", user.uid)
      );

      const snap = await getDocs(q);
      const list: any[] = [];

      for (const docSnap of snap.docs) {
        const pairId = docSnap.id;
        const data = docSnap.data();
        const memberUids: string[] = data.members || [];

        const names: string[] = [];

        for (const uid of memberUids) {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const n = userSnap.data().name;
            if (n) names.push(n);
          }
        }

        list.push({
          pairId,
          names: names.length > 0 ? names : ["不明なユーザー"],
        });
      }

      setPairs(list);
    };

    loadPairs();
  }, []);

  // 🔥 クエスト読み込み
  useEffect(() => {
    const loadQuest = async () => {
      const snap = await getDoc(doc(db, "quests", id as string));
      if (snap.exists()) {
        const q = snap.data();

        setTitle(q.title);
        setDetail(q.detail);
        setPoint(q.point);

        // Timestamp → yyyy-mm-dd
        if (q.deadline && q.deadline.toDate) {
          const d = q.deadline.toDate();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setDeadline(`${yyyy}-${mm}-${dd}`);
        }

        setIsPublic(q.isPublic ?? true);
        setIcon(q.icon || "");
        setTargetPair(q.targetPair || "all");
      }
      setLoading(false);
    };

    loadQuest();
  }, [id]);

  // 🔥 更新処理
  const updateQuest = async () => {
    await updateDoc(doc(db, "quests", id as string), {
      title,
      detail,
      point,
      deadline: deadline || null,
      isPublic,
      icon,
      targetPair,
    });

    alert("クエストを更新しました！");
    router.push("/quests");
  };

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">クエスト編集</h1>

      {/* アイコン */}
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

      {/* 入力項目 */}
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
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="w-full border p-2 rounded-lg"
        />

        <input
          type="number"
          value={point}
          onChange={(e) => setPoint(Number(e.target.value))}
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

        {/* 対象ペア */}
        <select
          className="w-full border p-2 rounded-lg"
          value={targetPair}
          onChange={(e) => setTargetPair(e.target.value)}
        >
          <option value="all">全体</option>
          {pairs.map((p) => (
            <option key={p.pairId} value={p.pairId}>
              {(p.names || ["不明なユーザー"]).join(" & ")}
            </option>
          ))}
        </select>

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
