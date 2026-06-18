# Średnia Rozkmina

Mobile-first online party game based on numeric dilemmas, reading the group average, and the `Odklejeniec` badge mechanic.

## Current status

This repository contains the frontend scaffold for the game. The Supabase database is intentionally not wired yet — the next step is to create the database schema, RLS policies, and realtime subscriptions.

## Stack

- React + Vite
- Supabase planned for database and realtime room state
- Vercel planned for hosting
- GitHub for source control

## Core game loop

1. Host creates a room.
2. Players join using a room code.
3. Host starts a round with a question.
4. Each player submits two numbers:
   - own answer
   - predicted group average
5. The app calculates:
   - group average from own answers
   - closest predictions
   - the player farthest from the average: `Odklejeniec`
6. Scores and badges are updated.
7. After 3 Odklejeniec badges, the player gets -2 points and the badge counter resets.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` after Supabase is created:

```bash
cp .env.example .env.local
```

## Next step

See `docs/DATABASE_NEXT_STEPS.md`.
