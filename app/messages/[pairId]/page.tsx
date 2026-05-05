"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  limit,
} from "firebase/firestore";
import Image from "next/image";

export default function MessagePage() {
  const { pairId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const user = auth.currentUser;

  // 🔥 メッセージ読み込み（最新20件）
  useEffect(() => {
    if (!pairId) return;

    const q = query(
      collection(db, "messages", pairId as string, "threads"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, async (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 🔥 Firestore は desc で取っているので reverse して昇順に戻す
      list = list.reverse();

      setMessages(list);

      // 🔥 user が null のタイミングは既読処理しない
      if (!user?.uid) return;

      // 🔥 未読メッセージを既読にする
      const unread = snap.docs.filter((d) => {
        const data = d.data();
        return (
          data.sender !== user.uid &&
          (!data.readBy || !data.readBy.includes(user.uid))
        );
      });

      for (const msg of unread) {
        await updateDoc(
          doc(db, "messages", pairId as string, "threads", msg.id),
          {
            readBy: [...(msg.data().readBy || []), user.uid],
          }
        );
      }

      // 🔥 自動スクロール
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsub();
  }, [pairId, user?.uid]);

  // 🔥 相手ユーザー情報取得
  useEffect(() => {
    const loadOther = async () => {
      const pairRef = doc(db, "pairs", pairId as string);
      const pairSnap = await getDoc(pairRef);
      if (!pairSnap.exists()) return;

      const pair = pairSnap.data();
      const otherUid = pair.members.find((m: string) => m !== user?.uid);

      const userRef = doc(db, "users", otherUid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      setOtherUser(userSnap.data());
    };

    loadOther();
  }, [pairId, user?.uid]);

  // 🔥 メッセージ送信
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "messages", pairId as string, "threads"), {
      text,
      sender: user?.uid,
      createdAt: serverTimestamp(),
      readBy: [user?.uid],
    });

    setText("");
  };

  // 🔥 メッセージ削除
  const deleteMessage = async (id: string) => {
    if (!confirm("このメッセージを削除しますか？")) return;

    await deleteDoc(doc(db, "messages", pairId as string, "threads", id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4 bg-white shadow flex items-center gap-3">
        {otherUser?.icon ? (
          <Image
            src={otherUser.icon}
            alt="icon"
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-[40px] h-[40px] bg-slate-300 rounded-full" />
        )}

        <h1 className="text-lg font-semibold">{otherUser?.name || "相手"}</h1>
      </header>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender === user?.uid;
          const isRead = msg.readBy?.includes(otherUser?.uid);

          // 🔥 時間フォーマット
          const time =
            msg.createdAt?.toDate &&
            msg.createdAt.toDate().toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            });

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                isMe ? "justify-end pr-16" : "justify-start pl-2"
              }`}
            >
              {/* 相手のアイコン */}
              {!isMe && otherUser?.icon && (
                <Image
                  src={otherUser.icon}
                  alt="icon"
                  width={35}
                  height={35}
                  className="rounded-full"
                />
              )}

              <div className="flex flex-col items-end">
                <div
                  className={`px-3 py-2 rounded-lg max-w-[70%] relative group ${
                    isMe
                      ? "bg-indigo-600 text-white"
                      : "bg-white border text-slate-800"
                  }`}
                >
                  {msg.text}

                  {/* 🔥 自分のメッセージだけ削除ボタン */}
                  {isMe && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* 🔥 時間表示 */}
                <span className="text-[10px] text-slate-500 mt-1">
                  {time}
                  {isMe && (isRead ? " ・既読" : " ・未読")}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="p-4 bg-white flex gap-2 border-t">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          送信
        </button>
      </div>
    </div>
  );
}
