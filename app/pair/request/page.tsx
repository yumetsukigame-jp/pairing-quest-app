"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  addDoc,
  collection,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export default function PairRequestPage() {
  const [partnerUid, setPartnerUid] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 自分の UID を取得
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setMyUid(user.uid);
    }
  }, []);

  // UID コピー
  const handleCopyUid = async () => {
    if (!myUid) return;
    await navigator.clipboard.writeText(myUid);
    alert("あなたの UID をコピーしました");
  };

  // ペア申請処理
  const handleRequest = async () => {
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
      // 自分側の pendingPairs に申請を保存
      await setDoc(doc(db, "pendingPairs", user.uid), {
        requestedTo: partnerUid,
        createdAt: new Date(),
      });

      // 相手側の pendingPairs をチェック
      const otherPendingRef = doc(db, "pendingPairs", partnerUid);
      const otherSnap = await getDoc(otherPendingRef);

      let pairCreated = false;

      // 相互申請が揃ったらペア成立
      if (otherSnap.exists() && otherSnap.data().requestedTo === user.uid) {
        const pairId = uuidv4();

        // ① pairs 作成
        await setDoc(doc(db, "pairs", pairId), {
          members: [user.uid, partnerUid],
          createdAt: new Date(),
        });

        // ② pairPoints 初期化
        await setDoc(doc(db, "pairPoints", pairId), {
          [user.uid]: { received: 0, given: 0 },
          [partnerUid]: { received: 0, given: 0 },
        });

        // ③ users の pairs に追加
        await updateDoc(doc(db, "users", user.uid), {
          pairs: arrayUnion(pairId),
        });
        await updateDoc(doc(db, "users", partnerUid), {
          pairs: arrayUnion(pairId),
        });

        // ④ pendingPairs を削除
        await deleteDoc(doc(db, "pendingPairs", user.uid));
        await deleteDoc(doc(db, "pendingPairs", partnerUid));

        // ⑤ メッセージ履歴に自動投稿
        await addDoc(collection(db, "messages", pairId, "items"), {
          sender: "system",
          text: "ペアが成立しました！",
          createdAt: new Date(),
        });

        pairCreated = true;
      }

      // 成立したらトップページへ（バナー表示）
      if (pairCreated) {
        router.push("/?pairCreated=1");
      } else {
        alert("ペア申請を送信しました。相手もあなたの UID を入力するとペアが成立します。");
      }
    } catch (error: any) {
      alert("申請に失敗しました：" + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">ペア申請</h1>

      <p className="text-sm text-slate-600">
        お互いが相手の UID を入力するとペアが成立します。
        <br />
        ペアリング設定は後からでも追加できます。
      </p>

      {/* 自分の UID 表示 */}
      <div className="bg-slate-50 border rounded-lg p-3 text-sm">
        <p className="font-semibold mb-1">あなたの UID</p>
        <p className="break-all text-xs mb-2">
          {myUid ?? "ログイン情報を取得中…"}
        </p>
        <button
          onClick={handleCopyUid}
          disabled={!myUid}
          className="px-3 py-1 text-xs rounded bg-slate-200"
        >
          UID をコピー
        </button>
      </div>

      {/* 相手の UID 入力 */}
      <div>
        <p className="text-sm font-semibold mb-1">相手の UID</p>
        <input
          type="text"
          placeholder="相手の UID を入力"
          value={partnerUid}
          onChange={(e) => setPartnerUid(e.target.value)}
          className="w-full border p-2 rounded mb-2"
        />
      </div>

      <button
        onClick={handleRequest}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        {loading ? "送信中…" : "申請する"}
      </button>
    </div>
  );
}
