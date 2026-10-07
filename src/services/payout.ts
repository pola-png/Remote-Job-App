import { supabase } from '../config/supabase';
import { MemoryAndDiskCache } from './cache';

export interface UserWithdrawalDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingNumberOrSwift?: string;
  cryptoAddress: string;
  cryptoNetwork?: string;
  preferredMethod: 'BANK' | 'CRYPTO';
}

export interface PayoutHistoryItem {
  id: string;
  amountUsd: number;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID';
  createdAt: string;
  payoutMethod: string;
}

export const PayoutService = {
  MINIMUM_PAYOUT_USD: 30.0,
  PAYOUT_DAY_OF_MONTH: 27,

  async getKycStatus(userId: string, forceRefresh: boolean = false): Promise<{ isVerified: boolean; status: string }> {
    const cacheKey = `kyc_status_${userId}`;

    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<{ isVerified: boolean; status: string }>(
        cacheKey,
        1000 * 60 * 60 * 24
      );
      if (cached) return cached;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_verified, verification_status')
        .eq('id', userId)
        .maybeSingle();

      const res = data
        ? { isVerified: data.is_verified === true, status: data.verification_status || 'unverified' }
        : { isVerified: false, status: 'unverified' };

      await MemoryAndDiskCache.set(cacheKey, res);
      return res;
    } catch (_) {
      return { isVerified: false, status: 'unverified' };
    }
  },

  async getSavedWithdrawalDetails(
    userId: string,
    forceRefresh: boolean = false
  ): Promise<UserWithdrawalDetails | null> {
    const cacheKey = `user_withdrawal_details_${userId}`;

    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<UserWithdrawalDetails>(cacheKey, 1000 * 60 * 30);
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from('user_withdrawal_details')
        .select('bank_name, account_number, account_name, routing_number_or_swift, crypto_address, preferred_method')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      const details: UserWithdrawalDetails = {
        bankName: data.bank_name || '',
        accountNumber: data.account_number || '',
        accountName: data.account_name || '',
        routingNumberOrSwift: data.routing_number_or_swift || '',
        cryptoAddress: data.crypto_address || '',
        preferredMethod: data.preferred_method === 'crypto' ? 'CRYPTO' : 'BANK',
      };

      await MemoryAndDiskCache.set(cacheKey, details);
      return details;
    } catch (_) {
      return null;
    }
  },

  async saveWithdrawalDetails(
    userId: string,
    details: UserWithdrawalDetails
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        user_id: userId,
        bank_name: details.bankName.trim(),
        account_number: details.accountNumber.trim(),
        account_name: details.accountName.trim(),
        routing_number_or_swift: details.routingNumberOrSwift?.trim() || null,
        crypto_address: details.cryptoAddress.trim(),
        preferred_method: details.preferredMethod === 'CRYPTO' ? 'crypto' : 'bank_transfer',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_withdrawal_details')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        return { success: false, message: error.message || 'Failed to save payout method.' };
      }

      await MemoryAndDiskCache.set(`user_withdrawal_details_${userId}`, details);
      return { success: true, message: 'Withdrawal details saved successfully.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error saving withdrawal details.' };
    }
  },

  async getRecentPayouts(userId: string, forceRefresh: boolean = false): Promise<PayoutHistoryItem[]> {
    const cacheKey = `recent_payouts_${userId}`;

    if (!forceRefresh) {
      const cached = await MemoryAndDiskCache.get<PayoutHistoryItem[]>(cacheKey, 1000 * 60 * 10);
      if (cached && cached.length > 0) return cached;
    }

    try {
      const { data } = await supabase
        .from('payout_requests')
        .select('id, amount_usd, status, created_at, payout_method')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          amountUsd: Number(item.amount_usd || 0),
          status: (item.status || 'PENDING').toUpperCase() as any,
          createdAt: new Date(item.created_at).toLocaleDateString(),
          payoutMethod: item.payout_method || 'Bank Transfer',
        }));
        await MemoryAndDiskCache.set(cacheKey, formatted);
        return formatted;
      }

      return [];
    } catch (_) {
      return [];
    }
  },

  async requestPayout(
    userId: string,
    amountUsd: number,
    method: string
  ): Promise<{ success: boolean; message: string }> {
    if (amountUsd < this.MINIMUM_PAYOUT_USD) {
      return {
        success: false,
        message: `Minimum withdrawal threshold is $${this.MINIMUM_PAYOUT_USD.toFixed(2)}.`,
      };
    }

    try {
      const { error } = await supabase.from('payout_requests').insert({
        user_id: userId,
        amount_usd: amountUsd,
        status: 'pending',
        payout_method: method,
        created_at: new Date().toISOString(),
      });

      if (error) {
        return { success: false, message: error.message || 'Failed to submit withdrawal request.' };
      }

      await MemoryAndDiskCache.delete(`recent_payouts_${userId}`);

      return {
        success: true,
        message: `Payout request of $${amountUsd.toFixed(2)} submitted successfully. Payments are processed on the ${this.PAYOUT_DAY_OF_MONTH}th.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to submit payout request.' };
    }
  },
};
