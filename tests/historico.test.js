import { describe, it, expect } from 'vitest';
import {
  candidatosDoHistorico, coresPorCandidato, dominioPosicao, pivotMetrica,
} from '../src/lib/historico.js';

const S = [
  { data: '2026-06-14', id: 'a', nome: 'A', partido: 'P1', score: 70, posicao: 1, origem: 'backfill' },
  { data: '2026-06-15', id: 'a', nome: 'A', partido: 'P1', score: 75, posicao: 1, origem: 'live' },
  { data: '2026-06-14', id: 'b', nome: 'B', partido: 'P2', score: 80, posicao: 2, origem: 'backfill' },
  // b NÃO tem 2026-06-15 -> gap
];

describe('candidatosDoHistorico', () => {
  it('ordena por score do dia mais recente (desc)', () => {
    const c = candidatosDoHistorico(S);
    expect(c.map(x => x.id)).toEqual(['a', 'b']); // a:75(15/06) > b:80(14/06, dia mais antigo)
    expect(c[0].ultimoScore).toBe(75);
  });
  it('série vazia -> []', () => {
    expect(candidatosDoHistorico([])).toEqual([]);
  });
});

describe('coresPorCandidato', () => {
  it('determinístico e faz wrap acima da paleta', () => {
    const muitos = Array.from({ length: 9 }, (_, i) => ({ id: `c${i}` }));
    const cores = coresPorCandidato(muitos);
    expect(cores.c0).toBe(cores.c8); // 9º faz wrap para o índice 0
    expect(typeof cores.c0).toBe('string');
  });
});

describe('dominioPosicao', () => {
  it('[1, N]', () => {
    expect(dominioPosicao([{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toEqual([1, 3]);
    expect(dominioPosicao([])).toEqual([1, 1]);
  });
});

describe('pivotMetrica', () => {
  it('separa origem em __bf/__live e duplica o ponto de fronteira', () => {
    const rows = pivotMetrica(S, 'score', ['a']);
    const r14 = rows.find(r => r.data === '2026-06-14');
    const r15 = rows.find(r => r.data === '2026-06-15');
    expect(r14.a__bf).toBe(70);          // dia backfill
    expect(r15.a__live).toBe(75);        // dia live
    expect(r15.a__bf).toBe(75);          // fronteira duplicada -> linhas se juntam
  });
  it('gap: dia sem ponto não recebe chave (undefined)', () => {
    const rows = pivotMetrica(S, 'score', ['b']);
    const r15 = rows.find(r => r.data === '2026-06-15');
    expect(r15.b__live).toBeUndefined();
    expect(r15.b__bf).toBeUndefined();
  });
  it('uma linha por dia, ordenada', () => {
    const rows = pivotMetrica(S, 'posicao', ['a', 'b']);
    expect(rows.map(r => r.data)).toEqual(['2026-06-14', '2026-06-15']);
  });
});
