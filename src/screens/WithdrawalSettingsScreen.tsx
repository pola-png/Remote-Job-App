import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, CreditCard, Building, Coins } from '../components/LucideIcons';
import { PayoutService, UserWithdrawalDetails } from '../services/payout';

interface Props {
  userId: string;
  onBack: () => void;
}

export const WithdrawalSettingsScreen: React.FC<Props> = ({ userId, onBack }: Props) => {
  const [methodType, setMethodType] = useState<'BANK' | 'CRYPTO'>('BANK');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [routingOrSwift, setRoutingOrSwift] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSavedDetails = async () => {
      setIsLoading(true);
      const saved = await PayoutService.getSavedWithdrawalDetails(userId);
      if (saved) {
        setMethodType(saved.preferredMethod || 'BANK');
        setBankName(saved.bankName || '');
        setAccountNumber(saved.accountNumber || '');
        setAccountName(saved.accountName || '');
        setRoutingOrSwift(saved.routingNumberOrSwift || '');
        setCryptoAddress(saved.cryptoAddress || '');
      }
      setIsLoading(false);
    };

    loadSavedDetails();
  }, [userId]);

  const handleSave = async () => {
    if (methodType === 'BANK') {
      if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
        Alert.alert('Incomplete Details', 'Please enter your Account Holder Name, Account Number, and Bank Name.');
        return;
      }
    } else {
      if (!cryptoAddress.trim()) {
        Alert.alert('Incomplete Details', 'Please enter your USDT / Crypto Wallet Address.');
        return;
      }
    }

    setIsSaving(true);
    const details: UserWithdrawalDetails = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      routingNumberOrSwift: routingOrSwift.trim(),
      cryptoAddress: cryptoAddress.trim(),
      preferredMethod: methodType,
    };

    const res = await PayoutService.saveWithdrawalDetails(userId, details);
    setIsSaving(false);

    if (res.success) {
      Alert.alert('Settings Saved', res.message, [
        { text: 'OK', onPress: onBack },
      ]);
    } else {
      Alert.alert('Error', res.message);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color="#F8FAFC" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>SELECT DEFAULT METHOD</Text>

        <View style={styles.methodsRow}>
          <TouchableOpacity
            style={[styles.methodCard, methodType === 'BANK' && styles.methodCardActive]}
            onPress={() => setMethodType('BANK')}
          >
            <Building color={methodType === 'BANK' ? '#38BDF8' : '#94A3B8'} size={24} />
            <Text style={[styles.methodLabel, methodType === 'BANK' && styles.methodLabelActive]}>
              Bank Transfer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, methodType === 'CRYPTO' && styles.methodCardActive]}
            onPress={() => setMethodType('CRYPTO')}
          >
            <Coins color={methodType === 'CRYPTO' ? '#38BDF8' : '#94A3B8'} size={24} />
            <Text style={[styles.methodLabel, methodType === 'CRYPTO' && styles.methodLabelActive]}>
              Crypto (USDT)
            </Text>
          </TouchableOpacity>
        </View>

        {methodType === 'BANK' ? (
          <>
            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor="#64748B"
              value={accountName}
              onChangeText={setAccountName}
            />

            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chase Bank / Citibank"
              placeholderTextColor="#64748B"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.inputLabel}>Account Number / IBAN *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1234567890"
              placeholderTextColor="#64748B"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="default"
            />

            <Text style={styles.inputLabel}>Routing Number / SWIFT Code (Optional)</Text>
            <TextInput
              style={styles.input}
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
              style={styles.input}
              placeholder="e.g. 0x... or T..."
              placeholderTextColor="#64748B"
              value={cryptoAddress}
              onChangeText={setCryptoAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Account / Wallet Label (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Binance USDT (TRC20 / ERC20)"
              placeholderTextColor="#64748B"
              value={accountName}
              onChangeText={setAccountName}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CreditCard color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Payout Method</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  methodsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  methodCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  methodCardActive: { borderColor: '#38BDF8', backgroundColor: '#0F172A' },
  methodLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 8, textAlign: 'center' },
  methodLabelActive: { color: '#38BDF8', fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#CBD5E1', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
