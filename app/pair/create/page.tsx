"use client";

import { useState } from "react";
import { auth, db } from "@/firebase";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export default function CreatePairPage() {
  const [partnerUid, setPartnerUid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreatePair = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("ログインしてください");
      return;
    }

    if (!partnerUid) {
      alert("相手の UID を入力してください");
      return;
    }

    setLoading(true);

    try {
      // ペアIDを生成
      const pairId = uuidv4();

      // ① pairs コレクションに登録
      await setDoc(doc(db, "pairs", pairId), {
        members: [user.uid, partnerUid],
        createdAt: new Date(),
      });

      // ② pairPoints を初期化
      await setDoc(doc(db, "pairPoints", pairId), {
        [user.uid]: {
          received: 0,
          given: 0,
        },
        [partnerUid]: {
          received: 0,
          given: 0,
        },
      });

      // ③ users/{uid}/pairs に pairId を追加
      await updateDoc(doc(db, "users", user.uid), {
        pairs: arrayUnion(pairId),
      });

      await updateDoc(doc(db, "users", partnerUid), {
        pairs: arrayUnion(pairId),
      });

      alert("ペアを作成しました！");
    } catch (error: any) {
      alert("ペア作成に失敗しました：" + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">ペアを作成する</h1>

      <p className="text-sm text-slate-600 mb-4">
        ※ ペアリング設定は後からでも追加できます
      </p>

      <input
        type="text"
        placeholder="相手の UID を入力"
        value={partnerUid}
        onChange={(e) => setPartnerUid(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <button
        onClick={handleCreatePair}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        {loading ? "作成中…" : "ペアを作成する"}
      </button>
    </div>
  );
}
