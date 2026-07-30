import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

type Tab = 'Home' | 'Queue' | 'Add' | 'Profile' | 'Stats';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Problem = {
  id: string;
  name: string;
  platform: string;
  topic: string;
  subtopic: string;
  pattern: string;
  difficulty: Difficulty;
  revision: number;
  due: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  score?: number;
};

const C = {
  ink: '#161A23', muted: '#737784', line: '#E8E8EC', bg: '#F7F7F8',
  white: '#FFFFFF', purple: '#6C4EF5', purpleSoft: '#EEEAFE',
  green: '#18A873', greenSoft: '#E7F8F1', orange: '#F29339', red: '#E45353',
};

const seed: Problem[] = [
  { id: '1', name: 'Two Sum', platform: 'LeetCode', topic: 'Arrays & Hashing', subtopic: 'Hash Maps', pattern: 'Complement Lookup', difficulty: 'Easy', revision: 4, due: 'Today', status: 'Pending', score: 86 },
  { id: '2', name: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', topic: 'Sliding Window', subtopic: 'Variable Window', pattern: 'Two Pointers', difficulty: 'Medium', revision: 3, due: 'Today', status: 'Pending', score: 74 },
  { id: '3', name: 'Course Schedule', platform: 'LeetCode', topic: 'Graphs', subtopic: 'Topological Sort', pattern: 'Kahn’s Algorithm', difficulty: 'Medium', revision: 2, due: 'Yesterday', status: 'Overdue', score: 62 },
  { id: '4', name: 'Merge Intervals', platform: 'LeetCode', topic: 'Intervals', subtopic: 'Overlapping Intervals', pattern: 'Sort & Sweep', difficulty: 'Medium', revision: 5, due: 'Tomorrow', status: 'Pending', score: 89 },
];

const icons: Record<Tab, string> = { Home: '⌂', Queue: '☷', Add: '+', Profile: '♙', Stats: '⌁' };
const intervals = [0, 1, 3, 7, 15, 30, 60, 90, 180, 365];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: true }),
});

function Pill({ children, tone = 'purple' }: { children: React.ReactNode; tone?: 'purple'|'green'|'orange'|'red'|'gray' }) {
  const map = { purple: [C.purpleSoft, C.purple], green: [C.greenSoft, C.green], orange: ['#FFF1E3', C.orange], red: ['#FDEAEA', C.red], gray: ['#F0F0F2', C.muted] };
  return <View style={[s.pill, { backgroundColor: map[tone][0] }]}><Text style={[s.pillText, { color: map[tone][1] }]}>{children}</Text></View>;
}

function Progress({ value, color = C.purple }: { value: number; color?: string }) {
  return <View style={s.track}><View style={[s.fill, { width: `${Math.max(3, value)}%`, backgroundColor: color }]} /></View>;
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{action && <Pressable onPress={onPress}><Text style={s.link}>{action}</Text></Pressable>}</View>;
}

