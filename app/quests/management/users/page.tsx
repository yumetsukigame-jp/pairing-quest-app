"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";

export default function PairManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);

  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [activePairs, setActivePairs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setMyUid(user.uid);

      // 🔥 全ユーザー取得
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);

      // 🔥 自分が関係する pairs を取得
      const pq = query(
        collection(db, "pairs"),
        where("members", "array-contains", user.uid)
      );
      const psnap = await getDocs(pq);

      const active: any[] = [];
      const received: any[] = [];
      const sent: any[] = [];

      psnap.forEach((d) => {
        const data = d.data();
        const otherUid = data.members.find((m: string) => m !== user.uid);

        if (data.status === "active") {
          active.push({ id: d.id, otherUid, ...data });
        }

        if (data.status === "pending") {
          if (data.requester === user.uid) {
            sent.push({ id: d.id, otherUid, ...data });
          } else {
            received.push({ id: d.id, otherUid, ...data });
          }
        }
      });

      setActivePairs(active);
      setPendingReceived(received);
      setPendingSent(sent);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔥 ペア申請
  const sendPairRequest = async (targetUid: string) => {
    if (!myUid) return;

    const pairRef = doc(collection(db, "pairs"));
    await setDoc(pairRef, {
      members: [myUid, targetUid],
      requester: myUid,
      status: "pending",
      createdAt: new Date(),
    });

    alert("ペア申請を送りました！");
  };

  // 🔥 ペア承認
  const approvePair = async (pairId: string, otherUid: string) => {
    if (!myUid) return;

    await updateDoc(doc(db, "pairs", pairId), {
      status: "active",
    });

    await setDoc(doc(db, "pairPoints", pairId), {
      [myUid]: { received: 0, given: 0 },
      [otherUid]: { received: 0, given: 0 },
    });

    alert("ペアが成立しました！");
  };

  // 🔥 ペア解除
  const removePair = async (pairId: string) => {
    if (!confirm("ペアを解除しますか？")) return;

    await updateDoc(doc(db, "pairs", pairId), {
      status: "removed",
    });

    alert("ペアを解除しました");
  };

  if (loading) return <div className="p-6 text-center">読み込み中…</div>;

  // 🔥 申請可能ユーザー = 全ユーザー − 自分 − active − pending
  const unavailableUids = new Set([
    myUid,
    ...activePairs.map((p) => p.otherUid),
    ...pendingReceived.map((p) => p.otherUid),
    ...pendingSent.map((p) => p.otherUid),
  ]);

  const availableUsers = users.filter((u) => !unavailableUids.has(u.id));

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">ペア管理</h1>

      {/* 🔥 承認待ち（相手からの申請） */}
      {pendingReceived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">承認待ちのペア申請</h2>

          {pendingReceived.map((p) => {
            const other = users.find((u) => u.id === p.otherUid);

            return (
              <div
                key={p.id}
                className="p-4 border rounded-xl bg-white flex items-center gap-4"
              >
                {other?.icon ? (
                  <Image
                    src={other.icon}
                    alt="icon"
                    width={60}
                    height={60}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] bg-slate-200 rounded-lg"></div>
                )}

                <div className="flex-1">
                  <p className="font-semibold">{other?.name}</p>
                  <p className="text-xs text-slate-500">{other?.email}</p>
                  <p className="text-orange-600 text-sm font-semibold">
                    あなたへのペア申請があります
                  </p>
                </div>

                <button
                  onClick={() => approvePair(p.id, p.otherUid)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg"
                >
                  承認する
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* 🔥 自分が送った申請 */}
      {pendingSent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">申請中のペア</h2>

          {pendingSent.map((p) => {
            const other = users.find((u) => u.id === p.otherUid);

            return (
              <div
                key={p.id}
                className="p-4 border rounded-xl bg-white flex items-center gap-4"
              >
                {other?.icon ? (
                  <Image
                    src={other.icon}
                    alt="icon"
                    width={60}
                    height={60}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] bg-slate-200 rounded-lg"></div>
                )}

                <div className="flex-1">
                  <p className="font-semibold">{other?.name}</p>
                  <p className="text-xs text-slate-500">{other?.email}</p>
                  <p className="text-blue-600 text-sm font-semibold">
                    申請中…
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 🔥 アクティブなペア */}
      {activePairs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">ペア一覧</h2>

          {activePairs.map((p) => {
            const other = users.find((u) => u.id === p.otherUid);

            return (
              <div
                key={p.id}
                className="p-4 border rounded-xl bg-white flex items-center gap-4"
              >
                {other?.icon ? (
                  <Image
                    src={other.icon}
                    alt="icon"
                    width={60}
                    height={60}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] bg-slate-200 rounded-lg"></div>
                )}

                <div className="flex-1">
                  <p className="font-semibold">{other?.name}</p>
                  <p className="text-xs text-slate-500">{other?.email}</p>
                  <p className="text-green-600 text-sm font-semibold">
                    ✔ ペア成立中
                  </p>
                </div>

                <button
                  onClick={() => removePair(p.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg"
                >
                  ペア解除
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* 🔥 ペア申請可能なユーザー */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ペア申請</h2>

        {availableUsers.length === 0 && (
          <p className="text-sm text-slate-500">申請可能なユーザーはいません</p>
        )}

        {availableUsers.map((u) => (
          <div
            key={u.id}
            className="p-4 border rounded-xl bg-white flex items-center gap-4"
          >
            {u.icon ? (
              <Image
                src={u.icon}
                alt="icon"
                width={60}
                height={60}
                className="rounded-lg object-contain"
              />
            ) : (
              <div className="w-[60px] h-[60px] bg-slate-200 rounded-lg"></div>
            )}

            <div className="flex-1">
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>

            <button
              onClick={() => sendPairRequest(u.id)}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg"
            >
              申請
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
