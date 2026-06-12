// Dossiê PDF de um nó DOM (a view de Confronto). NÃO usar em mapas Leaflet.
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportarDossie(node, nomeArquivo = 'confronto.pdf') {
  if (!node) return;
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#FFFFFF', useCORS: true });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margem = 8;
  const w = pageW - margem * 2;
  const h = (canvas.height / canvas.width) * w;
  pdf.addImage(img, 'PNG', margem, margem, w, Math.min(h, pageH - margem * 2 - 8));
  const data = new Date().toLocaleDateString('pt-BR');
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(`Gerado em ${data} · Monitor TO Governo 2026 · uso interno`, margem, pageH - 5);
  pdf.save(nomeArquivo);
}
