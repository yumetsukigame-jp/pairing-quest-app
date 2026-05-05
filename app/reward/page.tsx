"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RewardPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [sortType, setSortType] = useState("low");
  const router = useRouter();

  // 🔥 ユーザーポイント取得（pairPoints）
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const pairPointsRef = collection(db, "pairPoints");
      const q = query(pairPointsRef, where(user.uid, "!=", null));
      const snap = await getDocs(q);

      let total = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data[user.uid]) {
          total += data[user.uid].received;
        }
      });

      setPoints(total);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 報酬一覧取得
  useEffect(() => {
    const fetchRewards = async () => {
      const snap = await getDocs(collection(db, "rewards"));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRewards(list);
    };

    fetchRewards();
  }, []);

  // 🔥 交換処理（固定報酬 & 可変報酬）
  const handleSelect = async (reward: any, variableAmount?: number) => {
    const cost = reward.type === "variable" ? variableAmount : reward.cost;

    if (points < cost) {
      alert("ポイントが足りません！");
      return;
    }

    if (reward.type === "fixed" && reward.stock <= 0) {
      alert("在庫がありません！");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;

    // 🔥 pairPoints の received を減算
    const pairPointsRef = collection(db, "pairPoints");
    const q = query(pairPointsRef, where(uid, "!=", null));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("ポイント情報が見つかりません");
      return;
    }

    const pairDoc = snap.docs[0];
    const pairId = pairDoc.id;
    const pairData = pairDoc.data();

    const newReceived = pairData[uid].received - cost;

    await updateDoc(doc(db, "pairPoints", pairId), {
      [`${uid}.received`]: newReceived,
    });

    // 🔥 shippingHistory に保存
    await setDoc(doc(collection(db, "shippingHistory")), {
      uid,
      rewardId: reward.id,
      name: reward.name,
      cost: cost,
      image: reward.image ?? null,
      variableAmount: reward.type === "variable" ? variableAmount : null,
      requestedAt: new Date(),
      shipped: false,
    });

    // 🔥 在庫（固定報酬のみ）
    if (reward.type === "fixed") {
      await updateDoc(doc(db, "rewards", reward.id), {
        stock: reward.stock - 1,
      });
    }

    setPoints(newReceived);
    router.push("/reward/complete");
  };

  // 🔥 ソート
  const sortedRewards = [...rewards].sort((a, b) => {
    const costA = a.type === "variable" ? a.min : a.cost;
    const costB = b.type === "variable" ? b.min : b.cost;

    if (sortType === "low") return costA - costB;
    return costB - costA;
  });

  return (
    <div className="max-w-xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold text-center">ご褒美一覧</h1>

      {/* 現在ポイント */}
      <section className="p-4 border rounded-xl bg-slate-50">
        <h2 className="text-lg font-semibold mb-2">あなたのポイント</h2>
        <p className="text-3xl font-bold text-indigo-600">{points} pt</p>
      </section>

      {/* ソート */}
      <div className="flex gap-2 items-center">
        <span className="text-sm">並び替え：</span>
        <select
          className="border p-1 rounded"
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
          <option value="low">ポイントが低い順</option>
          <option value="high">ポイントが高い順</option>
        </select>
      </div>

      {/* 報酬一覧 */}
      <section className="space-y-4">
        {sortedRewards.map((reward) => (
          <div
            key={reward.id}
            className="p-4 border rounded-xl bg-white space-y-3"
          >
            <div className="flex items-center gap-4">
              {reward.image && (
                <Image
                  src={reward.image}
                  alt={reward.name}
                  width={80}
                  height={80}
                  className="rounded-lg object-contain"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold">{reward.name}</p>

                {reward.type === "fixed" ? (
                  <p className="text-sm text-slate-500">
                    必要ポイント：{reward.cost} pt
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    申請額：{reward.min}〜{reward.max} pt
                  </p>
                )}
              </div>
            </div>

            {/* 🔥 可変報酬の入力欄 */}
            {reward.type === "variable" && (
              <VariableRewardInput
                reward={reward}
                points={points}
                onSubmit={(amount) => handleSelect(reward, amount)}
              />
            )}

            {/* 🔥 固定報酬の交換ボタン */}
            {reward.type === "fixed" && (
              <button
                onClick={() => handleSelect(reward)}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg"
              >
                交換する
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

/**
 * 可変報酬の入力コンポーネント
 */
function VariableRewardInput({
  reward,
  points,
  onSubmit,
}: {
  reward: any;
  points: number;
  onSubmit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(reward.min);

  const canExchange = amount <= points;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">希望ポイント</label>
      <input
        type="number"
        className="w-full border p-2 rounded"
        value={amount}
        min={reward.min}
        max={reward.max}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      {!canExchange && (
        <p className="text-red-500 text-sm">ポイントが足りません</p>
      )}

      <button
        disabled={!canExchange}
        onClick={() => onSubmit(amount)}
        className={`w-full px-3 py-2 rounded-lg ${
          canExchange
            ? "bg-indigo-600 text-white"
            : "bg-slate-300 text-slate-500"
        }`}
      >
        この内容で交換する
      </button>
    </div>
  );
}
