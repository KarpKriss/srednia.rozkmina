import { useMemo, useState } from 'react';
import { QUESTIONS } from './data/questions.js';
import { createRoomCode } from './lib/roomCode.js';
import { calculateRoundResults } from './lib/scoring.js';
import { getOrCreateLocalPlayerId } from './lib/storage.js';
import { isSupabaseConfigured } from './lib/supabaseClient.js';

const PHASES = {
  START: 'start',
  LOBBY: 'lobby',
  ANSWERING: 'answering',
  REVEAL: 'reveal',
  DISCUSSION: 'discussion',
  FINISHED: 'finished',
};

export default function App() {
  const localPlayerId = useMemo(() => getOrCreateLocalPlayerId(), []);
  const [phase, setPhase] = useState(PHASES.START);
  const [roomCode, setRoomCode] = useState('');
  const [hostName, setHostName] = useState('Kris');
  const [guestName, setGuestName] = useState('');
  const [players, setPlayers] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [ownAnswer, setOwnAnswer] = useState('');
  const [predictedAverage, setPredictedAverage] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const currentQuestion = QUESTIONS[roundIndex % QUESTIONS.length];
  const isHost = players.some((player) => player.id === localPlayerId && player.isHost);

  function createLocalRoom() {
    setRoomCode(createRoomCode());
    setPlayers([
      {
        id: localPlayerId,
        name: hostName.trim() || 'Host',
        score: 0,
        odklejeniecBadges: 0,
        isHost: true,
      },
    ]);
    setPhase(PHASES.LOBBY);
  }

  function addDemoPlayer() {
    const name = guestName.trim() || `Gracz ${players.length + 1}`;
    setPlayers((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        score: 0,
        odklejeniecBadges: 0,
        isHost: false,
      },
    ]);
    setGuestName('');
  }

  function startRound() {
    setAnswers([]);
    setOwnAnswer('');
    setPredictedAverage('');
    setLastResult(null);
    setPhase(PHASES.ANSWERING);
  }

  function submitHostAnswer(event) {
    event.preventDefault();

    const own = Number(ownAnswer);
    const prediction = Number(predictedAverage);

    if (!Number.isFinite(own) || !Number.isFinite(prediction)) {
      return;
    }

    setAnswers((current) => [
      ...current.filter((answer) => answer.playerId !== localPlayerId),
      {
        playerId: localPlayerId,
        ownAnswer: own,
        predictedAverage: prediction,
      },
    ]);

    setOwnAnswer('');
    setPredictedAverage('');
  }

  function fillDemoAnswers() {
    const hostAnswer = answers.find((answer) => answer.playerId === localPlayerId);

    if (!hostAnswer) {
      return;
    }

    const generatedAnswers = players
      .filter((player) => player.id !== localPlayerId)
      .map((player, index) => {
        const base = hostAnswer.ownAnswer;
        const spread = (index + 1) * 7;
        return {
          playerId: player.id,
          ownAnswer: Math.max(0, Math.round(base + spread * (index % 2 === 0 ? 1 : -1))),
          predictedAverage: Math.max(0, Math.round(hostAnswer.predictedAverage + spread / 2)),
        };
      });

    setAnswers([hostAnswer, ...generatedAnswers]);
  }

  function revealRound() {
    const result = calculateRoundResults(players, answers);
    setLastResult(result);
    setPlayers(result.updatedPlayers);
    setPhase(PHASES.REVEAL);
  }

  function nextRound() {
    if (roundIndex + 1 >= QUESTIONS.length) {
      setPhase(PHASES.FINISHED);
      return;
    }

    setRoundIndex((current) => current + 1);
    setPhase(PHASES.DISCUSSION);
  }

  function resetGame() {
    setPhase(PHASES.START);
    setRoomCode('');
    setPlayers([]);
    setRoundIndex(0);
    setAnswers([]);
    setLastResult(null);
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">party game</p>
          <h1>Średnia Rozkmina</h1>
        </div>
        <span className={isSupabaseConfigured ? 'status online' : 'status'}>
          {isSupabaseConfigured ? 'Supabase ready' : 'Local scaffold'}
        </span>
      </header>

      {phase === PHASES.START && (
        <section className="card hero">
          <p className="eyebrow">v0.1 frontend scaffold</p>
          <h2>Utwórz pokój i przetestuj mechanikę gry.</h2>
          <p>
            Ta wersja ma lokalny tryb demo. Online roomy podepniemy w kolejnym kroku przez Supabase.
          </p>

          <label>
            Nick hosta
            <input value={hostName} onChange={(event) => setHostName(event.target.value)} />
          </label>

          <button className="primary" onClick={createLocalRoom}>Create room</button>
        </section>
      )}

      {phase === PHASES.LOBBY && (
        <section className="grid">
          <div className="card">
            <p className="eyebrow">room code</p>
            <div className="roomCode">{roomCode}</div>
            <p className="muted">Docelowo tutaj będzie link i QR code dla znajomych.</p>
          </div>

          <div className="card">
            <h2>Lobby</h2>
            <PlayerList players={players} />

            <div className="inlineForm">
              <input
                placeholder="Dodaj gracza demo"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
              />
              <button onClick={addDemoPlayer}>Add</button>
            </div>

            <button className="primary" disabled={players.length < 2 || !isHost} onClick={startRound}>
              Start game
            </button>
          </div>
        </section>
      )}

      {phase === PHASES.ANSWERING && (
        <section className="card">
          <p className="eyebrow">round {roundIndex + 1}</p>
          <h2>{currentQuestion.text}</h2>
          <p className="unit">Jednostka: {currentQuestion.unit}</p>

          <form className="answerForm" onSubmit={submitHostAnswer}>
            <label>
              Moja odpowiedź
              <input
                inputMode="decimal"
                type="number"
                value={ownAnswer}
                onChange={(event) => setOwnAnswer(event.target.value)}
              />
            </label>
            <label>
              Przewidywana średnia grupy
              <input
                inputMode="decimal"
                type="number"
                value={predictedAverage}
                onChange={(event) => setPredictedAverage(event.target.value)}
              />
            </label>
            <button className="primary" type="submit">Submit answer</button>
          </form>

          <div className="actionRow">
            <button disabled={!answers.some((answer) => answer.playerId === localPlayerId)} onClick={fillDemoAnswers}>
              Fill demo answers
            </button>
            <button disabled={answers.length !== players.length} onClick={revealRound}>
              Reveal round ({answers.length}/{players.length})
            </button>
          </div>
        </section>
      )}

      {phase === PHASES.REVEAL && lastResult && (
        <section className="grid">
          <div className="card highlight">
            <p className="eyebrow">average</p>
            <div className="bigNumber">{lastResult.average}</div>
            <p>{currentQuestion.unit}</p>
          </div>

          <div className="card">
            <h2>Round result</h2>
            <ResultTable players={players} answers={answers} result={lastResult} unit={currentQuestion.unit} />
            <button className="primary" onClick={nextRound}>Discussion / Next</button>
          </div>
        </section>
      )}

      {phase === PHASES.DISCUSSION && (
        <section className="card hero">
          <p className="eyebrow">discussion</p>
          <h2>Czas na obronę Odklejeńca i krótką rozkminę.</h2>
          <p>Host może przejść do kolejnej rundy, gdy rozmowa naturalnie się skończy.</p>
          <button className="primary" onClick={startRound}>Next round</button>
        </section>
      )}

      {phase === PHASES.FINISHED && (
        <section className="card hero">
          <p className="eyebrow">final score</p>
          <h2>Koniec gry</h2>
          <PlayerList players={[...players].sort((a, b) => b.score - a.score)} />
          <button className="primary" onClick={resetGame}>New game</button>
        </section>
      )}
    </main>
  );
}

