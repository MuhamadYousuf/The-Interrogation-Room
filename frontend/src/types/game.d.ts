export type GameMode = 'investigating' | 'interrogating';

export type DifficultyBand = 'intro' | 'standard' | 'tense' | 'adaptive';

export type DialogueSpeaker = 'player' | 'npc' | 'system';

export interface DialogueLine {
  id: string;
  speaker: DialogueSpeaker;
  text: string;
  timestamp: string;
  npcId?: string;
}

export interface AgentTrace {
  id: string;
  timestamp: string;
  observation: string;
  inference: string;
  decision: string;
  action: string;
  confidence?: number;
  source?: string;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  avatar: string;
  mood: 'calm' | 'guarded' | 'anxious' | 'hostile' | 'grieving';
  suspicion: number;
  dialogueHistory: DialogueLine[];
  interrogationState: {
    isAvailable: boolean;
    retryCount: number;
    lastAskedAt?: string;
    pressure: number;
  };
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  room: string;
  location: string;
  discovered: boolean;
  relevance: 'minor' | 'supporting' | 'critical';
  icon?: string;
  imageUrl?: string;
}

export interface PlayerMetrics {
  elapsedSeconds: number;
  interrogationCount: number;
  retryCount: number;
  accuracy?: number;
  inspectedClueIds: string[];
  selectedNpcId?: string;
}

export interface LevelState {
  id: string;
  sessionId?: string;
  title: string;
  roomName: string;
  roomDescription: string;
  objective: string;
  difficulty: DifficultyBand;
  npcs: NPC[];
  clues: Clue[];
  collectedClueIds: string[];
  agentTraces: AgentTrace[];
  startedAt: string;
  updatedAt: string;
  completed: boolean;
  completionReason?: string;
}
