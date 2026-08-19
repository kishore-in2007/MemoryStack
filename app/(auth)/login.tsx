import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/UI';
import { COLORS as C } from '../../constants/topics';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState(false);
  const setUser = useStore(s => s.setUser);

  const demo = () => {
    setUser({ id: 'demo-user', email: 'student@memorystack.app', name: 'Akash Sharma' });
    router.replace('/(tabs)');
  };

  const submit = async () => {
    if (!email || password.length < 6) {
      return Alert.alert('Check your details', 'Enter a valid email and a password of at least 6 characters.');
    }

    if (!isSupabaseConfigured) {
      return Alert.alert(
        'Cloud Not Configured',
        'Supabase backend keys are not configured in .env yet. Would you like to enter Demo Mode with all features enabled?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter Demo Mode', onPress: demo },
        ]
      );
    }

    setLoading(true);
    const result = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (result.error) {
      return Alert.alert('Authentication failed', result.error.message);
    }

    if (signup && !result.data.session) {
      return Alert.alert('Confirm your email', 'Open the confirmation link, then sign in.');
    }

    setUser({
      id: result.data.user!.id,
      email: result.data.user!.email || email,
      name: (result.data.user!.user_metadata?.full_name as string) || email.split('@')[0],
    });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.screen}>
      <View style={s.orb} />
      <View style={s.content}>
        <Text style={s.mark}>MS</Text>
        <Text style={s.logo}>
          Memory<Text style={{ color: '#A996FF' }}>Stack</Text>
        </Text>
        <Text style={s.tag}>AI-powered DSA retention</Text>
        <View style={s.form}>
          <Text style={s.heading}>{signup ? 'Create your account' : 'Welcome back'}</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#758096"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#758096"
            secureTextEntry
          />
          <Button
            title={loading ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            onPress={submit}
            disabled={loading}
          />
          <Button title="Explore demo offline" onPress={demo} outline />
          <Pressable style={s.switch} onPress={() => setSignup(!signup)}>
            <Text style={s.switchText}>{signup ? 'Already registered? Sign in' : 'New here? Create an account'}</Text>
          </Pressable>
        </View>
        <Text style={s.mode}>
          {isSupabaseConfigured ? 'Cloud services connected' : 'Demo mode ready · Cloud credentials optional'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111522' },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#40339A',
    top: -150,
    right: -80,
    opacity: 0.6,
  },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '900',
    fontSize: 17,
    overflow: 'hidden',
  },
  logo: { fontSize: 32, color: '#fff', fontWeight: '900', marginTop: 18, letterSpacing: -1 },
  tag: { color: '#9098AA', marginTop: 5 },
  form: { marginTop: 35, backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  heading: { fontSize: 21, fontWeight: '800', color: C.ink, marginBottom: 16 },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    paddingHorizontal: 14,
    marginBottom: 12,
    color: C.ink,
  },
  switch: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  mode: { color: '#758096', textAlign: 'center', fontSize: 11, marginTop: 20 },
});
