// js/termo.js
let arquivoTermoSelecionado = null;

function validarArquivoTermo(input) {
  const file = input.files[0];
  const statusEl = document.getElementById('statusUploadTermo') || document.getElementById('statusUploadTermoRecusado');
  if (!file) {
    if (statusEl) statusEl.innerHTML = '';
    arquivoTermoSelecionado = null;
    return;
  }
  if (file.type !== 'application/pdf') {
    if (statusEl) statusEl.innerHTML = '<span style="color: #ef4444;">Apenas arquivos PDF são aceitos.</span>';
    input.value = '';
    arquivoTermoSelecionado = null;
    return;
  }
  if (statusEl) statusEl.innerHTML = `<span style="color: #10b981;">Arquivo selecionado: ${file.name}</span>`;
  arquivoTermoSelecionado = file;
}

async function enviarConsentimentoETermo() {
  if (!document.getElementById('aceiteLgpd').checked) {
    mostrarToast('Você precisa aceitar a Política de Privacidade.', 'warning');
    return;
  }
  if (!document.getElementById('aceiteTermo').checked) {
    mostrarToast('Você precisa aceitar o Termo de Compromisso.', 'warning');
    return;
  }
  if (!arquivoTermoSelecionado) {
    mostrarToast('Envie o Termo de Compromisso preenchido e assinado.', 'warning');
    return;
  }

  const btn = document.getElementById('btnEnviarConsentimento');
  showButtonLoading(btn);

  try {
    let ip = 'N/A';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch(e) {}

    await new Promise(resolve => {
      postSemResposta({
        acao: 'registrarConsentimento',
        email: emailUsuario,
        versao: '1.0',
        ip
      }, null, () => resolve());
    });

    const base64 = await lerArquivoBase64(arquivoTermoSelecionado);
    await new Promise(resolve => {
      postSemResposta({
        acao: 'uploadTermoCompromisso',
        email: emailUsuario,
        fileBase64: base64
      }, null, () => resolve());
    });

        // Fecha o modal de consentimento
    document.getElementById('modalConsentimento').style.display = 'none';

    // Exibe o toast de confirmação
    mostrarToast('Documentos enviados com sucesso! Você receberá um e‑mail quando o acesso for aprovado.', 'success', 0);
    
    // Faz logout (volta para a tela de login)
    logout();

  } catch (e) {
    console.error(e);
    mostrarToast('Erro ao enviar documentos. Tente novamente.', 'error');
  } finally {
    hideButtonLoading(btn);
  }
}


// ---------- Administrador ----------
function abrirModalAprovacaoTermos() {
  if (emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') {
    mostrarToast('Apenas Administrador.', 'error');
    return;
  }
  document.getElementById('modalAprovacaoTermos').style.display = 'flex';
  carregarListaTermos();
}

function fecharModalAprovacaoTermos() {
  document.getElementById('modalAprovacaoTermos').style.display = 'none';
}

