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
      //   （全体クエストは失敗時ポイント移動なし）
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

    // v2 API では return null は不要
  }
);

/**
 * クエスト失敗時のポイント移動
 * 仕様：
 * - ペア指定クエストのみポイント移動
 * - 失敗者（executor） → 設定者（creator）にポイントが動く
 *   - executor.given   += pointsFail
 *   - creator.received += pointsFail
 * - 全体クエスト（targetPair === "all"）は失敗時ポイント移動なし
 */
async function applyFailPoints(quest: any) {
  const pairId = quest.targetPair;
  const executor = quest.executor;
  const creator = quest.createdBy;
  const pointsFail = quest.pointsFail || 0;

  // 全体クエストは失敗時のみポイント移動なし
  if (!pairId || pairId === "all") return;
  if (!executor || !creator) return;

  const pairPointsRef = db.collection("pairPoints").doc(pairId);
  const pairPointsSnap = await pairPointsRef.get();
  if (!pairPointsSnap.exists) return;

  const pairPoints = pairPointsSnap.data() || {};

  const execCurrent =
    pairPoints[executor] || { received: 0, given: 0 };
  const creatorCurrent =
    pairPoints[creator] || { received: 0, given: 0 };

  await pairPointsRef.update({
    // 失敗者 → あげた（given）が増える
    [executor]: {
      received: execCurrent.received,
      given: execCurrent.given + pointsFail,
    },
    // 設定者 → もらった（received）が増える
    [creator]: {
      received: creatorCurrent.received + pointsFail,
      given: creatorCurrent.given,
    },
  });

  console.log(
    `失敗ポイント ${pointsFail}pt: executor(${executor}) → creator(${creator})`
  );
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
 * クエスト達成時にポイント付与
 * 仕様：
 * - 成功時は全体クエストでもポイント移動する
 * - 設定者（creator） → 実行者（executor）にポイントが動く
 *   - executor.received += pointsSuccess
 *   - creator.given    += pointsSuccess
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
    if (!(before.status === "pending" && after.status === "success")) {
      return;
    }

    console.log(`クエスト達成: ${event.params.questId}`);

    const quest = after;
    const pairId = quest.targetPair;
    const executor = quest.executor;
    const creator = quest.createdBy;
    const points = quest.pointsSuccess || 0;

    // 成功時は全体クエストでもポイント移動する
    if (!pairId || !executor || !creator) return;

    const pairPointsRef = db.collection("pairPoints").doc(pairId);
    const pairPointsSnap = await pairPointsRef.get();
    if (!pairPointsSnap.exists) return;

    const pairPoints = pairPointsSnap.data() || {};

    const execCurrent =
      pairPoints[executor] || { received: 0, given: 0 };
    const creatorCurrent =
      pairPoints[creator] || { received: 0, given: 0 };

    await pairPointsRef.update({
      // 実行者 → もらった（received）が増える
      [executor]: {
        received: execCurrent.received + points,
        given: execCurrent.given,
      },
      // 設定者 → あげた（given）が増える
      [creator]: {
        received: creatorCurrent.received,
        given: creatorCurrent.given + points,
      },
    });

    console.log(
      `成功ポイント ${points}pt: creator(${creator}) → executor(${executor})`
    );
  }
);
