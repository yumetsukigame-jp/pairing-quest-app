import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * 毎分実行されるスケジュールタスク
 * 期限切れクエストの処理 & デイリークエストの再配置
 */
export const checkQuestDeadlines = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Asia/Tokyo",
    region: "us-central1",
  },
  async () => {
    const now = new Date();

    const questsRef = db.collection("quests");
    const snapshot = await questsRef.where("status", "==", "pending").get();

    for (const docSnap of snapshot.docs) {
      const quest = docSnap.data();
      const questId = docSnap.id;

      const deadline = quest.deadline ? quest.deadline.toDate() : null;
      if (!deadline) continue;

      // まだ期限前ならスキップ
      if (deadline > now) continue;

      console.log(`期限切れクエスト: ${questId}`);

      // ① failed にする
      await docSnap.ref.update({
        status: "failed",
        executor: null,
        failedAt: admin.firestore.Timestamp.now(),
      });

      // ② ペア指定クエストのみ失敗ポイント付与
      if (quest.targetPair !== "all" && quest.executor) {
        await applyFailPoints(quest);
      }

      // ③ デイリークエストは再配置
      if (quest.questType === "daily") {
        const nextDeadline = getNextDailyDeadline(quest.dailyResetTime);

        await docSnap.ref.update({
          status: "pending",
          executor: null,
          deadline: nextDeadline,
        });

        console.log(`デイリー再配置: ${questId}`);
      }
    }

    // ※ v2 API では return null を書かないこと！
  }
);

/**
 * 不達成ポイントを実行者に付与（ペア指定クエストのみ）
 */
async function applyFailPoints(quest: any) {
  const pairId = quest.targetPair;
  const executor = quest.executor;
  const pointsFail = quest.pointsFail || 0;

  if (!pairId || !executor) return;

  const pairPointsRef = db.collection("pairPoints").doc(pairId);
  const pairPointsSnap = await pairPointsRef.get();
  if (!pairPointsSnap.exists) return;

  const pairPoints = pairPointsSnap.data() || {};
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
  const safe = timeStr || "00:00";
  const [h, m] = safe.split(":").map(Number);

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
export const onQuestSuccess = onDocumentUpdated(
  {
    document: "quests/{questId}",
    region: "us-central1",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    // pending → success のときのみ実行
    if (before.status === "pending" && after.status === "success") {
      console.log(`クエスト達成: ${event.params.questId}`);

      const quest = after;
      const pairId = quest.targetPair;
      const executor = quest.executor;
      const points = quest.pointsSuccess || 0;

      if (!pairId || !executor) return;

      const pairPointsRef = db.collection("pairPoints").doc(pairId);
      const pairPointsSnap = await pairPointsRef.get();
      if (!pairPointsSnap.exists) return;

      const pairPoints = pairPointsSnap.data() || {};
      const current = pairPoints[executor] || { received: 0, given: 0 };

      await pairPointsRef.update({
        [executor]: {
          received: current.received + points,
          given: current.given,
        },
      });

      console.log(`達成ポイント +${points}pt を実行者 ${executor} に付与しました`);
    }
  }
);
