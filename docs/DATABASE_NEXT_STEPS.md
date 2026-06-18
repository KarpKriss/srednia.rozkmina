# Database Next Steps

This document defines what should be created in Supabase after the frontend scaffold.

## Recommended order

1. Create Supabase project.
2. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Create tables.
4. Add RLS policies.
5. Add seed questions.
6. Replace local demo state with Supabase service calls.
7. Add realtime subscriptions for rooms, players, rounds, and answers.

## Tables for v0.1

### `rooms`

Purpose: game room created by host.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `code text unique not null`
- `status text not null default 'lobby'`
- `host_player_id uuid null`
- `current_round_id uuid null`
- `round_number int not null default 0`
- `max_rounds int not null default 7`
- `created_at timestamptz not null default now()`

Allowed statuses:

- `lobby`
- `answering`
- `reveal`
- `discussion`
- `finished`

### `players`

Purpose: players in a room.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `room_id uuid not null references rooms(id) on delete cascade`
- `name text not null`
- `score int not null default 0`
- `odklejeniec_badges int not null default 0`
- `is_host boolean not null default false`
- `client_token text not null`
- `joined_at timestamptz not null default now()`

### `questions`

Purpose: reusable question deck.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `category text not null`
- `text text not null`
- `unit text not null`
- `is_active boolean not null default true`

### `rounds`

Purpose: single game round.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `room_id uuid not null references rooms(id) on delete cascade`
- `question_id uuid not null references questions(id)`
- `round_number int not null`
- `status text not null default 'answering'`
- `average numeric null`
- `created_at timestamptz not null default now()`

### `answers`

Purpose: two submitted numbers per player per round.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `round_id uuid not null references rounds(id) on delete cascade`
- `player_id uuid not null references players(id) on delete cascade`
- `own_answer numeric not null`
- `predicted_average numeric not null`
- `submitted_at timestamptz not null default now()`
- `unique(round_id, player_id)`

### `round_scores`

Purpose: audit trail of points given in a round.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `round_id uuid not null references rounds(id) on delete cascade`
- `player_id uuid not null references players(id) on delete cascade`
- `points int not null default 0`
- `reason text not null`
- `created_at timestamptz not null default now()`

## RLS direction

MVP can use a simple `client_token` stored in localStorage. This is not bulletproof security, but it is acceptable for a party game prototype.

Minimum rules:

- Anyone can create a room.
- Anyone can join a room by code.
- Player can insert/update only their own answer using matching `client_token`.
- Host can move the game phase and create rounds.
- Players can read room state, players, questions, rounds, answers after reveal, and scores for their room.

## Important product decision before SQL

Decide whether answers should be visible before reveal.

Recommended: no. Before reveal, players should only see how many people submitted, not actual values.
