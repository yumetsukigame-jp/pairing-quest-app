"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { auth, db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function HomePage() {
  const searchParams = useSearchParams();
  const [showPairBanner, setShowPairBanner] = useState(
    searchParams.get("pairCreated") === "1"
  );

  const [userData, setUserData] = useState<any>(null);
  const [pairList, setPairList] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      // 🔥 Firestore からユーザーデータ取得
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }

      const userInfo = userSnap.data();
      setUserData(userInfo);

      // 🔥 ペア情報の読み込み（users.pairs は使わない）
      const pq = query(
        collection(db, "pairs"),
        where("members", "array-contains", user.uid),
        where("status", "==", "active")
      );

      const psnap = await getDocs(pq);

      const pairsData: any[] = [];
      let total = 0;

      for (const docSnap of psnap.docs) {
        const pairId = docSnap.id;
        const pairInfo = docSnap.data();

        // 🔥 pairPoints 読み込み
        const ppRef = doc(db, "pairPoints", pairId);
        const ppSnap = await getDoc(ppRef);
        if (!ppSnap.exists()) continue;

        const pp = ppSnap.data();
        const myPoints = pp[user.uid] || { received: 0, given: 0 };

        total += myPoints.received;

        // 🔥 相手ユーザー情報取得
        const otherUid = pairInfo.members.find((m: string) => m !== user.uid);
        const otherUserRef = doc(db, "users", otherUid);
        const otherUserSnap = await getDoc(otherUserRef);

        let otherName = "相手";
        let otherIcon: string | null = null;

        if (otherUserSnap.exists()) {
          const otherData = otherUserSnap.data();
          otherName = otherData.name || "相手";

          if (
            typeof otherData.icon === "string" &&
            otherData.icon.startsWith("/")
          ) {
            otherIcon = otherData.icon;
          }
        }

        const otherPoints = pp[otherUid]?.received ?? 0;

        pairsData.push({
          pairId,
          otherUid,
          otherName,
          otherIcon,
          myReceived: myPoints.received,
          myGiven: myPoints.given,
          otherPoints,
        });
      }

      setPairList(pairsData);
      setTotalPoints(total);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">

        {/* 🔔 ペア成立バナー */}
        {showPairBanner && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg mb-4">
            ペアが成立しました！
            <button
              onClick={() => setShowPairBanner(false)}
              className="ml-4 text-sm text-green-700 underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* 🎨 キャラ画像＋プロフィール */}
        <section className="bg-white rounded-2xl shadow p-6 flex items-center gap-6">
          <div className="flex-shrink-0">
            {userData?.icon ? (
          <Image
           src={userData.icon}
           alt="icon"
           width={200}
            height={200}
            style={{
             objectFit: "contain",
           }}
           className="rounded-xl"
          />

            ) : (
              <div className="w-[200px] h-[200px] rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                No Icon
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <h1 className="text-2xl font-bold">{userData?.name || "ユーザー"}</h1>

            <Link
              href="/profile/character-select"
              className="inline-block px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white w-fit"
            >
              キャラを変更
            </Link>

            <div className="mt-2">
              <h2 className="text-lg font-semibold">総ポイント</h2>
              <p className="text-3xl font-bold text-indigo-600">{totalPoints} pt</p>

              <Link
                href="/my-points"
                className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
              >
                詳細を見る
              </Link>
            </div>
          </div>
        </section>

        {/* ② ペア一覧 */}
        <section className="bg-white rounded-xl shadow p-4 space-y-3">
          <h3 className="text-lg font-semibold">ペア一覧</h3>

          {pairList.length === 0 && (
            <p className="text-sm text-slate-500">
              ペアがまだいません。ペア申請をしてみましょう。
            </p>
          )}

          {pairList.map((pair) => (
            <div
              key={pair.pairId}
              className="border rounded-lg p-3 bg-slate-50 flex items-center gap-4"
            >
              {/* 🔥 相手のアイコン表示 */}
              {pair.otherIcon ? (
                <Image
                  src={pair.otherIcon}
                  alt="pair icon"
                  width={60}
                  height={60}
                  className="rounded-lg object-contain border bg-white"
                />
              ) : (
                <div className="w-[60px] h-[60px] rounded-lg bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                  No Icon
                </div>
              )}

              <div className="flex-1">
                <p className="font-semibold">{pair.otherName}</p>

                <p className="text-xs text-slate-600">
                  もらった：{pair.myReceived} pt
                </p>
                <p className="text-xs text-slate-600">
                  あげた：{pair.myGiven} pt
                </p>

                <p className="text-xs text-indigo-600 font-bold mt-1">
                  相手の総ポイント：{pair.otherPoints} pt
                </p>

                {/* 🔥 ペアごとのメッセージへ */}
                <Link
                  href={`/messages/${pair.pairId}`}
                  className="text-xs text-indigo-600 underline mt-1 inline-block"
                >
                  メッセージへ
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* 🔥 ペア管理リンク */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">ペア管理</h2>
            <p className="text-sm text-slate-500">ペア申請・承認を行います</p>
          </div>
          <Link
            href="/quests/management/users"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* ③ クエスト */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">クエスト一覧</h2>
            <p className="text-sm text-slate-500">新しいクエストを受注できます</p>
          </div>
          <Link
            href="/quests"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* ⑤ ご褒美 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">ご褒美</h2>
            <p className="text-sm text-slate-500">貯めたポイントでご褒美と交換できます</p>
          </div>
          <Link
            href="/reward"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* 申請履歴 */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">申請履歴</h2>
            <p className="text-sm text-slate-500">交換申請の履歴を確認できます</p>
          </div>
          <Link
            href="/my-reward"
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
          >
            開く
          </Link>
        </section>

        {/* クエスト作成トップ */}
        <div className="text-center mt-8 mb-4">
          <Link
            href="/quests/management"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl text-lg shadow hover:bg-indigo-700 transition"
          >
            クエスト作成トップへ
          </Link>
        </div>

        {/* 🔚 ログアウト */}
        <div className="text-center mt-4 mb-6">
          <button
            onClick={async () => {
              await auth.signOut();
              window.location.href = "/login";
            }}
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            ログアウト
          </button>
        </div>

      </main>
    </div>
  );
}