import type { AgentTrace, Clue, LevelState, NPC, PlayerMetrics } from '../types/game';

const BASE_URL = 'http://192.168.0.101:8000';

type ApiTrace = {
  observation: string;
  inference: string;
  decision: string;
  action: string;
  confidence?: number;
  timestamp?: string;
};

type ApiNpc = {
  id: string;
  name: string;
  role: string;
  mood: NPC['mood'];
  suspicion: number;
  opening_line: string;
  personality?: string | null;
  alibi?: string | null;
  is_killer?: boolean;
};

type ApiClue = {
  id: string;
  title: string;
  description: string;
  room: string;
  location: string;
  discovered: boolean;
  relevance: Clue['relevance'];
};

type ApiGameState = {
  session_id: string;
  level_id: string;
  title: string;
  room_name: string;
  room_description: string;
  objective: string;
  difficulty: LevelState['difficulty'];
  clues: ApiClue[];
  npcs: ApiNpc[];
  collected_clue_ids: string[];
  trace: ApiTrace;
};

type ApiNpcResponse = {
  session_id: string;
  npc_id: string;
  dialogue: string;
  trace: ApiTrace;
};

type ApiAccusationResponse = {
  status: 'success' | 'failed';
  message: string;
  solution_story?: string | null;
  next_level?: ApiGameState | null;
};

const now = () => new Date().toISOString();

async function postJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const rawText = await response.text();
    console.log(`[api] ${path} raw response:`, rawText);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText} ${rawText}`);
    }

    return rawText ? (JSON.parse(rawText) as TResponse) : ({} as TResponse);
  } catch (error) {
    console.error(`[api] ${path} failed`, error);
    throw error;
  }
}

function mapTrace(trace: ApiTrace, idPrefix = 'trace'): AgentTrace {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: trace.timestamp ?? now(),
    observation: trace.observation,
    inference: trace.inference,
    decision: trace.decision,
    action: trace.action,
    confidence: trace.confidence,
    source: 'fastapi-antigravity-orchestrator',
  };
}

function mapNpc(npc: ApiNpc): NPC {
  return {
    id: npc.id,
    name: npc.name,
    role: npc.role,
    avatar: npc.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    mood: npc.mood,
    suspicion: npc.suspicion,
    dialogueHistory: [
      {
        id: `dialogue-${npc.id}-opening`,
        speaker: 'npc',
        npcId: npc.id,
        text: npc.opening_line,
        timestamp: now(),
      },
    ],
    interrogationState: {
      isAvailable: true,
      retryCount: 0,
      pressure: Math.min(100, Math.max(0, npc.suspicion)),
    },
  };
}

function mapClue(clue: ApiClue): Clue {
  return {
    id: clue.id,
    title: clue.title,
    description: clue.description,
    room: clue.room,
    location: clue.location,
    discovered: clue.discovered,
    relevance: clue.relevance,
  };
}

function mapGameState(state: ApiGameState): LevelState {
  return {
    id: state.level_id,
    sessionId: state.session_id,
    title: state.title,
    roomName: state.room_name,
    roomDescription: state.room_description,
    objective: state.objective,
    difficulty: state.difficulty,
    npcs: state.npcs.map(mapNpc),
    clues: state.clues.map(mapClue),
    collectedClueIds: state.collected_clue_ids,
    agentTraces: [mapTrace(state.trace, 'trace-start')],
    startedAt: now(),
    updatedAt: now(),
    completed: false,
  };
}

function mapMetrics(metrics: PlayerMetrics) {
  return {
    elapsed_seconds: metrics.elapsedSeconds,
    interrogation_count: metrics.interrogationCount,
    retry_count: metrics.retryCount,
    accuracy: metrics.accuracy ?? 1,
    inspected_clue_ids: metrics.inspectedClueIds,
  };
}

export async function startGame(sessionId?: string): Promise<LevelState> {
  const state = await postJson<ApiGameState>('/game/start', sessionId ? { session_id: sessionId } : undefined);
  return mapGameState(state);
}

export async function sendInterrogation(
  sessionId: string,
  npcId: string,
  message: string,
  metrics: PlayerMetrics,
): Promise<{ dialogue: string; trace: AgentTrace }> {
  const response = await postJson<ApiNpcResponse>('/game/interrogate', {
    session_id: sessionId,
    npc_id: npcId,
    player_message: message,
    current_metrics: mapMetrics(metrics),
  });

  return {
    dialogue: response.dialogue,
    trace: mapTrace(response.trace, 'trace-interrogate'),
  };
}

export async function sendAccusation(
  sessionId: string,
  npcId: string,
  assumption: string,
): Promise<{ status: 'success' | 'failed'; message: string; solutionStory?: string; nextLevel?: LevelState }> {
  const response = await postJson<ApiAccusationResponse>('/game/accuse', {
    sessionId,
    npcId,
    assumption,
  });

  return {
    status: response.status,
    message: response.message,
    solutionStory: response.solution_story ?? undefined,
    nextLevel: response.next_level ? mapGameState(response.next_level) : undefined,
  };
}

export interface CompanionChatResponse {
  response: string;
  trace: AgentTrace;
}

export async function sendCompanionChat(
  sessionId: string,
  message: string,
  globalTranscript: Array<{ speaker: string; text: string; npcId?: string }>,
  discoveredClues: Array<{ title: string; description: string; room: string }>,
): Promise<CompanionChatResponse> {
  const response = await postJson<{ response: string; trace: ApiTrace }>('/game/companion/chat', {
    session_id: sessionId,
    player_message: message,
    global_transcript: globalTranscript.map(line => ({
      speaker: line.speaker,
      text: line.text,
      npc_id: line.npcId
    })),
    discovered_clues: discoveredClues.map(clue => ({
      title: clue.title,
      description: clue.description,
      room: clue.room
    })),
  });

  return {
    response: response.response,
    trace: mapTrace(response.trace, 'trace-companion'),
  };
}

export { BASE_URL };