function ProblemCard({ item, onStart }: { item: Problem; onStart: (p: Problem) => void }) {
  return <View style={s.card}>
    <View style={s.rowBetween}>
      <View style={{ flex: 1, paddingRight: 10 }}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.meta}>{item.topic}  ·  R{item.revision}</Text></View>
      <Pill tone={item.status === 'Overdue' ? 'red' : item.difficulty === 'Easy' ? 'green' : 'orange'}>{item.status === 'Overdue' ? 'Overdue' : item.difficulty}</Pill>
    </View>
    <View style={[s.rowBetween, { marginTop: 16 }]}><Text style={s.platform}>{item.platform}</Text><Pressable style={s.smallButton} onPress={() => onStart(item)}><Text style={s.smallButtonText}>Start revision  →</Text></Pressable></View>
  </View>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Home');
  const [problems, setProblems] = useState<Problem[]>(seed);
  const [active, setActive] = useState<Problem | null>(null);
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { AsyncStorage.getItem('memory-stack').then(v => { if (v) { try { setProblems(JSON.parse(v)); } catch {} } setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem('memory-stack', JSON.stringify(problems)); }, [problems, loaded]);
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('revisions', { name: 'Daily revisions', importance: Notifications.AndroidImportance.DEFAULT });
      const existing = await AsyncStorage.getItem('reminder-scheduled');
      if (existing) return;
      const permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Your memory stack is ready', body: `You have ${due.length} revisions due today.`, data: { screen: 'queue' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0, channelId: 'revisions' },
      });
      await AsyncStorage.setItem('reminder-scheduled', 'true');
    })().catch(() => {});
  }, [loaded]);

  const due = problems.filter(p => p.status !== 'Completed' && (p.due === 'Today' || p.status === 'Overdue'));
  const completed = problems.filter(p => p.status === 'Completed').length;
  const strength = Math.round(problems.reduce((a, p) => a + (p.score || 70), 0) / problems.length);

  const finish = (problem: Problem, score: number) => {
    const nextRevision = Math.min(10, problem.revision + 1);
    setProblems(list => list.map(p => p.id === problem.id ? { ...p, revision: nextRevision, due: `In ${intervals[nextRevision - 1]} days`, status: 'Completed', score } : p));
    setActive(null); setTab('Home');
    Alert.alert('Revision complete', `Memory score updated to ${score}%. Next review: ${intervals[nextRevision - 1]} days.`);
  };

  return <SafeAreaView style={[s.safe, dark && { backgroundColor: '#11131A' }]}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <View style={[s.app, dark && { backgroundColor: '#11131A' }]}>
      <View style={s.topbar}><View><Text style={[s.logo, dark && s.darkText]}>Memory<Text style={{ color: C.purple }}>Stack</Text></Text><Text style={s.kicker}>LEARN  ·  REVISE  ·  RETAIN</Text></View><View style={s.avatar}><Text style={s.avatarText}>AS</Text></View></View>
      <View style={{ flex: 1 }}>
        {tab === 'Home' && <Home due={due} strength={strength} completed={completed} onStart={setActive} onQueue={() => setTab('Queue')} dark={dark} />}
        {tab === 'Queue' && <Queue problems={problems} onStart={setActive} />}
        {tab === 'Add' && <AddProblem onAdd={p => { setProblems(x => [p, ...x]); setTab('Queue'); }} />}
        {tab === 'Profile' && <Profile problems={problems} strength={strength} dark={dark} setDark={setDark} />}
        {tab === 'Stats' && <Stats problems={problems} strength={strength} />}
      </View>
      <View style={[s.nav, dark && { backgroundColor: '#1A1D26', borderTopColor: '#292D39' }]}>
        {(Object.keys(icons) as Tab[]).map(x => <Pressable key={x} accessibilityRole="button" style={s.navItem} onPress={() => setTab(x)}>
          <View style={x === 'Add' ? s.addCircle : undefined}><Text style={[s.navIcon, tab === x && { color: C.purple }, x === 'Add' && { color: C.white, fontSize: 27 }]}>{icons[x]}</Text></View>
          {x !== 'Add' && <Text style={[s.navLabel, tab === x && { color: C.purple, fontWeight: '700' }]}>{x}</Text>}
        </Pressable>)}
      </View>
    </View>
    <RevisionModal problem={active} onClose={() => setActive(null)} onFinish={finish} />
  </SafeAreaView>;
}

