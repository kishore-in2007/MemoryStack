import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import type { SupportedLanguage } from '../../../types/problem';
import type { SubmissionResponse } from '../../../types/compiler';
import { Button, ui } from '../../../components/UI';
import { LanguageSelector } from '../../../components/compiler/LanguageSelector';
import { LightweightCodeEditor } from '../../../components/compiler/LightweightCodeEditor';
import { SubmissionStatusCard } from '../../../components/compiler/SubmissionStatusCard';
import { RevisionProgressHeader } from '../../../components/revision/RevisionProgressHeader';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { usePracticeProblem } from '../../../hooks/usePracticeProblem';
import { useCodeDraft } from '../../../hooks/useCodeDraft';
import { runSampleTests, submitSolution } from '../../../services/compilerService';

export default function Compiler() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { data, loading, error, retry } = usePracticeProblem(id);
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmissionResponse>();
  const { source, setSource } = useCodeDraft(id, language, data?.starterCode[language] ?? '');

  useEffect(() => {
    return NetInfo.addEventListener(x => setOnline(Boolean(x.isConnected && x.isInternetReachable !== false)));
  }, []);

  useEffect(() => {
    const warn = () => {
      if (!source.trim()) return false;
      Alert.alert('Leave compiler?', 'Your draft is saved on this device.');
      return false;
    };
    const back = BackHandler.addEventListener('hardwareBackPress', warn);
    const unsub = nav.addListener('beforeRemove', e => {
      if (busy) e.preventDefault();
    });
    return () => {
      back.remove();
      unsub();
    };
  }, [source, busy, nav]);

  if (loading) return <LoadingState label="Loading compiler..." />;
  if (error || !data) return <ErrorState message={error ?? 'Compiler unavailable.'} onRetry={retry} />;

  const execute = async (mode: 'run' | 'submit') => {
    setBusy(true);
    setResult(undefined);
    try {
      const fn = mode === 'run' ? runSampleTests : submitSolution;
      const r = await fn({ revisionId: id, practiceProblemId: data.id, language, sourceCode: source });
      setResult(r);
      if (mode === 'submit' && r.status === 'accepted') {
        router.replace({
          pathname: '/revision/[id]/result',
          params: { id, submissionId: r.submissionId, score: String(r.score ?? 100), tests: String(r.testsTotal) },
        });
      }
    } catch (e) {
      Alert.alert('Execution note', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <RevisionProgressHeader step={3} />
      <Text style={ui.title}>{data.title}</Text>
      <Text style={ui.subtitle}>Type your solution below and test it.</Text>
      <LanguageSelector
        value={language}
        onChange={l => {
          setLanguage(l);
          setSource(data?.starterCode[l] ?? '');
        }}
      />
      <LightweightCodeEditor
        value={source}
        onChange={setSource}
        onReset={() => setSource(data?.starterCode[language] ?? '')}
      />
      <Button
        outline
        title={busy ? 'Running...' : 'Run sample tests'}
        disabled={busy || !source.trim()}
        onPress={() => execute('run')}
      />
      <Button
        title={busy ? 'Submitting...' : 'Submit hidden tests'}
        disabled={busy || !source.trim()}
        onPress={() => execute('submit')}
      />
      {result && <SubmissionStatusCard result={result} />}
    </ScrollView>
  );
}
