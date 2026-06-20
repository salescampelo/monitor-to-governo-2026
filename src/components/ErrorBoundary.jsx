import React from 'react';

// Portado do monitor-pmto, recolorido para a paleta da majoritaria (#0B3D91) e
// sem prop-types (nao e dependencia deste repo). Isola a falha de um painel para
// que um throw nao derrube o shell inteiro — pareado com Suspense no SafePanel.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', background: '#fef2f2', borderRadius: 8, margin: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#991b1b', marginBottom: 8 }}>Erro ao carregar painel</h2>
          <p style={{ color: '#7f1d1d', marginBottom: 16 }}>
            {this.state.error?.message || 'Ocorreu um erro inesperado'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ padding: '10px 20px', background: '#0B3D91', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
          >
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
