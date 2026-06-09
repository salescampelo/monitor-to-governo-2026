import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase.js';
import { fetchJ, URLS } from './lib/fetch.js';
import { CONFIG } from './lib/config.js';
import { CSS, PanelSkeleton } from './components/ui.jsx';
import { useWW } from './lib/ui-helpers.js';
import LoginScreen from './components/LoginScreen.jsx';
import AppHeader from './components/AppHeader.jsx';
import InteligenciaCompetitivaPanel from './panels/InteligenciaCompetitivaPanel.jsx';
import VicesPanel from './panels/VicesPanel.jsx';
import GeografiaPanel from './panels/GeografiaPanel.jsx';
import RadarPanel from './panels/RadarPanel.jsx';
import CoberturaPanel from './panels/CoberturaPanel.jsx';
import { Target, Users, MapPin, Radar, ShieldCheck } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [userEmail, setUserEmail] = useState(null);
  const [adversariosData, setAdversariosData] = useState(null);
  const [advMentionsData, setAdvMentionsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activePanel, setActivePanel] = useState('inteligencia');
  const isMobile = useWW() < 768;

  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot DEV-only session bootstrap on mount; intentional
      setSession({ dev: true });
      setUserEmail('dev@localhost');
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setUserEmail(s.user?.email);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetcher = import.meta.env.DEV
        ? (u) => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null)
        : fetchJ;
      const [adv, advM] = await Promise.all([
        fetcher(URLS.adversarios),
        fetcher(URLS.adversariosMentions),
      ]);
      if (adv) setAdversariosData(adv);
      if (advM) setAdvMentionsData(advM);
    } catch (err) {
      if (err.message?.includes('Sessão expirada')) {
        await supabase.auth.signOut();
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intended data-fetch effect; loadData sets loading/data state on mount and session change
    if (session) loadData();
  }, [session, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdversariosData(null);
    setAdvMentionsData(null);
  };

  const daysToElection = useMemo(() => {
    const election = new Date(CONFIG.ELECTION_DATE);
    const now = new Date();
    return Math.ceil((election - now) / (1000 * 60 * 60 * 24));
  }, []);

  const headerMetrics = useMemo(() => {
    const ranking = adversariosData?.ranking || [];
    const totalCandidatos = ranking.length || 8;
    const engajamentoMedio = ranking.length > 0
      ? ranking.reduce((sum, r) => sum + (r.taxa_engajamento_pct || 0), 0) / ranking.length
      : 0;

    let imprensa48h = 0;
    if (advMentionsData?.candidatos) {
      // eslint-disable-next-line react-hooks/purity -- Date.now() needed for the rolling 48h press window; recomputed when mention data changes
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      Object.values(advMentionsData.candidatos).forEach(c => {
        (c.mentions || []).forEach(m => {
          if (m.captured_at && new Date(m.captured_at) >= cutoff) imprensa48h++;
        });
      });
    }

    return { totalCandidatos, engajamentoMedio, imprensa48h, crises: 0 };
  }, [adversariosData, advMentionsData]);

  if (session === undefined) return null;
  if (!session) return <><style>{CSS}</style><LoginScreen /></>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8F7F4)' }}>
      <style>{CSS}</style>
      <AppHeader
        isMobile={isMobile}
        refreshing={refreshing}
        handleRefresh={loadData}
        userEmail={userEmail}
        onLogout={handleLogout}
        lastUpdate={adversariosData?.data_atualizacao}
        daysToElection={daysToElection}
        raceOffice={adversariosData?.cargo || 'Governador'}
        raceState={adversariosData?.estado || 'Tocantins'}
        raceYear={adversariosData?.eleicao?.slice(0, 4) || '2026'}
        totalCandidatos={headerMetrics.totalCandidatos}
        engajamentoMedio={headerMetrics.engajamentoMedio}
        imprensa48h={headerMetrics.imprensa48h}
        crises={headerMetrics.crises}
      />
      <main style={{ maxWidth: 1600, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 40px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'inteligencia', label: 'Inteligência Competitiva', icon: Target },
            { key: 'radar', label: 'Radar', icon: Radar },
            { key: 'geografia', label: 'Geografia', icon: MapPin },
            { key: 'cobertura', label: 'Cobertura', icon: ShieldCheck },
            { key: 'vices', label: 'Vices', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
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

        {activePanel === 'inteligencia' && (
          adversariosData ? (
            <InteligenciaCompetitivaPanel
              adversariosData={adversariosData}
              advMentionsData={advMentionsData}
            />
          ) : (
            <PanelSkeleton rows={8} />
          )
        )}
        {activePanel === 'radar' && <RadarPanel />}
        {activePanel === 'geografia' && <GeografiaPanel />}
        {activePanel === 'cobertura' && <CoberturaPanel />}
        {activePanel === 'vices' && <VicesPanel />}
      </main>
    </div>
  );
}
