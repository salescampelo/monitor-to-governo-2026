// CSV zero-dependência. toCSV é puro/testável; baixarCSV toca o DOM.
function escapar(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(rows, headers) {
  const head = headers.map(escapar).join(',');
  const body = rows.map(r => headers.map(h => escapar(r[h])).join(',')).join('\n');
  return body ? head + '\n' + body : head;
}

export function baixarCSV(nomeArquivo, rows, headers) {
  const conteudo = toCSV(rows, headers);
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
