// Supabase Edge Function: sync-remote-jobs
// Ingests external job feeds, normalizes, deduplicates, and upserts to Supabase `public.job_postings`
// Setup type definitions for Deno runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;/gi, "—")
    .replace(/&bull;/gi, "•")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

function normalizeCategory(raw: string = ""): string {
  const cat = raw.toLowerCase();
  if (
    cat.includes("dev") ||
    cat.includes("software") ||
    cat.includes("engineer") ||
    cat.includes("tech") ||
    cat.includes("python") ||
    cat.includes("react") ||
    cat.includes("frontend") ||
    cat.includes("backend") ||
    cat.includes("fullstack") ||
    cat.includes("mobile") ||
    cat.includes("web")
  ) {
    return "DEVELOPMENT";
  }
  if (
    cat.includes("design") ||
    cat.includes("ui") ||
    cat.includes("ux") ||
    cat.includes("creative") ||
    cat.includes("product design") ||
    cat.includes("graphic")
  ) {
    return "DESIGN";
  }
  if (
    cat.includes("writing") ||
    cat.includes("content") ||
    cat.includes("copy") ||
    cat.includes("editor") ||
    cat.includes("writer")
  ) {
    return "WRITING";
  }
  if (
    cat.includes("support") ||
    cat.includes("customer") ||
    cat.includes("success") ||
    cat.includes("service") ||
    cat.includes("help")
  ) {
    return "SUPPORT";
  }
  if (
    cat.includes("assistant") ||
    cat.includes("virtual") ||
    cat.includes("admin") ||
    cat.includes("operations")
  ) {
    return "ASSISTANT";
  }
  if (
    cat.includes("data") ||
    cat.includes("analytics") ||
    cat.includes("entry") ||
    cat.includes("ai")
  ) {
    return "DATA";
  }
  if (
    cat.includes("sales") ||
    cat.includes("account") ||
    cat.includes("business development") ||
    cat.includes("sdr")
  ) {
    return "SALES";
  }
  if (
    cat.includes("finance") ||
    cat.includes("accounting") ||
    cat.includes("payroll") ||
    cat.includes("tax")
  ) {
    return "FINANCE";
  }
  if (
    cat.includes("market") ||
    cat.includes("growth") ||
    cat.includes("seo") ||
    cat.includes("social")
  ) {
    return "MARKETING";
  }
  return "DEVELOPMENT";
}

function formatSalary(min?: number | null, max?: number | null, currency = "$") {
  if (min && max) {
    return `${currency}${Number(min).toLocaleString()} - ${currency}${Number(max).toLocaleString()} / yr`;
  }
  if (min) {
    return `${currency}${Number(min).toLocaleString()}+ / yr`;
  }
  if (max) {
    return `Up to ${currency}${Number(max).toLocaleString()} / yr`;
  }
  return "$ Competitive";
}

