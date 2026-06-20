import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase.js';
import { fetchJ, URLS } from './lib/fetch.js';
import { CONFIG } from './lib/config.js';
import { CSS, PanelSkeleton } from './components/ui.jsx';
import { useWW } from './lib/ui-helpers.js';
import { useOffline } from './lib/useOffline.js';
import { useAutoRefresh } from './lib/useAutoRefresh.js';
import { getPanelFromUrl, syncPanelToUrl } from './lib/urlState.js';
import { computeHeaderMetrics } from './lib/headerMetrics.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import AppHeader from './components/AppHeader.jsx';
import BottomNav from './components/BottomNav.jsx';
import EstadoCorridaFaixa from './components/EstadoCorridaFaixa.jsx';
import InteligenciaCompetitivaPanel from './panels/InteligenciaCompetitivaPanel.jsx';
import VicesPanel from './panels/VicesPanel.jsx';
import GeografiaPanel from './panels/GeografiaPanel.jsx';
import RadarPanel from './panels/RadarPanel.jsx';
import CoberturaPanel from './panels/CoberturaPanel.jsx';
import TerritorioPanel from './panels/TerritorioPanel.jsx';
import NarrativaPanel from './panels/NarrativaPanel.jsx';
import ImprensaPanel from './panels/ImprensaPanel.jsx';
import { Target, Users, MapPin, Radar, ShieldCheck, Map as MapaIcon, GitCompare, TrendingUp, MessageSquareText, Newspaper } from 'lucide-react';

// Lazy: ConfrontoPanel/TendenciasPanel puxam recharts (~grande). Code-split mantém-nos
// fora do bundle principal — só baixam quando a aba é aberta.
const ConfrontoPanel = lazy(() => import('./panels/ConfrontoPanel.jsx'));
const TendenciasPanel = lazy(() => import('./panels/TendenciasPanel.jsx'));

// Fase A — isola a falha de um painel (ErrorBoundary) e cobre o lazy-load (Suspense).
const SafePanel = ({ children }) => (
  <ErrorBoundary><Suspense fallback={<PanelSkeleton rows={8} />}>{children}</Suspense></ErrorBoundary>
);

