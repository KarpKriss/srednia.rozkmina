# Changelog

## v0.2.0

### Added

- Supabase project connected: `srednia.rozkmina`.
- Database schema for online MVP:
  - `questions`,
  - `rooms`,
  - `players`,
  - `rounds`,
  - `answers`,
  - `round_scores`.
- RPC functions for room creation, joining, round start, answer submit, reveal/scoring, discussion, and finish.
- Realtime subscriptions for room, player, round, answer, and score changes.
- Online frontend flow:
  - Create room,
  - Join room,
  - Lobby,
  - Answering,
  - Reveal,
  - Discussion,
  - Final score.
- Supabase config fallback for Vercel deployment.

### Changed

- Scoring is now calculated in Supabase through `finish_round`, not only in local frontend code.
- README now reflects online MVP status.

### Known MVP limitations

- Answers are hidden by the UI before reveal, but readable technically through the public frontend key.
- No user accounts yet.
- No QR code join yet.

## v0.1.0

### Added

- React + Vite frontend scaffold.
- Mobile-first UI for party game flow.
- Local demo room creation.
- Local demo player creation.
- Answer phase with own answer and predicted average.
- Scoring engine:
  - +5 / +3 / +1 for closest average prediction,
  - Odklejeniec badge for farthest own answer from average,
  - -2 points after 3 Odklejeniec badges,
  - badge counter reset after penalty.
- Initial question deck.
- Supabase client placeholder.
- Vercel SPA config.
- Database next steps document.
