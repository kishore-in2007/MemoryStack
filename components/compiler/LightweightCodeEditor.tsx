import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Code2, RotateCcw } from 'lucide-react-native';
import { COLORS as C } from '../../constants/topics';

export function LightweightCodeEditor({
  value,
  onChange,
  onReset,
}: {
  value: string;
  onChange: (v: string) => void;
  onReset?: () => void;
}) {
  const insertTab = () => {
    onChange(value + '    ');
  };

  const clearCode = () => {
    onChange('');
  };

  return (
    <View style={s.container}>
      {/* Editor Top Bar */}
      <View style={s.topBar}>
        <View style={s.titleRow}>
          <Code2 size={15} color={C.primary} style={{ marginRight: 6 }} />
          <Text style={s.titleText}>CODE EDITOR</Text>
        </View>
        <View style={s.toolsRow}>
          {onReset && (
            <Pressable style={s.toolButton} onPress={onReset}>
              <Text style={s.toolButtonText}>Template</Text>
            </Pressable>
          )}
          <Pressable style={s.toolButton} onPress={insertTab}>
            <Text style={s.toolButtonText}>+ Tab</Text>
          </Pressable>
          <Pressable style={s.toolButton} onPress={clearCode}>
            <Text style={[s.toolButtonText, { color: '#EF4444' }]}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {/* Editor Frame */}
      <View style={s.frame}>
        <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={true}>
          <TextInput
            multiline
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
            scrollEnabled={false}
            style={s.input}
            maxLength={50000}
            placeholder="// Write your solution code here..."
            placeholderTextColor="#4B5563"
          />
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 14,
    marginBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2433',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toolButtonText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  frame: {
    minHeight: 380,
    backgroundColor: '#0F131C',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2433',
    overflow: 'hidden',
  },
  input: {
    minWidth: 700,
    minHeight: 380,
    padding: 14,
    color: '#F8FAFC',
    fontFamily: 'monospace',
    fontSize: 13.5,
    lineHeight: 21,
  },
});