function Home({ due, strength, completed, onStart, onQueue, dark }: { due: Problem[]; strength: number; completed: number; onStart: (p: Problem) => void; onQueue: () => void; dark: boolean }) {
  return <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <Text style={[s.eyebrow, dark && { color: '#A9AEBE' }]}>THURSDAY, JULY 30</Text><Text style={[s.hero, dark && s.darkText]}>Good afternoon, Akash 👋</Text><Text style={s.sub}>Small reviews. Strong memories.</Text>
    <View style={s.focusCard}>
      <View style={s.rowBetween}><Pill>DAILY FOCUS</Pill><Text style={s.focusIcon}>✦</Text></View>
      <Text style={s.focusNumber}>{due.length}</Text><Text style={s.focusTitle}>revisions due today</Text><Text style={s.focusSub}>{due.filter(x => x.status === 'Overdue').length ? `${due.filter(x => x.status === 'Overdue').length} overdue · ` : ''}About {Math.max(8, due.length * 6)} minutes</Text>
      <Pressable style={s.primary} onPress={() => due[0] ? onStart(due[0]) : onQueue()}><Text style={s.primaryText}>{due.length ? 'Start today’s stack' : 'Explore your queue'}  →</Text></Pressable>
    </View>
    <View style={s.metrics}><View style={s.metric}><Text style={s.metricValue}>{strength}%</Text><Text style={s.metricLabel}>Memory strength</Text><Progress value={strength} /></View><View style={s.metric}><Text style={s.metricValue}>{completed}</Text><Text style={s.metricLabel}>Completed today</Text><Text style={s.up}>↑ Keep going</Text></View></View>
    <SectionTitle title="Up next" action="View queue" onPress={onQueue} />
    {due.slice(0, 2).map(p => <ProblemCard key={p.id} item={p} onStart={onStart} />)}
    <View style={s.insight}><Text style={s.insightIcon}>✦</Text><View style={{ flex: 1 }}><Text style={s.insightTitle}>Memory insight</Text><Text style={s.insightText}>Your Arrays recall is strongest. A short Graphs revision today will balance your stack.</Text></View></View>
  </ScrollView>;
}

function Queue({ problems, onStart }: { problems: Problem[]; onStart: (p: Problem) => void }) {
  const [filter, setFilter] = useState<'All'|'Today'|'Overdue'>('All');
  const list = problems.filter(p => filter === 'All' || (filter === 'Today' ? p.due === 'Today' : p.status === 'Overdue'));
  return <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <Text style={s.screenTitle}>Revision queue</Text><Text style={s.sub}>Your reviews, ordered by memory priority.</Text>
    <View style={s.filters}>{(['All','Today','Overdue'] as const).map(x => <Pressable key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && s.filterActive]}><Text style={[s.filterText, filter === x && { color: C.white }]}>{x}{x === 'All' ? `  ${problems.length}` : ''}</Text></Pressable>)}</View>
    {list.length ? list.map(p => <ProblemCard key={p.id} item={p} onStart={onStart} />) : <Empty text="Nothing due here. Your memory stack is clear." />}
  </ScrollView>;
}

