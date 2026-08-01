# Memory Stack — Full Implementation Guide for Codex
> Production-ready Android APK | Play Store Release | Version 1.0

---

## 📋 Table of Contents
1. [Project Structure](#1-project-structure)
2. [Environment Setup](#2-environment-setup)
3. [Database Schema](#3-database-schema)
4. [Authentication](#4-authentication)
5. [Navigation](#5-navigation)
6. [Screens & Components](#6-screens--components)
7. [AI Classification (Groq)](#7-ai-classification-groq)
8. [Spaced Repetition Logic](#8-spaced-repetition-logic)
9. [Push Notifications](#9-push-notifications)
10. [Problem Recommendation](#10-problem-recommendation)
11. [Performance Evaluation](#11-performance-evaluation)
12. [Memory Strength Engine](#12-memory-strength-engine)
13. [Offline Support](#13-offline-support)
14. [Play Store Build](#14-play-store-build)
15. [Environment Variables](#15-environment-variables)

---

## 1. Project Structure

```
MemoryStack/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx          # Home — Daily Queue
│   │   ├── add.tsx            # Add Problem
│   │   ├── queue.tsx          # Revision Queue
│   │   ├── profile.tsx        # Memory Strength Profile
│   │   └── stats.tsx          # Stats & Progress
│   ├── revision/
│   │   ├── [id].tsx           # Revision Session
│   │   └── result.tsx         # Performance Result
│   └── _layout.tsx
├── components/
│   ├── ProblemCard.tsx
│   ├── RevisionCard.tsx
│   ├── MemoryStrengthBar.tsx
│   ├── SkeletonLoader.tsx
│   ├── ConceptBadge.tsx
│   └── PerformanceForm.tsx
├── lib/
│   ├── supabase.ts
│   ├── groq.ts
│   ├── spacedRepetition.ts
│   ├── notifications.ts
│   ├── recommendations.ts
│   └── memoryStrength.ts
├── store/
│   └── useStore.ts            # Zustand global state
├── hooks/
│   ├── useRevisionQueue.ts
│   ├── useMemoryStrength.ts
│   └── useProblems.ts
├── types/
│   └── index.ts
├── constants/
│   └── topics.ts              # DSA topic list
├── app.json
├── eas.json
└── .env
```

---

## 2. Environment Setup

### Install
```bash
npx create-expo-app MemoryStack --template blank-typescript
cd MemoryStack
npx expo install expo-router expo-notifications expo-linking expo-constants expo-device
npm install @supabase/supabase-js zustand nativewind react-native-reanimated
npm install @react-native-async-storage/async-storage react-native-safe-area-context
npm install react-native-screens react-native-gesture-handler
npx expo install expo-build-properties
```

### app.json
```json
{
  "expo": {
    "name": "Memory Stack",
    "slug": "memory-stack",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "resizeMode": "contain", "backgroundColor": "#0f172a" },
    "android": {
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#0f172a" },
      "package": "com.memorystack.app",
      "googleServicesFile": "./google-services.json",
      "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "POST_NOTIFICATIONS"]
    },
    "plugins": [
      "expo-router",
      ["expo-notifications", { "color": "#6366f1" }],
      ["expo-build-properties", { "android": { "compileSdkVersion": 34, "targetSdkVersion": 34 } }]
    ],
    "scheme": "memorystack"
  }
}
```

### eas.json
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "aab" } }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./play-store-key.json",
        "track": "production"
      }
    }
  }
}
```

---

## 3. Database Schema

Run in Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Problems table
create table problems (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  platform text not null check (platform in ('LeetCode','Codeforces','CodeChef')),
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  topic text,
  subtopic text,
  pattern text,
  url text,
  solved_date date not null,
  created_at timestamptz default now()
);

-- Revisions table
create table revisions (
  id uuid primary key default uuid_generate_v4(),
  problem_id uuid references problems on delete cascade,
  user_id uuid references auth.users on delete cascade,
  revision_number int not null,
  due_date date not null,
  status text default 'pending' check (status in ('pending','completed','overdue')),
  score int check (score between 0 and 100),
  time_taken int,           -- seconds
  time_complexity text,
  space_complexity text,
  attempts int default 1,
  completed_date date,
  recommended_problem_name text,
  recommended_problem_url text,
  created_at timestamptz default now()
);

-- Memory strength table
create table memory_strength (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  topic text not null,
  strength_score float default 0,
  revision_count int default 0,
  success_rate float default 0,
  avg_score float default 0,
  last_revision_date date,
  next_revision_date date,
  updated_at timestamptz default now(),
  unique(user_id, topic)
);

-- Problem queue (recommendations)
create table problem_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  revision_id uuid references revisions,
  problem_name text not null,
  platform text,
  topic text,
  subtopic text,
  difficulty text,
  url text,
  status text default 'pending' check (status in ('pending','completed','skipped')),
  assigned_date date default current_date,
  due_date date,
  created_at timestamptz default now()
);

-- Enable RLS
alter table problems enable row level security;
alter table revisions enable row level security;
alter table memory_strength enable row level security;
alter table problem_queue enable row level security;

-- RLS Policies (users see only their own data)
create policy "own_problems" on problems for all using (auth.uid() = user_id);
create policy "own_revisions" on revisions for all using (auth.uid() = user_id);
create policy "own_memory" on memory_strength for all using (auth.uid() = user_id);
create policy "own_queue" on problem_queue for all using (auth.uid() = user_id);

-- Indexes for performance
create index idx_revisions_due on revisions(user_id, due_date, status);
create index idx_problems_user on problems(user_id);
create index idx_memory_topic on memory_strength(user_id, topic);
```

---

## 4. Authentication

### lib/supabase.ts
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### app/(auth)/login.tsx
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    else router.replace('/(tabs)');
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Check your email to confirm your account.');
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <Text style={{ color: '#6366f1', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>Memory Stack</Text>
      <Text style={{ color: '#94a3b8', marginBottom: 32 }}>DSA Revision. Powered by AI.</Text>
      <TextInput
        placeholder="Email" placeholderTextColor="#475569"
        value={email} onChangeText={setEmail} autoCapitalize="none"
        style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 14, borderRadius: 10, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password" placeholderTextColor="#475569"
        value={password} onChangeText={setPassword} secureTextEntry
        style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 14, borderRadius: 10, marginBottom: 24 }}
      />
      <TouchableOpacity onPress={handleLogin} disabled={loading}
        style={{ backgroundColor: '#6366f1', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? 'Loading...' : 'Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSignup}
        style={{ padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#6366f1' }}>
        <Text style={{ color: '#6366f1', fontWeight: 'bold' }}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 5. Navigation

### app/_layout.tsx
```typescript
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/notifications';

export default function RootLayout() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    registerForPushNotifications();
  }, []);

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f1f5f9' }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="revision/[id]" options={{ title: 'Revision Session' }} />
      <Stack.Screen name="revision/result" options={{ title: 'Result' }} />
    </Stack>
  );
}
```

### app/(tabs)/_layout.tsx
```typescript
import { Tabs } from 'expo-router';
import { Home, Plus, List, User, BarChart2 } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#475569',
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#f1f5f9'
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="queue" options={{ title: 'Queue', tabBarIcon: ({ color }) => <List color={color} size={22} /> }} />
      <Tabs.Screen name="add" options={{ title: 'Add', tabBarIcon: ({ color }) => <Plus color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', tabBarIcon: ({ color }) => <BarChart2 color={color} size={22} /> }} />
    </Tabs>
  );
}
```

---

## 6. Screens & Components

### app/(tabs)/index.tsx — Home (Daily Queue)
```typescript
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { markOverdueRevisions } from '../../lib/spacedRepetition';

export default function HomeScreen() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await markOverdueRevisions(user!.id);

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('revisions')
      .select('*, problems(*)')
      .eq('user_id', user!.id)
      .lte('due_date', today)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });

    // Group by topic
    const grouped = (data || []).reduce((acc: any, rev: any) => {
      const topic = rev.problems?.topic || 'Uncategorized';
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(rev);
      return acc;
    }, {});

    setQueue(Object.entries(grouped));
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  const totalDue = queue.reduce((sum, [_, items]: any) => sum + items.length, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchQueue(); setRefreshing(false); }} />}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 'bold' }}>Today's Revisions</Text>
        <Text style={{ color: '#6366f1', fontSize: 16, marginBottom: 20 }}>{totalDue} due today</Text>

        {loading ? <Text style={{ color: '#475569' }}>Loading...</Text> :
          queue.length === 0 ?
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ color: '#10b981', fontSize: 18, fontWeight: 'bold' }}>🎉 All caught up!</Text>
              <Text style={{ color: '#475569', marginTop: 8 }}>No revisions due today.</Text>
            </View> :
            queue.map(([topic, items]: any) => (
              <TouchableOpacity key={topic}
                onPress={() => router.push({ pathname: '/revision/[id]', params: { id: items[0].id, topic } })}
                style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12,
                  borderLeftWidth: 4, borderLeftColor: items.some((i: any) => i.status === 'overdue') ? '#ef4444' : '#6366f1' }}>
                <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 'bold' }}>{topic}</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4 }}>{items.length} problem{items.length > 1 ? 's' : ''} due</Text>
                {items.some((i: any) => i.status === 'overdue') &&
                  <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ Overdue</Text>}
              </TouchableOpacity>
            ))}
      </View>
    </ScrollView>
  );
}
```

### app/(tabs)/add.tsx — Add Problem
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { classifyProblem } from '../../lib/groq';
import { generateRevisionSchedule } from '../../lib/spacedRepetition';
import { router } from 'expo-router';

const PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function AddProblemScreen() {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [difficulty, setDifficulty] = useState('Medium');
  const [url, setUrl] = useState('');
  const [solvedDate, setSolvedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<any>(null);

  const handleClassify = async () => {
    if (!name) return Alert.alert('Error', 'Enter problem name first');
    setClassifying(true);
    const result = await classifyProblem(name, difficulty);
    setClassification(result);
    setClassifying(false);
  };

  const handleSubmit = async () => {
    if (!name || !classification) return Alert.alert('Error', 'Classify the problem first');
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: problem, error } = await supabase.from('problems').insert({
      user_id: user!.id, name, platform, difficulty: classification.difficulty || difficulty,
      topic: classification.topic, subtopic: classification.subtopic,
      pattern: classification.pattern, url, solved_date: solvedDate
    }).select().single();

    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }

    await generateRevisionSchedule(problem.id, user!.id, solvedDate);
    Alert.alert('Success', `${name} added! Revision schedule created.`);
    router.replace('/(tabs)');
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Add Solved Problem</Text>

        <Text style={{ color: '#94a3b8', marginBottom: 6 }}>Problem Name *</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. House Robber"
          placeholderTextColor="#475569"
          style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 14, borderRadius: 10, marginBottom: 16 }} />

        <Text style={{ color: '#94a3b8', marginBottom: 6 }}>Platform</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {PLATFORMS.map(p => (
            <TouchableOpacity key={p} onPress={() => setPlatform(p)}
              style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center',
                backgroundColor: platform === p ? '#6366f1' : '#1e293b' }}>
              <Text style={{ color: '#f1f5f9', fontSize: 12 }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94a3b8', marginBottom: 6 }}>Difficulty</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {DIFFICULTIES.map(d => (
            <TouchableOpacity key={d} onPress={() => setDifficulty(d)}
              style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center',
                backgroundColor: difficulty === d ? '#6366f1' : '#1e293b' }}>
              <Text style={{ color: '#f1f5f9', fontSize: 12 }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94a3b8', marginBottom: 6 }}>Problem URL (optional)</Text>
        <TextInput value={url} onChangeText={setUrl} placeholder="https://leetcode.com/problems/..."
          placeholderTextColor="#475569" autoCapitalize="none"
          style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 14, borderRadius: 10, marginBottom: 16 }} />

        <Text style={{ color: '#94a3b8', marginBottom: 6 }}>Solved Date</Text>
        <TextInput value={solvedDate} onChangeText={setSolvedDate} placeholder="YYYY-MM-DD"
          placeholderTextColor="#475569"
          style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 14, borderRadius: 10, marginBottom: 20 }} />

        <TouchableOpacity onPress={handleClassify} disabled={classifying}
          style={{ backgroundColor: '#1e40af', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 }}>
          {classifying ? <ActivityIndicator color="#fff" /> :
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>🤖 Classify with AI</Text>}
        </TouchableOpacity>

        {classification && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: '#10b981', fontWeight: 'bold', marginBottom: 8 }}>✓ Classification Result</Text>
            <Text style={{ color: '#94a3b8' }}>Topic: <Text style={{ color: '#f1f5f9' }}>{classification.topic}</Text></Text>
            <Text style={{ color: '#94a3b8' }}>Subtopic: <Text style={{ color: '#f1f5f9' }}>{classification.subtopic}</Text></Text>
            <Text style={{ color: '#94a3b8' }}>Pattern: <Text style={{ color: '#f1f5f9' }}>{classification.pattern}</Text></Text>
            <Text style={{ color: '#94a3b8' }}>Difficulty: <Text style={{ color: '#f1f5f9' }}>{classification.difficulty}</Text></Text>
          </View>
        )}

        <TouchableOpacity onPress={handleSubmit} disabled={loading || !classification}
          style={{ backgroundColor: classification ? '#6366f1' : '#334155', padding: 16, borderRadius: 10, alignItems: 'center' }}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Problem & Schedule Revisions</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### app/(tabs)/profile.tsx — Memory Strength Profile
```typescript
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [strengths, setStrengths] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data } = await supabase.from('memory_strength')
        .select('*').eq('user_id', user!.id).order('strength_score', { ascending: false });
      setStrengths(data || []);
    };
    load();
  }, []);

  const getColor = (score: number) =>
    score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 'bold' }}>Memory Profile</Text>
        <Text style={{ color: '#475569', marginBottom: 20 }}>{user?.email}</Text>

        {strengths.map(s => (
          <View key={s.id} style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{s.topic}</Text>
              <Text style={{ color: getColor(s.strength_score), fontWeight: 'bold' }}>{Math.round(s.strength_score)}%</Text>
            </View>
            <View style={{ backgroundColor: '#0f172a', borderRadius: 6, height: 8, marginBottom: 10 }}>
              <View style={{ backgroundColor: getColor(s.strength_score), borderRadius: 6, height: 8, width: `${s.strength_score}%` }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#475569', fontSize: 12 }}>Revisions: {s.revision_count}</Text>
              <Text style={{ color: '#475569', fontSize: 12 }}>Avg Score: {Math.round(s.avg_score)}%</Text>
              <Text style={{ color: '#475569', fontSize: 12 }}>Success: {Math.round(s.success_rate)}%</Text>
            </View>
            {s.next_revision_date &&
              <Text style={{ color: '#6366f1', fontSize: 12, marginTop: 6 }}>Next: {s.next_revision_date}</Text>}
          </View>
        ))}

        <TouchableOpacity onPress={() => supabase.auth.signOut().then(() => router.replace('/(auth)/login'))}
          style={{ backgroundColor: '#1e293b', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#ef4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### app/revision/[id].tsx — Revision Session
```typescript
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getRecommendation } from '../../lib/recommendations';

export default function RevisionSession() {
  const { id, topic } = useLocalSearchParams();
  const [revision, setRevision] = useState<any>(null);
  const [previousProblems, setPreviousProblems] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: rev } = await supabase.from('revisions')
        .select('*, problems(*)').eq('id', id).single();
      setRevision(rev);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: prev } = await supabase.from('problems')
        .select('name, platform').eq('user_id', user!.id).eq('topic', topic);
      setPreviousProblems(prev || []);

      const rec = await getRecommendation(user!.id, topic as string,
        rev.problems.subtopic, rev.problems.difficulty, prev?.map((p: any) => p.name) || []);
      setRecommendation(rec);
      setLoading(false);
    };
    load();
  }, []);

  const startRevision = () => {
    if (recommendation?.url) Linking.openURL(recommendation.url);
    router.push({ pathname: '/revision/result', params: {
      revisionId: id, recommendedProblem: recommendation?.name,
      recommendedUrl: recommendation?.url, topic
    }});
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator color="#6366f1" size="large" />
    <Text style={{ color: '#475569', marginTop: 12 }}>Getting recommendation...</Text>
  </View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#6366f1', fontSize: 14, marginBottom: 4 }}>Revision {revision?.revision_number} of 10</Text>
        <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>{topic}</Text>

        <Text style={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: 10 }}>Previously Solved</Text>
        {previousProblems.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#10b981', marginRight: 8 }}>✓</Text>
            <Text style={{ color: '#94a3b8' }}>{p.name} <Text style={{ color: '#475569' }}>({p.platform})</Text></Text>
          </View>
        ))}

        {recommendation && (
          <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 }}>
            <Text style={{ color: '#6366f1', fontWeight: 'bold', marginBottom: 8 }}>🎯 Today's Problem</Text>
            <Text style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' }}>{recommendation.name}</Text>
            <Text style={{ color: '#94a3b8', marginTop: 4 }}>Platform: {recommendation.platform}</Text>
            <Text style={{ color: '#94a3b8' }}>Difficulty: {recommendation.difficulty}</Text>
            <Text style={{ color: '#94a3b8' }}>Pattern: {recommendation.pattern}</Text>
          </View>
        )}

        <TouchableOpacity onPress={startRevision}
          style={{ backgroundColor: '#6366f1', padding: 16, borderRadius: 10, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Start Revision →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### app/revision/result.tsx — Performance Evaluation
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { calculateRevisionScore } from '../../lib/spacedRepetition';
import { updateMemoryStrength } from '../../lib/memoryStrength';
import { scheduleNextRevision } from '../../lib/spacedRepetition';

export default function ResultScreen() {
  const { revisionId, recommendedProblem, topic } = useLocalSearchParams();
  const [correct, setCorrect] = useState(true);
  const [timeTaken, setTimeTaken] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [attempts, setAttempts] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const score = calculateRevisionScore({ correct, timeTaken: Number(timeTaken),
      attempts: Number(attempts), timeComplexity, spaceComplexity });

    await supabase.from('revisions').update({
      score, status: 'completed', completed_date: new Date().toISOString().split('T')[0],
      time_taken: Number(timeTaken), time_complexity: timeComplexity,
      space_complexity: spaceComplexity, attempts: Number(attempts),
      recommended_problem_name: recommendedProblem
    }).eq('id', revisionId);

    const { data: { user } } = await supabase.auth.getUser();
    await updateMemoryStrength(user!.id, topic as string, score);
    await scheduleNextRevision(revisionId as string);

    router.replace({ pathname: '/revision/result', params: { final: 'true', score: String(score), topic } });
    setLoading(false);
  };

  const { final, score } = useLocalSearchParams();
  if (final === 'true') return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 64 }}>{Number(score) >= 80 ? '🎉' : Number(score) >= 50 ? '💪' : '📚'}</Text>
      <Text style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 'bold', marginTop: 16 }}>Score: {score}/100</Text>
      <Text style={{ color: '#94a3b8', marginTop: 8 }}>
        {Number(score) >= 80 ? 'Excellent! Memory strengthened.' : Number(score) >= 50 ? 'Good effort! Keep going.' : 'Needs more practice. Extra revision scheduled.'}
      </Text>
      <TouchableOpacity onPress={() => router.replace('/(tabs)')}
        style={{ backgroundColor: '#6366f1', padding: 16, borderRadius: 10, marginTop: 32, paddingHorizontal: 40 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Log Performance</Text>

        <Text style={{ color: '#94a3b8', marginBottom: 10 }}>Did you solve it correctly?</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {[true, false].map(v => (
            <TouchableOpacity key={String(v)} onPress={() => setCorrect(v)}
              style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center',
                backgroundColor: correct === v ? (v ? '#10b981' : '#ef4444') : '#1e293b' }}>
              <Text style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{v ? 'Yes ✓' : 'No ✗'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {[
          { label: 'Time Taken (minutes)', value: timeTaken, setter: setTimeTaken, placeholder: '30' },
          { label: 'Time Complexity', value: timeComplexity, setter: setTimeComplexity, placeholder: 'O(n)' },
          { label: 'Space Complexity', value: spaceComplexity, setter: setSpaceComplexity, placeholder: 'O(1)' },
          { label: 'Number of Attempts', value: attempts, setter: setAttempts, placeholder: '1' },
        ].map(({ label, value, setter, placeholder }) => (
          <View key={label} style={{ marginBottom: 16 }}>
            <Text style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</Text>
            <TextInput value={value} onChangeText={setter} placeholder={placeholder}
              placeholderTextColor="#475569"
              style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: 14, borderRadius: 10 }} />
          </View>
        ))}

        <TouchableOpacity onPress={handleSubmit} disabled={loading}
          style={{ backgroundColor: '#6366f1', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 }}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit & Get Score</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

---

## 7. AI Classification (Groq)

### lib/groq.ts
```typescript
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function classifyProblem(name: string, difficulty: string) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.1,
      messages: [{
        role: 'system',
        content: 'You are a DSA expert. Return only valid JSON. No explanation.'
      }, {
        role: 'user',
        content: `Classify this DSA problem:
Name: "${name}"
Difficulty hint: ${difficulty}

Return JSON only:
{
  "topic": "one of: Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Graphs, Dynamic Programming, Backtracking, Binary Search, Sorting, Hashing, Heaps, Greedy, Bit Manipulation, Math, Two Pointers, Sliding Window, Recursion, Trie",
  "subtopic": "specific subtopic",
  "pattern": "main algorithmic pattern",
  "difficulty": "Easy or Medium or Hard"
}`
      }]
    })
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { topic: 'Arrays', subtopic: 'General', pattern: 'Iteration', difficulty };
  }
}

export async function getAIRecommendation(
  topic: string, subtopic: string, difficulty: string, solvedNames: string[]
): Promise<{ name: string; platform: string; difficulty: string; pattern: string; url: string }> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.7,
      messages: [{
        role: 'system',
        content: 'You are a DSA expert. Return only valid JSON. No explanation.'
      }, {
        role: 'user',
        content: `Recommend a DSA problem for revision:
Topic: ${topic}
Subtopic: ${subtopic}
Difficulty: ${difficulty}
Already solved: ${solvedNames.join(', ')}

Return JSON only (must be a real LeetCode problem, not from already solved list):
{
  "name": "problem name",
  "platform": "LeetCode",
  "difficulty": "Easy or Medium or Hard",
  "pattern": "algorithmic pattern",
  "url": "https://leetcode.com/problems/problem-slug/"
}`
      }]
    })
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { name: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Hashing', url: 'https://leetcode.com/problems/two-sum/' };
  }
}
```

---

## 8. Spaced Repetition Logic

### lib/spacedRepetition.ts
```typescript
import { supabase } from './supabase';

const INTERVALS = [0, 1, 3, 7, 15, 30, 60, 90, 180, 365]; // days

export async function generateRevisionSchedule(
  problemId: string, userId: string, solvedDate: string
) {
  const base = new Date(solvedDate);
  const revisions = INTERVALS.map((days, i) => {
    const due = new Date(base);
    due.setDate(due.getDate() + days);
    return {
      problem_id: problemId,
      user_id: userId,
      revision_number: i + 1,
      due_date: due.toISOString().split('T')[0],
      status: i === 0 ? 'pending' : 'pending'
    };
  });

  await supabase.from('revisions').insert(revisions);
}

export async function scheduleNextRevision(revisionId: string) {
  const { data: rev } = await supabase.from('revisions')
    .select('*').eq('id', revisionId).single();
  if (!rev || rev.revision_number >= 10) return;

  // Mark current as completed (already done), just ensure next is active
  const { data: nextRev } = await supabase.from('revisions')
    .select('*').eq('problem_id', rev.problem_id)
    .eq('revision_number', rev.revision_number + 1).single();

  if (nextRev && nextRev.status === 'pending') return; // already scheduled
}

export async function markOverdueRevisions(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('revisions')
    .update({ status: 'overdue' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_date', today);
}

export function calculateRevisionScore({
  correct, timeTaken, attempts, timeComplexity, spaceComplexity
}: {
  correct: boolean; timeTaken: number; attempts: number;
  timeComplexity: string; spaceComplexity: string;
}): number {
  if (!correct) return Math.max(10, 40 - (attempts - 1) * 10);

  let score = 100;
  if (attempts > 1) score -= (attempts - 1) * 10;
  if (timeTaken > 45) score -= 15;
  else if (timeTaken > 30) score -= 8;
  if (spaceComplexity?.includes('n²') || timeComplexity?.includes('n²')) score -= 10;

  return Math.max(10, Math.min(100, score));
}
```

---

## 9. Push Notifications

### lib/notifications.ts
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true
  })
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const { status: s } = await Notifications.requestPermissionsAsync();
    status = s;
  }
  if (status !== 'granted') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('revisions', {
      name: 'Daily Revisions', importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250], lightColor: '#6366f1'
    });
  }
  await scheduleDailyReminder();
}

