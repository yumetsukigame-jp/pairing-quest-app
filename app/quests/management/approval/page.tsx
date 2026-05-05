"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import Image from "next/image";

export default function ApprovalPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 フィルター（all / pending）
  const [filter, setFilter] = useState<"all" | "pending">("all");

  const fetchHistory = async () => {
    const ref = collection(db, "shippingHistory");
    const q = query(ref, orderBy("requestedAt", "desc"));
    const snap = await getDocs(q);

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setHistory(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("この報酬を承認しますか？")) return;

    await updateDoc(doc(db, "shippingHistory", id), {
      shipped: true, // ← 承認済み扱い
      approvedAt: new Date(),
    });

    alert("承認しました！");
    fetchHistory();
  };

  if (loading) {
    return <div className="p-6 text-center">読み込み中…</div>;
  }

  // 🔥 フィルター適用
  const filteredHistory =
    filter === "pending"
      ? history.filter((item) => !item.shipped)
      : history;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">報酬の承認管理</h1>

      {/* 🔥 フィルター */}
      <div className="flex gap-3 justify-center mb-4">
        <button
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
          onClick={() => setFilter("all")}
        >
          すべて
        </button>

        <button
          className={`px-4 py-2 rounded-lg ${
            filter === "pending"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200 text-slate-700"
          }`}
          onClick={() => setFilter("pending")}
        >
          未承認のみ
        </button>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-xl bg-white space-y-3"
          >
            <div className="flex items-center gap-4">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="rounded-lg object-contain"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>

                <p className="text-sm text-slate-500">
                  申請者：{item.userName}（{item.userX ?? "X未登録"}）
                </p>

                <p className="text-sm text-slate-500">
                  申請日時：
                  {item.requestedAt?.toDate
                    ? item.requestedAt.toDate().toLocaleString()
                    : ""}
                </p>

                {/* variableAmount がある場合は可変報酬 */}
                {item.variableAmount ? (
                  <p className="text-sm text-slate-500">
                    申請ポイント：{item.variableAmount} pt
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    必要ポイント：{item.cost} pt
                  </p>
                )}

                {/* 🔥 承認日時の表示 */}
                {item.approvedAt && (
                  <p className="text-sm text-green-600 font-semibold">
                    承認日時：
                    {item.approvedAt?.toDate
                      ? item.approvedAt.toDate().toLocaleString()
                      : ""}
                  </p>
                )}
              </div>
            </div>

            {/* 🔥 承認ボタン */}
            {item.shipped ? (
              <p className="text-green-600 font-semibold text-center">
                ✔ 承認済み
              </p>
            ) : (
              <button
                onClick={() => handleApprove(item.id)}
                className="w-full bg-indigo-600 text-white p-2 rounded-lg"
              >
                承認する
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
