import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Sparkles, UserCheck, LogIn, UserPlus } from 'lucide-react-native';
import { COLORS as C } from '../../constants/topics';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useStore(s => s.setUser);

  const handleGuestLogin = () => {
    setUser({
      id: 'demo-user',
      email: 'student@memorystack.app',
      name: 'Akash Sharma',
    });
    router.replace('/(tabs)');
  };

  const handleAuth = async () => {
    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
    if (trimmedPass.length < 6) {
      return Alert.alert('Password too short', 'Password must be at least 6 characters.');
    }
    if (isSignUp && !trimmedName) {
      return Alert.alert('Name Required', 'Please enter your full name.');
    }

    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password: trimmedPass,
            options: {
              data: { full_name: trimmedName },
            },
          });
          if (error) {
            setLoading(false);
            return Alert.alert('Sign Up Failed', error.message);
          }
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || trimmedEmail,
              name: trimmedName || trimmedEmail.split('@')[0],
            });
            Alert.alert('Account Created', 'Welcome to MemoryStack!');
            router.replace('/(tabs)');
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: trimmedPass,
          });
          if (error) {
            setLoading(false);
            return Alert.alert('Sign In Failed', error.message);
          }
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || trimmedEmail,
              name: (data.user.user_metadata?.full_name as string) || trimmedEmail.split('@')[0],
            });
            router.replace('/(tabs)');
          }
        }
      } catch (err) {
        // Fallback to local session if network error
        const localName = trimmedName || trimmedEmail.split('@')[0];
        setUser({
          id: `user-${Date.now()}`,
          email: trimmedEmail,
          name: localName,
        });
        router.replace('/(tabs)');
      } finally {
        setLoading(false);
      }
    } else {
      // Local authenticated mode when backend is offline or keys not configured
      const localName = trimmedName || (trimmedEmail.split('@')[0].charAt(0).toUpperCase() + trimmedEmail.split('@')[0].slice(1));
      setUser({
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        name: localName,
      });
      setLoading(false);
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.screen}
    >
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Background Ambient Glow */}
        <View style={s.orb} />

        {/* Branding */}
        <View style={s.brandWrap}>
          <View style={s.logoBadge}>
            <Text style={s.logoBadgeText}>MS</Text>
          </View>
          <Text style={s.appName}>
            Memory<Text style={{ color: '#9D88FF' }}>Stack</Text>
          </Text>
          <Text style={s.appTag}>AI Spaced Repetition for DSA</Text>
        </View>

        {/* Auth Card */}
        <View style={s.card}>
          {/* Segmented Tab Controls */}
          <View style={s.tabRow}>
            <Pressable
              style={[s.tabButton, !isSignUp && s.activeTab]}
              onPress={() => setIsSignUp(false)}
            >
              <LogIn size={16} color={!isSignUp ? '#fff' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[s.tabText, !isSignUp && s.activeTabText]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[s.tabButton, isSignUp && s.activeTab]}
              onPress={() => setIsSignUp(true)}
            >
              <UserPlus size={16} color={isSignUp ? '#fff' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[s.tabText, isSignUp && s.activeTabText]}>Create Account</Text>
            </Pressable>
          </View>

          <Text style={s.formTitle}>{isSignUp ? 'Join MemoryStack' : 'Welcome back'}</Text>
          <Text style={s.formSubtitle}>
            {isSignUp
              ? 'Start retaining DSA patterns with spaced repetition.'
              : 'Log in to review your revision queue today.'}
          </Text>

          {/* Form Fields */}
          {isSignUp && (
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>FULL NAME</Text>
              <TextInput
                style={s.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Akash Sharma"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>PASSWORD</Text>
            <View style={s.passwordWrap}>
              <TextInput
                style={[s.input, { paddingRight: 48 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={s.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748B" />
                ) : (
                  <Eye size={20} color="#64748B" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Primary Action Button */}
          <Pressable
            style={[s.primaryButton, loading && { opacity: 0.8 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.primaryButtonText}>
                {isSignUp ? 'Create My Account →' : 'Sign In →'}
              </Text>
            )}
          </Pressable>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.dividerLine} />
          </View>

          {/* 1-Tap Instant Guest Demo Login */}
          <Pressable style={s.guestButton} onPress={handleGuestLogin}>
            <Sparkles size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={s.guestButtonText}>⚡ Instant Demo (No password needed)</Text>
          </Pressable>
        </View>

        {/* Status Footer */}
        <View style={s.footer}>
          <UserCheck size={14} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={s.footerText}>
            {isSupabaseConfigured
              ? 'Cloud sync connected'
              : 'Local storage active · Full features ready'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
  },
  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#40339A',
    top: -100,
    right: -80,
    opacity: 0.5,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoBadgeText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
  },
  appTag: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#151C2E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: C.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: '#fff',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 52,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontSize: 14,
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  guestButtonText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