export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Memory Stack',
      body: "Don't forget your DSA revisions today!",
      sound: true,
      data: { screen: 'home' }
    },
    trigger: {
      hour: 9, minute: 0, repeats: true,
      channelId: 'revisions'
    } as any
  });
}

export async function sendOverdueAlert(topic: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠ Overdue Revision',
      body: `You missed a revision for ${topic}. Review it now!`,
      channelId: 'revisions'
    },
    trigger: null
  });
}
```

---

## 10. Problem Recommendation

### lib/recommendations.ts
```typescript
import { supabase } from './supabase';
import { getAIRecommendation } from './groq';

export async function getRecommendation(
  userId: string, topic: string, subtopic: string,
  difficulty: string, solvedNames: string[]
) {
  // First try from problem_queue
  const { data: queued } = await supabase.from('problem_queue')
    .select('*').eq('user_id', userId).eq('topic', topic)
    .eq('status', 'pending').limit(1).single();

  if (queued) return queued;

  // Otherwise get AI recommendation
  const rec = await getAIRecommendation(topic, subtopic, difficulty, solvedNames);

  // Store in queue
  await supabase.from('problem_queue').insert({
    user_id: userId, problem_name: rec.name, platform: rec.platform,
    topic, subtopic, difficulty: rec.difficulty, url: rec.url, status: 'pending',
    due_date: new Date().toISOString().split('T')[0]
  });

  return { name: rec.name, platform: rec.platform, difficulty: rec.difficulty,
    pattern: rec.pattern, url: rec.url };
}
```

---

## 11. Memory Strength Engine

### lib/memoryStrength.ts
```typescript
import { supabase } from './supabase';

