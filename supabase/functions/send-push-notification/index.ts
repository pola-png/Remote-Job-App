import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// =====================================================================
// XapZap / Remote Job: Dynamic Highest-Paying Task Push Notification Service
// Fetches live tasks, identifies highest paying opportunity, and dispatches
// high-converting push messages calling users back to the app.
// Deploy with: supabase functions deploy send-push-notification
// =====================================================================

const FIREBASE_PROJECT_ID = "xapzap-34fb4";
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

interface TaskCandidate {
  id: string;
  title: string;
  rawTitle: string;
  payoutUsd: number;
  payoutFormatted: string;
  category: "SURVEY" | "APP_INSTALL" | "WEBSITE" | "VIDEO" | "FAST_TRACK";
  actionUrl: string;
  network: "CPALEAD" | "CPAGRIP" | "DIRECT";
}

// Strip geo tags, device notes, and affiliate noise from task titles
function sanitizeTaskTitle(raw: string): string {
  if (!raw) return "Featured Task";
  let clean = raw
    .replace(/\[.*?\]/g, "") // Remove [US, CA only], [Android], etc.
    .replace(/\(.*?(only|device|incent|free|trial|install|download|fast).*?\)/gi, "")
    .replace(/[-–|]\s*(Android|iOS|Mobile|US|UK|Global|Pin Submit).*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // If excessively long, trim at word boundary
  if (clean.length > 36) {
    clean = clean.substring(0, 33).trim() + "...";
  }
  return clean || "High-Payout Task";
}

// Categorize candidate based on keywords
function detectTaskCategory(rawCategory: string, title: string, desc: string): "SURVEY" | "APP_INSTALL" | "WEBSITE" | "VIDEO" | "FAST_TRACK" {
  const combined = `${rawCategory} ${title} ${desc}`.toLowerCase();
  if (combined.includes("install") || combined.includes("download") || combined.includes("app") || combined.includes("game")) {
    return "APP_INSTALL";
  }
  if (combined.includes("video") || combined.includes("watch") || combined.includes("stream")) {
    return "VIDEO";
  }
  if (combined.includes("survey") || combined.includes("quiz") || combined.includes("opinion") || combined.includes("feedback")) {
    return "SURVEY";
  }
  if (combined.includes("locker") || combined.includes("vip") || combined.includes("fast-track")) {
    return "FAST_TRACK";
  }
  return "WEBSITE";
}

// Fetch live tasks from all networks and find the single highest-paying opportunity
async function fetchHighestPayingTask(): Promise<TaskCandidate> {
  const candidates: TaskCandidate[] = [];

  // 1. Fetch CPAlead Live Offers (Publisher 3367742)
  const fetchCpaLead = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const url = "https://www.cpalead.com/api/offers?id=3367742&country=user&device=android&limit=30&format=json";
      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return;
      const json = await res.json();
      const offers = json?.offers;
      if (Array.isArray(offers)) {
        for (const o of offers) {
          const parsed = parseFloat(String(o.amount || "0"));
          if (!isNaN(parsed) && parsed > 0) {
            candidates.push({
              id: `cpalead_${o.id}`,
              title: sanitizeTaskTitle(o.title || "Sponsored Task"),
              rawTitle: String(o.title || ""),
              payoutUsd: parsed,
              payoutFormatted: `$${parsed.toFixed(2)}`,
              category: detectTaskCategory(o.payout_type || "", o.title || "", o.description || ""),
              actionUrl: String(o.link || ""),
              network: "CPALEAD",
            });
          }
        }
      }
    } catch (e) {
      console.warn("[Push] CPAlead fetch skipped or timed out:", e);
    }
  };

  // 2. Fetch CPAGrip Live Offers (Publisher 2562057)
  const fetchCpaGrip = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const url = "https://www.cpagrip.com/common/offer_feed_json.php?user_id=2562057&pubkey=91d72ec7105a456434a2f85c9692c1c8&limit=30";
      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return;
      const json = await res.json();
      const offers = json?.offers;
      if (Array.isArray(offers)) {
        for (const o of offers) {
          const parsed = parseFloat(String(o.payout || "0"));
          if (!isNaN(parsed) && parsed > 0) {
            candidates.push({
              id: `cpagrip_${o.offer_id}`,
              title: sanitizeTaskTitle(o.title || "Partner Task"),
              rawTitle: String(o.title || ""),
              payoutUsd: parsed,
              payoutFormatted: `$${parsed.toFixed(2)}`,
              category: detectTaskCategory(o.category || "", o.title || "", o.description || ""),
              actionUrl: String(o.offerlink || ""),
              network: "CPAGRIP",
            });
          }
        }
      }
    } catch (e) {
      console.warn("[Push] CPAGrip fetch skipped or timed out:", e);
    }
  };

  // 3. Guaranteed High-Paying Platform Baseline Tasks
  candidates.push({
    id: "cpalead_locker_67493",
    title: "VIP Fast-Track Offer Locker",
    rawTitle: "VIP Fast-Track: High-Payout Offer Locker",
    payoutUsd: 2.50,
    payoutFormatted: "$2.50",
    category: "FAST_TRACK",
    actionUrl: "https://www.fastsvr.com/unlock/suMfPdJ?publisherUserId=3367742",
    network: "CPALEAD",
  });

  candidates.push({
    id: "playstore_inapp_review_v1",
    title: "Google Play In-App Review Task",
    rawTitle: "Rate & Review on Google Play",
    payoutUsd: 1.00,
    payoutFormatted: "$1.00",
    category: "APP_INSTALL",
    actionUrl: "",
    network: "DIRECT",
  });

  // Run external API fetches concurrently
  await Promise.allSettled([fetchCpaLead(), fetchCpaGrip()]);

  // Sort candidate tasks strictly by payout in descending order
  candidates.sort((a, b) => b.payoutUsd - a.payoutUsd);

  const highest = candidates[0];
  console.log(`[Push] Evaluated ${candidates.length} candidates. Highest paying task: "${highest.title}" paying ${highest.payoutFormatted} (${highest.id})`);
  return highest;
}

