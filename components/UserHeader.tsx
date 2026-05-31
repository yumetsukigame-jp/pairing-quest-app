"use client";

import Link from "next/link";
import Image from "next/image";

export default function UserHeader() {
  return (
    <header className="w-full">
      <Link href="/" className="block">
        <Image
          src="/header.webp"
          alt="ゆめつきの書斎 ヘッダー"
          width={1200}
          height={300}
          className="w-full h-auto object-contain cursor-pointer block"
          priority
        />
      </Link>
    </header>
  );
}