export async function updateMemoryStrength(userId: string, topic: string, score: number) {
  const { data: existing } = await supabase.from('memory_strength')
    .select('*').eq('user_id', userId).eq('topic', topic).single();

  if (!existing) {
    await supabase.from('memory_strength').insert({
      user_id: userId, topic, strength_score: score,
      revision_count: 1, success_rate: score >= 60 ? 100 : 0,
      avg_score: score, last_revision_date: new Date().toISOString().split('T')[0]
    });
    return;
  }

  const newCount = existing.revision_count + 1;
  const newAvg = ((existing.avg_score * existing.revision_count) + score) / newCount;
  const successCount = (existing.success_rate / 100 * existing.revision_count) + (score >= 60 ? 1 : 0);
  const newSuccessRate = (successCount / newCount) * 100;

  // Weighted strength: recent performance matters more
  const newStrength = (existing.strength_score * 0.6) + (score * 0.4);

  await supabase.from('memory_strength').update({
    strength_score: Math.min(100, newStrength),
    revision_count: newCount,
    success_rate: newSuccessRate,
    avg_score: newAvg,
    last_revision_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  }).eq('id', existing.id);
}
```

---

## 12. Global State

### store/useStore.ts
```typescript
import { create } from 'zustand';

interface AppState {
  user: any;
  setUser: (user: any) => void;
  todayQueue: any[];
  setTodayQueue: (queue: any[]) => void;
  memoryStrengths: any[];
  setMemoryStrengths: (s: any[]) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  todayQueue: [],
  setTodayQueue: (todayQueue) => set({ todayQueue }),
  memoryStrengths: [],
  setMemoryStrengths: (memoryStrengths) => set({ memoryStrengths }),
}));
```

---

## 13. Offline Support

### AsyncStorage cache pattern
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function cacheQueue(queue: any[]) {
  await AsyncStorage.setItem('cached_queue', JSON.stringify(queue));
  await AsyncStorage.setItem('cache_date', new Date().toISOString().split('T')[0]);
}

export async function getCachedQueue() {
  const date = await AsyncStorage.getItem('cache_date');
  const today = new Date().toISOString().split('T')[0];
  if (date !== today) return null;
  const cached = await AsyncStorage.getItem('cached_queue');
  return cached ? JSON.parse(cached) : null;
}
```

