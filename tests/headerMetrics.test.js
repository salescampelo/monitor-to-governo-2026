import { describe, it, expect } from 'vitest';
import {
  computeHeaderMetrics, adversarioEmAlta, imprensa48h, vulnerabsCriticas,
} from '../src/lib/headerMetrics.js';

const NOW = new Date('2026-06-17T00:00:00Z');

const MENTIONS = {
  candidatos: {
    dorinha: { nome: 'Dorinha', total_mentions: 33, new_this_run: 19, mentions: [
      { captured_at: '2026-06-16T20:00:00Z' }, // dentro de 48h
      { captured_at: '2026-06-10T00:00:00Z' }, // fora de 48h
    ] },
    katia: { nome: 'Kátia', total_mentions: 10, new_this_run: 4, mentions: [
      { captured_at: '2026-06-16T23:00:00Z' },
    ] },
  },
};

describe('adversarioEmAlta', () => {
  it('escolhe o maior new_this_run', () => {
    expect(adversarioEmAlta(MENTIONS)).toEqual({ nome: 'Dorinha', novos: 19 });
  });
  it('sem dado -> null (no-fabricação)', () => {
    expect(adversarioEmAlta(null)).toBeNull();
    expect(adversarioEmAlta({ candidatos: {} })).toBeNull();
  });
  it('todos com 0 novos -> null (não inventa surto)', () => {
    expect(adversarioEmAlta({ candidatos: { a: { nome: 'A', new_this_run: 0 } } })).toBeNull();
  });
});

describe('imprensa48h', () => {
  it('conta só menções dentro da janela de 48h', () => {
    expect(imprensa48h(MENTIONS, NOW)).toBe(2); // dorinha(1) + katia(1)
  });
  it('sem dado -> 0', () => {
    expect(imprensa48h(null, NOW)).toBe(0);
  });
});

describe('vulnerabsCriticas', () => {
  it('lê resumo.criticos do radar', () => {
    expect(vulnerabsCriticas({ resumo: { criticos: 3 } })).toBe(3);
    expect(vulnerabsCriticas({ resumo: { criticos: 0 } })).toBe(0);
  });
  it('sem feed -> null (NUNCA 0 fabricado)', () => {
    expect(vulnerabsCriticas(null)).toBeNull();
    expect(vulnerabsCriticas({})).toBeNull();
    expect(vulnerabsCriticas({ resumo: {} })).toBeNull();
  });
});

describe('computeHeaderMetrics', () => {
  it('agrega os feeds num objeto de header', () => {
    const m = computeHeaderMetrics(
      { ranking: [{ id: 'a' }, { id: 'b' }] },
      MENTIONS,
      { resumo: { criticos: 3 } },
      NOW,
    );
    expect(m).toEqual({
      totalCandidatos: 2,
      adversarioEmAlta: { nome: 'Dorinha', novos: 19 },
      imprensa48h: 2,
      vulnerabsCriticas: 3,
    });
  });
  it('tudo vazio -> zeros e nulls, sem crash', () => {
    const m = computeHeaderMetrics(null, null, null, NOW);
    expect(m).toEqual({ totalCandidatos: 0, adversarioEmAlta: null, imprensa48h: 0, vulnerabsCriticas: null });
  });
});
