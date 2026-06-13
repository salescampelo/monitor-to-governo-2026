import { describe, it, expect } from 'vitest';
import { normalizarDimensoes, mencoesPorDia } from '../src/lib/dimensoes.js';

const RANKING = [
  { id: 'a', votos_2022: 100, seguidores: 0, taxa_engajamento_pct: 2,
    sobreposicao: 0.9, severidade_processual: 0.1, vetor_doadores: 0.5,
    capital_positivo: 0.4, trajetoria_eleitoral: 0.7, nivel_base: 'alta',
    is_mandato_atual: true },
  { id: 'b', votos_2022: 50, seguidores: 0, taxa_engajamento_pct: 6,
    sobreposicao: 0.3, severidade_processual: 0.0, vetor_doadores: 0.2,
    capital_positivo: 0.8, trajetoria_eleitoral: 0.5, nivel_base: 'média',
    is_mandato_atual: false },
  { id: 'c', votos_2022: 0, seguidores: 0, taxa_engajamento_pct: 4,
    sobreposicao: 0.0, severidade_processual: 0.0, vetor_doadores: 0.0,
    capital_positivo: 0.0, trajetoria_eleitoral: 0.1, nivel_base: 'baixa',
    is_mandato_atual: false },
];

describe('normalizarDimensoes', () => {
  const out = normalizarDimensoes(RANKING);

  it('mapeia min-max votos_2022 sobre o conjunto', () => {
    expect(out.a.votos_2022).toBe(1);      // maior
    expect(out.c.votos_2022).toBe(0);      // menor
    expect(out.b.votos_2022).toBeCloseTo(0.5, 5);
  });

  it('max==min vira 0 para todos (seguidores all-zero, sem div/0)', () => {
    expect(out.a.seguidores).toBe(0);
    expect(out.b.seguidores).toBe(0);
    expect(out.c.seguidores).toBe(0);
  });

  it('usa 0..1 nativo direto', () => {
    expect(out.a.sobreposicao).toBe(0.9);
    expect(out.a.trajetoria).toBe(0.7);
    expect(out.b.capital_positivo).toBe(0.8);
  });

  it('mapeia nivel_base categórico', () => {
    expect(out.a.nivel_base).toBe(1.0);
    expect(out.b.nivel_base).toBe(0.5);
    expect(out.c.nivel_base).toBe(0.0);
  });

  it('mandato de booleano', () => {
    expect(out.a.mandato).toBe(1);
    expect(out.b.mandato).toBe(0);
  });

  it('todas as 10 dims presentes e em 0..1', () => {
    const dims = ['votos_2022','seguidores','sobreposicao','nivel_base',
      'engajamento','mandato','severidade','vetor_doadores','capital_positivo','trajetoria'];
    for (const d of dims) {
      expect(out.a[d]).toBeGreaterThanOrEqual(0);
      expect(out.a[d]).toBeLessThanOrEqual(1);
    }
  });
});

describe('mencoesPorDia', () => {
  it('agrega por captured_at e preenche dias vazios com 0', () => {
    const mentions = [
      { captured_at: '2026-06-10' }, { captured_at: '2026-06-10' },
      { captured_at: '2026-06-12' },
    ];
    const serie = mencoesPorDia(mentions);
    const por = Object.fromEntries(serie.map(p => [p.dia, p.n]));
    expect(por['2026-06-10']).toBe(2);
    expect(por['2026-06-11']).toBe(0);   // dia vazio, contíguo
    expect(por['2026-06-12']).toBe(1);
    expect(serie.length).toBe(3);
  });

  it('normaliza captured_at com componente de hora (datetime ISO)', () => {
    const mentions = [
      { captured_at: '2026-06-10T14:30:00Z' },
      { captured_at: '2026-06-10T09:00:00Z' },
      { captured_at: '2026-06-11' },
    ];
    const serie = mencoesPorDia(mentions);
    const por = Object.fromEntries(serie.map(p => [p.dia, p.n]));
    expect(por['2026-06-10']).toBe(2);   // duas no mesmo dia, horas diferentes
    expect(por['2026-06-11']).toBe(1);
    expect(serie.length).toBe(2);
  });

  it('lista vazia -> []', () => {
    expect(mencoesPorDia([])).toEqual([]);
  });
});
