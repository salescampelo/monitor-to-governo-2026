import { describe, it, expect } from 'vitest';
import { pesquisaMaisRecente, resumoPesquisas } from '../src/lib/pesquisas.js';

const SERIE = [
  // pesquisa antiga
  { protocolo: 'P1', instituto: 'Inst A', data_divulgacao: '2026-05-01', candidato: 'X', percentual: 30, entrevistas: 1000, margem: 3 },
  { protocolo: 'P1', instituto: 'Inst A', data_divulgacao: '2026-05-01', candidato: 'Y', percentual: 20 },
  // pesquisa recente (deve vencer)
  { protocolo: 'P2', instituto: 'Inst B', data_divulgacao: '2026-06-19', candidato: 'X', percentual: 33, entrevistas: 800, margem: 3.2 },
  { protocolo: 'P2', instituto: 'Inst B', data_divulgacao: '2026-06-19', candidato: 'Y', percentual: 41 },
  // lacuna (sem percentual) — nunca entra no ranking
  { protocolo: 'P3', instituto: 'Inst C', data_divulgacao: null, campo: 'mai', motivo: 'Suspensa' },
];

describe('pesquisaMaisRecente', () => {
  it('escolhe o protocolo de divulgação mais recente e ordena o ranking desc', () => {
    const r = pesquisaMaisRecente(SERIE);
    expect(r.protocolo).toBe('P2');
    expect(r.instituto).toBe('Inst B');
    expect(r.ranking.map(x => x.candidato)).toEqual(['Y', 'X']); // 41 > 33
    expect(r.entrevistas).toBe(800);
  });
  it('sem ponto com número -> null (no-fabricação)', () => {
    expect(pesquisaMaisRecente([{ protocolo: 'Z', motivo: 'suspensa' }])).toBeNull();
    expect(pesquisaMaisRecente([])).toBeNull();
    expect(pesquisaMaisRecente(null)).toBeNull();
  });
});

describe('resumoPesquisas', () => {
  it('agrega última + contagens de lacuna/aguardando', () => {
    const r = resumoPesquisas({
      serie: SERIE,
      n_pesquisas_com_numero: 2,
      lacunas_suspensas_sem_numero: [{ protocolo: 'P3' }],
      aguardando: [{ protocolo: 'P4' }],
      gerado_em: '2026-06-19T16:06:00',
    });
    expect(r.ultima.protocolo).toBe('P2');
    expect(r.nComNumero).toBe(2);
    expect(r.nLacunas).toBe(1);
    expect(r.aguardando).toHaveLength(1);
  });
  it('serie ausente/ inválida -> null', () => {
    expect(resumoPesquisas(null)).toBeNull();
    expect(resumoPesquisas({})).toBeNull();
  });
});
