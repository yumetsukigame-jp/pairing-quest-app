import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * 毎分実行されるスケジュールタスク
 * 期限切れクエストの処理 & デイリークエストの再配置
 */
exports.checkQuestDeadlines = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    const now = new Date();

    const questsRef = db.collection("quests");
    const snapshot = await questsRef.where("status", "==", "pending").get();

    const batch = db.batch();

    for (const docSnap of snapshot.docs) {
      const quest = docSnap.data();
      const questId = docSnap.id;

      const deadline = quest.deadline ? quest.deadline.toDate() : null;
      if (!deadline) continue;

      if (deadline <= now) {
        console.log(`期限切れクエスト: ${questId}`);

        /**
         * 🔥 非公開クエストはポイント処理しない
         * → status を failed にするだけで終了
         */
        if (quest.isPublic === false) {
          batch.update(docSnap.ref, {
            status: "failed",
            failedAt: admin.firestore.Timestamp.now(),
          });
          continue; // ← 次のクエストへ
        }

        /**
         * 🔥 公開クエストだけ不達成ポイント処理
         */
        batch.update(docSnap.ref, {
          status: "failed",
          failedAt: admin.firestore.Timestamp.now(),
        });

        // executor が存在する場合のみ減点
        if (quest.executor) {
          await applyFailPoints(quest);
        }

        /**
         * デイリークエストの再配置
         */
        if (quest.questType === "daily") {
          const nextDeadline = getNextDailyDeadline(quest.dailyResetTime);

          batch.update(docSnap.ref, {
            status: "pending",
            deadline: nextDeadline,
          });

          console.log(`デイリー再配置: ${questId}`);
        }
      }
    }

    await batch.commit();
    return null;
  });

/**
 * 不達成ポイントを実行者に付与
 */
async function applyFailPoints(quest: any) {
  const pairId = quest.targetPair;
  const executor = quest.executor;
  const pointsFail = quest.pointsFail || 0;

  if (!pairId || !executor) return;

  const pairPointsRef = db.collection("pairPoints").doc(pairId);
  const pairPointsSnap = await pairPointsRef.get();
  if (!pairPointsSnap.exists) return;

  const pairPoints = pairPointsSnap.data();
  const current = pairPoints[executor] || { received: 0, given: 0 };

  await pairPointsRef.update({
    [executor]: {
      received: current.received + pointsFail,
      given: current.given,
    },
  });

  console.log(`不達成ポイント ${pointsFail} を実行者 ${executor} に付与しました`);
}

/**
 * デイリークエストの次回期限を計算
 */
function getNextDailyDeadline(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);

  const next = new Date();
  next.setHours(h, m, 0, 0);

  if (next <= new Date()) {
    next.setDate(next.getDate() + 1);
  }

  return admin.firestore.Timestamp.fromDate(next);
}

/**
 * クエスト達成時にポイント付与（実行者に付与）
 */
exports.onQuestSuccess = functions.firestore
  .document("quests/{questId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // pending → success のときのみ実行
    if (before.status === "pending" && after.status === "success") {
      console.log(`クエスト達成: ${context.params.questId}`);

      const quest = after;
      const pairId = quest.targetPair;
      const executor = quest.executor;
      const points = quest.pointsSuccess || 0;

      if (!pairId || !executor) return;

      const pairPointsRef = db.collection("pairPoints").doc(pairId);
      const pairPointsSnap = await pairPointsRef.get();
      if (!pairPointsSnap.exists) return;

      const pairPoints = pairPointsSnap.data();
      const current = pairPoints[executor] || { received: 0, given: 0 };

      await pairPointsRef.update({
        [executor]: {
          received: current.received + points,
          given: current.given,
        },
      });

      console.log(`達成ポイント +${points}pt を実行者 ${executor} に付与しました`);
    }
  });