// Generate captivating, high-converting notification copies tailored to the highest-paying task
function generateHighestPayingTaskAlert(task: TaskCandidate, currentSlot: number): { title: string; message: string } {
  const payout = task.payoutFormatted;
  const title = task.title;

  // Time-of-day contextual templates that weave in real task title & payout
  const slotCopyMap: Record<number, Array<{ title: string; message: string }>> = {
    // 00:00 - 02:59 UTC (Late Night Boost)
    0: [
      {
        title: `🌙 Night Boost: ${payout} Task Open`,
        message: `Earn ${payout} right now with "${title}". Complete it in 2 minutes and wake up to cash!`,
      },
      {
        title: `⚡ Flash Night Earning: ${payout}`,
        message: `Top night-owl task "${title}" is live! Add ${payout} directly to your wallet balance.`,
      },
    ],
    // 03:00 - 05:59 UTC (Early Morning Payouts)
    1: [
      {
        title: `💸 Early Bird Alert: Earn ${payout}`,
        message: `Fresh high-paying task unlocked: "${title}". Be one of the first to claim ${payout}!`,
      },
      {
        title: `🔔 ${payout} Task Ready to Claim`,
        message: `Start your day with instant earnings. Complete "${title}" to get credited ${payout} now.`,
      },
    ],
    // 06:00 - 08:59 UTC (Morning Rush)
    2: [
      {
        title: `☕ Morning Cash Drop: ${payout} Live`,
        message: `Grab ${payout} with your morning coffee! "${title}" is paying top rates right now.`,
      },
      {
        title: `🔥 Highest Paying Task: ${payout}`,
        message: `Advertisers just posted "${title}" for ${payout}. Spots are filling fast — tap to start!`,
      },
    ],
    // 09:00 - 11:59 UTC (Mid-Day Peak)
    3: [
      {
        title: `💎 High-Payout Alert: ${payout} on ${title}`,
        message: `Claim ${payout} instantly! Complete this verified sponsor task and cash out today.`,
      },
      {
        title: `🚀 Daily Top Earner: ${payout} Available`,
        message: `"${title}" has our highest payout today. Open the app to complete it before it expires!`,
      },
    ],
    // 12:00 - 14:59 UTC (Lunchtime Drop)
    4: [
      {
        title: `🍱 Lunch Break Cash: Earn ${payout}`,
        message: `Turn 3 minutes into ${payout}! "${title}" is waiting in your task hub right now.`,
      },
      {
        title: `💰 Instant ${payout} Task Available`,
        message: `Boost your creator balance by ${payout} with "${title}". Tap here to start and earn!`,
      },
    ],
    // 15:00 - 17:59 UTC (Afternoon Surge)
    5: [
      {
        title: `⚡ Afternoon Surge: ${payout} Task Live`,
        message: `Over 500 users cashed out today! Claim ${payout} on "${title}" while spots remain.`,
      },
      {
        title: `🎯 Top Bounty: ${payout} on "${title}"`,
        message: `New sponsored requirement available. Finish it now and withdraw your cash straight away!`,
      },
    ],
    // 18:00 - 20:59 UTC (Evening Prime Time)
    6: [
      {
        title: `🌟 Prime Time Reward: ${payout} Available`,
        message: `Evening rush is live! Earn ${payout} with "${title}" before daily spots reset.`,
      },
      {
        title: `🔔 New ${payout} Task Just Dropped`,
        message: `Complete "${title}" tonight and add ${payout} to your balance. Tap to begin!`,
      },
    ],
    // 21:00 - 23:59 UTC (Night Cap & Final Bonus)
    7: [
      {
        title: `✨ End-of-Day Bonus: ${payout} Task`,
        message: `Last call to earn ${payout} on "${title}" before tomorrow's refresh. Tap to cash out!`,
      },
      {
        title: `💸 Instant Withdrawal Alert: ${payout}`,
        message: `Hit your payout threshold tonight with "${title}". Pocket ${payout} in minutes!`,
      },
    ],
  };

  const pool = slotCopyMap[currentSlot] ?? slotCopyMap[0];
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected;
}

