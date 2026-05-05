import fs from "fs";
import path from "path";
import sharp from "sharp";

const SRC_ROOT = path.join(process.cwd(), "source_images");
const DEST_ROOT = path.join(process.cwd(), "public");

const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else if (IMAGE_EXT.test(file)) {
      results.push(fullPath);
    }
  }

  return results;
}

async function processImage(srcPath: string) {
  const relative = path.relative(SRC_ROOT, srcPath);
  const ext = path.extname(srcPath).toLowerCase();

  // WebP はスキップ
  if (ext === ".webp") {
    console.log(`⏭ スキップ（WebP のため変換不要）: ${srcPath}`);
    return;
  }

  const publicPath = path.join(DEST_ROOT, relative.replace(IMAGE_EXT, ".webp"));
  const publicDir = path.dirname(publicPath);

  const srcWebpPath = path.join(SRC_ROOT, relative.replace(IMAGE_EXT, ".webp"));
  const srcWebpDir = path.dirname(srcWebpPath);

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(srcWebpDir)) fs.mkdirSync(srcWebpDir, { recursive: true });

  console.log(`▶ 変換中: ${srcPath}`);

  const buffer = await sharp(srcPath)
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toBuffer();

  await sharp(buffer).toFile(publicPath);
  console.log(`✔ public 出力: ${publicPath}`);

  await sharp(buffer).toFile(srcWebpPath);
  console.log(`✔ source_images 出力: ${srcWebpPath}`);

  if (/\.(png|jpg|jpeg)$/i.test(srcPath)) {
    fs.unlinkSync(srcPath);
    console.log(`🗑 削除: ${srcPath}`);
  }
}

// 🔥 questicon の list.json を自動生成
function generateQuestIconList() {
  const questIconDir = path.join(DEST_ROOT, "questicon");

  if (!fs.existsSync(questIconDir)) {
    console.log("⚠ questicon フォルダが存在しません。スキップします。");
    return;
  }

  const files = fs
    .readdirSync(questIconDir)
    .filter((f) => f.endsWith(".webp"))
    .map((f) => `/questicon/${f}`);

  const jsonPath = path.join(questIconDir, "list.json");
  fs.writeFileSync(jsonPath, JSON.stringify(files, null, 2));

  console.log(`📄 list.json を生成しました: ${jsonPath}`);
  console.log(files);
}

async function run() {
  const files = getAllFiles(SRC_ROOT);

  console.log(`📸 処理対象ファイル数: ${files.length}`);

  for (const file of files) {
    await processImage(file);
  }

  console.log("\n🎉 変換完了！source_images と public に WebP が揃いました！");

  // 🔥 最後に list.json を生成
  generateQuestIconList();
}

run();
