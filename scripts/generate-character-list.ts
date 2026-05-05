import fs from "fs";
import path from "path";

const PUBLIC_CHARACTER_DIR = path.join(process.cwd(), "public/Character");
const OUTPUT_JSON = path.join(process.cwd(), "public/characters.json");

function run() {
  if (!fs.existsSync(PUBLIC_CHARACTER_DIR)) {
    console.error("❌ public/Character フォルダが存在しません");
    return;
  }

  const files = fs.readdirSync(PUBLIC_CHARACTER_DIR);

  const webpFiles = files
    .filter((f) => f.toLowerCase().endsWith(".webp"))
    .map((f) => `/character/${f}`);

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(webpFiles, null, 2));

  console.log("🎉 characters.json を生成しました:");
  console.log(webpFiles);
}

run();
