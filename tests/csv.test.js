import { describe, it, expect } from 'vitest';
import { toCSV } from '../src/lib/csv.js';

describe('toCSV', () => {
  it('header na 1a linha e linhas na ordem', () => {
    const csv = toCSV([{ a: 1, b: 2 }], ['a', 'b']);
    expect(csv).toBe('a,b\n1,2');
  });
  it('escapa vírgula, aspas e newline', () => {
    const csv = toCSV([{ a: 'x,y', b: 'di"z', c: 'li\nnha' }], ['a', 'b', 'c']);
    expect(csv).toBe('a,b,c\n"x,y","di""z","li\nnha"');
  });
  it('valores ausentes viram vazio', () => {
    const csv = toCSV([{ a: 1 }], ['a', 'b']);
    expect(csv).toBe('a,b\n1,');
  });
});
