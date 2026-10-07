import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Briefcase,
  Lock,
  Mail,
  User,
  AtSign,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
} from '../components/LucideIcons';
import { AuthService } from '../services/auth';

interface Props {
  onSignedUp: () => void;
  onNavigateToSignIn: () => void;
  onOpenPolicy: (type: 'PRIVACY' | 'TERMS') => void;
}

export const SignUpScreen: React.FC<Props> = ({
  onSignedUp,
  onNavigateToSignIn,
  onOpenPolicy,
}: Props) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeLegal, setAgreeLegal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      Alert.alert('Required Fields', 'Please complete all fields to create your account.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Length', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords you entered do not match.');
      return;
    }

    if (!agreeLegal) {
      Alert.alert(
        'Policy Agreement',
        'You must agree to the Terms of Service and Privacy Policy to proceed.'
      );
      return;
    }

    setIsLoading(true);
    const res = await AuthService.signUp(email, password, fullName, username);
    setIsLoading(false);

    if (res.error) {
      Alert.alert('Sign Up Failed', res.error);
    } else {
      Alert.alert('Account Created', 'Welcome to Remote Job! You are now signed in.');
      onSignedUp();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Branding Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Briefcase color="#38BDF8" size={32} />
          </View>
          <Text style={styles.appTitle}>Remote Job</Text>
          <Text style={styles.subtitle}>
            Create your account to apply for remote jobs and complete micro-tasks.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Free Account</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <User color="#94A3B8" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex Johnson"
              placeholderTextColor="#64748B"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputRow}>
            <AtSign color="#94A3B8" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. alexj"
              placeholderTextColor="#64748B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            <Mail color="#94A3B8" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Lock color="#94A3B8" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff color="#94A3B8" size={18} />
              ) : (
                <Eye color="#94A3B8" size={18} />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <Lock color="#94A3B8" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor="#64748B"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          {/* Legal Checkbox */}
          <TouchableOpacity
            style={styles.legalCheckRow}
            onPress={() => setAgreeLegal(!agreeLegal)}
          >
            {agreeLegal ? (
              <CheckSquare color="#38BDF8" size={20} />
            ) : (
              <Square color="#64748B" size={20} />
            )}
            <Text style={styles.legalCheckText}>
              I agree to the{' '}
              <Text
                style={styles.legalCheckLink}
                onPress={() => onOpenPolicy('TERMS')}
              >
                Terms
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalCheckLink}
                onPress={() => onOpenPolicy('PRIVACY')}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation to Sign In */}
        <View style={styles.footer}>
          <Text style={styles.footerNotice}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateToSignIn}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  legalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  legalCheckText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  legalCheckLink: {
    color: '#38BDF8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerNotice: {
    color: '#94A3B8',
    fontSize: 13,
  },
  signInLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
