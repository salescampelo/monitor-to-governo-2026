# Monitor TO Governo 2026 — Inteligência Eleitoral B2B

Dashboard de inteligência eleitoral para a corrida ao Governo do Tocantins 2026.

## Modos de operação
- **B2B neutro** (default): visão simétrica dos 8 pré-candidatos a Governador.
- **Unilateral**: visão por cliente, definida em `VITE_TARGET_CANDIDATE`.

## Stack
- React 18 + Vite
- Supabase Auth
- Recharts + Lucide
- Vercel (deploy)

## Setup local
1. `cp .env.example .env.local`
2. Preencher `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. `npm run dev`