function carregarListaTermos() {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=listarTermos&email=${encodeURIComponent(emailUsuario)}`, function(termos) {
    esconderLoading();
    renderizarListaTermos(termos);
  });
}

function renderizarListaTermos(termos) {
  const container = document.getElementById('listaTermosContainer');
  if (!container) return;
  if (!termos || termos.length === 0) {
    container.innerHTML = '<p>Nenhum termo pendente.</p>';
    return;
  }
  let html = '<table style="width:100%; border-collapse:collapse; font-size:14px;">';
  html += '<thead><tr><th>Usuário</th><th>Data Envio</th><th>Status</th><th>Arquivo</th><th>Ações</th></tr></thead><tbody>';
  termos.forEach(t => {
    html += `<tr>
      <td>${t.email}</td>
      <td>${t.dataEnvio ? new Date(t.dataEnvio).toLocaleString('pt-BR') : ''}</td>
      <td>${t.status}</td>
      <td><a href="${t.viewUrl}" target="_blank">Visualizar</a></td>
      <td>`;
    if (t.status === 'pendente') {
      html += `<button class="btn-pequeno" onclick="aprovarTermo('${t.email}')">Aprovar</button>
               <button class="btn-pequeno" onclick="recusarTermo('${t.email}')">Recusar</button>`;
    }
    html += `</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function aprovarTermo(emailAlvo) {
  if (!confirm(`Aprovar termo de ${emailAlvo}?`)) return;
  const botoes = document.querySelectorAll(`button[onclick*="${emailAlvo}"]`);
  botoes.forEach(btn => { if (btn.textContent.includes('Aprovar')) btn.disabled = true; });

  postSemResposta({
    acao: 'aprovarTermo',
    emailAdmin: emailUsuario,
    emailAlvo: emailAlvo,
    decisao: 'aprovar'
  }, 'Termo aprovado! E-mail enviado ao usuário.', () => {
    carregarListaTermos();
  });
  setTimeout(() => carregarListaTermos(), 1500);
}

function recusarTermo(emailAlvo) {
  const motivo = prompt('Motivo da recusa (opcional):');
  if (motivo === null) return;
  const botoes = document.querySelectorAll(`button[onclick*="${emailAlvo}"]`);
  botoes.forEach(btn => { if (btn.textContent.includes('Recusar')) btn.disabled = true; });

  postSemResposta({
    acao: 'aprovarTermo',
    emailAdmin: emailUsuario,
    emailAlvo: emailAlvo,
    decisao: 'recusar',
    obs: motivo || ''
  }, 'Termo recusado.', () => {
    carregarListaTermos();
  });
  setTimeout(() => carregarListaTermos(), 1500);
}

// Auxiliar base64 (se não existir)
function lerArquivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function exibirTelaRecusado(motivo) {
  // Esconde a tela de espera e garante que o app esteja visível
  const msgEspera = document.getElementById('mensagemEspera');
  if (msgEspera) msgEspera.style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Remove a tela de espera padrão e injeta a interface de reenvio
  let tela = document.getElementById('telaTermoRecusado');
  if (!tela) {
    tela = document.createElement('div');
    tela.id = 'telaTermoRecusado';
    tela.style.cssText = 'text-align:center; padding:40px 20px; max-width:500px; margin:0 auto;';
    document.getElementById('app').appendChild(tela);
  }
  tela.style.display = 'block';
  tela.innerHTML = `
    <h2 style="color:#dc2626;"><i class="fas fa-exclamation-triangle"></i> Termo Recusado</h2>
    <p style="color: var(--text-secondary);">Seu termo de compromisso foi recusado pelo supervisor.</p>
    ${motivo ? `<p style="background:#fee2e2; padding:12px; border-radius:8px; color:#991b1b;"><strong>Motivo:</strong> ${motivo}</p>` : ''}
    <p style="color: var(--text-muted);">Por favor, corrija os apontamentos e reenvie o arquivo corrigido.</p>
    <div style="margin-top: 24px;">
      <input type="file" id="novoArquivoTermo" accept=".pdf" onchange="validarArquivoTermo(this)" style="display:block; margin: 0 auto 16px;">
      <p id="statusUploadTermoRecusado" style="font-size:13px; color: var(--text-muted);"></p>
      <button class="btn-salvar" id="btnReenviarTermo" onclick="reenviarTermo()">
        <i class="fas fa-paper-plane"></i> Reenviar Termo Corrigido
      </button>
      <button class="btn-cancelar" onclick="logout()" style="margin-top: 12px;">Sair</button>
    </div>
  `;
}

function reenviarTermo() {
  const fileInput = document.getElementById('novoArquivoTermo');
  const file = fileInput.files[0];
  if (!file) {
    mostrarToast('Selecione o arquivo PDF corrigido.', 'warning');
    return;
  }
  if (file.type !== 'application/pdf') {
    mostrarToast('Apenas arquivos PDF são aceitos.', 'warning');
    return;
  }

  const btn = document.getElementById('btnReenviarTermo');
  showButtonLoading(btn);

  lerArquivoBase64(file).then(base64 => {
    postSemResposta({
      acao: 'uploadTermoCompromisso',
      email: emailUsuario,
      fileBase64: base64
    }, null, () => {
      hideButtonLoading(btn);
      mostrarToast('Termo reenviado com sucesso! Aguardando nova avaliação.', 'success');
      // Volta para a tela de espera (verificação de status)
      verificarStatusTermoEAcessar();
    });
  }).catch(() => {
    mostrarToast('Erro ao ler o arquivo.', 'error');
    hideButtonLoading(btn);
  });
}
