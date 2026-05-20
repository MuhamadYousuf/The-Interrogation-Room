import { useCallback, useMemo, useState } from 'react';
import { sendAccusation, sendInterrogation, startGame, sendCompanionChat } from '../services/api';
import type { AgentTrace, Clue, DialogueLine, GameMode, LevelState, NPC, PlayerMetrics } from '../types/game';

const createDialogueLine = (
  speaker: DialogueLine['speaker'],
  text: string,
  npcId?: string,
): DialogueLine => ({
  id: `dialogue-${speaker}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  speaker,
  text,
  npcId,
  timestamp: new Date().toISOString(),
});

export function useGameState() {
  const [currentScene, setCurrentScene] = useState<LevelState | null>(null);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueLine[]>([]);
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
  const [mode, setMode] = useState<GameMode>('investigating');
  const [selectedNpcId, setSelectedNpcId] = useState<string | undefined>();
  const [selectedClueId, setSelectedClueId] = useState<string | undefined>();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [interrogationCount, setInterrogationCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState<string | null>(null);
  const [accusationResult, setAccusationResult] = useState<{
    status: 'success' | 'failed';
    message: string;
    solutionStory?: string;
  } | null>(null);
  const [companionHistory, setCompanionHistory] = useState<DialogueLine[]>([]);
  const [isCompanionLoading, setIsCompanionLoading] = useState(false);

  const selectedNpc = useMemo(
    () => npcs.find((npc) => npc.id === selectedNpcId),
    [npcs, selectedNpcId],
  );

  const selectedClue = useMemo(
    () => currentScene?.clues.find((clue) => clue.id === selectedClueId),
    [currentScene?.clues, selectedClueId],
  );

  const collectedClues = useMemo(() => {
    if (!currentScene) {
      return [];
    }

    return currentScene.clues.filter((clue) => currentScene.collectedClueIds.includes(clue.id));
  }, [currentScene]);

  const metrics: PlayerMetrics = useMemo(
    () => ({
      elapsedSeconds,
      interrogationCount,
      retryCount,
      accuracy: retryCount === 0 ? 1 : Math.max(0.2, 1 - retryCount * 0.12),
      inspectedClueIds: currentScene?.collectedClueIds ?? [],
      selectedNpcId,
    }),
    [currentScene?.collectedClueIds, elapsedSeconds, interrogationCount, retryCount, selectedNpcId],
  );

  const initializeGame = useCallback(async (sessionId?: string) => {
    setIsStarting(true);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const scene = await startGame(sessionId);
      const firstNpc = scene.npcs[0];

      setCurrentScene(scene);
      setNpcs(scene.npcs);
      setSelectedNpcId(firstNpc?.id);
      setDialogueHistory(firstNpc?.dialogueHistory ?? []);
      setAgentTraces(scene.agentTraces);
      setElapsedSeconds(0);
      setInterrogationCount(0);
      setRetryCount(0);
      setResolutionMessage(null);
      setAccusationResult(null);
      setCompanionHistory([
        createDialogueLine(
          'npc',
          "Hey partner. Riley here. I'm keeping track of all our suspect interviews and clues. Ask me to review contradictions, brainstorm motives, or summarize what we know so far.",
          'riley'
        )
      ]);
      setIsCompanionLoading(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start game.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsStarting(false);
    }
  }, []);

  const tickElapsed = useCallback(() => {
    setElapsedSeconds((current) => current + 1);
  }, []);

  const selectNpc = useCallback(
    (npcId: string) => {
      const npc = npcs.find((candidate) => candidate.id === npcId);

      setSelectedNpcId(npcId);
      setMode('interrogating');
      setDialogueHistory(npc?.dialogueHistory ?? []);
    },
    [npcs],
  );

  const inspectClue = useCallback((clueId: string) => {
    setSelectedClueId(clueId);
    setMode('investigating');

    setCurrentScene((current) => {
      if (!current) {
        return current;
      }

      const collectedClueIds = current.collectedClueIds.includes(clueId)
        ? current.collectedClueIds
        : [...current.collectedClueIds, clueId];

      return {
        ...current,
        collectedClueIds,
        clues: current.clues.map((clue) =>
          clue.id === clueId ? { ...clue, discovered: true } : clue,
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText || !currentScene?.sessionId || !selectedNpcId) {
        return;
      }

      const playerLine = createDialogueLine('player', trimmedText, selectedNpcId);

      setMode('interrogating');
      setIsLoading(true);
      setErrorMessage(null);
      setInterrogationCount((current) => current + 1);
      setDialogueHistory((current) => [...current, playerLine]);
      setNpcs((current) =>
        current.map((npc) =>
          npc.id === selectedNpcId
            ? {
                ...npc,
                dialogueHistory: [...npc.dialogueHistory, playerLine],
                interrogationState: {
                  ...npc.interrogationState,
                  retryCount: npc.interrogationState.retryCount + 1,
                  lastAskedAt: playerLine.timestamp,
                  pressure: Math.min(100, npc.interrogationState.pressure + 8),
                },
              }
            : npc,
        ),
      );

      try {
        const response = await sendInterrogation(
          currentScene.sessionId,
          selectedNpcId,
          trimmedText,
          metrics,
        );
        const npcLine = createDialogueLine('npc', response.dialogue, selectedNpcId);

        setDialogueHistory((current) => [...current, npcLine]);
        setAgentTraces((current) => [response.trace, ...current]);
        setNpcs((current) =>
          current.map((npc) =>
            npc.id === selectedNpcId
              ? {
                  ...npc,
                  dialogueHistory: [...npc.dialogueHistory, npcLine],
                }
              : npc,
          ),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The manor signal went quiet.';
        const systemLine = createDialogueLine('system', 'The manor signal went quiet. Check the backend server and try again.');

        setRetryCount((current) => current + 1);
        setErrorMessage(message);
        setDialogueHistory((current) => [...current, systemLine]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentScene?.sessionId, metrics, selectedNpcId],
  );

  const handleAccusation = useCallback(
    async (npcId: string, assumption: string) => {
      if (!currentScene?.sessionId || isLoading) {
        return;
      }

      const accusedNpc = npcs.find((npc) => npc.id === npcId);
      const accusationLine = createDialogueLine(
        'player',
        `I accuse ${accusedNpc?.name ?? 'this suspect'} of the murder.`,
        npcId,
      );

      setMode('interrogating');
      setIsLoading(true);
      setErrorMessage(null);
      setAccusationResult(null);
      setDialogueHistory((current) => [...current, accusationLine]);

      try {
        const response = await sendAccusation(currentScene.sessionId, npcId, assumption);
        const systemLine = createDialogueLine('system', response.message, npcId);
        setResolutionMessage(response.message);
        setAccusationResult({
          status: response.status,
          message: response.message,
          solutionStory: response.solutionStory,
        });

        if (response.status === 'success') {
          // Keep active state so we can return to Home, but log success
          setDialogueHistory((current) => [...current, systemLine]);
        } else {
          setRetryCount((current) => current + 1);
          setDialogueHistory((current) => [...current, systemLine]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The accusation could not be processed.';
        const systemLine = createDialogueLine('system', 'The accusation could not be processed. Check the backend server and try again.');

        setRetryCount((current) => current + 1);
        setErrorMessage(message);
        setDialogueHistory((current) => [...current, systemLine]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentScene?.sessionId, isLoading, npcs],
  );

  const clearAccusationResult = useCallback(() => {
    setAccusationResult(null);
  }, []);

  const handleSendCompanionMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || !currentScene?.sessionId) {
        return;
      }

      const playerLine = createDialogueLine('player', trimmedText, 'riley');
      setCompanionHistory((current) => [...current, playerLine]);
      setIsCompanionLoading(true);

      const transcript = npcs.flatMap((npc) => npc.dialogueHistory);
      const cluesList = currentScene.clues.filter((c) => currentScene.collectedClueIds.includes(c.id));

      try {
        const response = await sendCompanionChat(
          currentScene.sessionId,
          trimmedText,
          transcript,
          cluesList,
        );
        const rileyLine = createDialogueLine('npc', response.response, 'riley');
        setCompanionHistory((current) => [...current, rileyLine]);
        setAgentTraces((current) => [response.trace, ...current]);
      } catch (error) {
        const errLine = createDialogueLine('system', 'The partner radio signal went quiet. Check connection.', 'riley');
        setCompanionHistory((current) => [...current, errLine]);
      } finally {
        setIsCompanionLoading(false);
      }
    },
    [currentScene, npcs],
  );

  return {
    currentScene,
    level: currentScene,
    npcs,
    dialogueHistory,
    agentTraces,
    mode,
    selectedNpc,
    selectedClue,
    selectedNpcId,
    selectedClueId,
    collectedClues,
    elapsedSeconds,
    interrogationCount,
    retryCount,
    metrics,
    isLoading,
    isStarting,
    isSubmitting: isLoading && !isStarting,
    errorMessage,
    resolutionMessage,
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
    sendInterrogation: handleSendMessage,
  };
}

export type UseGameState = ReturnType<typeof useGameState>;
export type { Clue, NPC };
