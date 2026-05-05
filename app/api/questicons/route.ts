import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public/questicon");
  const files = fs.readdirSync(dir);

  // 画像ファイルだけに絞る
  const icons = files
    .filter((file) => /\.(png|jpg|jpeg|webp|gif|svg)$/.test(file))
    .map((file) => `/questicon/${file}`);

  return NextResponse.json(icons);
}