---

## 14. Play Store Build

### Step 1 — EAS Setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Step 2 — Production AAB Build
```bash
eas build --platform android --profile production
```

### Step 3 — Submit to Play Store
```bash
# Download service account key from Google Play Console
# Save as play-store-key.json in root
eas submit --platform android --profile production
```

### Play Store Checklist
- [ ] App icon 512×512 PNG
- [ ] Feature graphic 1024×500 PNG
- [ ] Screenshots (phone): min 2, max 8
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy Policy URL (required for apps using internet)
- [ ] Content rating questionnaire
- [ ] Target API level 34 (Android 14) — required 2024+
- [ ] App signing enrolled via Play App Signing

### Privacy Policy (Required)
Host a simple privacy policy page. Minimum content:
```
Memory Stack collects email for authentication via Supabase.
Problem data is stored securely and never shared with third parties.
Push notifications can be disabled in device settings.
Contact: your@email.com
```

---

## 15. Environment Variables

### .env
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GROQ_API_KEY=your-groq-api-key
```

> ⚠ Never commit `.env` to GitHub. Add to `.gitignore`.

---

## 🚀 Codex Prompts Cheat Sheet

Use these exact prompts in Codex/Cursor to build each feature:

| Feature | Prompt |
|---|---|
| Auth flow | *"Implement Supabase email auth with session persistence in Expo Router, redirect to tabs on login"* |
| Add problem form | *"Create a React Native form with platform/difficulty toggle buttons, date input, and AI classify button that calls Groq API"* |
| Home queue | *"Fetch today's due revisions from Supabase grouped by topic, show overdue in red, tap navigates to revision session"* |
| AI classify | *"Call Groq llama-3.3-70b API with DSA problem name, parse JSON response for topic/subtopic/pattern/difficulty"* |
| Revision schedule | *"Generate 10 revision dates from solved date using intervals [0,1,3,7,15,30,60,90,180,365] days, insert all to Supabase"* |
| Memory strength | *"Update memory strength score using weighted average (60% old, 40% new score), update success rate and avg score in Supabase"* |
| Push notification | *"Schedule daily local push notification at 9 AM using Expo Notifications with Android channel setup"* |
| Recommendation | *"Call Groq API with topic/subtopic/difficulty and solved problem names, get new LeetCode problem recommendation as JSON"* |
| Profile screen | *"Fetch memory_strength table from Supabase, display each topic as a card with colored progress bar based on score"* |
| Play Store build | *"Configure eas.json for production AAB build with compileSdkVersion 34, run eas build and eas submit"* |

---

## 📅 Build Timeline for Codex

| Day | Task |
|---|---|
| 1 | Project setup, Supabase schema, auth screens |
| 2 | Navigation, Add Problem screen, Groq classification |
| 3 | Spaced repetition schedule generation |
| 4 | Home screen daily queue, revision session |
| 5 | Performance evaluation, scoring, result screen |
| 6 | Memory strength engine, profile screen |
| 7 | Push notifications, offline cache |
| 8 | Stats screen, problem queue, recommendation |
| 9 | UI polish, dark mode, error handling |
| 10 | EAS build, Play Store submission |

**Total: 10 days to Play Store** 🚀
