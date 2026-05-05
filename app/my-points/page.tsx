"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MyPointsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = collection(db, "pointHistory");
      const q = query(
        ref,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setHistory(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">ポイント履歴</h1>

      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="p-4 border rounded-xl bg-white">
            <p className="font-semibold">
              {item.added > 0 ? "＋" : "−"}
              {item.added} pt
            </p>

            <p className="text-slate-600">
              理由：{item.reason ?? "不明"}
            </p>

            <p className="text-slate-500 text-sm">
              {item.createdAt?.toDate
                ? item.createdAt.toDate().toLocaleString()
                : ""}
            </p>
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