// Get an OAuth2 access token from Firebase service account
async function getFirebaseAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${signingInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

serve(async (req: Request) => {
  console.log(`[Push] Incoming request: ${req.method} ${req.url}`);

  // Allow CORS
  if (req.method === "OPTIONS") {
    console.log("[Push] CORS preflight OPTIONS request");
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json().catch((e: any) => {
      console.warn("[Push] Request body parsing failed or empty:", e);
      return {};
    });
    console.log("[Push] Request body:", JSON.stringify(body));

    // 1. Dynamically fetch the current highest-paying task
    const highestTask = await fetchHighestPayingTask();

    // 2. Compute time slot (8 three-hour slots covering 24h)
    const currentUtcHour = new Date().getUTCHours();
    const currentSlot = Math.floor(currentUtcHour / 3);

    // 3. Generate high-converting push notification copy based on the real task details
    const generatedAlert = generateHighestPayingTaskAlert(highestTask, currentSlot);

    // Allow manual overrides if explicitly supplied in the request body
    const title: string = body.title ?? generatedAlert.title;
    const message: string = body.message ?? generatedAlert.message;
    const topic: string = body.topic ?? "all-users";
    const targetToken: string | undefined = body.token;

    // Rich deep link data payload attached to the notification
    const data: Record<string, string> = {
      targetScreen: "MICRO_JOBS",
      type: "highest_paying_task_alert",
      taskId: highestTask.id,
      taskTitle: highestTask.title,
      reward: highestTask.payoutFormatted,
      rewardUsd: String(highestTask.payoutUsd),
      category: highestTask.category,
      actionUrl: highestTask.actionUrl || "",
      network: highestTask.network,
      timestamp: String(Date.now()),
      ...(body.data || {}),
    };

    // Load Firebase service account from Supabase secrets
    const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) {
      console.error("[Push] Error: FIREBASE_SERVICE_ACCOUNT secret is not set in environment!");
      return new Response(
        JSON.stringify({
          error: "FIREBASE_SERVICE_ACCOUNT secret not set",
          highestTaskPreview: {
            title,
            message,
            task: highestTask,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Push] FIREBASE_SERVICE_ACCOUNT secret found. Parsing...");
    const serviceAccount = JSON.parse(serviceAccountStr);

    // Get Firebase OAuth2 access token
    console.log("[Push] Requesting Firebase access token...");
    const accessToken = await getFirebaseAccessToken(serviceAccount);
    console.log("[Push] Firebase token generated successfully.");

    // Build FCM message payload targeting topic or specific device token
    const messageTarget = targetToken ? { token: targetToken } : { topic };

    const fcmPayload = {
      message: {
        ...messageTarget,
        notification: {
          title,
          body: message,
        },
        android: {
          priority: "high",
          notification: {
            channel_id: "remote_job_alerts_channel",
            sound: "default",
            tag: "highest_paying_task",
          },
        },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
    };

    console.log(`[Push] Dispatching FCM notification with top task: "${highestTask.title}" (${highestTask.payoutFormatted})`);
    const fcmRes = await fetch(FCM_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmData = await fcmRes.json();
    console.log("[Push] FCM Response status:", fcmRes.status);
    console.log("[Push] FCM Response body:", JSON.stringify(fcmData));

    if (!fcmRes.ok) {
      console.error("[Push] FCM error returned:", JSON.stringify(fcmData));
      return new Response(JSON.stringify({ error: "FCM error", details: fcmData }), {
        status: fcmRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Push] Highest paying task notification sent successfully!");
    return new Response(
      JSON.stringify({
        success: true,
        messageId: fcmData.name,
        target: targetToken ? `token:${targetToken.slice(0, 8)}...` : `topic:${topic}`,
        highestTask: {
          id: highestTask.id,
          title: highestTask.title,
          payout: highestTask.payoutFormatted,
          payoutUsd: highestTask.payoutUsd,
          category: highestTask.category,
          network: highestTask.network,
        },
        notification: {
          title,
          body: message,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Push] Uncaught exception in edge function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
