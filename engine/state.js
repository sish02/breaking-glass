// Pure session state (data-model.md "Session state"). In memory only; reload starts fresh (FR-006).
// The reducer never decides correctness itself: `submit` delegates to rules.evaluate.
import { evaluate } from './rules.js';

export const ROLES = ['OTDR Reader', 'Route Mapper', 'Dispatcher', 'Safety Lead'];

function freshRoundState(content) {
  const out = {};
  for (const level of content.levels) {
    for (const r of level.rounds) {
      out[r.id] = {
        fired: false, selectedSite: null, highlightedEvent: null, attempts: 0, assistance: 0,
        solved: false, lastDiagnosis: null, digs: [],
      };
    }
  }
  return out;
}

export function createSession(content) {
  return {
    content,
    phase: 'setup',
    teamSize: null,
    levelIndex: 0,
    sessionRound: 0,
    roundState: freshRoundState(content),
    restartPending: false,
  };
}

/** Index of the first session round of a level. */
function levelStart(content, levelIndex) {
  return content.levels.slice(0, levelIndex).reduce((n, l) => n + l.rounds.length, 0);
}

export function currentLevel(state) {
  return state.content.levels[state.levelIndex];
}

export function currentRound(state) {
  const level = currentLevel(state);
  return level.rounds[state.sessionRound - levelStart(state.content, state.levelIndex)];
}

export function totalRounds(state) {
  return state.content.levels.reduce((n, l) => n + l.rounds.length, 0);
}

function withRound(state, id, patch) {
  return { ...state, roundState: { ...state.roundState, [id]: { ...state.roundState[id], ...patch } } };
}

export function reduce(state, action) {
  switch (action.type) {
    case 'chooseTeamSize': {
      if (state.phase !== 'setup' || ![3, 4].includes(action.n)) return state;
      return { ...state, phase: 'briefing', teamSize: action.n, levelIndex: 0, sessionRound: 0 };
    }
    case 'startLevel': {
      if (state.phase !== 'briefing') return state;
      return { ...state, phase: 'round' };
    }
    case 'selectSite': {
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      if (state.roundState[r.id].solved) return state;
      return withRound(state, r.id, { selectedSite: action.siteId });
    }
    case 'highlightEvent': {
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      return withRound(state, r.id, { highlightedEvent: action.eventId });
    }
    case 'submit': {
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      const rs = state.roundState[r.id];
      if (rs.solved || !rs.fired) return state;          // duplicate-submit guard (FR-017); fire first (FR-010)
      const diagnosis = evaluate(r, rs.selectedSite);
      if (diagnosis.status === 'invalid-input' || diagnosis.status === 'content-error') {
        return withRound(state, r.id, { lastDiagnosis: diagnosis }); // no attempt counted (FR-015)
      }
      return withRound(state, r.id, {
        attempts: rs.attempts + 1,
        solved: diagnosis.status === 'correct',
        lastDiagnosis: diagnosis,
        digs: [...rs.digs, { siteId: rs.selectedSite, status: diagnosis.status }],
      });
    }
    case 'firePulse': {
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      if (state.roundState[r.id].fired) return state;
      return withRound(state, r.id, { fired: true }); // free: no attempt, no assistance
    }
    case 'dig': {
      // Click-to-dig: select + submit in one action (FR-010).
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      const rs = state.roundState[r.id];
      if (rs.solved || !rs.fired) return state;
      return reduce(reduce(state, { type: 'selectSite', siteId: action.siteId }), { type: 'submit' });
    }
    case 'next': {
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      if (!state.roundState[r.id].solved) return state;
      const level = currentLevel(state);
      const indexInLevel = state.sessionRound - levelStart(state.content, state.levelIndex);
      if (indexInLevel + 1 < level.rounds.length) return { ...state, sessionRound: state.sessionRound + 1 };
      if (state.levelIndex + 1 < state.content.levels.length) {
        return { ...state, phase: 'briefing', levelIndex: state.levelIndex + 1, sessionRound: state.sessionRound + 1 };
      }
      return { ...state, phase: 'summary' };
    }
    case 'requestHelp': {
      if (state.phase !== 'round') return state;
      const r = currentRound(state);
      const rs = state.roundState[r.id];
      if (rs.solved || rs.assistance >= 3) return state;
      return withRound(state, r.id, { assistance: rs.assistance + 1 }); // never selects or submits (FR-016)
    }
    case 'requestRestart': {
      if (state.phase === 'setup' || state.restartPending) return state;
      return { ...state, restartPending: true };
    }
    case 'cancelRestart': {
      if (!state.restartPending) return state;
      return { ...state, restartPending: false };
    }
    case 'confirmRestart': {
      if (!state.restartPending && state.phase !== 'summary') return state; // summary's Play again = confirmed restart
      return createSession(state.content);
    }
    default:
      return state;
  }
}

/** Role shown for Player p (1…n) in session round r (spec FR-019). Display only. */
export function roleFor(player, sessionRound, n) {
  return ROLES[(((player - 1 + sessionRound) % n) + n) % n];
}

/** Counts for one level (FR-018 level recap). */
export function levelRecap(state, levelIndex) {
  const rounds = state.content.levels[levelIndex].rounds.map((r) => state.roundState[r.id]);
  return {
    solved: rounds.filter((r) => r.solved).length,
    rounds: rounds.length,
    attempts: rounds.reduce((n, r) => n + r.attempts, 0),
    assistance: rounds.reduce((n, r) => n + r.assistance, 0),
  };
}

/** Session summary grouped by level, with totals (FR-018). */
export function sessionSummary(state) {
  const levels = state.content.levels.map((level, i) => ({
    id: level.id,
    title: level.title,
    rounds: level.rounds.map((r) => ({ id: r.id, title: r.title, ...state.roundState[r.id] })),
    recap: levelRecap(state, i),
  }));
  const totals = levels.reduce((t, l) => ({
    solved: t.solved + l.recap.solved,
    rounds: t.rounds + l.recap.rounds,
    attempts: t.attempts + l.recap.attempts,
    assistance: t.assistance + l.recap.assistance,
  }), { solved: 0, rounds: 0, attempts: 0, assistance: 0 });
  return { levels, totals };
}
