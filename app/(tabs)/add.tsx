import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, ChevronUp, Code2, Link2, Sparkles, Check } from 'lucide-react-native';
import { Button, ui } from '../../components/UI';
import { PlatformSelector } from '../../components/problem-search/PlatformSelector';
import { ProblemAutocomplete } from '../../components/problem-search/ProblemAutocomplete';
import { LanguageSelector } from '../../components/compiler/LanguageSelector';
import { addSolvedProblem } from '../../services/problemSearchService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isDateOnly, todayInTimeZone } from '../../lib/dateOnly';
import { useStore } from '../../store/useStore';
import { COLORS as C } from '../../constants/topics';
import type { Platform, SupportedLanguage, ProblemCatalogItem } from '../../types/problem';
import type { Difficulty } from '../../types';

export default function Add() {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('LeetCode');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState(todayInTimeZone());
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [pattern, setPattern] = useState('');
  const [selected, setSelected] = useState<ProblemCatalogItem>();
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [source, setSource] = useState('');
  const [explanation, setExplanation] = useState('');
  const [time, setTime] = useState('');
  const [space, setSpace] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const localAdd = useStore(s => s.addProblem);

  const changePlatform = (v: Platform) => {
    setPlatform(v);
    setSelected(undefined);
    setName('');
    setUrl('');
  };

  const choose = (x: ProblemCatalogItem) => {
    setSelected(x);
    setName(x.title);
    setUrl(x.url);
    if (x.difficulty !== 'Unknown') setDifficulty(x.difficulty as Difficulty);
    if (x.topics && x.topics.length > 0) {
      setTopic(x.topics[0]);
      if (x.topics.length > 1) {
        setSubtopic(x.topics[1]);
      }
    }
  };

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return Alert.alert('Problem Name Required', 'Please enter or select a problem name to continue.');
    }
    if (!isDateOnly(date)) {
      return Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format.');
    }

    setLoading(true);

    const finalTopic = topic.trim() || 'Algorithms';
    const finalSubtopic = subtopic.trim() || 'General';
    const finalPattern = pattern.trim() || 'Standard Pattern';
    const finalUrl = url.trim() || undefined;
    const finalSource = source.trim() || undefined;
    const finalExplanation = explanation.trim() || undefined;
    const finalTime = time.trim() || undefined;
    const finalSpace = space.trim() || undefined;

    try {
      if (isSupabaseConfigured) {
        try {
          await addSolvedProblem({
            catalogProblemId: selected?.id,
            name: trimmedName,
            platform,
            difficulty,
            topic: finalTopic,
            subtopic: finalSubtopic,
            pattern: finalPattern,
            url: finalUrl,
            solvedDate: date,
            language,
            sourceCode: finalSource,
            explanation: finalExplanation,
            timeComplexity: finalTime,
            spaceComplexity: finalSpace,
          });
        } catch {
          // Fallback to local store if edge function fails
          localAdd({
            name: trimmedName,
            platform,
            difficulty,
            url: finalUrl,
            solvedDate: date,
            topic: finalTopic,
            subtopic: finalSubtopic,
            pattern: finalPattern,
            language,
            sourceCode: finalSource,
            explanation: finalExplanation,
            timeComplexity: finalTime,
            spaceComplexity: finalSpace,
          });
        }
      } else {
        localAdd({
          name: trimmedName,
          platform,
          difficulty,
          url: finalUrl,
          solvedDate: date,
          topic: finalTopic,
          subtopic: finalSubtopic,
          pattern: finalPattern,
          language,
          sourceCode: finalSource,
          explanation: finalExplanation,
          timeComplexity: finalTime,
          spaceComplexity: finalSpace,
        });
      }

      Alert.alert(
        'Problem Added! 🎯',
        finalSource
          ? 'Your solution code was saved and 10 spaced revisions have been scheduled.'
          : 'Added successfully! You can review it via the platform link on your revision dates.'
      );
      router.replace('/(tabs)/queue');
    } catch (e) {
      Alert.alert('Could not add problem', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <ScrollView
        style={ui.screen}
        contentContainerStyle={[ui.content, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ui.title}>Add solved problem</Text>
        <Text style={ui.subtitle}>
          Save DSA problems to retain them forever with spaced repetition.
        </Text>

        {/* Platform Picker */}
        <Text style={ui.label}>PLATFORM</Text>
        <PlatformSelector value={platform} onChange={changePlatform} />

        {/* Problem Autocomplete */}
        <Text style={ui.label}>PROBLEM NAME *</Text>
        <ProblemAutocomplete
          platform={platform}
          value={name}
          onChange={v => {
            setName(v);
            setSelected(undefined);
          }}
          onSelect={choose}
        />

        {/* Difficulty */}
        <Text style={ui.label}>DIFFICULTY</Text>
        <View style={s.diffRow}>
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(x => {
            const active = difficulty === x;
            return (
              <Pressable
                key={x}
                style={[
                  s.diffButton,
                  active && {
                    backgroundColor: x === 'Easy' ? '#059669' : x === 'Medium' ? C.primary : '#DC2626',
                    borderColor: 'transparent',
                  },
                ]}
                onPress={() => setDifficulty(x)}
              >
                <Text style={[s.diffButtonText, active && { color: '#fff' }]}>{x}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Problem URL */}
        <Text style={ui.label}>PROBLEM URL (OPTIONAL)</Text>
        <View style={s.inputWithIcon}>
          <Link2 size={16} color={C.muted} style={{ marginLeft: 14, marginRight: 6 }} />
          <TextInput
            style={[ui.input, s.urlInput]}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            placeholder="https://leetcode.com/problems/..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Solved Date */}
        <Text style={ui.label}>SOLVED DATE</Text>
        <TextInput
          style={ui.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94A3B8"
        />

        {/* Optional Concepts Accordion / Section */}
        <Pressable
          style={s.accordionHeader}
          onPress={() => setShowOptionalDetails(!showOptionalDetails)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sparkles size={16} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={s.accordionTitle}>Topic & Algorithmic Pattern</Text>
            <Text style={s.optionalBadge}>Optional</Text>
          </View>
          {showOptionalDetails ? (
            <ChevronUp size={18} color={C.muted} />
          ) : (
            <ChevronDown size={18} color={C.muted} />
          )}
        </Pressable>

        {showOptionalDetails && (
          <View style={s.accordionBody}>
            <Text style={ui.label}>TOPIC (OPTIONAL)</Text>
            <TextInput
              style={ui.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Dynamic Programming, Arrays, Graphs"
              placeholderTextColor="#94A3B8"
            />

            <Text style={ui.label}>SUBTOPIC (OPTIONAL)</Text>
            <TextInput
              style={ui.input}
              value={subtopic}
              onChangeText={setSubtopic}
              placeholder="e.g. 2D DP, Hashing, BFS"
              placeholderTextColor="#94A3B8"
            />

            <Text style={ui.label}>PATTERN (OPTIONAL)</Text>
            <TextInput
              style={ui.input}
              value={pattern}
              onChangeText={setPattern}
              placeholder="e.g. Take / Skip, Sliding Window, Kahn’s Algorithm"
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        {/* Original Solution Section (Completely Optional) */}
        <View style={s.sectionHeaderWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Code2 size={20} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={s.sectionTitle}>Original solution</Text>
          </View>
          <Text style={s.optionalTag}>Optional</Text>
        </View>
        <Text style={s.sectionSubtitle}>
          Paste your code to review it during revisions, or skip it to review directly via the problem link.
        </Text>

        <LanguageSelector value={language} onChange={setLanguage} />

        <TextInput
          multiline
          style={[ui.input, s.codeInput]}
          value={source}
          onChangeText={setSource}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textAlignVertical="top"
          placeholder={`// Paste ${language} solution here (or leave blank)...`}
          placeholderTextColor="#64748B"
        />

        {/* Notes and Complexity (Optional) */}
        <Text style={ui.label}>APPROACH / EXPLANATION (OPTIONAL)</Text>
        <TextInput
          multiline
          style={[ui.input, s.notesInput]}
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Brief summary of why this approach works..."
          placeholderTextColor="#94A3B8"
        />

        <View style={s.columns}>
          <View style={s.flex}>
            <Text style={ui.label}>TIME COMPLEXITY</Text>
            <TextInput
              style={ui.input}
              value={time}
              onChangeText={setTime}
              placeholder="e.g. O(n)"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={s.flex}>
            <Text style={ui.label}>SPACE COMPLEXITY</Text>
            <TextInput
              style={ui.input}
              value={space}
              onChangeText={setSpace}
              placeholder="e.g. O(1)"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Add Problem Button */}
        <View style={{ marginTop: 24 }}>
          <Button
            title={loading ? 'Saving...' : 'Add problem to stack →'}
            disabled={loading}
            onPress={submit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  diffRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  diffButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  urlInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 0,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    marginTop: 14,
    marginBottom: 6,
  },
  accordionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: C.ink,
  },
  optionalBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.muted,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  accordionBody: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '800',
    color: C.primary,
    backgroundColor: C.soft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: C.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  codeInput: {
    minHeight: 180,
    fontFamily: 'monospace',
    fontSize: 12.5,
    lineHeight: 19,
    paddingTop: 12,
    marginTop: 10,
    backgroundColor: '#0F131C',
    color: '#F8FAFC',
    borderColor: '#1E2433',
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  columns: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
});