function PlayerList({ players }) {
  return (
    <ul className="playerList">
      {players.map((player) => (
        <li key={player.id}>
          <span>{player.name}{player.isHost ? ' 👑' : ''}</span>
          <strong>{player.score} pkt</strong>
          <small>{player.odklejeniecBadges}/3 odklejeńca</small>
        </li>
      ))}
    </ul>
  );
}

function ResultTable({ players, answers, result, unit }) {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  const answerMap = new Map(answers.map((answer) => [answer.playerId, answer]));
  const rankingMap = new Map(result.predictionRanking.map((entry, index) => [entry.playerId, index + 1]));
  const odklejeniecIds = new Set(result.odklejency.map((entry) => entry.playerId));

  return (
    <div className="resultList">
      {players.map((player) => {
        const answer = answerMap.get(player.id);
        const rank = rankingMap.get(player.id);
        return (
          <article key={player.id} className={odklejeniecIds.has(player.id) ? 'resultRow odklejeniec' : 'resultRow'}>
            <div>
              <strong>{playerMap.get(player.id)?.name}</strong>
              {odklejeniecIds.has(player.id) && <span className="badge">Odklejeniec</span>}
            </div>
            <p>Odpowiedź: {answer?.ownAnswer} {unit}</p>
            <p>Typowana średnia: {answer?.predictedAverage} {unit}</p>
            <p>Miejsce w typowaniu: {rank}</p>
            <p>Zmiana punktów: {player.lastRoundPoints ?? 0}{player.penaltyApplied ? ' / kara -2' : ''}</p>
          </article>
        );
      })}
    </div>
  );
}
