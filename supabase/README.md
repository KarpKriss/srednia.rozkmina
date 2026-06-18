# Supabase Integration

Project: `srednia.rozkmina`

Project ref: `cxqbwkxifiyiuncljmzk`

API URL:

```text
https://cxqbwkxifiyiuncljmzk.supabase.co
```

## Applied migrations

The following migrations have been applied directly to the Supabase project:

1. `initial_game_schema`
2. `fix_join_room_conflict`
3. `allow_answer_reads_for_mvp`

## Tables

- `questions`
- `rooms`
- `players`
- `rounds`
- `answers`
- `round_scores`

## RPC functions used by the frontend

- `create_room(p_host_name, p_client_token, p_host_token, p_max_rounds)`
- `join_room(p_code, p_name, p_client_token)`
- `start_round(p_room_id, p_host_token, p_question_id)`
- `submit_answer(p_round_id, p_player_id, p_client_token, p_own_answer, p_predicted_average)`
- `finish_round(p_round_id, p_host_token)`
- `set_round_discussion(p_round_id, p_host_token)`
- `finish_game(p_room_id, p_host_token)`

## MVP security model

This game intentionally does not use user accounts yet.

The MVP uses locally generated client/host keys and Supabase RLS/RPC functions. This is sufficient for a friend-party prototype, but not a hardened public product.

Important simplification for v0.1:

- answers are hidden by the UI before reveal,
- answers are readable from the database by a technical user with the public frontend key.

For a public product, add account auth or a stricter server-side snapshot RPC that only exposes submitted counts before reveal.
