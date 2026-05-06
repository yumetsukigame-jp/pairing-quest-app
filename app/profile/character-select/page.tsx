"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CharacterSelectPage() {
  const router = useRouter();

  const [characters, setCharacters] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setSelected(data.icon || null);
        setName(data.name || "");
      }

      const res = await fetch("/characters.json");
      const list = await res.json();
      setCharacters(list);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
      name,
      icon: selected,
    });

    router.push("/");
  };

  const handleCancel = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">プロフィール編集</h1>

      <div className="space-y-2">
        <label className="text-sm font-semibold">名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">キャラを選択</h2>

        <div className="grid grid-cols-2 gap-4">
          {characters.map((char) => (
            <div
              key={char}
              onClick={() => setSelected(char)}
              className={`border rounded-xl p-2 cursor-pointer ${
                selected === char ? "ring-4 ring-indigo-500" : ""
              }`}
            >
              <Image
                src={char}
                alt="character"
                width={150}
                height={150}
                className="rounded-lg object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          保存する
        </button>

        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 bg-slate-300 text-slate-800 rounded-lg"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
