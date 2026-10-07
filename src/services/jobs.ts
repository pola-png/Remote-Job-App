import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

export interface MicroJobItem {
  id: string;
  title: string;
  category: 'AI_DATA' | 'WEBSITE' | 'VIDEO' | 'SURVEY';
  rewardUsd: number;
  durationSeconds: number;
  description: string;
  actionUrl?: string;
  isCompleted?: boolean;
}

const DEFAULT_JOBS: MicroJobItem[] = [
  // 1. AI Data Annotation & Training Tasks
  {
    id: 'ai_task_1',
    title: 'AI Data Annotation: Sentiment & Tone Verification',
    category: 'AI_DATA',
    rewardUsd: 0.35,
    durationSeconds: 45,
    description: 'Evaluate conversational AI sample outputs and verify safety and tone consistency.',
  },
  {
    id: 'ai_task_2',
    title: 'Visual Quality & Object Labeling Test',
    category: 'AI_DATA',
    rewardUsd: 0.45,
    durationSeconds: 60,
    description: 'Verify bounding tags for generative model synthetic image benchmarks.',
  },
  {
    id: 'ai_task_3',
    title: 'Code Completion & Syntax Accuracy Audit',
    category: 'AI_DATA',
    rewardUsd: 0.60,
    durationSeconds: 50,
    description: 'Review LLM code suggestions for Python and TypeScript snippet correctness.',
  },
  {
    id: 'ai_task_4',
    title: 'Medical Terminology & Safety Guardrail Check',
    category: 'AI_DATA',
    rewardUsd: 0.75,
    durationSeconds: 70,
    description: 'Verify AI assistant health disclaimer responses against ethical guidelines.',
  },
  {
    id: 'ai_task_5',
    title: 'Audio Speech-to-Text Transcription Verification',
    category: 'AI_DATA',
    rewardUsd: 0.40,
    durationSeconds: 40,
    description: 'Listen to 10-second audio clips and confirm automated transcription fidelity.',
  },
  {
    id: 'ai_task_6',
    title: 'Multimodal Chatbot Intent Classification',
    category: 'AI_DATA',
    rewardUsd: 0.50,
    durationSeconds: 55,
    description: 'Categorize customer support conversational queries into target API intents.',
  },

  // 2. Website & Platform Exploration Tasks
  {
    id: 'web_task_1',
    title: 'Visit & Verify Sponsor Landing Page',
    category: 'WEBSITE',
    rewardUsd: 0.20,
    durationSeconds: 20,
    description: 'Browse the partner cloud portal for 20 seconds and confirm page load responsiveness.',
    actionUrl: 'https://google.com',
  },
  {
    id: 'web_task_2',
    title: 'Fintech Platform UI & Navigation Audit',
    category: 'WEBSITE',
    rewardUsd: 0.35,
    durationSeconds: 30,
    description: 'Explore the dashboard layout and test interactive chart components.',
    actionUrl: 'https://stripe.com',
  },
  {
    id: 'web_task_3',
    title: 'E-Commerce Store Checkout Flow Speed Test',
    category: 'WEBSITE',
    rewardUsd: 0.40,
    durationSeconds: 35,
    description: 'Navigate products, add an item to cart, and verify payment screen rendering.',
    actionUrl: 'https://shopify.com',
  },
  {
    id: 'web_task_4',
    title: 'SaaS Developer Documentation Usability Check',
    category: 'WEBSITE',
    rewardUsd: 0.30,
    durationSeconds: 25,
    description: 'Inspect API endpoints documentation and confirm sample code readability.',
    actionUrl: 'https://supabase.com',
  },
  {
    id: 'web_task_5',
    title: 'Remote Collaboration Tool Feature Tour',
    category: 'WEBSITE',
    rewardUsd: 0.25,
    durationSeconds: 20,
    description: 'Visit the collaboration suite demo page and verify interactive video tour.',
    actionUrl: 'https://slack.com',
  },

  // 3. Video & Media Review Tasks
  {
    id: 'video_task_1',
    title: 'Watch & Review Creator Promotional Video',
    category: 'VIDEO',
    rewardUsd: 0.30,
    durationSeconds: 30,
    description: 'Watch sponsor video in full and submit feedback on audio clarity and visual pacing.',
  },
  {
    id: 'video_task_2',
    title: 'Tech Product Unboxing & Quality Review',
    category: 'VIDEO',
    rewardUsd: 0.45,
    durationSeconds: 45,
    description: 'Watch high-resolution gadget preview and vote on lighting and narration quality.',
  },
  {
    id: 'video_task_3',
    title: 'Developer Tool Feature Demo Breakdown',
    category: 'VIDEO',
    rewardUsd: 0.55,
    durationSeconds: 50,
    description: 'Watch live coding session clip and confirm step-by-step clarity.',
  },
  {
    id: 'video_task_4',
    title: 'Mobile App Teaser & Gameplay Feedback',
    category: 'VIDEO',
    rewardUsd: 0.35,
    durationSeconds: 35,
    description: 'Review 30-second mobile app showcase clip and rate user onboarding hook.',
  },

  // 4. Surveys & Tech Feedback Tasks
  {
    id: 'survey_task_1',
    title: 'Remote Workforce Tech Stack Survey',
    category: 'SURVEY',
    rewardUsd: 0.60,
    durationSeconds: 60,
    description: 'Answer 5 multiple choice questions on your preferred remote developer tooling and IDEs.',
  },
  {
    id: 'survey_task_2',
    title: 'AI Coding Assistant Usage & Productivity Pulse',
    category: 'SURVEY',
    rewardUsd: 0.70,
    durationSeconds: 65,
    description: 'Share your feedback on AI code autocompletion and agentic workflows.',
  },
  {
    id: 'survey_task_3',
    title: 'Global Remote Salary & Benefits Preferences',
    category: 'SURVEY',
    rewardUsd: 0.85,
    durationSeconds: 75,
    description: 'Help benchmark global remote compensation, equity packages, and wellness perks.',
  },
];