function AddProblem({ onAdd }: { onAdd: (p: Problem) => void }) {
  const [name, setName] = useState(''); const [platform, setPlatform] = useState('LeetCode'); const [difficulty, setDifficulty] = useState<Difficulty>('Medium'); const [classifying, setClassifying] = useState(false);
  const submit = () => {
    if (!name.trim()) return Alert.alert('Problem name required', 'Enter the problem you solved.');
    setClassifying(true);
    setTimeout(() => {
      const lower = name.toLowerCase();
      const cls = lower.includes('tree') ? ['Trees','Traversal','Depth-first Search'] : lower.includes('graph') || lower.includes('course') ? ['Graphs','Graph Traversal','Topological Sort'] : lower.includes('substring') || lower.includes('window') ? ['Sliding Window','Variable Window','Two Pointers'] : ['Arrays & Hashing','Hash Maps','Frequency Map'];
      onAdd({ id: Date.now().toString(), name: name.trim(), platform, difficulty, topic: cls[0], subtopic: cls[1], pattern: cls[2], revision: 1, due: 'Today', status: 'Pending', score: 70 });
      setClassifying(false); setName(''); Alert.alert('Added to your stack', `${cls[0]} → ${cls[1]} → ${cls[2]}`);
    }, 900);
  };
  return <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.screenTitle}>Add solved problem</Text><Text style={s.sub}>Log it now. We’ll handle the revision plan.</Text>
    <View style={s.formCard}><Text style={s.label}>PROBLEM NAME</Text><TextInput value={name} onChangeText={setName} placeholder="e.g. Two Sum" placeholderTextColor="#A5A7AE" style={s.input} />
      <Text style={s.label}>PLATFORM</Text><View style={s.choiceRow}>{['LeetCode','Codeforces','CodeChef'].map(x => <Pressable key={x} onPress={() => setPlatform(x)} style={[s.choice, platform === x && s.choiceActive]}><Text style={[s.choiceText, platform === x && { color: C.purple }]}>{x}</Text></Pressable>)}</View>
      <Text style={s.label}>DIFFICULTY</Text><View style={s.choiceRow}>{(['Easy','Medium','Hard'] as Difficulty[]).map(x => <Pressable key={x} onPress={() => setDifficulty(x)} style={[s.choice, difficulty === x && s.choiceActive]}><Text style={[s.choiceText, difficulty === x && { color: C.purple }]}>{x}</Text></Pressable>)}</View>
      <Text style={s.label}>SOLVED DATE</Text><View style={s.input}><Text style={{ color: C.ink }}>Today, July 30, 2026</Text></View>
      <Pressable disabled={classifying} style={[s.primary, classifying && { opacity: .7 }]} onPress={submit}><Text style={s.primaryText}>{classifying ? '✦  Classifying concept…' : 'Add to memory stack  →'}</Text></Pressable>
    </View>
    <View style={s.aiNote}><Text style={s.insightIcon}>✦</Text><Text style={s.aiText}>AI classifies the topic, subtopic and pattern, then creates all 10 spaced reviews automatically.</Text></View>
  </ScrollView>;
}

function Profile({ problems, strength, dark, setDark }: { problems: Problem[]; strength: number; dark: boolean; setDark: (x: boolean) => void }) {
  const topics = useMemo(() => Array.from(new Set(problems.map(p => p.topic))).map(topic => { const a = problems.filter(p => p.topic === topic); return { topic, score: Math.round(a.reduce((n,p) => n + (p.score || 70),0)/a.length), count: a.length }; }).sort((a,b) => b.score-a.score), [problems]);
  return <ScrollView contentContainerStyle={s.content}>
    <View style={s.profileHead}><View style={s.bigAvatar}><Text style={s.bigAvatarText}>AS</Text></View><Text style={s.screenTitle}>Akash Sharma</Text><Text style={s.sub}>Building interview-ready recall</Text></View>
    <View style={s.strengthCard}><Text style={s.label}>OVERALL MEMORY STRENGTH</Text><View style={s.rowBetween}><Text style={s.bigScore}>{strength}%</Text><Pill tone="green">Strong</Pill></View><Progress value={strength} /><Text style={s.meta}>Across {topics.length} concepts · {problems.length} problems</Text></View>
    <SectionTitle title="Concept memory" />
    {topics.map((x, i) => <View style={s.topicRow} key={x.topic}><View style={[s.topicIcon, { backgroundColor: i % 2 ? '#E8F6F3' : C.purpleSoft }]}><Text>{i % 2 ? '⌁' : '◈'}</Text></View><View style={{ flex: 1 }}><View style={s.rowBetween}><Text style={s.topicTitle}>{x.topic}</Text><Text style={s.topicScore}>{x.score}%</Text></View><Progress value={x.score} color={x.score < 70 ? C.orange : C.purple} /><Text style={s.meta}>{x.count} problem{x.count !== 1 ? 's' : ''} · Next review soon</Text></View></View>)}
    <View style={s.setting}><View><Text style={s.cardTitle}>Dark mode</Text><Text style={s.meta}>Reduce glare while studying</Text></View><Switch value={dark} onValueChange={setDark} trackColor={{ true: C.purple }} /></View>
  </ScrollView>;
}