const TABS = [
  { key: 'inteligencia', label: 'Inteligência Competitiva', icon: Target },
  { key: 'confronto',    label: 'Confronto',  icon: GitCompare },
  { key: 'tendencias',   label: 'Tendências', icon: TrendingUp },
  { key: 'narrativa',    label: 'Narrativa',  icon: MessageSquareText },
  { key: 'imprensa',     label: 'Imprensa',   icon: Newspaper },
  { key: 'radar',        label: 'Radar',      icon: Radar },
  { key: 'geografia',    label: 'Geografia',  icon: MapPin },
  { key: 'territorio',   label: 'Território', icon: MapaIcon },
  { key: 'cobertura',    label: 'Cobertura',  icon: ShieldCheck },
  { key: 'vices',        label: 'Vices',      icon: Users },
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [userEmail, setUserEmail] = useState(null);
  const [adversariosData, setAdversariosData] = useState(null);
  const [advMentionsData, setAdvMentionsData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [pesquisasData, setPesquisasData] = useState(null);
  const [narrativaData, setNarrativaData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activePanel, setActivePanel] = useState(() => getPanelFromUrl()); // Fase C: hidrata do deep-link
  const isMobile = useWW() < 768;
  const isOffline = useOffline();

  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot DEV-only session bootstrap on mount; intentional
      setSession({ dev: true });
      setUserEmail('dev@localhost');
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if (s) setUserEmail(s.user?.email ?? null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setUserEmail(s.user?.email);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fase F: único carregador eager, com a bifurcação DEV/fetchJ centralizada e modo
  // {silent} (auto-refresh sem spinner). Inclui o radar (Fase B) no mesmo Promise.all.
  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const fetcher = import.meta.env.DEV
        ? (u) => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null)
        : fetchJ;
      const [adv, advM, radar, pesq, narr] = await Promise.all([
        fetcher(URLS.adversarios),
        fetcher(URLS.adversariosMentions),
        fetcher(URLS.radar),
        fetcher(URLS.pesquisas),
        fetcher(URLS.narrativa),
      ]);
      if (adv) setAdversariosData(adv);
      if (advM) setAdvMentionsData(advM);
      if (radar) setRadarData(radar);
      if (pesq) setPesquisasData(pesq);
      if (narr) setNarrativaData(narr);
    } catch (err) {
      if (err.message?.includes('Sessão expirada')) {
        await supabase.auth.signOut();
      }
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intended data-fetch effect; loadData sets data state on mount and session change
    if (session) loadData();
  }, [session, loadData]);

  // Fase C: painel ativo -> URL (deep-link compartilhável; back/refresh preserva a aba).
  useEffect(() => { syncPanelToUrl(activePanel); }, [activePanel]);

  // Fase C: auto-refresh silencioso a cada 30 min (toggle persistido em localStorage).
  const refreshSilent = useCallback(() => loadData({ silent: true }), [loadData]);
  const handleRefresh = useCallback(() => loadData({ silent: false }), [loadData]);
  const { enabled: autoRefreshEnabled, setEnabled: setAutoRefresh } = useAutoRefresh(refreshSilent, 30);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdversariosData(null);
    setAdvMentionsData(null);
    setRadarData(null);
    setPesquisasData(null);
    setNarrativaData(null);
  };

  const daysToElection = useMemo(() => {
    const election = new Date(CONFIG.ELECTION_DATE);
    const now = new Date();
    return Math.ceil((election - now) / (1000 * 60 * 60 * 24));
  }, []);

  // Fase B: métricas do header derivadas de feeds reais (pura; ver lib/headerMetrics.js).
  const headerMetrics = useMemo(
    () => computeHeaderMetrics(adversariosData, advMentionsData, radarData),
    [adversariosData, advMentionsData, radarData],
  );

  // Fase D: idade da última coleta — usa data_atualizacao do adversarios / updated_at do
  // radar (ambos SINCRONIZADOS pela monitor.yml; não derivar dos snapshots manuais de geo).
  const dataAgeHours = useMemo(() => {
    const raw = adversariosData?.data_atualizacao || radarData?.updated_at;
    if (!raw) return null;
    const p = String(raw).split(/[- :]/);
    const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1, p[3] || 0, p[4] || 0);
    // eslint-disable-next-line react-hooks/purity -- Date.now() necessário para a idade da coleta; recomputa quando os feeds mudam
    return isNaN(d) ? null : Math.max(0, (Date.now() - d.getTime()) / 3600000);
  }, [adversariosData, radarData]);

  if (session === undefined) return null;
  if (!session) return <><style>{CSS}</style><LoginScreen /></>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8F7F4)' }}>
      <style>{CSS}</style>
      {isOffline && (
        <div role="alert" style={{ background: '#b91c1c', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '6px 16px', letterSpacing: '0.05em' }}>
          SEM CONEXÃO — os dados exibidos podem estar desatualizados
        </div>
      )}
      <AppHeader
        isMobile={isMobile}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
        userEmail={userEmail}
        onLogout={handleLogout}
        lastUpdate={adversariosData?.data_atualizacao}
        daysToElection={daysToElection}
        raceOffice={adversariosData?.cargo || 'Governador'}
        raceState={adversariosData?.estado || 'Tocantins'}
        raceYear={adversariosData?.eleicao?.slice(0, 4) || '2026'}
        totalCandidatos={headerMetrics.totalCandidatos}
        adversarioEmAlta={headerMetrics.adversarioEmAlta}
        imprensa48h={headerMetrics.imprensa48h}
        vulnerabsCriticas={headerMetrics.vulnerabsCriticas}
        dataAgeHours={dataAgeHours}
        autoRefreshEnabled={autoRefreshEnabled}
        setAutoRefresh={setAutoRefresh}
      />
      <main style={{ maxWidth: 1600, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 40px', paddingBottom: isMobile ? 80 : undefined }}>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActivePanel(key)}
                aria-current={activePanel === key ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: activePanel === key ? '1.5px solid #0B3D91' : '1.5px solid rgba(26,39,68,0.15)',
                  background: activePanel === key ? 'rgba(11,61,145,0.1)' : 'rgba(26,39,68,0.04)',
                  color: activePanel === key ? '#0B3D91' : '#5A6478',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {activePanel === 'inteligencia' && (
          <SafePanel>
            <EstadoCorridaFaixa pesquisasData={pesquisasData} />
            {adversariosData
              ? <InteligenciaCompetitivaPanel adversariosData={adversariosData} advMentionsData={advMentionsData} />
              : <PanelSkeleton rows={8} />}
          </SafePanel>
        )}
        {activePanel === 'confronto'  && <SafePanel><ConfrontoPanel adversariosData={adversariosData} advMentionsData={advMentionsData} /></SafePanel>}
        {activePanel === 'tendencias' && <SafePanel><TendenciasPanel /></SafePanel>}
        {activePanel === 'narrativa'  && <SafePanel><NarrativaPanel narrativaData={narrativaData} /></SafePanel>}
        {activePanel === 'imprensa'   && <SafePanel><ImprensaPanel advMentionsData={advMentionsData} /></SafePanel>}
        {activePanel === 'radar'      && <SafePanel><RadarPanel /></SafePanel>}
        {activePanel === 'geografia'  && <SafePanel><GeografiaPanel /></SafePanel>}
        {activePanel === 'territorio' && <SafePanel><TerritorioPanel /></SafePanel>}
        {activePanel === 'cobertura'  && <SafePanel><CoberturaPanel /></SafePanel>}
        {activePanel === 'vices'      && <SafePanel><VicesPanel /></SafePanel>}
      </main>

      {isMobile && <BottomNav activePanel={activePanel} setActivePanel={setActivePanel} />}
    </div>
  );
}
