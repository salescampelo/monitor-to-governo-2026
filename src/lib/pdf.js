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
  const rodapeH = 8;
  const w = pageW - margem * 2;
  const h = (canvas.height / canvas.width) * w;   // altura total da imagem em mm
  const utilH = pageH - margem * 2 - rodapeH;     // altura útil por página

  const data = new Date().toLocaleDateString('pt-BR');
  const rodape = (n, total) => {
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(`Gerado em ${data} · Monitor TO Governo 2026 · uso interno  ·  ${n}/${total}`,
      margem, pageH - 4);
  };

  // Conteúdo mais alto que uma página A4 é tilado: a mesma imagem é deslocada
  // para cima a cada página, mostrando a fatia seguinte (sem cortar nada).
  const totalPaginas = Math.max(1, Math.ceil(h / utilH));
  for (let p = 0; p < totalPaginas; p++) {
    if (p > 0) pdf.addPage();
    const offset = margem - p * utilH;
    pdf.addImage(img, 'PNG', margem, offset, w, h);
    // máscara branca cobrindo o que vaza na faixa do rodapé
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, pageH - rodapeH, pageW, rodapeH, 'F');
    rodape(p + 1, totalPaginas);
  }
  pdf.save(nomeArquivo);
}
