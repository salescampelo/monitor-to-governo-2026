// Deep-link de painel por URL (?panel=radar). Adaptado do urlState do monitor-pmto,
// reduzido ao que a majoritaria precisa: SO o painel ativo (este app nao tem os
// filtros de imprensa/cluster do PMTO). Nucleo puro (parsePanel/panelToSearch) p/
// ser testavel em node sem window; wrappers finos tocam window/history.

export const VALID_PANELS = new Set([
  'inteligencia', 'confronto', 'tendencias', 'narrativa', 'imprensa', 'radar',
  'geografia', 'territorio', 'cobertura', 'vices',
]);
export const DEFAULT_PANEL = 'inteligencia';

// search: querystring crua (ex.: '?panel=radar'). Painel invalido/ausente -> default.
export function parsePanel(search) {
  const p = new URLSearchParams(search || '').get('panel');
  return VALID_PANELS.has(p) ? p : DEFAULT_PANEL;
}

// Retorna '' (default, URL limpa) ou '?panel=<id>'.
export function panelToSearch(panel) {
  if (panel === DEFAULT_PANEL || !VALID_PANELS.has(panel)) return '';
  const p = new URLSearchParams();
  p.set('panel', panel);
  return `?${p.toString()}`;
}

export function getPanelFromUrl() {
  return parsePanel(typeof window !== 'undefined' ? window.location.search : '');
}

export function syncPanelToUrl(panel) {
  if (typeof window === 'undefined') return;
  const search = panelToSearch(panel);
  window.history.replaceState({}, '', search || window.location.pathname);
}
