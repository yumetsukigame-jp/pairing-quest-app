import fs from "fs";
import path from "path";

const characterDir = path.join(process.cwd(), "public", "character"); // ← 小文字に修正
const outputFile = path.join(process.cwd(), "public", "characters.json");

function generateCharacterList() {
  if (!fs.existsSync(characterDir)) {
    console.error("❌ public/character フォルダが存在しません");
    return;
  }

  const files = fs.readdirSync(characterDir);

  const list = files
    .filter((f) => f.endsWith(".webp"))
    .map((f) => `/character/${f}`); // ← 小文字に修正

  fs.writeFileSync(outputFile, JSON.stringify(list, null, 2), "utf-8");

  console.log("🎉 characters.json を生成しました:");
  console.log(list);
}

generateCharacterList();
