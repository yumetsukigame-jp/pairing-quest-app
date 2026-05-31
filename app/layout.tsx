import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserFooter from "@/components/UserFooter";
import UserHeader from "@/components/UserHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PairingQuest",
  description: "ペアでクエストを楽しむアプリ",

  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  },

  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 共通ヘッダー */}
        <UserHeader />

        {/* ページ内容 */}
        <div className="flex-1">
          {children}
        </div>

        {/* 共通フッター */}
        <UserFooter />
      </body>
    </html>
  );
}
