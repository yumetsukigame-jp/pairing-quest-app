"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AddRewardForm() {
  const router = useRouter();

  const [type, setType] = useState<"fixed" | "variable">("fixed");

  const [name, setName] = useState("");
  const [cost, setCost] = useState(0); // fixed
  const [stock, setStock] = useState(0); // fixed

  const [min, setMin] = useState(100); // variable
  const [max, setMax] = useState(5000); // variable
  const [rate, setRate] = useState(1); // variable

  const [iconList, setIconList] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // 🔥 アイコン読み込み（/api/rewards-images）
  useEffect(() => {
    const fetchIcons = async () => {
      const res = await fetch("/api/rewards-images");
      const icons = await res.json();
      setIconList(icons);
    };
    fetchIcons();
  }, []);

  const handleSave = async () => {
    if (!name) {
      alert("名前を入力してください");
      return;
    }

    const data: any = {
      name,
      type,
      image: selectedIcon || null,
      createdAt: new Date(),
    };

    if (type === "fixed") {
      data.cost = cost;
      data.stock = stock;
    }

    if (type === "variable") {
      data.min = min;
      data.max = max;
      data.rate = rate;
    }

    await addDoc(collection(db, "rewards"), data);

    alert("報酬を追加しました！");
    router.push("/quests/management/rewards");
  };

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
          <option value="variable">可変ポイント報酬（お小遣いなど）</option>
        </select>
      </div>

      {/* 名前 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">報酬名</label>
        <input
          className="w-full border p-2 rounded"
          placeholder="例：お小遣い / お菓子"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* 固定報酬フォーム */}
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

      {/* 可変報酬フォーム */}
      {type === "variable" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold">最小申請ポイント</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">最大申請ポイント</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">換算レート（1pt = ?円）</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
        </>
      )}

      {/* アイコン選択 */}
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

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 text-white p-3 rounded-lg text-lg"
      >
        保存する
      </button>
    </div>
  );
}
