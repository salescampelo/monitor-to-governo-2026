// Helpers puros do movimento de narrativa (narrativa_movimento.json). Testaveis.

// Tom liquido [-1,1] -> rotulo + cor. Limiar 0.2 evita rotular ruido como tendencia.
export function tomLabel(tom) {
  if (tom == null) return { label: 'Sem dado', color: '#94a3b8' };
  if (tom <= -0.2) return { label: 'Narrativa adversa', color: '#ef4444' };
  if (tom >= 0.2)  return { label: 'Narrativa favorável', color: '#22c55e' };
  return { label: 'Narrativa neutra', color: '#6B7280' };
}

// {positivo,negativo,neutro} -> percentuais (0..100) que somam ~100. Total 0 -> zeros.
export function sentimentoPct(s) {
  const pos = s?.positivo || 0, neg = s?.negativo || 0, neu = s?.neutro || 0;
  const total = pos + neg + neu;
  if (!total) return { pos: 0, neg: 0, neu: 0, total: 0 };
  return {
    pos: (pos / total) * 100,
    neg: (neg / total) * 100,
    neu: (neu / total) * 100,
    total,
  };
}

export const nivelCor = (nivel) =>
  nivel === 'critico' ? '#ef4444' : nivel === 'alerta' ? '#f59e0b' : '#6B7280';
