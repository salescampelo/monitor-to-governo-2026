import { supabase } from './supabase.js';

const DATA_BASE = '/api/data';

export const URLS = {
  adversarios:         `${DATA_BASE}/adversarios.json`,
  adversariosMentions: `${DATA_BASE}/adversarios_mentions.json`,
  // social_metrics.json NÃO é exposto: hoje tem 1 só data de coleta (usá-lo como série
  // fabricaria tendência). A série real de seguidores/engajamento vive em historico.json
  // e é plotada por TendenciasPanel. Religar como 2ª fonte só com >=2 datas acumuladas.
  vices:               `${DATA_BASE}/vices_config.json`,
  geoElectoral:        `${DATA_BASE}/geo_electoral.json`,
  territorioIndicadores: `${DATA_BASE}/territorio_indicadores.json`,
  territorioSeries:      `${DATA_BASE}/territorio_series.json`,
  territorioVulnerabilidade: `${DATA_BASE}/territorio_vulnerabilidade.json`,
  emendaRoi:           `${DATA_BASE}/emenda_roi_municipio.json`,
  radar:               `${DATA_BASE}/radar_vulnerabilidade.json`,
  vetores:             `${DATA_BASE}/vetores_processuais.json`,
  dataQuality:         `${DATA_BASE}/data_quality.json`,
  historico:           `${DATA_BASE}/historico.json`,
  pesquisas:           `${DATA_BASE}/pesquisas_serie_governador.json`,
  narrativa:           `${DATA_BASE}/narrativa_movimento.json`,
};

const FETCH_TIMEOUT = 10000;
const SESSION_EXPIRED = 'Sessão expirada. Faça login novamente.';

export const fetchJ = async (u) => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  const attempt = async (isRetry = false) => {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

    if (sessionErr || !session?.access_token) {
      if (!isRetry) {
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && refreshed.session) return attempt(true);
      }
      throw new Error(SESSION_EXPIRED);
    }

    const base = typeof location !== 'undefined' ? location.origin : 'http://localhost';
    const url = new URL(u, base);
    url.searchParams.set('t', Date.now());
    const r = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (r.status === 401 && !isRetry) {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshed.session) return attempt(true);
      throw new Error(SESSION_EXPIRED);
    }

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  try {
    return await attempt();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[fetchJ] Timeout em ${u}`);
      return null;
    }
    if (err.message === SESSION_EXPIRED) throw err;
    console.error(`[fetchJ] Erro em ${u}:`, err.message);
    return null;
  } finally {
    clearTimeout(tid);
  }
};
