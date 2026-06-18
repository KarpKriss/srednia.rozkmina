# Średnia Rozkmina

Mobile-first online party game based on numeric dilemmas, reading the group average, and the `Odklejeniec` badge mechanic.

## Current status

The app is connected to Supabase and supports the first online MVP flow:

- host creates a room,
- players join by room code,
- host starts a round,
- players submit two numeric answers,
- host reveals the round,
- Supabase calculates average, prediction points, Odklejeniec badge, and -2 penalty after 3 badges.

## Stack

- React + Vite
- Supabase database + RPC + realtime
- Vercel hosting
- GitHub source control

## Supabase project

Project: `srednia.rozkmina`

Project ref: `cxqbwkxifiyiuncljmzk`

See `supabase/README.md` for schema and RPC notes.

## Core game loop

1. Host creates a room.
2. Players join using a room code.
3. Host starts a round with a question.
4. Each player submits two numbers:
   - own answer
   - predicted group average
5. Supabase calculates:
   - group average from own answers,
   - closest predictions,
   - the player farthest from the average: `Odklejeniec`.
6. Scores and badges are updated.
7. After 3 Odklejeniec badges, the player gets -2 points and the badge counter resets.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

The frontend already contains public Supabase fallback config, so Vercel should work without manual env setup.

You can still copy `.env.example` to `.env.local` for explicit local configuration:

```bash
cp .env.example .env.local
```

## Known MVP simplification

Answers are hidden by the UI before reveal, but the MVP database policy currently allows reading answers from the frontend key. This is acceptable for a friend-party prototype, but should be hardened before public release.