async function fetchExternalFeeds() {
  const allJobs: any[] = [];

  // 1. Jobicy
  try {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=100");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.jobs)) {
        for (const item of data.jobs) {
          const rawCat = Array.isArray(item.jobIndustry) ? item.jobIndustry[0] : (item.jobIndustry || "");
          const rawType = Array.isArray(item.jobType) ? item.jobType[0] : (item.jobType || "Full-time");
          let jobType = "Full-time";
          if (rawType.toLowerCase().includes("part")) jobType = "Part-time";
          else if (rawType.toLowerCase().includes("contract")) jobType = "Contract";
          else if (rawType.toLowerCase().includes("freelance")) jobType = "Freelance";

          const minSal = item.salaryMin ? Number(item.salaryMin) : null;
          const maxSal = item.salaryMax ? Number(item.salaryMax) : null;
          const locationStr = item.jobGeo ? `Remote (${item.jobGeo})` : "Remote (Worldwide)";
          const idSlug = item.id || item.jobSlug || (item.companyName + "_" + item.jobTitle).toLowerCase().replace(/[^a-z0-9]/g, "_");

          allJobs.push({
            id: `jobicy_${idSlug}`.substring(0, 120),
            title: (item.jobTitle || "Remote Specialist").trim(),
            company: (item.companyName || "Hiring Company").trim(),
            company_logo: item.companyLogo || null,
            location: locationStr,
            job_type: jobType,
            salary_range: formatSalary(minSal, maxSal, item.salaryCurrency || "$"),
            salary_min: minSal,
            salary_max: maxSal,
            category: normalizeCategory(rawCat || item.jobTitle),
            tags: Array.isArray(item.jobIndustry) ? item.jobIndustry.slice(0, 5) : [rawCat || "Remote"],
            description: stripHtml(item.jobDescription || item.jobExcerpt || "").slice(0, 3000),
            requirements: [
              "Demonstrated experience in relevant discipline.",
              "Strong communication and asynchronous collaboration skills.",
              "Self-starter with high accountability.",
            ],
            benefits: [
              "100% remote work flexibility",
              "Competitive salary package",
              "Career development and modern tooling",
            ],
            status: "active",
            source: "Jobicy",
            direct_apply_url: item.url || null,
            is_verified_employer: true,
            is_worldwide: locationStr.toLowerCase().includes("worldwide") || locationStr.toLowerCase().includes("any"),
            is_entry_level: item.jobLevel === "Entry" || item.jobLevel === "Any",
            posted_timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          });
        }
      }
    }
  } catch (e) {
    console.error("Jobicy fetch failed:", e);
  }

  // 2. Himalayas
  try {
    const res = await fetch("https://himalayas.app/jobs/api?limit=100");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.jobs)) {
        for (const item of data.jobs) {
          const rawCat = Array.isArray(item.categories) ? item.categories[0] : (item.categories || "");
          const rawType = item.employmentType || "Full Time";
          let jobType = "Full-time";
          if (rawType.toLowerCase().includes("part")) jobType = "Part-time";
          else if (rawType.toLowerCase().includes("contract")) jobType = "Contract";
          else if (rawType.toLowerCase().includes("freelance")) jobType = "Freelance";

          const minSal = item.minSalary ? Number(item.minSalary) : null;
          const maxSal = item.maxSalary ? Number(item.maxSalary) : null;
          const locationStr =
            Array.isArray(item.locationRestrictions) && item.locationRestrictions.length > 0
              ? `Remote (${item.locationRestrictions.join(", ")})`
              : "Remote (Worldwide)";

          const idSlug = item.guid || (item.companyName + "_" + item.title).toLowerCase().replace(/[^a-z0-9]/g, "_");

          allJobs.push({
            id: `himalayas_${idSlug}`.substring(0, 120),
            title: (item.title || "Remote Position").trim(),
            company: (item.companyName || "Hiring Company").trim(),
            company_logo: item.companyLogo || null,
            location: locationStr,
            job_type: jobType,
            salary_range: formatSalary(minSal, maxSal, item.currency || "$"),
            salary_min: minSal,
            salary_max: maxSal,
            category: normalizeCategory(rawCat || item.title),
            tags: Array.isArray(item.categories) ? item.categories.slice(0, 5) : [rawCat || "Remote"],
            description: stripHtml(item.description || item.excerpt || "").slice(0, 3000),
            requirements: [
              "Relevant professional experience and domain competence.",
              "Excellent communication skills for global remote teams.",
              "Independent project ownership.",
            ],
            benefits: [
              "Work from anywhere in the world",
              "Flexible hours and supportive company culture",
              "Timely compensation and benefits",
            ],
            status: "active",
            source: "Himalayas",
            direct_apply_url: item.applicationLink || null,
            is_verified_employer: true,
            is_worldwide: locationStr.toLowerCase().includes("worldwide"),
            is_entry_level: Array.isArray(item.seniority) && item.seniority.some((s: string) => s.toLowerCase().includes("entry") || s.toLowerCase().includes("junior")),
            posted_timestamp: item.pubDate ? (item.pubDate < 2000000000 ? item.pubDate * 1000 : item.pubDate) : Date.now(),
          });
        }
      }
    }
  } catch (e) {
    console.error("Himalayas fetch failed:", e);
  }

  // 3. RemoteJobs.org
  try {
    const res = await fetch("https://remotejobs.org/api/v1/jobs?limit=50");
    if (res.ok) {
      const json = await res.json();
      const items = json && Array.isArray(json.data) ? json.data : [];
      for (const item of items) {
        const rawCat = item.category?.name || item.category?.slug || "";
        const rawType = item.type || "Full-time";
        let jobType = "Full-time";
        if (rawType.toLowerCase().includes("part")) jobType = "Part-time";
        else if (rawType.toLowerCase().includes("contract")) jobType = "Contract";
        else if (rawType.toLowerCase().includes("freelance")) jobType = "Freelance";

        const minSal = item.salary_min ? Number(item.salary_min) : null;
        const maxSal = item.salary_max ? Number(item.salary_max) : null;
        const locationStr = item.location || "Remote (Worldwide)";
        const companyName = item.company?.name || "Hiring Company";
        const idSlug = item.id || (companyName + "_" + item.title).toLowerCase().replace(/[^a-z0-9]/g, "_");

        allJobs.push({
          id: `remotejobs_${idSlug}`.substring(0, 120),
          title: (item.title || "Remote Position").trim(),
          company: companyName.trim(),
          company_logo: item.company?.logo_url || null,
          location: locationStr,
          job_type: jobType,
          salary_range: item.salary_text ? item.salary_text.trim() : formatSalary(minSal, maxSal, "$"),
          salary_min: minSal,
          salary_max: maxSal,
          category: normalizeCategory(rawCat || item.title),
          tags: [rawCat || "Remote", "RemoteJobs.org"].filter(Boolean),
          description: stripHtml(item.description || "").slice(0, 3000),
          requirements: [
            "Demonstrated competence and practical domain experience.",
            "Effective written communication for distributed teams.",
            "Proactive attitude and goal-oriented mindset.",
          ],
          benefits: [
            "100% remote flexibility worldwide",
            "Competitive salary and compensation",
            "Work with high-impact global team",
          ],
          status: "active",
          source: "RemoteJobs.org",
          direct_apply_url: item.apply_url || item.url || null,
          is_verified_employer: true,
          is_worldwide: locationStr.toLowerCase().includes("worldwide"),
          is_entry_level: (item.title || "").toLowerCase().includes("junior") || (item.title || "").toLowerCase().includes("entry"),
          posted_timestamp: item.posted_at ? new Date(item.posted_at).getTime() : Date.now(),
        });
      }
    }
  } catch (e) {
    console.error("RemoteJobs.org fetch failed:", e);
  }

  // Deduplicate
  const seen = new Map<string, any>();
  const uniqueJobs: any[] = [];
  const cutoff = Date.now() - 35 * 24 * 60 * 60 * 1000;

  for (const job of allJobs) {
    if (!job.title || !job.company) continue;
    if (job.posted_timestamp && job.posted_timestamp < cutoff) {
      job.status = "closed";
    }
    const fp = `${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}:::${job.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    if (!seen.has(fp)) {
      seen.set(fp, job);
      uniqueJobs.push(job);
    }
  }

  return uniqueJobs;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const jobs = await fetchExternalFeeds();
    const BATCH_SIZE = 50;
    let syncedCount = 0;

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE).map((j) => ({
        ...j,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("job_postings").upsert(batch, { onConflict: "id" });
      if (!error) {
        syncedCount += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully ingested and synchronized ${syncedCount} remote jobs to Supabase.`,
        syncedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
