import { describe, it, expect } from 'vitest';
import { parsePanel, panelToSearch, DEFAULT_PANEL, VALID_PANELS } from '../src/lib/urlState.js';

describe('parsePanel', () => {
  it('aceita painel válido', () => {
    expect(parsePanel('?panel=radar')).toBe('radar');
    expect(parsePanel('?panel=territorio')).toBe('territorio');
  });
  it('painel inválido ou ausente -> default', () => {
    expect(parsePanel('?panel=hackerzinho')).toBe(DEFAULT_PANEL);
    expect(parsePanel('')).toBe(DEFAULT_PANEL);
    expect(parsePanel('?foo=bar')).toBe(DEFAULT_PANEL);
  });
  it('todas as 9 abas são reconhecidas', () => {
    expect(VALID_PANELS.size).toBe(9);
    for (const p of VALID_PANELS) expect(parsePanel(`?panel=${p}`)).toBe(p);
  });
});

describe('panelToSearch', () => {
  it('default -> querystring vazia (URL limpa)', () => {
    expect(panelToSearch(DEFAULT_PANEL)).toBe('');
  });
  it('painel não-default -> ?panel=<id>', () => {
    expect(panelToSearch('vices')).toBe('?panel=vices');
  });
  it('painel inválido -> vazio (não escreve lixo na URL)', () => {
    expect(panelToSearch('xyz')).toBe('');
  });
  it('round-trip: parse(panelToSearch(x)) === x', () => {
    for (const p of VALID_PANELS) expect(parsePanel(panelToSearch(p) || '')).toBe(p);
  });
});
