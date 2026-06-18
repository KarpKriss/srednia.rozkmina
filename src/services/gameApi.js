import { supabase } from '../lib/supabaseClient.js';
import { createSafeId } from '../lib/storage.js';

const ROOM_STATE_SELECT = `
  id,
  code,
  status,
  host_player_id,
  current_round_id,
  round_number,
  max_rounds,
  players(*),
  rounds(
    *,
    questions(*)
  )
`;

export function createLocalKey() {
  return createSafeId();
}

export async function createOnlineRoom(hostName, maxRounds = 7) {
  const clientKey = createLocalKey();
  const hostKey = createLocalKey();

  const { data, error } = await supabase.rpc('create_room', {
    p_host_name: hostName,
    p_client_token: clientKey,
    p_host_token: hostKey,
    p_max_rounds: maxRounds,
  });

  if (error) throw error;

  const row = data?.[0];

  return {
    roomId: row.room_id,
    playerId: row.player_id,
    code: row.code,
    clientKey,
    hostKey,
    isHost: true,
  };
}

export async function joinOnlineRoom(code, playerName) {
  const clientKey = createLocalKey();

  const { data, error } = await supabase.rpc('join_room', {
    p_code: code,
    p_name: playerName,
    p_client_token: clientKey,
  });

  if (error) throw error;

  const row = data?.[0];

  return {
    roomId: row.room_id,
    playerId: row.player_id,
    code: row.code,
    status: row.status,
    clientKey,
    hostKey: null,
    isHost: false,
  };
}

export async function fetchRoomState(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_STATE_SELECT)
    .eq('id', roomId)
    .single();

  if (error) throw error;

  const currentRound = data.rounds?.find((round) => round.id === data.current_round_id) ?? null;

  let answers = [];
  let roundScores = [];

  if (currentRound) {
    const answersResult = await supabase
      .from('answers')
      .select('*')
      .eq('round_id', currentRound.id);

    if (answersResult.error) throw answersResult.error;
    answers = answersResult.data ?? [];

    const scoresResult = await supabase
      .from('round_scores')
      .select('*')
      .eq('round_id', currentRound.id);

    if (scoresResult.error) throw scoresResult.error;
    roundScores = scoresResult.data ?? [];
  }

  return {
    room: data,
    players: data.players ?? [],
    currentRound,
    currentQuestion: currentRound?.questions ?? null,
    answers,
    roundScores,
  };
}

export async function startOnlineRound(roomId, hostKey) {
  const { error } = await supabase.rpc('start_round', {
    p_room_id: roomId,
    p_host_token: hostKey,
    p_question_id: null,
  });

  if (error) throw error;
}

export async function submitOnlineAnswer(roundId, playerId, clientKey, ownAnswer, predictedAverage) {
  const { error } = await supabase.rpc('submit_answer', {
    p_round_id: roundId,
    p_player_id: playerId,
    p_client_token: clientKey,
    p_own_answer: Number(ownAnswer),
    p_predicted_average: Number(predictedAverage),
  });

  if (error) throw error;
}

export async function revealOnlineRound(roundId, hostKey) {
  const { error } = await supabase.rpc('finish_round', {
    p_round_id: roundId,
    p_host_token: hostKey,
  });

  if (error) throw error;
}

export async function moveOnlineRoundToDiscussion(roundId, hostKey) {
  const { error } = await supabase.rpc('set_round_discussion', {
    p_round_id: roundId,
    p_host_token: hostKey,
  });

  if (error) throw error;
}

export function subscribeToRoom(roomId, onChange) {
  return supabase
    .channel(`room:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();
}

export function subscribeToRound(roundId, onChange) {
  if (!roundId) return null;

  return supabase
    .channel(`round:${roundId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `round_id=eq.${roundId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'round_scores', filter: `round_id=eq.${roundId}` }, onChange)
    .subscribe();
}

export function unsubscribe(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
