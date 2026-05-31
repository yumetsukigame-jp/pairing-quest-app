"use client";

import Link from "next/link";

export default function UserHeader() {
  return (
    <header className="w-full">
      <Link href="/">
        <img
          src="/header.webp"
          alt="ゆめつきの書斎 ヘッダー"
          className="w-full h-auto object-contain cursor-pointer"
        />
      </Link>
    </header>
  );
}
