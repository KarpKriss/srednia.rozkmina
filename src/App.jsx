import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from './lib/supabaseClient.js';
import {
  createOnlineRoom,
  fetchRoomState,
  joinOnlineRoom,
  moveOnlineRoundToDiscussion,
  revealOnlineRound,
  startOnlineRound,
  submitOnlineAnswer,
  subscribeToRoom,
  subscribeToRound,
  unsubscribe,
} from './services/gameApi.js';
import './styles.css';

const SESSION_STORAGE_KEY = 'srednia-rozkmina-current-session';

function loadSavedSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSavedSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export default function App() {
  const [session, setSession] = useState(() => loadSavedSession());
  const [roomState, setRoomState] = useState(null);
  const [hostName, setHostName] = useState('Kris');
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [ownAnswer, setOwnAnswer] = useState('');
  const [predictedAverage, setPredictedAverage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const refreshRoom = useCallback(async () => {
    if (!session?.roomId) return;

    const nextState = await fetchRoomState(session.roomId);
    setRoomState(nextState);
  }, [session?.roomId]);

  useEffect(() => {
    if (!session?.roomId) return;

    refreshRoom().catch((nextError) => setError(nextError.message));

    const roomChannel = subscribeToRoom(session.roomId, () => {
      refreshRoom().catch((nextError) => setError(nextError.message));
    });

    return () => unsubscribe(roomChannel);
  }, [refreshRoom, session?.roomId]);

  useEffect(() => {
    const roundId = roomState?.currentRound?.id;
    if (!roundId) return;

    const roundChannel = subscribeToRound(roundId, () => {
      refreshRoom().catch((nextError) => setError(nextError.message));
    });

    return () => unsubscribe(roundChannel);
  }, [refreshRoom, roomState?.currentRound?.id]);

  const players = useMemo(() => roomState?.players ?? [], [roomState]);
  const room = roomState?.room ?? null;
  const currentRound = roomState?.currentRound ?? null;
  const currentQuestion = roomState?.currentQuestion ?? null;
  const answers = roomState?.answers ?? [];
  const roundScores = roomState?.roundScores ?? [];
  const currentPlayer = players.find((player) => player.id === session?.playerId) ?? null;
  const isHost = Boolean(session?.isHost);
  const hasSubmitted = answers.some((answer) => answer.player_id === session?.playerId);

  async function runAction(action) {
    setError('');
    setIsBusy(true);

    try {
      await action();
      await refreshRoom();
    } catch (nextError) {
      setError(nextError.message || 'Something went wrong.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateRoom(event) {
    event.preventDefault();

    await runAction(async () => {
      const nextSession = await createOnlineRoom(hostName.trim() || 'Host', 7);
      saveSession(nextSession);
      setSession(nextSession);
      const nextState = await fetchRoomState(nextSession.roomId);
      setRoomState(nextState);
    });
  }

  async function handleJoinRoom(event) {
    event.preventDefault();

    await runAction(async () => {
      const nextSession = await joinOnlineRoom(roomCodeInput.trim().toUpperCase(), playerName.trim() || 'Gracz');
      saveSession(nextSession);
      setSession(nextSession);
      const nextState = await fetchRoomState(nextSession.roomId);
      setRoomState(nextState);
    });
  }

  async function handleStartRound() {
    await runAction(async () => {
      await startOnlineRound(session.roomId, session.hostKey);
    });
  }

  async function handleSubmitAnswer(event) {
    event.preventDefault();

    await runAction(async () => {
      await submitOnlineAnswer(
        currentRound.id,
        session.playerId,
        session.clientKey,
        ownAnswer,
        predictedAverage
      );
      setOwnAnswer('');
      setPredictedAverage('');
    });
  }

  async function handleRevealRound() {
    await runAction(async () => {
      await revealOnlineRound(currentRound.id, session.hostKey);
    });
  }

  async function handleDiscussion() {
    await runAction(async () => {
      await moveOnlineRoundToDiscussion(currentRound.id, session.hostKey);
    });
  }

  function leaveRoom() {
    clearSavedSession();
    setSession(null);
    setRoomState(null);
    setOwnAnswer('');
    setPredictedAverage('');
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">online party game</p>
          <h1>Średnia Rozkmina</h1>
        </div>
        <span className={isSupabaseConfigured ? 'status online' : 'status'}>
          {isSupabaseConfigured ? 'Supabase online' : 'Local scaffold'}
        </span>
      </header>

      {error && <div className="errorBox">{error}</div>}

      {!session && (
        <section className="grid">
          <form className="card hero" onSubmit={handleCreateRoom}>
            <p className="eyebrow">host</p>
            <h2>Załóż pokój gry.</h2>
            <label>
              Twój nick
              <input value={hostName} onChange={(event) => setHostName(event.target.value)} />
            </label>
            <button className="primary" disabled={isBusy} type="submit">Create room</button>
          </form>

          <form className="card hero" onSubmit={handleJoinRoom}>
            <p className="eyebrow">player</p>
            <h2>Dołącz kodem.</h2>
            <label>
              Kod pokoju
              <input value={roomCodeInput} onChange={(event) => setRoomCodeInput(event.target.value)} placeholder="ABCD" />
            </label>
            <label>
              Twój nick
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="np. Ola" />
            </label>
            <button className="primary" disabled={isBusy} type="submit">Join room</button>
          </form>
        </section>
      )}

      {session && !roomState && (
        <section className="card hero">
          <p className="eyebrow">loading</p>
          <h2>Ładuję pokój...</h2>
          <button onClick={leaveRoom}>Reset session</button>
        </section>
      )}

      {session && roomState && (
        <section className="grid">
          <aside className="card">
            <p className="eyebrow">room code</p>
            <div className="roomCode">{room?.code}</div>
            <p className="muted">Daj ten kod znajomym. Wchodzą na stronę i klikają Join room.</p>
            <button onClick={leaveRoom}>Leave room</button>
          </aside>

          <section className="card">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">status: {room?.status}</p>
                <h2>{getPhaseTitle(room?.status)}</h2>
              </div>
              {currentPlayer && <span className="pill">{currentPlayer.name}</span>}
            </div>

            {room?.status === 'lobby' && (
              <LobbyView players={players} isHost={isHost} isBusy={isBusy} onStartRound={handleStartRound} />
            )}

            {room?.status === 'answering' && currentQuestion && currentRound && (
              <AnsweringView
                question={currentQuestion}
                players={players}
                answers={answers}
                ownAnswer={ownAnswer}
                predictedAverage={predictedAverage}
                setOwnAnswer={setOwnAnswer}
                setPredictedAverage={setPredictedAverage}
                hasSubmitted={hasSubmitted}
                isHost={isHost}
                isBusy={isBusy}
                onSubmitAnswer={handleSubmitAnswer}
                onReveal={handleRevealRound}
              />
            )}

            {room?.status === 'reveal' && currentQuestion && currentRound && (
              <RevealView
                question={currentQuestion}
                round={currentRound}
                players={players}
                answers={answers}
                scores={roundScores}
                isHost={isHost}
                isBusy={isBusy}
                onDiscussion={handleDiscussion}
              />
            )}

            {room?.status === 'discussion' && (
              <DiscussionView isHost={isHost} isBusy={isBusy} onNextRound={handleStartRound} />
            )}

            {room?.status === 'finished' && <FinalView players={players} />}
          </section>
        </section>
      )}
    </main>
  );
}

function getPhaseTitle(status) {
  switch (status) {
    case 'lobby': return 'Czekamy na graczy';
    case 'answering': return 'Odpowiadamy';
    case 'reveal': return 'Wyniki rundy';
    case 'discussion': return 'Czas na rozkminę';
    case 'finished': return 'Koniec gry';
    default: return 'Gra';
  }
}

function LobbyView({ players, isHost, isBusy, onStartRound }) {
  return (
    <div>
      <PlayerList players={players} />
      {isHost ? (
        <button className="primary" disabled={players.length < 2 || isBusy} onClick={onStartRound}>
          Start round
        </button>
      ) : (
        <p className="muted">Czekamy, aż host rozpocznie rundę.</p>
      )}
    </div>
  );
}

function AnsweringView(props) {
  const {
    question,
    players,
    answers,
    ownAnswer,
    predictedAverage,
    setOwnAnswer,
    setPredictedAverage,
    hasSubmitted,
    isHost,
    isBusy,
    onSubmitAnswer,
    onReveal,
  } = props;

  return (
    <div>
      <p className="eyebrow">{question.category}</p>
      <h2>{question.text}</h2>
      <p className="unit">Jednostka: {question.unit}</p>

      {hasSubmitted ? (
        <div className="successBox">Odpowiedź zapisana. Czekamy na resztę: {answers.length}/{players.length}</div>
      ) : (
        <form className="answerForm" onSubmit={onSubmitAnswer}>
          <label>
            Moja odpowiedź
            <input inputMode="decimal" type="number" value={ownAnswer} onChange={(event) => setOwnAnswer(event.target.value)} required />
          </label>
          <label>
            Przewidywana średnia grupy
            <input inputMode="decimal" type="number" value={predictedAverage} onChange={(event) => setPredictedAverage(event.target.value)} required />
          </label>
          <button className="primary" disabled={isBusy} type="submit">Submit answer</button>
        </form>
      )}

      {isHost && (
        <div className="actionRow">
          <button disabled={answers.length < players.length || isBusy} onClick={onReveal}>
            Reveal round ({answers.length}/{players.length})
          </button>
        </div>
      )}
    </div>
  );
}

function RevealView({ question, round, players, answers, scores, isHost, isBusy, onDiscussion }) {
  return (
    <div>
      <p className="eyebrow">average</p>
      <div className="bigNumber">{round.average}</div>
      <p className="unit">{question.unit}</p>
      <ResultTable players={players} answers={answers} scores={scores} unit={question.unit} />
      {isHost && <button className="primary" disabled={isBusy} onClick={onDiscussion}>Discussion</button>}
    </div>
  );
}

function DiscussionView({ isHost, isBusy, onNextRound }) {
  return (
    <div className="hero">
      <h2>Odklejeniec broni odpowiedzi. Reszta może rozkminiać.</h2>
      {isHost ? (
        <button className="primary" disabled={isBusy} onClick={onNextRound}>Next round</button>
      ) : (
        <p className="muted">Czekamy na kolejną rundę.</p>
      )}
    </div>
  );
}

function FinalView({ players }) {
  return (
    <div>
      <h2>Final score</h2>
      <PlayerList players={[...players].sort((a, b) => b.score - a.score)} />
    </div>
  );
}

function PlayerList({ players }) {
  return (
    <ul className="playerList">
      {players.map((player) => (
        <li key={player.id}>
          <span>{player.name}{player.is_host ? ' 👑' : ''}</span>
          <strong>{player.score} pkt</strong>
          <small>{player.odklejeniec_badges}/3 odklejeńca</small>
        </li>
      ))}
    </ul>
  );
}

function ResultTable({ players, answers, scores, unit }) {
  const answerMap = new Map(answers.map((answer) => [answer.player_id, answer]));
  const scoreByPlayer = new Map();
  const badgePlayerIds = new Set();
  const penaltyPlayerIds = new Set();

  scores.forEach((score) => {
    scoreByPlayer.set(score.player_id, (scoreByPlayer.get(score.player_id) ?? 0) + score.points);
    if (score.reason === 'odklejeniec_badge') badgePlayerIds.add(score.player_id);
    if (score.reason === 'odklejeniec_penalty') penaltyPlayerIds.add(score.player_id);
  });

  return (
    <div className="resultList">
      {players.map((player) => {
        const answer = answerMap.get(player.id);
        const isOdklejeniec = badgePlayerIds.has(player.id);
        return (
          <article key={player.id} className={isOdklejeniec ? 'resultRow odklejeniec' : 'resultRow'}>
            <div>
              <strong>{player.name}</strong>
              {isOdklejeniec && <span className="badge">Odklejeniec</span>}
            </div>
            <p>Odpowiedź: {answer?.own_answer ?? '-'} {unit}</p>
            <p>Typowana średnia: {answer?.predicted_average ?? '-'} {unit}</p>
            <p>Zmiana punktów: {scoreByPlayer.get(player.id) ?? 0}{penaltyPlayerIds.has(player.id) ? ' / kara -2' : ''}</p>
          </article>
        );
      })}
    </div>
  );
}
