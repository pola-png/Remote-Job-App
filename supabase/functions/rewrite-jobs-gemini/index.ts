import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gflwvtxpziasbdraugwj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Call Gemini API via fetch with fallback models
async function callGemini(prompt: string): Promise<string> {
  const models = ["gemini-3.8-flash", "gemini-3.5-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15-second max per request

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topP: 0.85,
              maxOutputTokens: 850,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      const json = await res.json();
      if (res.ok) {
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        lastError = new Error(`[${model}] ${res.status}: ${json.error?.message || JSON.stringify(json)}`);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini model fallbacks failed");
}

function cleanHtmlOrMarkdown(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildPrompt(job: any): string {
  const cleanDesc = cleanHtmlOrMarkdown(job.description).slice(0, 2500);
  return `You are a senior recruitment editor for a verified global remote job publication.
Rewrite and elevate the following remote job posting into a neat, high-quality, comprehensive, and original job specification.

Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location || "Worldwide (100% Remote)"}
Category: ${job.category || "General"}
Salary/Compensation: ${job.salary_range || "Competitive"}

Raw Job Description:
${cleanDesc}

Instructions:
1. Your task is to act as a Job Information & Quality Assistant for Remote Jobs HQ.
2. Clean, organize, and format the listing in professional Markdown with these sections:
   ### Role Overview
   (A clear, faithful overview of what the role entails, the team, and distributed work arrangements based strictly on the vacancy.)

   ### Core Responsibilities
   (Extract only duties and deliverables explicitly stated or directly supported by the employer. Do NOT fabricate extra responsibilities.)

   ### Qualifications & Requirements
   (Extract only requirements, skills, and qualifications explicitly stated by the employer. Do NOT invent years of experience or credentials.)

   ### Remote Work & Location Details
   (State the remote scope, timezone alignment, and country eligibility based solely on the listing.)

3. STRICT ACCURACY RULES:
   - Accuracy is more important than length.
   - Never invent salary figures or unverified perks.
   - Never invent interview loops or hiring stages.
   - Do NOT mention aggregator websites (Jobicy, Remotive, Himalayas, Arbeitnow, etc.).
4. Output ONLY the clean markdown text without preamble or conversational remarks.`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let limit = 20;
    try {
      const body = await req.json();
      if (body?.limit && typeof body.limit === "number") {
        limit = Math.min(body.limit, 25); // Cap to 25 to guarantee completion within 150s timeout
      }
    } catch {
      // Keep default limit if no JSON body passed
    }

    // 1. Fetch un-rewritten jobs
    const { data: jobs, error: fetchErr } = await supabase
      .from("job_postings")
      .select("id, title, company, location, category, salary_range, description")
      .eq("status", "active")
      .eq("is_ai_rewritten", false)
      .order("posted_timestamp", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "All active jobs already rewritten", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];

      // Double-check if description already formatted
      if (
        job.description &&
        job.description.includes("### Role Overview") &&
        job.description.includes("### Key Responsibilities")
      ) {
        await supabase
          .from("job_postings")
          .update({ is_ai_rewritten: true, ai_rewritten_at: new Date().toISOString() })
          .eq("id", job.id);
        successCount++;
        continue;
      }

      try {
        const prompt = buildPrompt(job);
        const enhancedDescription = await callGemini(prompt);

        if (enhancedDescription && enhancedDescription.length > 200) {
          const { error: updateErr } = await supabase
            .from("job_postings")
            .update({
              description: enhancedDescription,
              is_ai_rewritten: true,
              ai_rewritten_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          if (!updateErr) successCount++;
          else failCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Failed to rewrite job ${job.id}:`, err);
        failCount++;
      }

      if (i < jobs.length - 1) {
        await sleep(300);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: jobs.length,
        rewritten: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
