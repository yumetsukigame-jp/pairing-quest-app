"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AddQuestPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [point, setPoint] = useState<number>(10);
  const [deadline, setDeadline] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [iconList, setIconList] = useState<string[]>([]);
  const [icon, setIcon] = useState<string | null>(null);

  const [pairs, setPairs] = useState<any[]>([]);
  const [executor, setExecutor] = useState<string>("all");

  // 🔥 アイコン一覧を public/questicon から取得
  useEffect(() => {
    const loadIcons = async () => {
      const res = await fetch("/questicon/list.json");
      const data = await res.json();
      setIconList(data);
    };
    loadIcons();
  }, []);

  // 🔥 ペア一覧を取得（pairs → members → users.name）
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

  // 🔥 クエスト作成
  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("クエスト名を入力してください");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "quests"), {
      name,
      detail,
      point,
      deadline: deadline || null,
      isPublic,
      icon: icon || null,
      executor,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      status: "open",
    });

    router.push("/quests/management");
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center">クエストを追加</h1>

      {/* アイコン選択 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">アイコン</h2>

        <div className="flex flex-col items-center gap-3">
          {icon ? (
            <Image
              src={icon}
              alt="quest icon"
              width={120}
              height={120}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="w-[120px] h-[120px] bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
              アイコン未選択
            </div>
          )}

          <div className="grid grid-cols-5 gap-3 max-h-40 overflow-y-auto p-2 border rounded-lg bg-white">
            {iconList.map((path) => (
              <button
                key={path}
                onClick={() => setIcon(path)}
                className={`border rounded-lg p-1 ${
                  icon === path ? "border-indigo-600" : "border-slate-300"
                }`}
              >
                <Image
                  src={path}
                  alt="icon"
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* クエスト名 */}
      <section>
        <label className="font-semibold">クエスト名</label>
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      {/* 詳細 */}
      <section>
        <label className="font-semibold">詳細</label>
        <textarea
          className="w-full border p-2 rounded mt-1"
          rows={3}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </section>

      {/* ポイント */}
      <section>
        <label className="font-semibold">ポイント</label>
        <input
          type="number"
          className="w-full border p-2 rounded mt-1"
          value={point}
          onChange={(e) => setPoint(Number(e.target.value))}
        />
      </section>

      {/* 期限 */}
      <section>
        <label className="font-semibold">期限（任意）</label>
        <input
          type="date"
          className="w-full border p-2 rounded mt-1"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </section>

      {/* 公開設定 */}
      <section>
        <label className="font-semibold">公開設定</label>
        <select
          className="w-full border p-2 rounded mt-1"
          value={isPublic ? "public" : "private"}
          onChange={(e) => setIsPublic(e.target.value === "public")}
        >
          <option value="public">公開</option>
          <option value="private">非公開</option>
        </select>
      </section>

      {/* 実行者（ペア選択） */}
      <section>
        <label className="font-semibold">対象ペア</label>
        <select
          className="w-full border p-2 rounded mt-1"
          value={executor}
          onChange={(e) => setExecutor(e.target.value)}
        >
          <option value="all">ペア全体</option>

          {pairs.map((p) => (
            <option key={p.pairId} value={p.pairId}>
              {(p.names || ["不明なユーザー"]).join(" & ")}
            </option>
          ))}
        </select>
      </section>

      {/* 作成ボタン */}
      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg text-lg"
      >
        作成する
      </button>
    </div>
  );
}
