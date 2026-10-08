// js/log.js
let logsGlobais = [];
let logsFiltrados = [];

function abrirModalHistorico() {
  document.getElementById('modalHistorico').style.display = 'flex';
  carregarLogAcoes();
}

function fecharModalHistorico() {
  document.getElementById('modalHistorico').style.display = 'none';
}

function carregarLogAcoes() {
  if (!emailUsuario) return;
  mostrarLoading();
  const url = API_URL + '?tipo=logAcoes&email=' + encodeURIComponent(emailUsuario) + '&limite=200';

  jsonp(url, function(resposta) {
    esconderLoading();
    if (resposta && resposta.erro) {
      mostrarToast(resposta.erro, 'error');
      return;
    }
    logsGlobais = Array.isArray(resposta) ? resposta : (resposta.logs || []);
    logsFiltrados = [...logsGlobais];
    renderizarLogAcoes(logsFiltrados);
  });
}

function filtrarListaLogs(lista, termo) {
  termo = (termo || '').trim().toLowerCase();
  if (!termo) return [...lista];
  return lista.filter(log =>
    (log.acao || '').toLowerCase().includes(termo) ||
    (log.usuario || '').toLowerCase().includes(termo) ||
    (log.usuarioNome || '').toLowerCase().includes(termo) ||
    (log.usuarioEscola || '').toLowerCase().includes(termo) ||
    (log.escola || '').toLowerCase().includes(termo) ||
    (log.detalhes || '').toLowerCase().includes(termo)
  );
}

function filtrarLogs() {
  const termo = document.getElementById('buscaHistorico').value;
  logsFiltrados = filtrarListaLogs(logsGlobais, termo);
  renderizarLogAcoes(logsFiltrados);
}

// Exporta o histórico em PDF (mesmo padrão dos outros relatórios do sistema: abre
// a janela de impressão e a pessoa escolhe "Salvar como PDF"). Busca até 1000
// registros (os mais recentes) e respeita o texto digitado no filtro da tela.
function exportarLogsPDF() {
  if (!emailUsuario) return;
  const termo = document.getElementById('buscaHistorico').value.trim();

  // Abre a janela já no clique, para o navegador não bloquear como pop-up
  const janela = window.open('', '_blank');
  if (!janela) {
    mostrarToast('Permita pop-ups neste site para exportar o PDF.', 'warning');
    return;
  }
  janela.document.write('<p style="font-family:Arial;padding:24px;">Gerando PDF...</p>');

  mostrarLoading();
  const url = API_URL + '?tipo=logAcoes&email=' + encodeURIComponent(emailUsuario) + '&limite=1000';

  jsonp(url, function(resposta) {
    esconderLoading();
    if (resposta && resposta.erro) {
      janela.close();
      mostrarToast(resposta.erro, 'error');
      return;
    }
    const todos = Array.isArray(resposta) ? resposta : (resposta.logs || []);
    const logs = filtrarListaLogs(todos, termo);
    if (!logs.length) {
      janela.close();
      mostrarToast('Nenhuma ação para exportar.', 'warning');
      return;
    }

    const agora = new Date().toLocaleString('pt-BR');
    const linhas = logs.map(function(l) {
      const data = l.dataHora ? new Date(l.dataHora).toLocaleString('pt-BR') : '—';
      const usuario = l.usuarioNome
        ? escapar(l.usuarioNome) + '<br><small>' + escapar(l.usuario) + '</small>'
        : (escapar(l.usuario) || '—');
      return '<tr>' +
        '<td class="nowrap">' + data + '</td>' +
        '<td>' + usuario + '</td>' +
        '<td>' + (escapar(l.usuarioEscola) || '—') + '</td>' +
        '<td>' + (escapar(l.acao) || '—') + '</td>' +
        '<td>' + (escapar(l.detalhes) || '—') + '</td>' +
        '</tr>';
    }).join('');

    const html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
      '<title>Histórico de Ações</title><style>' +
      '@page { size: A4 landscape; margin: 12mm; }' +
      'body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; }' +
      'h1 { font-size: 18px; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin: 0 0 8px; }' +
      '.meta { font-size: 11px; color: #475569; margin: 0 0 12px; }' +
      'table { width: 100%; border-collapse: collapse; }' +
      'thead { display: table-header-group; }' +
      'th { background: #1e3a8a; color: #fff; padding: 6px 8px; font-size: 11px; text-align: left; }' +
      'td { padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 10px; vertical-align: top; word-break: break-word; }' +
      'tr { page-break-inside: avoid; }' +
      'tbody tr:nth-child(even) { background: #f8fafc; }' +
      'small { color: #64748b; }' +
      '.nowrap { white-space: nowrap; }' +
      '@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }' +
      '</style></head><body>' +
      '<h1>Histórico de Ações</h1>' +
      '<p class="meta">Gerado em ' + agora + ' por ' + escapar(emailUsuario) +
        ' | ' + logs.length + ' ação(ões)' +
        (termo ? ' | Filtro: &ldquo;' + escapar(termo) + '&rdquo;' : '') +
        ' | Registros mais recentes (até 1.000)</p>' +
      '<table><thead><tr><th>Data/Hora</th><th>Usuário</th><th>Escola</th><th>Ação</th><th>Detalhes</th></tr></thead>' +
      '<tbody>' + linhas + '</tbody></table></body></html>';

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    janela.onload = function() { janela.print(); };
    mostrarToast(logs.length + ' ações no PDF.', 'success');
  });
}

function escapar(txt) {
  return String(txt == null ? '' : txt).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function renderizarLogAcoes(logs) {
  const container = document.getElementById('conteudoLog');
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px; color: var(--text-muted);">Nenhuma ação encontrada.</p>';
    return;
  }

  let html = `<table id="tabelaHistorico">
    <thead>
      <tr>
        <th>Data/Hora</th>
        <th>Usuário</th>
        <th>Escola</th>
        <th>Ação</th>
        <th>Detalhes</th>
      </tr>
    </thead>
    <tbody>`;

  logs.forEach(log => {
    const data = log.dataHora ? new Date(log.dataHora).toLocaleString('pt-BR') : '—';
    const nomeUsuario = log.usuarioNome
      ? `${escapar(log.usuarioNome)}<br><small style="color: var(--text-muted);">${escapar(log.usuario)}</small>`
      : (escapar(log.usuario) || '—');
    html += `<tr>
      <td class="data-hora" data-label="Data/Hora">${data}</td>
      <td data-label="Usuário">${nomeUsuario}</td>
      <td data-label="Escola">${escapar(log.usuarioEscola) || '—'}</td>
      <td data-label="Ação">${escapar(log.acao) || '—'}</td>
      <td class="detalhes" data-label="Detalhes" title="${escapar(log.detalhes)}">${escapar(log.detalhes) || '—'}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Log automático via registrarUltimaAcao (opcional)
function registrarLogNoServidor(acao, detalhes, escola) {
  if (!emailUsuario) return;
  postSemResposta({
    acao: 'registrarLogAcao',
    email: emailUsuario,
    acaoLog: acao,
    detalhes: detalhes || '',
    escola: escola || ''
  }, null);
}

if (typeof registrarUltimaAcao === 'function') {
  const _original = registrarUltimaAcao;
  registrarUltimaAcao = function(descricao, detalhes, escola) {
    _original(descricao);
    registrarLogNoServidor(descricao, detalhes, escola);
  };
}
