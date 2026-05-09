import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase.js';
import { fetchJ, URLS } from './lib/fetch.js';
import { CONFIG } from './lib/config.js';
import { CSS, useWW, PanelSkeleton } from './components/ui.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import AppHeader from './components/AppHeader.jsx';
import InteligenciaCompetitivaPanel from './panels/InteligenciaCompetitivaPanel.jsx';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [userEmail, setUserEmail] = useState(null);
  const [adversariosData, setAdversariosData] = useState(null);
  const [advMentionsData, setAdvMentionsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useWW() < 768;

  useEffect(() => {
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
      const [adv, advM] = await Promise.all([
        fetchJ(URLS.adversarios),
        fetchJ(URLS.adversariosMentions),
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
        totalCandidatos={headerMetrics.totalCandidatos}
        engajamentoMedio={headerMetrics.engajamentoMedio}
        imprensa48h={headerMetrics.imprensa48h}
        crises={headerMetrics.crises}
      />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 40px' }}>
        {adversariosData ? (
          <InteligenciaCompetitivaPanel
            adversariosData={adversariosData}
            advMentionsData={advMentionsData}
          />
        ) : (
          <PanelSkeleton rows={8} />
        )}
      </main>
    </div>
  );
}