export const JobsService = {
  async getBalance(userId: string, forceRefresh: boolean = false): Promise<number> {
    const cacheKey = `creator_balance_${userId}`;

    // 1. Check ultra-fast memory and disk cache first (zero network egress)
    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<number>(cacheKey, 1000 * 60 * 30); // 30 min cache
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    try {
      // 2. Query creator_balances table matching SQL schema
      const { data, error } = await supabase
        .from('creator_balances')
        .select('available_balance_usd, balance_usd')
        .eq('creator_id', userId)
        .maybeSingle();

      if (data && !error) {
        const val = Number(data.available_balance_usd ?? data.balance_usd ?? 0);
        await MemoryAndDiskCache.set(cacheKey, val);
        return val;
      }

      // Initialize row in creator_balances if not present
      try {
        await supabase.from('creator_balances').upsert({
          creator_id: userId,
          balance_usd: 0.0,
          available_balance_usd: 0.0,
          updated_at: new Date().toISOString(),
        });
      } catch (_) {}

      await MemoryAndDiskCache.set(cacheKey, 0);
      return 0;
    } catch (_) {
      const fallback = MemoryAndDiskCache.getInMemory<number>(cacheKey) ?? 0;
      return fallback;
    }
  },

  async getJobs(userId: string): Promise<MicroJobItem[]> {
    try {
      const completedList = await this.getCompletedTaskIds();
      return DEFAULT_JOBS.map((job) => ({
        ...job,
        isCompleted: completedList.includes(job.id),
      }));
    } catch (_) {
      return DEFAULT_JOBS;
    }
  },

  async completeTask(userId: string, task: MicroJobItem): Promise<{ newBalance: number; success: boolean }> {
    try {
      const currentBalance = await this.getBalance(userId);
      const updatedBalance = parseFloat((currentBalance + task.rewardUsd).toFixed(4));
      const cacheKey = `creator_balance_${userId}`;

      // Update in memory/disk cache immediately (Optimistic local-first update)
      await MemoryAndDiskCache.set(cacheKey, updatedBalance);
      await this.markTaskCompletedLocally(task.id);

      // Asynchronously sync to Supabase creator_balances in background
      (async () => {
        try {
          await supabase.from('creator_balances').upsert({
            creator_id: userId,
            balance_usd: updatedBalance,
            available_balance_usd: updatedBalance,
            updated_at: new Date().toISOString(),
          });
        } catch (_) {}
      })();

      // Record in monetization events ledger in background
      (async () => {
        try {
          await supabase.from('monetization_events').insert({
            user_id: userId,
            event_type: task.category.toLowerCase(),
            format: task.category.toLowerCase(),
            creator_earnings_micros: Math.round(task.rewardUsd * 1000000),
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      })();

      return { newBalance: updatedBalance, success: true };
    } catch (e) {
      return { newBalance: 0, success: false };
    }
  },

  async getCompletedTaskIds(): Promise<string[]> {
    try {
      const cached = await MemoryAndDiskCache.get<string[]>('completed_tasks_v1', 1000 * 60 * 60 * 24 * 7);
      return cached || [];
    } catch (_) {
      return [];
    }
  },

  async markTaskCompletedLocally(taskId: string): Promise<void> {
    try {
      const existing = await this.getCompletedTaskIds();
      if (!existing.includes(taskId)) {
        existing.push(taskId);
        await MemoryAndDiskCache.set('completed_tasks_v1', existing);
      }
    } catch (_) {}
  },
};
