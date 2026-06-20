import { useState, useEffect } from 'react';

// Portado do monitor-pmto (verbatim). Sinaliza queda de conexao para o banner
// "SEM CONEXAO" no App, evitando que dados servidos pareçam frescos quando o
// fetch silenciosamente falha offline.
export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
};
