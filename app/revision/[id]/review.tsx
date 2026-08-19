import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { Button, Pill, ui } from '../../../components/UI';
import { RevisionProgressHeader } from '../../../components/revision/RevisionProgressHeader';
import { PreviousSolutionCard } from '../../../components/revision/PreviousSolutionCard';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { useRevisionContext } from '../../../hooks/useRevisionContext';
import { markRevisionReviewed } from '../../../services/revisionService';
import { COLORS as C } from '../../../constants/topics';

export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, retry } = useRevisionContext(id);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingState label="Loading your previous work..." />;
  if (error || !data) return <ErrorState message={error ?? 'Revision not found.'} onRetry={retry} />;

  const next = async () => {
    setSaving(true);
    try {
      await markRevisionReviewed(id);
      router.push(`/revision/${id}/practice`);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const p = data.originalProblem;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <RevisionProgressHeader step={1} />
      <Pill text={`REVISION ${data.revision.revisionNumber} OF 10`} tone="purple" />
      <Text style={ui.title}>{p.name}</Text>
      <Text style={ui.subtitle}>
        {p.platform} · {p.difficulty} · {p.topic}
        {p.subtopic ? ` / ${p.subtopic}` : ''}
      </Text>
      {p.pattern ? <Text style={ui.subtitle}>Pattern: {p.pattern}</Text> : null}
      {p.userNotes && p.userNotes !== 'Original solution saved during study.' ? (
        <Text style={ui.subtitle}>{p.userNotes}</Text>
      ) : null}

      {p.url && (
        <Button
          outline
          title="🔗 Open original problem on platform"
          onPress={() => Linking.openURL(p.url!)}
        />
      )}

      <Text style={[ui.label, { marginTop: 24, marginBottom: 8 }]}>ORIGINAL SOLUTION REVIEW</Text>
      <PreviousSolutionCard solution={data.previousSolution} problemUrl={p.url} />

      <View style={{ marginTop: 24 }}>
        <Button
          title={saving ? 'Recording review...' : 'Reviewed - Continue to Practice →'}
          disabled={saving}
          onPress={next}
        />
      </View>
    </ScrollView>
  );
}
