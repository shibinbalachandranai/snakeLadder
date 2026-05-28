import { SNAKES, LADDERS, BOARD_SIZE } from "./constants";

export type Player = {
  name: string;
  position: number;
};

export type PlayerStats = {
  snakesHit: number;
  laddersClimbed: number;
  squaresLostToSnakes: number;
  squaresGainedFromLadders: number;
  diceHistory: number[];
  totalMoves: number;
};

export type LastEvent = "snake" | "ladder" | "normal" | null;

export type GameState = {
  mode: "pvp" | "pvc";
  players: [Player, Player];
  currentTurn: 0 | 1;
  phase: "setup" | "playing" | "won";
  diceValue: number | null;
  lastEvent: LastEvent;
  eventDelta: number;
  winner: 0 | 1 | null;
  stats: [PlayerStats, PlayerStats];
  // Animation support
  rollId: number;
  lastMover: 0 | 1 | null;
  moveFromPosition: number | null;
  preEventPosition: number | null;
};

export type GameAction =
  | {
      type: "START_GAME";
      mode: "pvp" | "pvc";
      p1Name: string;
      p2Name: string;
    }
  | { type: "ROLL"; diceValue: number }
  | { type: "RESTART" };

const emptyStats = (): PlayerStats => ({
  snakesHit: 0,
  laddersClimbed: 0,
  squaresLostToSnakes: 0,
  squaresGainedFromLadders: 0,
  diceHistory: [],
  totalMoves: 0,
});

export const initialState: GameState = {
  mode: "pvp",
  players: [
    { name: "Player 1", position: 0 },
    { name: "Player 2", position: 0 },
  ],
  currentTurn: 0,
  phase: "setup",
  diceValue: null,
  lastEvent: null,
  eventDelta: 0,
  winner: null,
  stats: [emptyStats(), emptyStats()],
  rollId: 0,
  lastMover: null,
  moveFromPosition: null,
  preEventPosition: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      return {
        ...initialState,
        mode: action.mode,
        phase: "playing",
        players: [
          { name: action.p1Name || "Player 1", position: 0 },
          { name: action.p2Name || "Player 2", position: 0 },
        ],
        stats: [emptyStats(), emptyStats()],
      };
    }

    case "ROLL": {
      const { diceValue } = action;
      const current = state.currentTurn;
      const moveFromPosition = state.players[current].position;
      const rawNewPos = moveFromPosition + diceValue;

      const newStats: [PlayerStats, PlayerStats] = [
        { ...state.stats[0], diceHistory: [...state.stats[0].diceHistory] },
        { ...state.stats[1], diceHistory: [...state.stats[1].diceHistory] },
      ];
      newStats[current] = {
        ...newStats[current],
        totalMoves: newStats[current].totalMoves + 1,
        diceHistory: [...newStats[current].diceHistory, diceValue],
      };

      if (rawNewPos > BOARD_SIZE) {
        return {
          ...state,
          diceValue,
          lastEvent: "normal",
          eventDelta: 0,
          stats: newStats,
          currentTurn: (1 - current) as 0 | 1,
          rollId: state.rollId + 1,
          lastMover: current,
          moveFromPosition,
          preEventPosition: moveFromPosition,
        };
      }

      let finalPos = rawNewPos;
      let lastEvent: LastEvent = "normal";
      let eventDelta = 0;

      if (SNAKES[rawNewPos] !== undefined) {
        const snakeTail = SNAKES[rawNewPos];
        eventDelta = snakeTail - rawNewPos;
        newStats[current].snakesHit += 1;
        newStats[current].squaresLostToSnakes += Math.abs(eventDelta);
        finalPos = snakeTail;
        lastEvent = "snake";
      } else if (LADDERS[rawNewPos] !== undefined) {
        const ladderTop = LADDERS[rawNewPos];
        eventDelta = ladderTop - rawNewPos;
        newStats[current].laddersClimbed += 1;
        newStats[current].squaresGainedFromLadders += eventDelta;
        finalPos = ladderTop;
        lastEvent = "ladder";
      }

      const newPlayers: [Player, Player] = [
        { ...state.players[0] },
        { ...state.players[1] },
      ];
      newPlayers[current] = { ...newPlayers[current], position: finalPos };

      if (finalPos === BOARD_SIZE) {
        return {
          ...state,
          diceValue,
          players: newPlayers,
          phase: "won",
          winner: current,
          lastEvent,
          eventDelta,
          stats: newStats,
          rollId: state.rollId + 1,
          lastMover: current,
          moveFromPosition,
          preEventPosition: rawNewPos,
        };
      }

      return {
        ...state,
        diceValue,
        players: newPlayers,
        currentTurn: (1 - current) as 0 | 1,
        lastEvent,
        eventDelta,
        stats: newStats,
        rollId: state.rollId + 1,
        lastMover: current,
        moveFromPosition,
        preEventPosition: rawNewPos,
      };
    }

    case "RESTART": {
      return { ...initialState };
    }

    default:
      return state;
  }
}
