import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Briefcase,
  ChevronRight,
  Clock3,
  DoorOpen,
  Eye,
  MapPin,
  MessageSquare,
  Search,
  SendHorizontal,
  X,
} from 'lucide-react-native';
import { AgentTraceLogModal } from '../components/AgentTraceLogModal';
import { useGameState } from '../hooks/useGameState';
import type { Clue, DialogueLine, NPC } from '../types/game';

type ScreenMode = 'room' | 'interrogation';

const DETECTIVE_FACE =
  'https://api.dicebear.com/9.x/adventurer/png?seed=Detective%20Raven&backgroundColor=1E1E24&radius=12';

const ROOMS = [
  {
    id: 'drawing-room',
    name: 'Drawing Room',
    objectiveLabel: 'Crime Scene',
    background: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75',
    description: 'The body was discovered near the cold hearth. Something about the music and the timeline does not fit.',
  },
  {
    id: 'grand-hall',
    name: 'Grand Hall',
    objectiveLabel: 'Witness Route',
    background: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=75',
    description: 'Every suspect passed through this hall. The marble floor remembers more than they do.',
  },
  {
    id: 'library',
    name: 'Library',
    objectiveLabel: 'Records Room',
    background: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=75',
    description: 'Private ledgers, old grudges, and locked drawers. Motive usually leaves paperwork.',
  },
  {
    id: 'conservatory',
    name: 'Conservatory',
    objectiveLabel: 'Rain Exit',
    background: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=75',
    description: 'Glass walls tremble under the storm. The killer may have crossed wet ground without leaving prints.',
  },
];

const CLUE_POSITIONS = [
  { left: '18%', top: '43%' },
  { left: '43%', top: '58%' },
  { left: '64%', top: '38%' },
  { left: '30%', top: '66%' },
];

const AMBER = '#FFBF00';

const formatElapsed = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return `${mins}:${secs}`;
};

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const portraitForNpc = (npc: NPC) =>
  `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(npc.name)}&backgroundColor=1E1E24&radius=12`;

