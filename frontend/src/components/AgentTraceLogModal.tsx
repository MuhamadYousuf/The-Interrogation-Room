import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { AgentTrace } from '../types/game';

interface AgentTraceLogModalProps {
  traces: AgentTrace[];
  visible: boolean;
  onClose: () => void;
}

export function AgentTraceLogModal({ traces, visible, onClose }: AgentTraceLogModalProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Antigravity Trace</Text>
            <Text style={styles.title}>Agent Reasoning Console</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <X color="#f8fafc" size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {traces.length === 0 ? (
            <Text style={styles.empty}>No traces emitted yet. The orchestrator is listening.</Text>
          ) : (
            traces.map((trace) => (
              <View key={trace.id} style={styles.traceCard}>
                <View style={styles.traceHeader}>
                  <Text style={styles.traceId}>{trace.id}</Text>
                  <Text style={styles.traceTime}>{new Date(trace.timestamp).toLocaleTimeString()}</Text>
                </View>
                <TraceRow label="OBSERVATION" value={trace.observation} />
                <TraceRow label="INFERENCE" value={trace.inference} />
                <TraceRow label="DECISION" value={trace.decision} />
                <TraceRow label="ACTION" value={trace.action} />
                {typeof trace.confidence === 'number' ? (
                  <Text style={styles.confidence}>confidence: {(trace.confidence * 100).toFixed(0)}%</Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020617',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#134e4a',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  kicker: {
    color: '#22c55e',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontFamily: 'monospace',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: {
    gap: 14,
    paddingBottom: 36,
    paddingTop: 18,
  },
  empty: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
  },
  traceCard: {
    backgroundColor: '#03110d',
    borderColor: '#14532d',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  traceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  traceId: {
    color: '#86efac',
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
  },
  traceTime: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  row: {
    marginBottom: 10,
  },
  rowLabel: {
    color: '#f59e0b',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },
  rowValue: {
    color: '#d1fae5',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  confidence: {
    color: '#22c55e',
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 2,
  },
});
