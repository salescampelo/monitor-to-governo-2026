// C16 — gate de acesso aos dados. Roda APÓS `vite build`.
//
// Os JSONs de dados moram em `public/data/` porque (a) o dev-server do Vite os
// serve estaticamente em DEV e (b) o `vercel.json` os empacota na função
// serverless via `includeFiles: public/data/**` (lido do SOURCE, não do dist).
//
// Efeito colateral indesejado: `vite build` copia `public/` para `dist/`, então
// `dist/data/*.json` ficaria servido ESTATICAMENTE em produção — alcançável por
// qualquer um que passe do Deployment Protection, SEM o token Supabase que a
// função `/api/data/[file].js` exige. Em prod o app já lê tudo pela função
// autenticada (ver o ternário `dev ? fetch('/data') : fetchJ(URLS.x)` nos
// painéis), então esse caminho estático é uma PORTA aberta que ninguém usa.
//
// Este passo remove `dist/data` do output: a função (que lê de public/data no
// bundle) segue intacta; a porta estática deixa de existir. Idempotente.
import { rmSync, existsSync } from 'node:fs';

const target = 'dist/data';
if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
  console.log(`[no-static-data] removido ${target} — dados servidos só via /api/data autenticado (C16).`);
} else {
  console.log(`[no-static-data] ${target} ausente — nada a fazer.`);
}
