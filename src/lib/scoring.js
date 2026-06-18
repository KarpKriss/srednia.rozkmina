export function calculateRoundResults(players, answers) {
  const validAnswers = answers.filter((answer) => Number.isFinite(answer.ownAnswer));

  if (validAnswers.length === 0) {
    throw new Error('Cannot calculate results without answers.');
  }

  const average = roundToTwoDecimals(
    validAnswers.reduce((sum, answer) => sum + answer.ownAnswer, 0) / validAnswers.length
  );

  const predictionRanking = validAnswers
    .map((answer) => ({
      playerId: answer.playerId,
      predictedAverage: answer.predictedAverage,
      predictionDelta: Math.abs(answer.predictedAverage - average),
    }))
    .sort((a, b) => a.predictionDelta - b.predictionDelta);

  const predictionPoints = assignPredictionPoints(predictionRanking);

  const ownAnswerDistances = validAnswers.map((answer) => ({
    playerId: answer.playerId,
    ownAnswer: answer.ownAnswer,
    distanceFromAverage: Math.abs(answer.ownAnswer - average),
  }));

  const maxDistance = Math.max(...ownAnswerDistances.map((item) => item.distanceFromAverage));
  const odklejency = ownAnswerDistances.filter((item) => item.distanceFromAverage === maxDistance);
  const odklejeniecIds = new Set(odklejency.map((item) => item.playerId));

  const updatedPlayers = players.map((player) => {
    const gainedPoints = predictionPoints.get(player.id) ?? 0;
    let score = player.score + gainedPoints;
    let odklejeniecBadges = player.odklejeniecBadges;
    let penaltyApplied = false;

    if (odklejeniecIds.has(player.id)) {
      odklejeniecBadges += 1;
    }

    if (odklejeniecBadges >= 3) {
      score -= 2;
      odklejeniecBadges = 0;
      penaltyApplied = true;
    }

    return {
      ...player,
      score,
      odklejeniecBadges,
      lastRoundPoints: gainedPoints,
      wasOdklejeniec: odklejeniecIds.has(player.id),
      penaltyApplied,
    };
  });

  return {
    average,
    predictionRanking,
    odklejency,
    updatedPlayers,
  };
}

function assignPredictionPoints(sortedRanking) {
  const pointsByPlace = [5, 3, 1];
  const points = new Map();
  let place = 0;
  let previousDelta = null;
  let previousPlace = 0;

  sortedRanking.forEach((entry, index) => {
    if (previousDelta === null || entry.predictionDelta !== previousDelta) {
      place = index;
      previousPlace = place;
      previousDelta = entry.predictionDelta;
    } else {
      place = previousPlace;
    }

    points.set(entry.playerId, pointsByPlace[place] ?? 0);
  });

  return points;
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
