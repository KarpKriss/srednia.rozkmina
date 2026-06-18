# Changelog

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

### Not yet implemented

- Supabase database schema.
- Online room joining.
- Realtime synchronization.
- RLS policies.
- QR code joining.
