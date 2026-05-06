export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "rewards");

    // PNG / JPG / JPEG / WEBP を取得
    const files = fs
      .readdirSync(dir)
      .filter((file) =>
        file.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/)
      );

    // パスを返す
    const images = files.map((file) => `/rewards/${file}`);

    return Response.json(images);
  } catch (error) {
    console.error("API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
