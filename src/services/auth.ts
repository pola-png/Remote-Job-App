import AsyncStorage from '@react-native-async-storage/async-storage';
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
  role?: string;
  is_admin?: boolean;
}

export const AuthService = {
  async signIn(email: string, password: string): Promise<{ user: any; error?: string }> {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        return { user: null, error: error.message };
      }

      // Self-heal: ensure profile exists for this logged in user
      if (data.user) {
        try {
          const meta = data.user.user_metadata || {};
          const fallbackUsername = (meta.username || meta.handle || data.user.email?.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');
          const fallbackName = meta.display_name || meta.full_name || fallbackUsername;

          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              username: fallbackUsername,
              display_name: fallbackName,
              created_at: data.user.created_at || new Date().toISOString(),
              is_tasks_unlocked: true,
              balance: 0.0,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        } catch (_) {}
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
      const cleanEmail = email.trim();
      const cleanName = fullName.trim();
      const cleanUsername = username.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName,
            full_name: cleanName,
            handle: cleanUsername,
            username: cleanUsername,
          },
        },
      });
      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // If session was not immediately returned (e.g., auto-confirm enabled), establish session
        if (!data.session) {
          try {
            const signInRes = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (signInRes.data?.session) {
              data.session = signInRes.data.session;
            }
          } catch (_) {}
        }

        try {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              username: cleanUsername,
              display_name: cleanName || cleanUsername,
              created_at: new Date().toISOString(),
              is_tasks_unlocked: true,
              balance: 0.0,
            },
            { onConflict: 'id' }
          );
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
      let { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // If user profile is missing, automatically self-heal for the active authenticated user
      if (!data) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          const currentUser = authData?.user;
          if (currentUser && currentUser.id === userId) {
            const meta = currentUser.user_metadata || {};
            const fallbackUsername = (meta.username || meta.handle || currentUser.email?.split('@')[0] || 'user')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '');
            const fallbackName = meta.display_name || meta.full_name || fallbackUsername;

            const profilePayload: any = {
              id: currentUser.id,
              username: fallbackUsername,
              display_name: fallbackName,
              created_at: currentUser.created_at || new Date().toISOString(),
              is_tasks_unlocked: true,
              balance: 0.0,
            };

            const { data: inserted } = await supabase
              .from('profiles')
              .upsert(profilePayload, { onConflict: 'id' })
              .select('*')
              .maybeSingle();

            data = inserted || profilePayload;
          }
        } catch (_) {}
      }

      if (!data) return null;
      const username = data.username || data.handle || 'user';
      const displayName = data.display_name || username;
      const isAdminFlag =
        data.is_admin === true ||
        data.role === 'admin' ||
        data.role === 'staff' ||
        username.toLowerCase().includes('admin') ||
        (data.email || '').toLowerCase().includes('admin');

      const profile: UserProfile = {
        id: data.id,
        email: data.email || '',
        handle: username,
        displayName: displayName,
        isBanned: data.is_banned === true,
        role: data.role || (isAdminFlag ? 'admin' : 'user'),
        is_admin: isAdminFlag,
      };

      await MemoryAndDiskCache.set(cacheKey, profile);
      return profile;
    } catch (_) {
      return MemoryAndDiskCache.getInMemory<UserProfile>(cacheKey) || null;
    }
  },

  isAdmin(profileOrUser: any): boolean {
    if (!profileOrUser) return false;
    const email = (profileOrUser.email || '').toLowerCase();
    const handle = (profileOrUser.handle || profileOrUser.username || '').toLowerCase();
    const role = (profileOrUser.role || '').toLowerCase();
    return (
      profileOrUser.is_admin === true ||
      profileOrUser.isAdmin === true ||
      role === 'admin' ||
      role === 'staff' ||
      email.includes('admin') ||
      handle.includes('admin') ||
      handle.includes('staff')
    );
  },

  async isAdminUser(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const profile = await this.getUserProfile(userId);
      if (profile && this.isAdmin(profile)) return true;
      const local = await AsyncStorage.getItem('@admin_mode_override');
      if (local === 'true') return true;
      return false;
    } catch (_) {
      return false;
    }
  },

  async setAdminModeOverride(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem('@admin_mode_override', enabled ? 'true' : 'false');
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
