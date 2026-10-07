import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Wallet,
  Calendar,
  ShieldCheck,
  CreditCard,
  History,
  AlertCircle,
  Building,
  Coins,
  Settings,
} from '../components/LucideIcons';
import { JobsService } from '../services/jobs';
import { PayoutService, PayoutHistoryItem, UserWithdrawalDetails } from '../services/payout';
import { PayoutVerificationScreen } from './PayoutVerificationScreen';
import { WithdrawalSettingsScreen } from './WithdrawalSettingsScreen';

interface Props {
  userId: string;
}

export const PayoutScreen: React.FC<Props> = ({ userId }: Props) => {
  const [balance, setBalance] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<{ isVerified: boolean; status: string }>({
    isVerified: false,
    status: 'unverified',
  });
  const [payouts, setPayouts] = useState<PayoutHistoryItem[]>([]);
  const [savedDetails, setSavedDetails] = useState<UserWithdrawalDetails | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showVerificationScreen, setShowVerificationScreen] = useState<boolean>(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState<boolean>(false);

  const [payoutMethod, setPayoutMethod] = useState<'BANK' | 'CRYPTO'>('BANK');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [routingOrSwift, setRoutingOrSwift] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    const [userBal, kyc, hist, saved] = await Promise.all([
      JobsService.getBalance(userId),
      PayoutService.getKycStatus(userId),
      PayoutService.getRecentPayouts(userId),
      PayoutService.getSavedWithdrawalDetails(userId),
    ]);
    setBalance(userBal);
    setKycStatus(kyc);
    setPayouts(hist);
    setSavedDetails(saved);

    if (saved) {
      setPayoutMethod(saved.preferredMethod || 'BANK');
      setBankName(saved.bankName || '');
      setAccountNumber(saved.accountNumber || '');
      setAccountName(saved.accountName || '');
      setRoutingOrSwift(saved.routingNumberOrSwift || '');
      setCryptoAddress(saved.cryptoAddress || '');
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRequestPayout = async () => {
    if (balance < PayoutService.MINIMUM_PAYOUT_USD) {
      Alert.alert(
        'Threshold Not Reached',
        `You need at least $${PayoutService.MINIMUM_PAYOUT_USD.toFixed(
          2
        )} to request a withdrawal. Your current balance is $${balance.toFixed(2)}.`
      );
      return;
    }

    // Refresh saved details before opening modal
    const saved = await PayoutService.getSavedWithdrawalDetails(userId);
    if (saved) {
      setSavedDetails(saved);
      setPayoutMethod(saved.preferredMethod || 'BANK');
      setBankName(saved.bankName || '');
      setAccountNumber(saved.accountNumber || '');
      setAccountName(saved.accountName || '');
      setRoutingOrSwift(saved.routingNumberOrSwift || '');
      setCryptoAddress(saved.cryptoAddress || '');
    }

    setShowWithdrawModal(true);
  };

  const handleSubmitWithdrawal = async () => {
    let methodStr = '';

    if (payoutMethod === 'BANK') {
      if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
        Alert.alert('Missing Info', 'Please enter your Account Holder Name, Bank Name, and Account Number.');
        return;
      }
      methodStr = `Bank: ${bankName.trim()} - ${accountNumber.trim()} (${accountName.trim()})`;
    } else {
      if (!cryptoAddress.trim()) {
        Alert.alert('Missing Info', 'Please enter your USDT / Crypto Wallet Address.');
        return;
      }
      const label = accountName.trim() ? ` [${accountName.trim()}]` : '';
      methodStr = `Crypto (USDT): ${cryptoAddress.trim()}${label}`;
    }

    setIsSubmitting(true);

    // Save details to user_withdrawal_details table
    await PayoutService.saveWithdrawalDetails(userId, {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      routingNumberOrSwift: routingOrSwift.trim(),
      cryptoAddress: cryptoAddress.trim(),
      preferredMethod: payoutMethod,
    });

    // Record request in payout_requests table
    const res = await PayoutService.requestPayout(userId, balance, methodStr);
    setIsSubmitting(false);

    if (res.success) {
      setShowWithdrawModal(false);
      Alert.alert('Payout Requested', res.message);
      loadData();
    } else {
      Alert.alert('Error', res.message);
    }
  };

  if (showVerificationScreen) {
    return (
      <PayoutVerificationScreen
        isVerified={kycStatus.isVerified}
        onBack={() => setShowVerificationScreen(false)}
      />
    );
  }

  if (showSettingsScreen) {
    return (
      <WithdrawalSettingsScreen
        userId={userId}
        onBack={() => {
          setShowSettingsScreen(false);
          loadData();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.topTitle}>Payout & Earnings</Text>
          <Text style={styles.topSubtitle}>Manage balances and monthly withdrawals</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => setShowSettingsScreen(true)}
        >
          <Settings color="#94A3B8" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        {/* Main Payout Balance Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <Wallet color="#38BDF8" size={24} />
            </View>
            <View style={styles.cycleBadge}>
              <Calendar color="#FBBF24" size={14} />
              <Text style={styles.cycleText}>Next Payout: 27th</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>TOTAL PAYOUT BALANCE</Text>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (balance / PayoutService.MINIMUM_PAYOUT_USD) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              ${balance.toFixed(2)} / ${PayoutService.MINIMUM_PAYOUT_USD.toFixed(2)} Minimum
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              balance < PayoutService.MINIMUM_PAYOUT_USD && styles.withdrawButtonDisabled,
            ]}
            onPress={handleRequestPayout}
          >
            <CreditCard color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Withdrawal Method Info Card */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => setShowSettingsScreen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.infoRow}>
            {savedDetails?.preferredMethod === 'CRYPTO' ? (
              <Coins color="#38BDF8" size={24} />
            ) : (
              <Building color="#38BDF8" size={24} />
            )}
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Saved Payout Method</Text>
              <Text style={styles.infoDesc} numberOfLines={1}>
                {savedDetails
                  ? savedDetails.preferredMethod === 'CRYPTO'
                    ? `Crypto (USDT): ${savedDetails.cryptoAddress || 'Configured'}`
                    : `Bank: ${savedDetails.bankName || 'Bank'} - ${savedDetails.accountNumber || 'Configured'}`
                  : 'Tap to configure your default Bank or Crypto withdrawal details.'}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {savedDetails ? 'SAVED' : 'SET UP'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Verification Status Card */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => setShowVerificationScreen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.infoRow}>
            <ShieldCheck color="#34D399" size={24} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Payout Verification (KYC)</Text>
              <Text style={styles.infoDesc}>
                {kycStatus.isVerified
                  ? 'Identity verified. You are eligible for automated monthly transfers.'
                  : 'Level 1 Tier active. Standard task earnings are automatically verified.'}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {kycStatus.isVerified ? 'VERIFIED' : 'TIER 1'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Payouts */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <History color="#94A3B8" size={16} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>RECENT PAYOUT REQUESTS</Text>
          </View>
        </View>

        {payouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <AlertCircle color="#64748B" size={32} />
            <Text style={styles.emptyText}>No payout requests yet.</Text>
          </View>
        ) : (
          payouts.map((item: PayoutHistoryItem) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                {item.payoutMethod.toLowerCase().includes('crypto') ? (
                  <Coins color="#38BDF8" size={20} />
                ) : (
                  <Building color="#38BDF8" size={20} />
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.historyMethod} numberOfLines={1}>
                    {item.payoutMethod}
                  </Text>
                  <Text style={styles.historyDate}>{item.createdAt}</Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>+${item.amountUsd.toFixed(2)}</Text>
                <View style={styles.historyStatusPill}>
                  <Text style={styles.historyStatusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Withdrawal Form Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Withdrawal</Text>
            <Text style={styles.modalSubtitle}>
              Amount to withdraw: ${balance.toFixed(2)}
            </Text>

            {/* Method Tabs (Bank vs Crypto) */}
            <View style={styles.methodTabs}>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  payoutMethod === 'BANK' && styles.methodTabActive,
                ]}
                onPress={() => setPayoutMethod('BANK')}
              >
                <Building color={payoutMethod === 'BANK' ? '#FFFFFF' : '#94A3B8'} size={16} style={{ marginRight: 6 }} />
                <Text
                  style={[
                    styles.methodTabText,
                    payoutMethod === 'BANK' && styles.methodTabTextActive,
                  ]}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodTab,
                  payoutMethod === 'CRYPTO' && styles.methodTabActive,
                ]}
                onPress={() => setPayoutMethod('CRYPTO')}
              >
                <Coins color={payoutMethod === 'CRYPTO' ? '#FFFFFF' : '#94A3B8'} size={16} style={{ marginRight: 6 }} />
                <Text
                  style={[
                    styles.methodTabText,
                    payoutMethod === 'CRYPTO' && styles.methodTabTextActive,
                  ]}
                >
                  Crypto (USDT)
                </Text>
              </TouchableOpacity>
            </View>

            {payoutMethod === 'BANK' ? (
              <>
                <Text style={styles.inputLabel}>Account Holder Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#64748B"
                  value={accountName}
                  onChangeText={setAccountName}
                />

                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Chase Bank / Citibank"
                  placeholderTextColor="#64748B"
                  value={bankName}
                  onChangeText={setBankName}
                />

                <Text style={styles.inputLabel}>Account Number / IBAN *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 1234567890"
                  placeholderTextColor="#64748B"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                />

                <Text style={styles.inputLabel}>Routing / SWIFT Code (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. CHASUS33"
                  placeholderTextColor="#64748B"
                  value={routingOrSwift}
                  onChangeText={setRoutingOrSwift}
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>USDT / Crypto Wallet Address *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 0x... or T..."
                  placeholderTextColor="#64748B"
                  value={cryptoAddress}
                  onChangeText={setCryptoAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.inputLabel}>Wallet / Network Label (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. USDT TRC20 (Binance)"
                  placeholderTextColor="#64748B"
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitWithdrawBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmitWithdrawal}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitWithdrawBtnText}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowWithdrawModal(false)}
              disabled={isSubmitting}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  topSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  settingsIconBtn: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312E81',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cycleText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 6,
  },
  progressContainer: {
    marginVertical: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
  },
  withdrawButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#334155',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  infoDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  statusPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusPillText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyMethod: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  historyDate: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  historyStatusPill: {
    backgroundColor: '#0F291E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  historyStatusText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 4,
    marginBottom: 16,
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  methodTabActive: {
    backgroundColor: '#2563EB',
  },
  methodTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  methodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  submitWithdrawBtn: {
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitWithdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    marginTop: 12,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
