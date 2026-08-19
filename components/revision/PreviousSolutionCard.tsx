import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, FileCode, CheckCircle2 } from 'lucide-react-native';
import type { PreviousSolutionSnapshot } from '../../types/revision';
import { COLORS as C } from '../../constants/topics';

export function PreviousSolutionCard({
  solution,
  problemUrl,
}: {
  solution?: PreviousSolutionSnapshot | null;
  problemUrl?: string | null;
}) {
  if (!solution || !solution.sourceCode || !solution.sourceCode.trim()) {
    return (
      <View style={s.emptyWrap}>
        <View style={s.emptyIconBadge}>
          <FileCode size={22} color={C.primary} />
        </View>
        <Text style={s.emptyTitle}>No code was entered for this problem</Text>
        <Text style={s.emptyBody}>
          You skipped pasting code when adding this problem. You can review the problem statement and examples through the platform link below, then proceed to the coding editor.
        </Text>
        {problemUrl && (
          <Pressable style={s.linkButton} onPress={() => Linking.openURL(problemUrl)}>
            <ExternalLink size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.linkButtonText}>Open problem on platform ↗</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.topRow}>
        <Text style={s.meta}>
          {solution.language.toUpperCase()} · {new Date(solution.createdAt).toLocaleDateString()}
        </Text>
        <View style={s.badge}>
          <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 4 }} />
          <Text style={s.badgeText}>Saved Solution</Text>
        </View>
      </View>
      <View style={s.code}>
        <Text selectable style={s.codeText}>
          {solution.sourceCode}
        </Text>
      </View>
      {solution.explanation && <Text style={s.body}>{solution.explanation}</Text>}
      <Text style={s.complexity}>
        {solution.timeComplexity ?? 'Time not recorded'} · {solution.spaceComplexity ?? 'Space not recorded'}
        {solution.score != null ? ` · ${solution.score}/100` : ''}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  code: {
    backgroundColor: '#0F131C',
    borderRadius: 10,
    padding: 14,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#1E2433',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#F8FAFC',
    fontSize: 12.5,
    lineHeight: 19,
  },
  body: {
    color: C.ink,
    lineHeight: 20,
    fontSize: 13,
  },
  complexity: {
    fontSize: 11.5,
    color: C.muted,
    fontWeight: '600',
  },
  emptyWrap: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  emptyIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 12.5,
    color: C.muted,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