function Stats({ problems, strength }: { problems: Problem[]; strength: number }) {
  const weeks = [42,58,49,72,64,84,Math.min(96,strength)];
  return <ScrollView contentContainerStyle={s.content}>
    <Text style={s.screenTitle}>Your progress</Text><Text style={s.sub}>Consistency turns practice into recall.</Text>
    <View style={s.statsHero}><Text style={s.label}>THIS WEEK</Text><Text style={s.bigScore}>{problems.length + 8}</Text><Text style={s.focusTitle}>revisions completed</Text><Text style={s.up}>↑ 18% from last week</Text></View>
    <SectionTitle title="Memory trend" />
    <View style={s.chart}><View style={s.bars}>{weeks.map((h,i) => <View key={i} style={s.barWrap}><View style={[s.bar, { height: h }]} /><Text style={s.barLabel}>{['F','S','S','M','T','W','T'][i]}</Text></View>)}</View></View>
    <View style={s.metrics}><View style={s.metric}><Text style={s.metricValue}>{strength}%</Text><Text style={s.metricLabel}>Avg. score</Text></View><View style={s.metric}><Text style={s.metricValue}>12m</Text><Text style={s.metricLabel}>Avg. session</Text></View></View>
    <SectionTitle title="Revision cycle" />
    <View style={s.card}>{intervals.map((d,i) => <View key={i} style={s.cycleRow}><View style={[s.cycleDot, i < 4 && { backgroundColor: C.purple }]}><Text style={[s.cycleDotText, i < 4 && { color: C.white }]}>{i + 1}</Text></View><Text style={s.cycleName}>Revision {i + 1}</Text><Text style={s.meta}>{d === 0 ? 'Immediately' : `${d} days`}</Text></View>)}</View>
  </ScrollView>;
}

function RevisionModal({ problem, onClose, onFinish }: { problem: Problem | null; onClose: () => void; onFinish: (p: Problem, score: number) => void }) {
  const [correct, setCorrect] = useState(true); const [minutes, setMinutes] = useState('18'); const [attempts, setAttempts] = useState('1');
  if (!problem) return null;
  const url = problem.platform === 'LeetCode' ? `https://leetcode.com/problemset/?search=${encodeURIComponent(problem.name)}` : problem.platform === 'Codeforces' ? 'https://codeforces.com/problemset' : 'https://www.codechef.com/practice';
  const score = Math.max(35, Math.min(100, (correct ? 82 : 48) + (Number(attempts) <= 1 ? 10 : 0) - Math.max(0, Number(minutes) - 25)));
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.modalSafe}><ScrollView contentContainerStyle={s.modalContent}>
    <View style={s.modalTop}><Pressable onPress={onClose} style={s.close}><Text style={s.closeText}>×</Text></Pressable><Pill>REVISION {problem.revision} OF 10</Pill><View style={{ width: 48 }} /></View>
    <Text style={s.modalEyebrow}>{problem.topic}  /  {problem.subtopic}</Text><Text style={s.modalTitle}>{problem.name}</Text><Text style={s.sub}>{problem.pattern} · {problem.difficulty}</Text>
    <View style={s.prompt}><Text style={s.promptTitle}>Before you code</Text><Text style={s.promptText}>Explain the core pattern out loud. What signals tell you this approach fits, and what is its time complexity?</Text></View>
    <Pressable style={s.outlineButton} onPress={() => Linking.openURL(url)}><Text style={s.outlineText}>Open on {problem.platform}  ↗</Text></Pressable>
    <SectionTitle title="Log your performance" />
    <Text style={s.label}>DID YOU SOLVE IT CORRECTLY?</Text><View style={s.choiceRow}><Pressable onPress={() => setCorrect(true)} style={[s.choice, correct && s.choiceActive]}><Text style={s.choiceText}>✓  Yes</Text></Pressable><Pressable onPress={() => setCorrect(false)} style={[s.choice, !correct && s.choiceActive]}><Text style={s.choiceText}>×  Not yet</Text></Pressable></View>
    <View style={s.twoCols}><View style={{ flex: 1 }}><Text style={s.label}>TIME (MIN)</Text><TextInput keyboardType="number-pad" value={minutes} onChangeText={setMinutes} style={s.input} /></View><View style={{ flex: 1 }}><Text style={s.label}>ATTEMPTS</Text><TextInput keyboardType="number-pad" value={attempts} onChangeText={setAttempts} style={s.input} /></View></View>
    <View style={s.scorePreview}><Text style={s.label}>ESTIMATED REVISION SCORE</Text><Text style={s.previewScore}>{score}</Text><Progress value={score} color={score >= 75 ? C.green : C.orange} /></View>
    <Pressable style={s.primary} onPress={() => onFinish(problem, score)}><Text style={s.primaryText}>Complete revision  →</Text></Pressable>
  </ScrollView></SafeAreaView></Modal>;
}

