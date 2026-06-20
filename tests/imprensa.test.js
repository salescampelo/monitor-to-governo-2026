import { describe, it, expect } from 'vitest';
import {
  achatarMencoes, aplicarFiltros, contagemPorFonte, volumePorDia, opcoesDeFiltro, FILTRO_INICIAL,
} from '../src/lib/imprensa.js';

const DATA = {
  updated_at: '2026-06-16 23:23',
  candidatos: {
    dorinha: { nome: 'Dorinha', mentions: [
      { title: 'A', url: 'u1', source: 'G1', published: 'Wed, 10 Jun 2026 00:41:25 GMT', sentimento: 'Neutro', escopo: 'focado', tipo: 'institucional', relevancia_rotulo: 'DIRETA', hash: 'h1' },
      { title: 'B', url: 'u2', source: 'G2', published: 'Mon, 15 Jun 2026 10:00:00 GMT', sentimento: 'Positivo', escopo: 'focado', tipo: 'campanha', relevancia_rotulo: 'INCIDENTAL', hash: 'h2' },
    ] },
    laurez: { nome: 'Laurez', mentions: [
      { title: 'C', url: 'u3', source: 'G1', published: 'Mon, 15 Jun 2026 12:00:00 GMT', sentimento: 'Negativo', escopo: 'incidental', tipo: 'judicial', relevancia_rotulo: 'DIRETA', hash: 'h3' },
    ] },
  },
};

describe('achatarMencoes', () => {
  it('achata por candidato e marca o adversário de origem', () => {
    const ms = achatarMencoes(DATA);
    expect(ms).toHaveLength(3);
    expect(ms.every(m => m.adversario_id && m.adversario_nome)).toBe(true);
    expect(ms.find(m => m.hash === 'h1').dia).toBe('2026-06-10');
  });
  it('sem dado -> []', () => {
    expect(achatarMencoes(null)).toEqual([]);
    expect(achatarMencoes({ candidatos: {} })).toEqual([]);
  });
  it('C9: menção sem published cai para captured_at (não some do volume/dia)', () => {
    const ms = achatarMencoes({ candidatos: { x: { nome: 'X', mentions: [
      { title: 'P', source: 'G', captured_at: '2026-06-12', hash: 'hp' }, // só captured_at
    ] } } });
    expect(ms[0].dia).toBe('2026-06-12');
    expect(ms[0].ts).toBeGreaterThan(0);
  });
});

describe('aplicarFiltros', () => {
  const ms = achatarMencoes(DATA);
  it('ordena por data desc', () => {
    const r = aplicarFiltros(ms, FILTRO_INICIAL);
    expect(r[0].published).toContain('15 Jun'); // mais recentes primeiro
    expect(r[r.length - 1].hash).toBe('h1');     // 10/jun por último
  });
  it('filtra por adversário', () => {
    expect(aplicarFiltros(ms, { ...FILTRO_INICIAL, adversario: 'laurez' })).toHaveLength(1);
  });
  it('filtra por sentimento', () => {
    expect(aplicarFiltros(ms, { ...FILTRO_INICIAL, sentimento: 'Negativo' }).map(m => m.hash)).toEqual(['h3']);
  });
  it('relevância "direta" pega só DIRETA', () => {
    const r = aplicarFiltros(ms, { ...FILTRO_INICIAL, relevancia: 'direta' });
    expect(r.map(m => m.hash).sort()).toEqual(['h1', 'h3']);
  });
});

describe('contagemPorFonte', () => {
  it('conta por veículo desc', () => {
    expect(contagemPorFonte(achatarMencoes(DATA))).toEqual([{ fonte: 'G1', n: 2 }, { fonte: 'G2', n: 1 }]);
  });
});

describe('volumePorDia', () => {
  it('agrupa por dia asc', () => {
    expect(volumePorDia(achatarMencoes(DATA))).toEqual([{ dia: '2026-06-10', n: 1 }, { dia: '2026-06-15', n: 2 }]);
  });
});

describe('opcoesDeFiltro', () => {
  it('lista adversários/fontes/tipos/escopos distintos', () => {
    const o = opcoesDeFiltro(achatarMencoes(DATA));
    expect(o.adversarios.map(a => a.id).sort()).toEqual(['dorinha', 'laurez']);
    expect(o.fontes).toEqual(['G1', 'G2']);
    expect(o.tipos).toEqual(['campanha', 'institucional', 'judicial']);
  });
});
