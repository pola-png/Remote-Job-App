/**
 * Gemini AI Job Description Enhancer & Restructurer
 * 
 * Purpose:
 * Transforms raw / scraped job descriptions into high-quality, 100% unique,
 * AdSense-friendly structured content:
 * - Clean executive role overview
 * - Clear core responsibilities & deliverables
 * - Key qualifications & technical requirements
 * - Remote culture & compensation context
 * - Actionable candidate application advice
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables from .env
const envFiles = ['.env', '.env.local', '.env.production'];
for (const envFile of envFiles) {
  const p = path.resolve(__dirname, '..', envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tnjmwahnzosuhqpkvuwo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GEMINI_API_KEY) {
  console.error('\n[Error] Missing GEMINI_API_KEY in .env.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Call Gemini API with timeout using fetch
async function callGemini(prompt, apiKey) {
  const models = ['gemini-flash-latest', 'gemini-3-flash-preview'];
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.85,
            maxOutputTokens: 1000,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const json = await res.json();
      if (res.ok) {
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        lastError = new Error(`[${model}] ${res.status}: ${json.error?.message || JSON.stringify(json)}`);
      }
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
    }
  }

  throw lastError || new Error('All model fallbacks failed');
}

function cleanHtmlOrMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPrompt(job) {
  const cleanDesc = cleanHtmlOrMarkdown(job.description).slice(0, 2500);
  return `You are a senior recruitment editor for a verified global remote job publication.
Rewrite and elevate the following remote job posting into a neat, high-quality, comprehensive, and original job specification.

Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Worldwide (100% Remote)'}
Category: ${job.category || 'General'}
Salary/Compensation: ${job.salary_range || 'Competitive'}

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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enhanceBatch({ limit = 10, delayMs = 1000 } = {}) {
  console.log(`\n========================================================`);
  console.log(`🚀 Starting Gemini Job Description Enhancement Pipeline`);
  console.log(`========================================================`);

  const { data: jobs, error } = await supabase
    .from('job_postings')
    .select('id, title, company, location, category, salary_range, description')
    .eq('status', 'active')
    .eq('is_ai_rewritten', false)
    .order('posted_timestamp', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching jobs from Supabase:', error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No eligible jobs found to enhance.');
    return;
  }

  console.log(`Found ${jobs.length} jobs to process with Gemini AI.\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    process.stdout.write(`[${i + 1}/${jobs.length}] "${job.title}" (${job.company})... `);

    // Skip if already enhanced
    if (job.description && job.description.includes('### Role Overview') && job.description.includes('### Key Responsibilities')) {
      console.log(`[SKIPPED - Already Enhanced]`);
      skippedCount++;
      continue;
    }

    try {
      const prompt = buildPrompt(job);
      const enhancedDescription = await callGemini(prompt, GEMINI_API_KEY);

      if (!enhancedDescription || enhancedDescription.length < 200) {
        throw new Error('Enhanced output too short');
      }

      const { error: updateErr } = await supabase
        .from('job_postings')
        .update({
          description: enhancedDescription,
          is_ai_rewritten: true,
          ai_rewritten_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateErr) {
        console.log(`❌ DB Update Error: ${updateErr.message}`);
        failCount++;
      } else {
        console.log(`✅ Enhanced & Saved (${enhancedDescription.length} chars)`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failCount++;
    }

    if (i < jobs.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`\n========================================================`);
  console.log(`Summary:`);
  console.log(`  Enhanced: ${successCount}`);
  console.log(`  Skipped (Already Done): ${skippedCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`========================================================\n`);
}

const args = process.argv.slice(2);
let limit = 10;
let delay = 1000;

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1], 10) || 10;
  }
  if (arg.startsWith('--delay=')) {
    delay = parseInt(arg.split('=')[1], 10) || 1000;
  }
}

enhanceBatch({ limit, delayMs: delay });