function Empty({ text }: { text: string }) { return <View style={s.empty}><Text style={s.emptyIcon}>✓</Text><Text style={s.cardTitle}>{text}</Text></View>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white, paddingTop: Platform.OS === 'android' ? 22 : 0 }, app: { flex: 1, backgroundColor: C.bg }, darkText: { color: C.white },
  topbar: { height: 72, backgroundColor: C.white, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line },
  logo: { fontSize: 21, fontWeight: '800', color: C.ink, letterSpacing: -.6 }, kicker: { fontSize: 8, color: C.muted, letterSpacing: 1.6, marginTop: 3 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: C.purple, fontWeight: '800', fontSize: 12 },
  content: { padding: 20, paddingBottom: 34 }, eyebrow: { fontSize: 11, letterSpacing: 1.4, color: C.muted, fontWeight: '700', marginTop: 5, marginBottom: 7 }, hero: { fontSize: 27, lineHeight: 34, fontWeight: '800', color: C.ink, letterSpacing: -.8 }, screenTitle: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -.8 }, sub: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 5 },
  focusCard: { backgroundColor: C.ink, padding: 22, borderRadius: 24, marginTop: 23, shadowColor: '#171721', shadowOpacity: .18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, focusIcon: { color: '#A996FF', fontSize: 24 }, focusNumber: { color: C.white, fontSize: 53, fontWeight: '800', marginTop: 14, letterSpacing: -2 }, focusTitle: { fontSize: 17, color: C.ink, fontWeight: '700' }, focusSub: { color: '#AEB0BA', marginTop: 6, marginBottom: 18 },
  primary: { minHeight: 52, borderRadius: 14, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, marginTop: 10 }, primaryText: { color: C.white, fontSize: 15, fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: 12, marginTop: 14 }, metric: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, minHeight: 116 }, metricValue: { fontSize: 25, fontWeight: '800', color: C.ink }, metricLabel: { fontSize: 12, color: C.muted, marginTop: 5, marginBottom: 12 }, up: { fontSize: 11, fontWeight: '700', color: C.green, marginTop: 5 },
  sectionHead: { marginTop: 26, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '800' }, link: { color: C.purple, fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 17, marginBottom: 11 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardTitle: { color: C.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' }, meta: { color: C.muted, fontSize: 11, marginTop: 6 }, platform: { color: C.muted, fontSize: 12, fontWeight: '600' }, smallButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 12 }, smallButtonText: { color: C.purple, fontSize: 12, fontWeight: '700' },
  pill: { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start' }, pillText: { fontSize: 9, letterSpacing: .6, fontWeight: '800' }, track: { width: '100%', height: 6, backgroundColor: '#ECECF0', borderRadius: 99, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 99 },
  insight: { flexDirection: 'row', gap: 13, backgroundColor: C.purpleSoft, padding: 17, borderRadius: 18, marginTop: 7 }, insightIcon: { color: C.purple, fontSize: 18 }, insightTitle: { color: C.purple, fontWeight: '800', fontSize: 13 }, insightText: { color: '#5B527C', fontSize: 12, lineHeight: 18, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 22 }, filter: { minHeight: 42, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, justifyContent: 'center' }, filterActive: { backgroundColor: C.ink, borderColor: C.ink }, filterText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  formCard: { marginTop: 22, backgroundColor: C.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.line }, label: { color: C.muted, fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginTop: 15, marginBottom: 8 }, input: { minHeight: 52, borderWidth: 1, borderColor: '#DFDFE4', borderRadius: 13, paddingHorizontal: 14, justifyContent: 'center', color: C.ink, backgroundColor: '#FBFBFC' }, choiceRow: { flexDirection: 'row', gap: 8 }, choice: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: '#DFDFE4', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFBFC' }, choiceActive: { borderColor: C.purple, backgroundColor: C.purpleSoft }, choiceText: { color: C.ink, fontSize: 11, fontWeight: '700' }, aiNote: { flexDirection: 'row', gap: 10, padding: 16, marginTop: 14 }, aiText: { flex: 1, color: C.muted, fontSize: 12, lineHeight: 18 },
  profileHead: { alignItems: 'center', marginTop: 7, marginBottom: 22 }, bigAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }, bigAvatarText: { color: C.white, fontWeight: '800', fontSize: 20 }, strengthCard: { backgroundColor: C.white, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: C.line }, bigScore: { color: C.ink, fontSize: 42, fontWeight: '800', letterSpacing: -1.5, marginBottom: 12 }, topicRow: { flexDirection: 'row', gap: 13, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, padding: 15 }, topicIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, topicTitle: { color: C.ink, fontSize: 13, fontWeight: '700' }, topicScore: { color: C.ink, fontSize: 13, fontWeight: '800' }, setting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.white, borderRadius: 17, padding: 17, marginTop: 18, borderWidth: 1, borderColor: C.line },
  statsHero: { backgroundColor: C.white, marginTop: 22, padding: 22, borderRadius: 20, borderWidth: 1, borderColor: C.line }, chart: { backgroundColor: C.white, height: 165, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 16 }, bars: { height: 125, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }, barWrap: { height: 125, justifyContent: 'flex-end', alignItems: 'center' }, bar: { width: 18, borderRadius: 6, backgroundColor: C.purple }, barLabel: { fontSize: 10, color: C.muted, marginTop: 7 }, cycleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 46, borderBottomWidth: 1, borderBottomColor: C.line }, cycleDot: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#ECECF0', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, cycleDotText: { fontSize: 10, color: C.muted, fontWeight: '800' }, cycleName: { flex: 1, color: C.ink, fontSize: 13, fontWeight: '600' },
  nav: { height: 74, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 8 : 0 }, navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' }, navIcon: { color: '#9295A0', fontSize: 21, fontWeight: '700' }, navLabel: { color: '#9295A0', fontSize: 9, marginTop: 4 }, addCircle: { width: 51, height: 51, borderRadius: 26, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center', marginTop: -19, shadowColor: C.purple, shadowOpacity: .3, shadowRadius: 8, elevation: 5 },
  modalSafe: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 22 : 0 }, modalContent: { padding: 20, paddingBottom: 40 }, modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, close: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 28, color: C.ink, marginTop: -3 }, modalEyebrow: { color: C.purple, fontSize: 11, fontWeight: '800', letterSpacing: .6, marginTop: 30 }, modalTitle: { color: C.ink, fontSize: 29, lineHeight: 36, fontWeight: '800', marginTop: 8 }, prompt: { backgroundColor: C.ink, borderRadius: 20, padding: 20, marginTop: 24 }, promptTitle: { color: '#A996FF', fontSize: 12, fontWeight: '800' }, promptText: { color: C.white, fontSize: 15, lineHeight: 23, marginTop: 10 }, outlineButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.purple, borderRadius: 14, marginTop: 12 }, outlineText: { color: C.purple, fontWeight: '700' }, twoCols: { flexDirection: 'row', gap: 12 }, scorePreview: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 17, marginTop: 15 }, previewScore: { fontSize: 35, fontWeight: '800', color: C.ink, marginBottom: 10 }, empty: { alignItems: 'center', padding: 40 }, emptyIcon: { fontSize: 30, color: C.green, marginBottom: 12 },
});
