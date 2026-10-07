import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';
import { SubscriptionTier } from './subscription';

export interface UserProfile {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  isBanned?: boolean;
  subscriptionTier?: SubscriptionTier;
}

export const AuthService = {
  async signIn(email: string, password: string): Promise<{ user: any; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user };
    } catch (e: any) {
      return { user: null, error: e.message || 'An error occurred during sign in.' };
    }
  },

  async signUp(
    email: string,
    password: string,
    fullName: string,
    username: string
  ): Promise<{ user: any; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: fullName.trim(),
            handle: username.trim(),
          },
        },
      });
      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
            display_name: fullName.trim(),
            handle: username.trim(),
            created_at: new Date().toISOString(),
          });
          try {
            await supabase.from('creator_balances').upsert({
              creator_id: data.user.id,
              balance_usd: 0.0,
              available_balance_usd: 0.0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } catch (_) {}
        } catch (_) {}
      }

      return { user: data.user };
    } catch (e: any) {
      return { user: null, error: e.message || 'An error occurred during sign up.' };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
  },

  async getCurrentUser(): Promise<any> {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (_) {
      return null;
    }
  },

  async getUserProfile(userId: string, forceRefresh: boolean = false): Promise<UserProfile | null> {
    const cacheKey = `user_profile_${userId}`;

    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<UserProfile>(cacheKey, 1000 * 60 * 60 * 24);
      if (cached) return cached;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, handle, display_name, is_banned')
        .eq('id', userId)
        .maybeSingle();

      if (!data) return null;
      const profile: UserProfile = {
        id: data.id,
        email: data.email || '',
        handle: data.handle || 'user',
        displayName: data.display_name || data.handle || 'User',
        isBanned: data.is_banned === true,
      };

      await MemoryAndDiskCache.set(cacheKey, profile);
      return profile;
    } catch (_) {
      return MemoryAndDiskCache.getInMemory<UserProfile>(cacheKey) || null;
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send reset link.' };
    }
  },

  async deleteAccount(userId: string): Promise<boolean> {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.signOut();
      return true;
    } catch (_) {
      return false;
    }
  },
};
