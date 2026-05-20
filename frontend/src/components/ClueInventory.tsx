import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Search } from 'lucide-react-native';
import type { Clue } from '../types/game';

interface ClueInventoryProps {
  clues: Clue[];
  selectedClueId?: string;
  onSelectClue: (clueId: string) => void;
}

export function ClueInventory({ clues, selectedClueId, onSelectClue }: ClueInventoryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Search color="#f59e0b" size={15} />
        <Text style={styles.label}>Evidence</Text>
      </View>

      {clues.length === 0 ? (
        <Text style={styles.empty}>No clues collected yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {clues.map((clue) => {
            const isSelected = clue.id === selectedClueId;

            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={clue.id}
                onPress={() => onSelectClue(clue.id)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={styles.chipTitle} numberOfLines={1}>
                  {clue.title}
                </Text>
                <Text style={styles.chipMeta}>{clue.relevance.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  empty: {
    color: '#64748b',
    fontSize: 13,
  },
  scroll: {
    gap: 10,
    paddingRight: 16,
  },
  chip: {
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 132,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: '#451a1a',
    borderColor: '#f59e0b',
  },
  chipTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  chipMeta: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
