import { describe, it, expect } from 'vitest';
import { tomLabel, sentimentoPct, nivelCor } from '../src/lib/narrativa.js';

describe('tomLabel', () => {
  it('classifica por limiar 0.2', () => {
    expect(tomLabel(0.5).label).toBe('Narrativa favorável');
    expect(tomLabel(-0.5).label).toBe('Narrativa adversa');
    expect(tomLabel(0.1).label).toBe('Narrativa neutra');
    expect(tomLabel(null).label).toBe('Sem dado');
  });
});

describe('sentimentoPct', () => {
  it('converte contagens em percentuais que somam ~100', () => {
    const p = sentimentoPct({ positivo: 2, negativo: 1, neutro: 1 });
    expect(p.total).toBe(4);
    expect(Math.round(p.pos + p.neg + p.neu)).toBe(100);
    expect(p.pos).toBe(50);
  });
  it('total 0 -> zeros, sem divisão por zero', () => {
    expect(sentimentoPct({ positivo: 0, negativo: 0, neutro: 0 })).toEqual({ pos: 0, neg: 0, neu: 0, total: 0 });
    expect(sentimentoPct(null)).toEqual({ pos: 0, neg: 0, neu: 0, total: 0 });
  });
});

describe('nivelCor', () => {
  it('mapeia nível -> cor', () => {
    expect(nivelCor('critico')).toBe('#ef4444');
    expect(nivelCor('alerta')).toBe('#f59e0b');
    expect(nivelCor('outro')).toBe('#6B7280');
  });
});
