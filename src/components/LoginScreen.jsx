import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { checkRateLimit, recordAttempt, clearAttempts } from '../lib/rateLimit.js';

const CSS_LOGIN = `
  @keyframes blob-float {
    0%,100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-18px) scale(1.04); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .login-input {
    width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px; padding: 12px 16px 12px 44px; color: #fff; font-size: 14px;
    outline: none; box-sizing: border-box; transition: border-color 0.15s; font-family: inherit;
  }
  .login-input::placeholder { color: rgba(255,255,255,0.3); }
  .login-input:focus { border-color: rgba(11,61,145,0.6); }
  .login-btn {
    width: 100%; padding: 13px; background: #0B3D91; border: none; border-radius: 10px;
    color: #fff; font-size: 14px; font-weight: 800; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.15s, transform 0.1s; font-family: inherit;
  }
  .login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .login-btn:disabled { opacity: 0.6; cursor: wait; }
`;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    const { allowed, retryAfterSec } = checkRateLimit(email);
    if (!allowed) {
      setError(`Muitas tentativas. Aguarde ${Math.ceil(retryAfterSec / 60)} min.`);
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        recordAttempt(email);
        setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : 'Erro ao entrar.');
      } else {
        clearAttempts(email);
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B3D91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", padding: 20, position: 'relative', overflow: 'hidden' }}>
      <style>{CSS_LOGIN}</style>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%)', top: -120, right: -80, animation: 'blob-float 11s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '14px 16px', marginBottom: 20 }}>
            <ShieldAlert size={36} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
            Inteligência Eleitoral<span style={{ color: 'rgba(255,255,255,0.5)' }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Governo do Tocantins · 2026
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '28px 28px 24px', backdropFilter: 'blur(12px)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 20px' }}>Acesso restrito</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              <input className="login-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              <input className="login-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error && (
              <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
              </div>
            )}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Entrando...</> : <><LogIn size={15} /> Entrar</>}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>Acesso restrito a usuários autorizados.</p>
      </div>
    </div>
  );
}
