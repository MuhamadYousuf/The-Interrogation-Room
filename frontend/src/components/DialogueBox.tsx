import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SendHorizontal } from 'lucide-react-native';
import type { DialogueLine, NPC } from '../types/game';

interface DialogueBoxProps {
  selectedNpc?: NPC;
  dialogueHistory: DialogueLine[];
  isLoading?: boolean;
  onAccuse?: (npcId: string) => void;
  onSendMessage: (text: string) => void;
}

export function DialogueBox({
  selectedNpc,
  dialogueHistory,
  isLoading,
  onAccuse,
  onSendMessage,
}: DialogueBoxProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const nextText = text.trim();

    if (!nextText || isLoading) {
      return;
    }

    onSendMessage(nextText);
    setText('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Interrogation</Text>
          <Text style={styles.npcName}>{selectedNpc ? selectedNpc.name : 'No witness selected'}</Text>
        </View>
        <View style={styles.headerActions}>
          {isLoading ? (
            <ActivityIndicator color="#f59e0b" />
          ) : selectedNpc ? (
            <Text style={styles.mood}>{selectedNpc.mood}</Text>
          ) : null}
          <ScaleButton
            disabled={!selectedNpc || isLoading}
            onPress={() => selectedNpc && onAccuse?.(selectedNpc.id)}
            style={[styles.accuseButton, (!selectedNpc || isLoading) && styles.accuseDisabled]}
          >
            <Text style={styles.accuseText}>ACCUSE</Text>
          </ScaleButton>
        </View>
      </View>

      <ScrollView style={styles.history} contentContainerStyle={styles.historyContent}>
        {dialogueHistory.length === 0 ? (
          <Text style={styles.empty}>Select a witness and begin questioning.</Text>
        ) : (
          dialogueHistory.map((line) => (
            <View
              key={line.id}
              style={[
                styles.line,
                line.speaker === 'player'
                  ? styles.playerLine
                  : line.speaker === 'system'
                    ? styles.systemLine
                    : styles.npcLine,
              ]}
            >
              <Text style={styles.speaker}>
                {line.speaker === 'player'
                  ? 'YOU'
                  : line.speaker === 'system'
                    ? 'SYSTEM'
                    : selectedNpc?.name ?? 'NPC'}
              </Text>
              <Text style={styles.lineText}>{line.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          editable={Boolean(selectedNpc) && !isLoading}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          placeholder={isLoading ? 'Waiting for the manor...' : 'Ask about the alibi...'}
          placeholderTextColor="#64748b"
          returnKeyType="send"
          style={styles.input}
          value={text}
        />
        <ScaleButton
          disabled={!text.trim() || !selectedNpc || isLoading}
          onPress={handleSend}
          style={[styles.sendButton, (!text.trim() || !selectedNpc || isLoading) && styles.sendDisabled]}
        >
          <SendHorizontal color="#0f172a" size={20} />
        </ScaleButton>
      </View>
    </KeyboardAvoidingView>
  );
}

function ScaleButton({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
}) {
  const [scale] = useState(() => new Animated.Value(1));

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      friction: 6,
      tension: 200,
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      friction: 6,
      tension: 200,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderColor: '#92400e',
    borderRadius: 8,
    borderWidth: 2,
    flex: 1,
    margin: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  eyebrow: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  npcName: {
    color: '#f59e0b',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  mood: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    color: '#cbd5e1',
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'capitalize',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  accuseButton: {
    backgroundColor: '#dc2626',
    borderColor: '#f59e0b',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  accuseDisabled: {
    opacity: 0.45,
  },
  accuseText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  history: {
    flex: 1,
  },
  historyContent: {
    gap: 8,
    paddingBottom: 8,
  },
  empty: {
    color: '#64748b',
    fontSize: 13,
    paddingVertical: 14,
  },
  line: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  npcLine: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderColor: 'rgba(148, 163, 184, 0.24)',
    borderWidth: 1,
    maxWidth: '88%',
  },
  playerLine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(127, 29, 29, 0.9)',
    maxWidth: '88%',
  },
  systemLine: {
    alignSelf: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#f59e0b',
    borderWidth: 1,
    maxWidth: '94%',
  },
  speaker: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  lineText: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: '#475569',
    borderRadius: 8,
    borderWidth: 1,
    color: '#f8fafc',
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
