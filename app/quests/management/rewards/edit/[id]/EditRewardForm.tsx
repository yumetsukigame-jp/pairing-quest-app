"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";

export default function EditRewardForm() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<"fixed" | "variable">("fixed");

  const [name, setName] = useState("");
  const [cost, setCost] = useState(0);
  const [stock, setStock] = useState(0);

  const [min, setMin] = useState(100);
  const [max, setMax] = useState(5000);
  const [rate, setRate] = useState(1);

  const [iconList, setIconList] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // 🔥 アイコン読み込み（/api/rewards-images）
  useEffect(() => {
    const fetchData = async () => {
      // 報酬データ読み込み
      const ref = doc(db, "rewards", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setName(data.name);
        setType(data.type);
        setSelectedIcon(data.image || null);

        if (data.type === "fixed") {
          setCost(data.cost);
          setStock(data.stock);
        } else {
          setMin(data.min);
          setMax(data.max);
          setRate(data.rate);
        }
      }

      // アイコン一覧読み込み
      const res = await fetch("/api/rewards-images");
      const icons = await res.json();
      setIconList(icons);

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    const ref = doc(db, "rewards", id as string);

    const data: any = {
      name,
      type,
      image: selectedIcon,
    };

    if (type === "fixed") {
      data.cost = cost;
      data.stock = stock;
    } else {
      data.min = min;
      data.max = max;
      data.rate = rate;
    }

    await updateDoc(ref, data);

    alert("更新しました！");
    router.push("/quests/management/rewards");
  };

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  return (
    <div className="space-y-6">
      {/* 種類 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">報酬タイプ</label>
        <select
          className="w-full border p-2 rounded"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value="fixed">固定ポイント報酬</option>
          <option value="variable">可変ポイント報酬</option>
        </select>
      </div>

      {/* 名前 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">報酬名</label>
        <input
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* 固定報酬 */}
      {type === "fixed" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold">必要ポイント</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">在庫数</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>
        </>
      )}

      {/* 可変報酬 */}
      {type === "variable" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold">最小ポイント</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">最大ポイント</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">換算レート</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
        </>
      )}

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
                alt="reward icon"
                width={100}
                height={100}
                className="rounded-lg object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 text-white p-3 rounded-lg"
      >
        保存する
      </button>
    </div>
  );
}