export function GameScreen({ navigation, route }: Props) {
  const [screenMode, setScreenMode] = useState<ScreenMode>('room');
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const [isAccuseInputOpen, setIsAccuseInputOpen] = useState(false);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const fade = useRef(new Animated.Value(1)).current;
  const {
    currentScene,
    npcs,
    dialogueHistory,
    agentTraces,
    selectedNpc,
    selectedClueId,
    elapsedSeconds,
    interrogationCount,
    isLoading,
    isStarting,
    errorMessage,
    accusationResult,
    companionHistory,
    isCompanionLoading,
    initializeGame,
    tickElapsed,
    selectNpc,
    inspectClue,
    handleSendMessage,
    handleAccusation,
    clearAccusationResult,
    handleSendCompanionMessage,
  } = useGameState();

  const passedSessionId = route.params?.sessionId;

  useEffect(() => {
    initializeGame(passedSessionId);
  }, [initializeGame, passedSessionId]);

  useEffect(() => {
    if (currentScene?.id) {
      setIsIntroOpen(true);
    }
  }, [currentScene?.id]);

  useEffect(() => {
    const timer = setInterval(tickElapsed, 1000);

    return () => clearInterval(timer);
  }, [tickElapsed]);

  useEffect(() => {
    runFade();
  }, [currentScene?.id]);

  const activeRoom = ROOMS[activeRoomIndex];
  const sceneClues = useMemo(() => currentScene?.clues ?? [], [currentScene]);
  const roomClues = useMemo(() => {
    const matchingClues = sceneClues.filter((clue) => {
      const clueRoom = clue.room.toLowerCase();
      const activeRoomName = activeRoom.name.toLowerCase();
      return clueRoom.includes(activeRoomName) || activeRoomName.includes(clueRoom);
    });

    if (matchingClues.length > 0) {
      return matchingClues;
    }

    return sceneClues.filter((_, index) => index % ROOMS.length === activeRoomIndex);
  }, [activeRoom.name, activeRoomIndex, sceneClues]);

  const runFade = (afterFade?: () => void) => {
    Animated.sequence([
      Animated.timing(fade, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        duration: 360,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (afterFade) {
      setTimeout(afterFade, 180);
    }
  };

  const moveToRoom = (index: number) => {
    if (index === activeRoomIndex) {
      return;
    }
    runFade(() => setActiveRoomIndex(index));
  };

  const enterInterrogation = (npc: NPC) => {
    runFade(() => {
      selectNpc(npc.id);
      setScreenMode('interrogation');
    });
  };

  const backToRoom = () => {
    runFade(() => setScreenMode('room'));
  };

  const sendMessage = () => {
    const message = draft.trim();
    if (!message || isLoading) {
      return;
    }
    handleSendMessage(message);
    setDraft('');
  };

  if (isStarting || !currentScene) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={AMBER} size="large" />
        <Text style={styles.loadingText}>Loading case file...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[styles.stage, { opacity: fade }]}>
        <ImageBackground
          blurRadius={screenMode === 'interrogation' ? 4 : 0}
          resizeMode="cover"
          source={{ uri: activeRoom.background }}
          style={styles.environment}
        />
        <View style={styles.environmentShade} />

        {screenMode === 'room' ? (
          <RoomMode
            activeRoom={activeRoom}
            activeRoomIndex={activeRoomIndex}
            askCount={interrogationCount}
            clues={roomClues.length > 0 ? roomClues : sceneClues}
            currentScene={currentScene}
            elapsedSeconds={elapsedSeconds}
            errorMessage={errorMessage}
            npcs={npcs}
            onEvidence={() => setIsEvidenceOpen(true)}
            onInspectClue={inspectClue}
            onInterrogate={enterInterrogation}
            onMoveRoom={moveToRoom}
            onTrace={() => setIsTraceOpen(true)}
            onPartner={() => setIsCompanionOpen(true)}
            selectedClueId={selectedClueId}
          />
        ) : (
          <InterrogationMode
            dialogueHistory={dialogueHistory}
            draft={draft}
            isLoading={isLoading}
            onAccuse={() => selectedNpc && setIsAccuseInputOpen(true)}
            onBack={backToRoom}
            onChangeDraft={setDraft}
            onSend={sendMessage}
            selectedNpc={selectedNpc}
          />
        )}
      </Animated.View>

      <EvidenceModal
        clues={sceneClues}
        collectedIds={currentScene.collectedClueIds}
        onClose={() => setIsEvidenceOpen(false)}
        onInspect={(clueId) => {
          inspectClue(clueId);
          setIsEvidenceOpen(false);
        }}
        selectedClueId={selectedClueId}
        visible={isEvidenceOpen}
      />
      <AgentTraceLogModal onClose={() => setIsTraceOpen(false)} traces={agentTraces} visible={isTraceOpen} />
      
      <ScenarioIntroModal
        visible={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
        title={currentScene.title || 'New Investigation'}
        description={currentScene.roomDescription || 'An unsolved crime at the manor.'}
        objective={currentScene.objective || 'Identify the suspect, find the key evidence, and solve the case.'}
        difficulty={currentScene.difficulty || 'standard'}
      />

      {selectedNpc && (
        <AccusationInputModal
          visible={isAccuseInputOpen}
          onClose={() => setIsAccuseInputOpen(false)}
          npcName={selectedNpc.name}
          onSubmit={(assumption) => {
            setIsAccuseInputOpen(false);
            handleAccusation(selectedNpc.id, assumption);
          }}
        />
      )}

      <ResolutionModal 
        onClose={clearAccusationResult} 
        result={accusationResult} 
        difficulty={currentScene.difficulty || 'standard'}
        onReturnHome={() => {
          clearAccusationResult();
          navigation.navigate('Home', { sessionId: currentScene.sessionId });
        }}
      />

      <CompanionChatModal
        visible={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        dialogueHistory={companionHistory}
        onSendMessage={handleSendCompanionMessage}
        isLoading={isCompanionLoading}
      />
    </SafeAreaView>
  );
}

function RoomMode({
  activeRoom,
  activeRoomIndex,
  askCount,
  clues,
  currentScene,
  elapsedSeconds,
  errorMessage,
  npcs,
  onEvidence,
  onInspectClue,
  onInterrogate,
  onMoveRoom,
  onTrace,
  onPartner,
  selectedClueId,
}: {
  activeRoom: (typeof ROOMS)[number];
  activeRoomIndex: number;
  askCount: number;
  clues: Clue[];
  currentScene: NonNullable<ReturnType<typeof useGameState>['currentScene']>;
  elapsedSeconds: number;
  errorMessage: string | null;
  npcs: NPC[];
  onEvidence: () => void;
  onInspectClue: (clueId: string) => void;
  onInterrogate: (npc: NPC) => void;
  onMoveRoom: (index: number) => void;
  onTrace: () => void;
  onPartner: () => void;
  selectedClueId?: string;
}) {
  return (
    <View style={styles.fullLayer}>
      <TopHud
        askCount={askCount}
        elapsedSeconds={elapsedSeconds}
        objective={currentScene.objective}
        onEvidence={onEvidence}
        onTrace={onTrace}
        onPartner={onPartner}
        roomName={activeRoom.name}
      />

      <View style={styles.roomInfo}>
        <Text style={styles.roomLabel}>{activeRoom.objectiveLabel}</Text>
        <Text style={styles.roomTitle}>{activeRoom.name}</Text>
        <Text style={styles.roomText}>{activeRoom.description}</Text>
      </View>

      {clues.map((clue, index) => (
        <ClueHotspot
          clue={clue}
          isCollected={currentScene.collectedClueIds.includes(clue.id)}
          isSelected={selectedClueId === clue.id}
          key={clue.id}
          onPress={() => onInspectClue(clue.id)}
          position={CLUE_POSITIONS[index % CLUE_POSITIONS.length]}
        />
      ))}

      <RightNavigation activeRoomIndex={activeRoomIndex} onMoveRoom={onMoveRoom} />
      <SuspectDock npcs={npcs} onInterrogate={onInterrogate} />
      {errorMessage ? <Text style={styles.errorToast}>{errorMessage}</Text> : null}
    </View>
  );
}

function TopHud({
  askCount,
  elapsedSeconds,
  objective,
  onEvidence,
  onTrace,
  onPartner,
  roomName,
}: {
  askCount: number;
  elapsedSeconds: number;
  objective: string;
  onEvidence: () => void;
  onTrace: () => void;
  onPartner: () => void;
  roomName: string;
}) {
  return (
    <View style={styles.topHud}>
      <View style={styles.hudLeft}>
        <Text style={styles.hudRoom}>{roomName}</Text>
        <Text style={styles.hudObjective} numberOfLines={1}>
          {objective}
        </Text>
      </View>
      <View style={styles.hudRight}>
        <View style={styles.statItem}>
          <Clock3 color={AMBER} size={16} />
          <Text style={styles.statText}>{formatElapsed(elapsedSeconds)}</Text>
        </View>
        <Text style={styles.statText}>{askCount} asks</Text>
        <ScaleButton onPress={onPartner} style={styles.iconAction}>
          <MessageSquare color={AMBER} size={20} />
          <Text style={styles.iconActionText}>Partner Riley</Text>
        </ScaleButton>
        <ScaleButton onPress={onEvidence} style={styles.iconAction}>
          <Briefcase color={AMBER} size={20} />
          <Text style={styles.iconActionText}>Evidence Bag</Text>
        </ScaleButton>
        <ScaleButton onPress={onTrace} style={styles.traceAction}>
          <BrainCircuit color={AMBER} size={20} />
        </ScaleButton>
      </View>
    </View>
  );
}

function RightNavigation({
  activeRoomIndex,
  onMoveRoom,
}: {
  activeRoomIndex: number;
  onMoveRoom: (index: number) => void;
}) {
  return (
    <View style={styles.rightRail}>
      <Text style={styles.railTitle}>Locations</Text>
      {ROOMS.map((room, index) => (
        <ScaleButton
          key={room.id}
          onPress={() => onMoveRoom(index)}
          style={[styles.locationButton, index === activeRoomIndex && styles.locationButtonActive]}
        >
          <MapPin color={index === activeRoomIndex ? AMBER : '#94a3b8'} size={15} />
          <Text style={[styles.locationText, index === activeRoomIndex && styles.locationTextActive]}>
            Go to {room.name}
          </Text>
          <ChevronRight color={index === activeRoomIndex ? AMBER : '#94a3b8'} size={16} />
        </ScaleButton>
      ))}
    </View>
  );
}

function SuspectDock({
  npcs,
  onInterrogate,
}: {
  npcs: NPC[];
  onInterrogate: (npc: NPC) => void;
}) {
  return (
    <View style={styles.suspectDock}>
      <View style={styles.dockHeader}>
        <Text style={styles.dockTitle}>Suspects in Room</Text>
        <Text style={styles.dockHint}>Tap a portrait to interrogate</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suspectList}>
        {npcs.map((npc) => (
          <SuspectPortraitButton key={npc.id} npc={npc} onPress={() => onInterrogate(npc)} />
        ))}
      </ScrollView>
    </View>
  );
}

function SuspectPortraitButton({ npc, onPress }: { npc: NPC; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const hasBeenInterrogated = npc.interrogationState.retryCount > 0;

  useEffect(() => {
    if (hasBeenInterrogated) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 820,
          toValue: 1.06,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 820,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [hasBeenInterrogated, pulse]);

  return (
    <ScaleButton onPress={onPress} style={styles.suspectButton}>
      <Animated.View style={[styles.suspectPulse, { transform: [{ scale: pulse }] }]}>
        <Image source={{ uri: portraitForNpc(npc) }} style={styles.suspectPortrait} />
        {!hasBeenInterrogated ? <View style={styles.attentionDot} /> : null}
      </Animated.View>
      <Text style={styles.suspectName} numberOfLines={1}>
        {npc.name}
      </Text>
      <Text style={styles.suspectRole} numberOfLines={1}>
        {npc.role}
      </Text>
    </ScaleButton>
  );
}

function ClueHotspot({
  clue,
  isCollected,
  isSelected,
  onPress,
  position,
}: {
  clue: Clue;
  isCollected: boolean;
  isSelected: boolean;
  onPress: () => void;
  position: { left: string; top: string };
}) {
  return (
    <ScaleButton
      onPress={onPress}
      style={[
        styles.clueHotspot,
        position,
        isCollected ? styles.clueHotspotCollected : styles.clueHotspotHidden,
        isSelected && styles.clueHotspotSelected,
      ]}
    >
      <Search color={isCollected ? '#0f172a' : AMBER} size={17} />
      {isCollected ? (
        <Text style={[styles.clueText, styles.clueTextCollected]} numberOfLines={1}>
          {clue.title}
        </Text>
      ) : null}
    </ScaleButton>
  );
}

function InterrogationMode({
  dialogueHistory,
  draft,
  isLoading,
  onAccuse,
  onBack,
  onChangeDraft,
  onSend,
  selectedNpc,
}: {
  dialogueHistory: DialogueLine[];
  draft: string;
  isLoading: boolean;
  onAccuse: () => void;
  onBack: () => void;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  selectedNpc?: NPC;
}) {
  return (
    <View style={styles.interrogationLayer}>
      <View style={styles.interrogationLeft}>
        <ScaleButton onPress={onBack} style={styles.backButton}>
          <ArrowLeft color={AMBER} size={18} />
          <Text style={styles.backText}>Back to Room</Text>
        </ScaleButton>
        <View style={styles.suspectHero}>
          <Image
            source={{ uri: selectedNpc ? portraitForNpc(selectedNpc) : DETECTIVE_FACE }}
            style={styles.suspectHeroImage}
          />
          <Text style={styles.heroName}>{selectedNpc?.name ?? 'Unknown Suspect'}</Text>
          <Text style={styles.heroRole}>{selectedNpc?.role ?? 'Suspect'}</Text>
        </View>
      </View>

      <View style={styles.transcriptPanel}>
        <View style={styles.transcriptHeader}>
          <View>
            <Text style={styles.transcriptKicker}>Case Transcript</Text>
            <Text style={styles.transcriptTitle}>Interrogation Room</Text>
          </View>
          <ScaleButton onPress={onAccuse} style={styles.accuseAction}>
            <Text style={styles.accuseText}>ACCUSE</Text>
          </ScaleButton>
        </View>

        <ScrollView style={styles.transcriptScroll} contentContainerStyle={styles.transcriptContent}>
          {dialogueHistory.map((line) => (
            <TranscriptEntry key={line.id} line={line} selectedNpc={selectedNpc} />
          ))}
          {isLoading ? <Text style={styles.thinkingText}>Awaiting suspect response...</Text> : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            editable={!isLoading && Boolean(selectedNpc)}
            onChangeText={onChangeDraft}
            onSubmitEditing={onSend}
            placeholder="Type an investigative question..."
            placeholderTextColor="#64748b"
            style={styles.questionInput}
            value={draft}
          />
          <ScaleButton onPress={onSend} style={styles.sendButton}>
            <SendHorizontal color="#0f172a" size={20} />
          </ScaleButton>
        </View>
      </View>
    </View>
  );
}

function TranscriptEntry({ line, selectedNpc }: { line: DialogueLine; selectedNpc?: NPC }) {
  const speaker =
    line.speaker === 'player' ? 'Detective Raven' : line.speaker === 'system' ? 'Case System' : selectedNpc?.name ?? 'Suspect';

  return (
    <View style={styles.transcriptEntry}>
      <Text style={styles.entrySpeaker}>{speaker}</Text>
      <Text style={styles.entryText}>{line.text}</Text>
    </View>
  );
}

function EvidenceModal({
  clues,
  collectedIds,
  onClose,
  onInspect,
  selectedClueId,
  visible,
}: {
  clues: Clue[];
  collectedIds: string[];
  onClose: () => void;
  onInspect: (clueId: string) => void;
  selectedClueId?: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.evidenceModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Evidence Bag</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#f8fafc" size={20} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.evidenceList}>
            {clues.map((clue) => {
              const collected = collectedIds.includes(clue.id);
              return (
                <ScaleButton key={clue.id} onPress={() => onInspect(clue.id)} style={styles.evidenceButton}>
                  <LinearGradient
                    colors={selectedClueId === clue.id ? ['#2a2416', '#1E1E24'] : ['#121214', '#1E1E24']}
                    style={styles.evidenceRow}
                  >
                    <Eye color={collected ? AMBER : '#94a3b8'} size={19} />
                    <View style={styles.evidenceCopy}>
                      <Text style={styles.evidenceTitle}>{collected ? clue.title : clue.location}</Text>
                      <Text style={styles.evidenceText}>
                        {collected ? clue.description : 'Not collected yet. Find and click this object in the room.'}
                      </Text>
                    </View>
                  </LinearGradient>
                </ScaleButton>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ScenarioIntroModal({
  visible,
  onClose,
  title,
  description,
  objective,
  difficulty,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  objective: string;
  difficulty: string;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <LinearGradient
          colors={['#1e293b', '#020617']}
          style={styles.introModalCard}
        >
          <Text style={styles.introKicker}>NEW CASE DETECTED ({difficulty.toUpperCase()})</Text>
          <Text style={styles.introTitle}>{title}</Text>
          <View style={styles.divider} />
          
          <Text style={styles.introHeading}>THE SCENARIO</Text>
          <Text style={styles.introText}>{description}</Text>

          <Text style={styles.introHeading}>OBJECTIVE</Text>
          <Text style={styles.introText}>{objective}</Text>

          <ScaleButton onPress={onClose} style={styles.introStartButton}>
            <Text style={styles.introStartButtonText}>BEGIN INVESTIGATION</Text>
          </ScaleButton>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function AccusationInputModal({
  visible,
  onClose,
  npcName,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  npcName: string;
  onSubmit: (assumption: string) => void;
}) {
  const [assumption, setAssumption] = useState('');

  const handleSubmit = () => {
    if (assumption.trim().length < 5) return;
    onSubmit(assumption);
    setAssumption('');
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.accuseInputCard}>
          <Text style={styles.accuseInputKicker}>ACCUSING SUSPECT</Text>
          <Text style={styles.accuseInputTitle}>{npcName}</Text>
          <Text style={styles.accuseInputInstructions}>
            Provide your complete assumption below. Explain how they committed the crime, their motive, and the contradictions that expose their guilt.
          </Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder="Type your explanation here (at least a sentence or two)..."
            placeholderTextColor="#64748b"
            style={styles.accuseTextInput}
            value={assumption}
            onChangeText={setAssumption}
          />
          <View style={styles.accuseInputActions}>
            <ScaleButton onPress={onClose} style={styles.accuseCancelButton}>
              <Text style={styles.accuseCancelButtonText}>CANCEL</Text>
            </ScaleButton>
            <ScaleButton 
              disabled={assumption.trim().length < 5} 
              onPress={handleSubmit} 
              style={[styles.accuseSubmitButton, assumption.trim().length < 5 && styles.accuseSubmitButtonDisabled]}
            >
              <Text style={styles.accuseSubmitButtonText}>SUBMIT ACCUSATION</Text>
            </ScaleButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ResolutionModal({
  onClose,
  result,
  onReturnHome,
  difficulty,
}: {
  onClose: () => void;
  result: { status: 'success' | 'failed'; message: string; solutionStory?: string } | null;
  onReturnHome: () => void;
  difficulty: string;
}) {
  if (!result) {
    return null;
  }

  const success = result.status === 'success';

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <TouchableOpacity activeOpacity={1} onPress={success ? undefined : onClose} style={styles.resolutionBackdrop}>
        <LinearGradient colors={success ? ['#064e3b', '#020617'] : ['#7f1d1d', '#020617']} style={styles.resolutionCard}>
          <Text style={styles.resolutionKicker}>{success ? 'CASE SOLVED' : 'ACCUSATION FAILED'}</Text>
          <Text style={styles.resolutionTitle}>{success ? 'YOU DID IT!' : 'DEDUCTION REJECTED'}</Text>
          
          <ScrollView style={styles.resolutionScroll} contentContainerStyle={styles.resolutionScrollContent}>
            {success && result.solutionStory ? (
              <>
                <Text style={styles.resolutionSectionHeader}>THE REAL STORY</Text>
                <Text style={styles.resolutionStoryText}>{result.solutionStory}</Text>
                
                <Text style={styles.resolutionConclusionText}>
                  This was an {difficulty} case, but next time it won't be so simple.
                </Text>
              </>
            ) : (
              <Text style={styles.resolutionMessage}>{result.message}</Text>
            )}
          </ScrollView>
          
          {success ? (
            <ScaleButton onPress={onReturnHome} style={styles.resolutionHomeButton}>
              <Text style={styles.resolutionHomeButtonText}>RETURN TO HOME SCREEN</Text>
            </ScaleButton>
          ) : (
            <Text style={styles.resolutionHint}>Tap outside to continue investigation</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Modal>
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
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      friction: 6,
      tension: 200,
      toValue: 0.96,
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
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

interface CompanionChatModalProps {
  visible: boolean;
  onClose: () => void;
  dialogueHistory: DialogueLine[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

function CompanionChatModal({
  visible,
  onClose,
  dialogueHistory,
  onSendMessage,
  isLoading,
}: CompanionChatModalProps) {
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, dialogueHistory.length]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.evidenceModal, { height: '80%', width: '70%' }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: AMBER }]}>Detective Riley</Text>
              <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Case Partner / Brainstorming</Text>
            </View>
            <ScaleButton onPress={onClose} style={styles.closeButton}>
              <X color="#f8fafc" size={18} />
            </ScaleButton>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, padding: 14 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 14 }}
          >
            {dialogueHistory.map((line) => {
              const isPlayer = line.speaker === 'player';
              const isSystem = line.speaker === 'system';
              return (
                <View
                  key={line.id}
                  style={[
                    styles.transcriptEntry,
                    isPlayer && { borderLeftColor: '#cbd5e1', backgroundColor: '#18181b' },
                    isSystem && { borderLeftColor: '#dc2626', backgroundColor: '#1a0a0a' },
                  ]}
                >
                  <Text style={[styles.entrySpeaker, isPlayer && { color: '#cbd5e1' }, isSystem && { color: '#dc2626' }]}>
                    {isPlayer ? 'You' : isSystem ? 'System' : 'Partner Riley'}
                  </Text>
                  <Text style={styles.entryText}>{line.text}</Text>
                </View>
              );
            })}
            {isLoading && (
              <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                <ActivityIndicator color={AMBER} size="small" />
                <Text style={[styles.thinkingText, { marginTop: 6 }]}>Riley is reviewing notes...</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputRow, { padding: 14, borderTopColor: 'rgba(255, 191, 0, 0.1)', borderTopWidth: 1 }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Riley to review contradictions or brainstorm..."
              placeholderTextColor="#475569"
              onSubmitEditing={handleSend}
              style={styles.questionInput}
            />
            <ScaleButton onPress={handleSend} style={styles.sendButton}>
              <SendHorizontal color="#020617" size={18} />
            </ScaleButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#020617',
    flex: 1,
  },
  stage: {
    flex: 1,
  },
  environment: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  environmentShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.48)',
  },
  fullLayer: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#020617',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '800',
  },
  topHud: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderBottomColor: 'rgba(255, 191, 0, 0.2)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  hudLeft: {
    flex: 1,
    paddingRight: 18,
  },
  hudRoom: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '900',
  },
  hudObjective: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  hudRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  iconAction: {
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.45)',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconActionText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  traceAction: {
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.45)',
    borderRadius: 4,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 44,
  },
  roomInfo: {
    left: 24,
    maxWidth: '48%',
    position: 'absolute',
    top: 86,
  },
  roomLabel: {
    color: AMBER,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roomTitle: {
    color: '#f8fafc',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 42,
    marginTop: 4,
    textShadowColor: '#020617',
    textShadowRadius: 10,
  },
  roomText: {
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
  },
  rightRail: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderLeftColor: 'rgba(255, 191, 0, 0.25)',
    borderLeftWidth: 1,
    gap: 9,
    paddingHorizontal: 10,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    top: 64,
    width: 176,
    bottom: '25%',
  },
  railTitle: {
    color: AMBER,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(148, 163, 184, 0.24)',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 8,
  },
  locationButtonActive: {
    borderColor: AMBER,
  },
  locationText: {
    color: '#cbd5e1',
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  locationTextActive: {
    color: '#f8fafc',
  },
  suspectDock: {
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
    borderTopColor: 'rgba(255, 191, 0, 0.28)',
    borderTopWidth: 1,
    bottom: 0,
    height: '25%',
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  dockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dockTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dockHint: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  suspectList: {
    gap: 12,
    paddingRight: 24,
  },
  suspectButton: {
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.26)',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 74,
    minWidth: 190,
    paddingHorizontal: 10,
  },
  suspectPulse: {
    borderColor: AMBER,
    borderRadius: 6,
    borderWidth: 1,
  },
  suspectPortrait: {
    borderRadius: 5,
    height: 54,
    width: 54,
  },
  attentionDot: {
    backgroundColor: AMBER,
    borderRadius: 6,
    height: 12,
    position: 'absolute',
    right: -5,
    top: -5,
    width: 12,
  },
  suspectName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
    maxWidth: 104,
  },
  suspectRole: {
    color: AMBER,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 104,
  },
  clueHotspot: {
    alignItems: 'center',
    borderColor: AMBER,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    maxWidth: 178,
    position: 'absolute',
  },
  clueHotspotHidden: {
    backgroundColor: 'rgba(30, 30, 36, 0.42)',
    height: 38,
    justifyContent: 'center',
    opacity: 0.72,
    paddingHorizontal: 9,
    width: 38,
  },
  clueHotspotCollected: {
    backgroundColor: 'rgba(255, 191, 0, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clueHotspotSelected: {
    borderWidth: 2,
  },
  clueText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '900',
    maxWidth: 132,
  },
  clueTextCollected: {
    color: '#0f172a',
  },
  interrogationLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flexDirection: 'row',
  },
  interrogationLeft: {
    alignItems: 'center',
    borderRightColor: 'rgba(255, 191, 0, 0.18)',
    borderRightWidth: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 56,
    width: '40%',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.5)',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    top: 10,
    zIndex: 30,
  },
  backText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  suspectHero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  suspectHeroImage: {
    borderColor: AMBER,
    borderRadius: 8,
    borderWidth: 2,
    height: 142,
    width: 142,
  },
  heroName: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },
  heroRole: {
    color: AMBER,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  transcriptPanel: {
    backgroundColor: 'rgba(10, 10, 14, 0.9)',
    padding: 12,
    width: '60%',
  },
  transcriptHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 191, 0, 0.22)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  transcriptKicker: {
    color: AMBER,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  transcriptTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  accuseAction: {
    backgroundColor: '#1E1E24',
    borderColor: '#dc2626',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  accuseText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  transcriptScroll: {
    flex: 1,
    marginTop: 12,
  },
  transcriptContent: {
    gap: 8,
    paddingBottom: 12,
  },
  transcriptEntry: {
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.18)',
    borderLeftColor: AMBER,
    borderLeftWidth: 3,
    borderRadius: 3,
    borderWidth: 1,
    padding: 10,
  },
  entrySpeaker: {
    color: AMBER,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  entryText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  thinkingText: {
    color: AMBER,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  questionInput: {
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.24)',
    borderRadius: 4,
    borderWidth: 1,
    color: '#f8fafc',
    flex: 1,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: AMBER,
    borderRadius: 4,
    height: 42,
    justifyContent: 'center',
    width: 48,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flex: 1,
    justifyContent: 'center',
  },
  evidenceModal: {
    backgroundColor: '#0a0a0e',
    borderColor: 'rgba(255, 191, 0, 0.52)',
    borderRadius: 4,
    borderWidth: 1,
    maxHeight: '78%',
    width: '62%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 191, 0, 0.2)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: 4,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  evidenceList: {
    gap: 10,
    padding: 14,
  },
  evidenceButton: {
    borderRadius: 4,
  },
  evidenceRow: {
    alignItems: 'center',
    borderColor: 'rgba(255, 191, 0, 0.32)',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  evidenceCopy: {
    flex: 1,
  },
  evidenceTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  evidenceText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  resolutionBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.86)',
    flex: 1,
    justifyContent: 'center',
  },
  resolutionCard: {
    borderColor: AMBER,
    borderRadius: 4,
    borderWidth: 2,
    padding: 28,
    width: '54%',
  },
  resolutionKicker: {
    color: AMBER,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  resolutionTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  resolutionMessage: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  resolutionHint: {
    color: AMBER,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  errorToast: {
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
    borderColor: '#dc2626',
    borderRadius: 4,
    borderWidth: 1,
    bottom: '27%',
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
    left: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
  },
  introModalCard: {
    backgroundColor: '#0a0a0e',
    borderColor: AMBER,
    borderRadius: 8,
    borderWidth: 2,
    padding: 24,
    width: '80%',
    maxHeight: '85%',
  },
  introKicker: {
    color: AMBER,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  introTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  introHeading: {
    color: AMBER,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  introText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  introStartButton: {
    backgroundColor: AMBER,
    borderRadius: 4,
    marginTop: 24,
    paddingVertical: 14,
  },
  introStartButtonText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  divider: {
    backgroundColor: 'rgba(255, 191, 0, 0.3)',
    height: 1,
    marginVertical: 16,
  },
  accuseInputCard: {
    backgroundColor: '#0a0a0e',
    borderColor: '#dc2626',
    borderRadius: 8,
    borderWidth: 2,
    padding: 20,
    width: '75%',
  },
  accuseInputKicker: {
    color: '#dc2626',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  accuseInputTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  accuseInputInstructions: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  accuseTextInput: {
    backgroundColor: '#1E1E24',
    borderColor: 'rgba(255, 191, 0, 0.2)',
    borderRadius: 4,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 13,
    padding: 10,
    textAlignVertical: 'top',
    height: 120,
  },
  accuseInputActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  accuseCancelButton: {
    backgroundColor: '#1E1E24',
    borderColor: '#475569',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accuseCancelButtonText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  accuseSubmitButton: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accuseSubmitButtonDisabled: {
    opacity: 0.5,
  },
  accuseSubmitButtonText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resolutionScroll: {
    maxHeight: 280,
    marginVertical: 12,
  },
  resolutionScrollContent: {
    paddingBottom: 10,
  },
  resolutionSectionHeader: {
    color: AMBER,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  resolutionStoryText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  resolutionConclusionText: {
    color: AMBER,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  resolutionHomeButton: {
    backgroundColor: AMBER,
    borderRadius: 4,
    marginTop: 12,
    paddingVertical: 12,
  },
  resolutionHomeButtonText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
