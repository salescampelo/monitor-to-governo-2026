# Monitor TO Governo 2026 — Dashboard (monitor-to-governo-2026)

## Visão geral
Dashboard de inteligência eleitoral **B2B neutro** para a corrida ao Governo do Tocantins 2026. Apresenta visão simétrica dos pré-candidatos a Governador (scorecards de **10 dimensões**; ranking dos ativos + lista de desistentes). Protegido por autenticação Supabase, deployado no Vercel.

## Modos de operação
- **B2B neutro** (default): visão simétrica dos pré-candidatos a Governador.
- **Unilateral**: visão por cliente, definida em `VITE_TARGET_CANDIDATE` (`src/lib/config.js`).

## Stack
- **Framework**: React 19 + Vite (JSX)
- **Ícones**: Lucide React (gráficos do painel são barras/CSS próprias — sem lib de charts)
- **Auth**: Supabase (`@supabase/supabase-js`)
- **Deploy**: Vercel — `vite build` → `dist/`; functions em `api/**` servem os JSON (`vercel.json`)

## Fonte de dados
Os dados vêm de JSON sincronizados do scraper `scraper-to-governo-2026` (scorecards de 10 dimensões dos pré-candidatos a governador). Ficam em `public/data/` e são servidos via `api/data` (não acessados estáticos), com `Authorization: Bearer` do Supabase em cada fetch (`src/lib/fetch.js`).

| Arquivo (`public/data/`) | Conteúdo |
|---|---|
| `adversarios.json` | Ranking / scorecards dos pré-candidatos |
| `adversarios_mentions.json` | Menções por candidato |
| `social_metrics.json` | Métricas de redes sociais |
| `vetores_processuais.json` | Vetores processuais / jurídicos |
| `vices_config.json` | Configuração de vices/chapas |

## Painéis implementados (`src/panels/`)
1. **Inteligência Competitiva** (`InteligenciaCompetitivaPanel`) — ranking simétrico dos pré-candidatos
2. **Vices / Chapas** (`VicesPanel`)

## Convenções
- Fetch com timeout, refresh de sessão Supabase e cache-bust (`?t=Date.now()`) em `src/lib/fetch.js`; rate-limit em `src/lib/rateLimit.js`.
- Auth gate via `LoginScreen.jsx`; UI compartilhada em `src/components/ui.jsx`.
- Data da eleição: `2026-10-04` (`config.js`).
- Os JSON em `public/data/` **são versionados** (tracked no git) e sobrescritos+commitados pelo sync do scraper (`sync_github.py` / GitHub Action `monitor.yml`). Não editá-los à mão — a próxima sincronização sobrescreve.

## Automações Claude Code

### Globais — valem em todo C:\dev (carregam ao **reiniciar** o Claude Code)
- **Hooks** (`~/.claude/`): `lgpd_guard` (CPF/CNPJ válido em versionado e `git add data/`) · `secret_guard` (segredos em versionado; avisa em Bash) · `proteger_remove` · `crlf_normalize` (CRLF→LF — útil em repos JS/Windows) · `backup_reminder`.
- **Agent** `lgpd-data-guardian` (revisor PII). **Skill** `data-session-backup` (mirror robocopy → HD).
- Convenção: código no git; dados em `data/`/`public/data/` (os JSON são publicados via sync do scraper, não por commit de dado bruto); dado nominal nunca versionado nem colado em chat (LGPD).

### Relevantes para este repo
- **Agent** `data-quality-validator` — validar os JSON consumidos de `scraper-to-governo-2026` (schema, frescor, simetria dos 8 candidatos) antes de renderizar.
