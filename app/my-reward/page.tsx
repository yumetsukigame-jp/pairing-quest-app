"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MyRewardPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "thisMonth" | "lastMonth" | "approved" | "pending" | "canceled"
  >("all");

  const router = useRouter();

  const fetchHistory = async (uid: string) => {
    const ref = collection(db, "shippingHistory");
    const q = query(
      ref,
      where("uid", "==", uid),
      orderBy("requestedAt", "desc")
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setHistory(list);
    setLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      fetchHistory(user.uid);
    });

    return () => unsub();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("この申請をキャンセルしますか？")) return;

    await updateDoc(doc(db, "shippingHistory", id), {
      canceled: true,
      canceledAt: new Date(),
    });

    alert("キャンセルしました");
    const user = auth.currentUser;
    if (user) fetchHistory(user.uid);
  };

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  // 🔥 フィルター処理
  const filtered = history.filter((item) => {
    const date = item.requestedAt?.toDate
      ? item.requestedAt.toDate()
      : null;
    if (!date) return false;

    const now = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    if (filter === "thisMonth") {
      return month === currentMonth && year === currentYear;
    }
    if (filter === "lastMonth") {
      return month === lastMonth && year === lastMonthYear;
    }
    if (filter === "approved") return item.shipped;
    if (filter === "pending") return !item.shipped && !item.canceled;
    if (filter === "canceled") return item.canceled;

    return true;
  });

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">報酬申請履歴</h1>

      {/* 🔥 フィルター */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[
          "all",
          "thisMonth",
          "lastMonth",
          "approved",
          "pending",
          "canceled",
        ].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded-lg ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {{
              all: "全期間",
              thisMonth: "今月",
              lastMonth: "先月",
              approved: "承認済み",
              pending: "未承認",
              canceled: "キャンセル済み",
            }[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500">該当する履歴がありません。</p>
      )}

      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-xl bg-white space-y-3"
          >
            {/* 画像 */}
            {item.image && (
              <Image
                src={item.image}
                alt={item.name}
                width={120}
                height={120}
                className="rounded-lg object-contain mx-auto"
              />
            )}

            <p className="font-semibold text-center">{item.name}</p>

            {/* fixed / variable */}
            {item.variableAmount ? (
              <p className="text-center text-slate-600">
                申請ポイント：{item.variableAmount} pt
              </p>
            ) : (
              <p className="text-center text-slate-600">
                必要ポイント：{item.cost} pt
              </p>
            )}

            <p className="text-center text-slate-500">
              申請日時：
              {item.requestedAt?.toDate
                ? item.requestedAt.toDate().toLocaleString()
                : ""}
            </p>

            {/* 承認状態 */}
            {item.shipped ? (
              <p className="text-green-600 font-semibold text-center">
                ✔ 承認済み（
                {item.approvedAt?.toDate
                  ? item.approvedAt.toDate().toLocaleString()
                  : ""}
                ）
              </p>
            ) : item.canceled ? (
              <p className="text-slate-500 font-semibold text-center">
                キャンセル済み（
                {item.canceledAt?.toDate
                  ? item.canceledAt.toDate().toLocaleString()
                  : ""}
                ）
              </p>
            ) : (
              <p className="text-red-600 font-semibold text-center">
                承認待ち
              </p>
            )}

            {/* 🔥 キャンセルボタン（未承認のみ） */}
            {!item.shipped && !item.canceled && (
              <button
                onClick={() => handleCancel(item.id)}
                className="w-full bg-red-500 text-white p-2 rounded-lg"
              >
                申請をキャンセルする
              </button>
            )}
          </div>
        ))}
      </div>

      <a
        href="/"
        className="block text-center mt-6 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg"
      >
        トップへ戻る
      </a>
    </div>
  );
}
