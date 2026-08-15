let ultimaAcao = null;
let atosSelecionados = new Set();
let nomeUsuario = "";
// =========================
// COMUNICAÇÃO COM A PLANILHA (GOOGLE SHEETS VIA API)
// =========================

// Flag para evitar loop de eventos no filtro de turma
let bloqueiaChangeTurma = false;
let metricasOriginais = null;
let ordenacaoAtual = { campo: null, direcao: 'asc' }; // 'asc' ou 'desc'
// ------ ALUNOS ------
// ------ ALUNOS ------
// ------ ALUNOS ------
async function carregarAlunos(pagina = 1, filtros = {}) {
  continuarCarregamentoAlunos(pagina, filtros);
}

function continuarCarregamentoAlunos(pagina, filtros) {
  mostrarLoading();
  
  let url = `${API_URL}?email=${emailUsuario}&pagina=${pagina}&limite=${alunosPorPagina}`;
  if (filtros.escola) url += `&escola=${encodeURIComponent(filtros.escola)}`;
  if (filtros.turma) url += `&turma=${encodeURIComponent(filtros.turma)}`;
  if (filtros.nome) url += `&nome=${encodeURIComponent(filtros.nome)}`;
  if (filtros.status) url += `&status=${encodeURIComponent(filtros.status)}`;
  if (filtros.situacao) url += `&situacao=${encodeURIComponent(filtros.situacao)}`;
  
  jsonp(url, function(dados) {
    esconderLoading();

    // 🔒 Tratamento do erro de termo (mantém na tela de login)
    if (dados.erro === "termo_pendente") {
      esconderLoading();

      if (dados.status === 'pendente' || dados.status === 'recusado') {
        document.getElementById('app').style.display = 'none';
        document.getElementById('login').style.display = '';
        const mensagem = dados.status === 'pendente'
          ? 'Seu termo de compromisso ainda não foi aprovado. Você receberá um e‑mail quando o acesso for liberado.'
          : 'Seu termo de compromisso foi recusado. Entre em contato com a SRE.';
        exibirMensagemLogin(mensagem);
      } else {
        document.getElementById('login').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('modalConsentimento').style.display = 'flex';
        document.getElementById('arquivoTermo').value = '';
        document.getElementById('statusUploadTermo').innerHTML = '';
        if (typeof arquivoTermoSelecionado !== 'undefined') arquivoTermoSelecionado = null;
      }
      return;
    }

    if (dados.erro) {
      if (dados.erro === "sessao_expirada") {
        localStorage.removeItem("emailUsuario");
        emailUsuario = "";
        esconderLoading();
        esconderSplash();
        document.getElementById("app").style.display = "none";
        document.getElementById("login").style.display = "";
        mostrarToast("Sessão expirada. Faça login novamente.", "error");
        return;
      } else {
        esconderLoading();
        mostrarToast("Erro de conexão. Tente novamente.", "warning");
        return;
      }
    }

    if (dados.escolasSupervisionadas) {
      window.escolasSupervisionadas = dados.escolasSupervisionadas;
    } else {
      window.escolasSupervisionadas = [];
    }

    // Preencher select de histórico de visitas
    const selectHistoricoEscola = document.getElementById('historicoFiltroEscola');
    if (selectHistoricoEscola) {
      selectHistoricoEscola.innerHTML = '<option value="">Todas as escolas</option>';
      const escolas = getEscolasPermitidas();
      escolas.forEach(esc => selectHistoricoEscola.appendChild(new Option(esc, esc)));
    }

    perfilUsuario = dados.perfil;
    const perfilSpan = document.getElementById('perfilUsuarioTexto');
    if (perfilSpan) {
        let nomePerfil = '';
        switch (perfilUsuario) {
            case 'SUPERVISOR':
                nomePerfil = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br') ? 'Administrador' : 'Supervisor';
                break;
            case 'SECRETARIA':
                nomePerfil = 'Secretaria';
                break;
            case 'PEDAGOGICO':
                nomePerfil = 'Pedagógico';
                break;
            case 'DIRETOR':
                nomePerfil = 'Diretor';
                break;
            default:
                nomePerfil = perfilUsuario;
        }
        perfilSpan.textContent = nomePerfil;
    }
    document.body.classList.remove('perfil-supervisor', 'perfil-secretaria');
    document.body.classList.add(perfilUsuario === 'SUPERVISOR' ? 'perfil-supervisor' : 'perfil-secretaria');
    escolaUsuario = dados.escola;
    const nomeEscolaHeader = document.getElementById('nomeEscolaHeader');
    if (nomeEscolaHeader) {
      if (perfilUsuario === 'SUPERVISOR') {
        nomeEscolaHeader.textContent = 'SRE Afonso Cláudio';
      } else {
        nomeEscolaHeader.textContent = escolaUsuario || 'Escola';
      }
    }

    const nomeSpan = document.getElementById("nomeUsuarioTexto");
    if (nomeSpan) nomeSpan.textContent = nomeUsuario;


    const emailSpan = document.getElementById("emailUsuarioTexto");
    if (emailSpan) emailSpan.textContent = emailUsuario;

    atualizarLogoEscola(escolaUsuario);

    if (!Array.isArray(dados.alunos)) {
      console.error("Resposta inválida, 'alunos' não é array:", dados);
      mostrarToast("Erro na comunicação com o servidor.", "error");
      esconderLoading();
      return;
    }

    aplicarFundoHeader(escolaUsuario);

    dadosGlobais = dados.alunos;
    dadosFiltradosGlobais = [...dadosGlobais];
    ordenacaoAtual = { campo: null, direcao: 'asc' };
    paginaAtual = dados.paginaAtual;
    const totalPaginas = dados.totalPaginas;
    const totalRegistros = dados.totalRegistros;
    
    renderLista(dadosGlobais);
    renderizarPaginacao(totalPaginas, totalRegistros);

    // Aplica estado inicial mobile (esconde lista se for celular)
    if (typeof aplicarEstadoInicialMobile === 'function') {
      aplicarEstadoInicialMobile();
    }

    
    document.getElementById("login").style.display = "none";
    esconderLoading();
    esconderSplash();
    document.getElementById("app").style.display = "block";
    aplicarCampanha();

    // Exibe dock mobile após login
    if (typeof exibirDockMobile === 'function') {
      exibirDockMobile();
    }

    // ========== AÇÕES IMEDIATAS (essenciais para a tela) ==========
    ajustarInterfacePorPerfil();   // esconde/mostra botões conforme perfil
    inicializarFiltros();          // carrega turmas para filtro (usa cache)
    preencherSelectEscolasTurma(); // select da escola no modal turmas (leve)

    // ========== AÇÕES ADIADAS (não bloqueiam a exibição inicial) ==========
    setTimeout(() => {
      carregarComunicados();
      iniciarPollingNotificacoes();
      carregarFotoPerfil();
      
      if (typeof carregarDesempenho === 'function') {
        carregarDesempenho();
      }
      if (typeof carregarRanking === 'function') {
        carregarRanking();   // 🔥 ADICIONE AQUI
      }
    }, 400); // 400 ms após a lista aparecer

    // preencherSelectsProcessos() e preencherSelectEscolasDoc() foram movidas
    // para as funções de abertura dos modais correspondentes (modals.js)

    if (perfilUsuario === "SECRETARIA") {
      carregarTurmasParaFiltro();
    }

    
    // Métricas
    const statusAtual = document.getElementById('filtroStatus')?.value || '';
    if (dados.metricas) {
      if (!metricasOriginais || !statusAtual) {
        metricasOriginais = dados.metricas;
      }
      if (statusAtual) {
        renderPainel(metricasOriginais);
      } else {
        renderPainel(dados.metricas);
      }
    } else {
      const resumo = gerarResumo(dadosGlobais);
      if (!metricasOriginais || !statusAtual) {
        metricasOriginais = resumo;
      }
      if (statusAtual) {
        renderPainel(metricasOriginais);
      } else {
        renderPainel(resumo);
      }
    }

    if (dados.resumoPorEscola) {
      resumoPorEscolaGlobal = dados.resumoPorEscola;
    }
    
    const mapaParaRender = (perfilUsuario === 'SUPERVISOR' && emailUsuario === 'eder.ramos@educador.edu.es.gov.br') 
      ? null 
      : resumoPorEscolaGlobal;
    renderPorEscola(mapaParaRender, dados.metricas);
    
    const btnProcessos = document.getElementById("btnProcessos");
    if (perfilUsuario === "SECRETARIA" || perfilUsuario === "SUPERVISOR" || perfilUsuario === "PEDAGOGICO") {
      if (btnProcessos) btnProcessos.style.display = "inline-block";
    }

    // Controle de visibilidade dos botões do menu
    if (perfilUsuario === 'PEDAGOGICO') {
      const textosRestritos = [
        'Novo Aluno', 'Importar Alunos', 'Atualizar Matriculados',
        'Promover Alunos', 'Checklist em Lote', 'Usuários', 'Cadastrar'
      ];
      document.querySelectorAll('#menuDropdown button').forEach(btn => {
        const texto = btn.textContent.trim();
        if (textosRestritos.some(t => texto.includes(t))) {
          btn.style.display = 'none';
        }
      });
      const filtroSituacao = document.getElementById('filtroSituacaoWrapper');
      if (filtroSituacao) filtroSituacao.style.display = 'none';
    }

    const btnGerador = document.getElementById('btnGeradorDocumentos');
    if (btnGerador && perfilUsuario === 'SUPERVISOR') {
      btnGerador.style.display = 'block';
    }

    const btnDadosEscola = document.getElementById('btnDadosEscola');
    if (btnDadosEscola) {
      btnDadosEscola.style.display = (perfilUsuario === 'SUPERVISOR' || perfilUsuario === 'SECRETARIA') ? 'inline-block' : 'none';
    }

    // Botões do Plano Tático
    const botoesPlano = ['btnPlanoTatico', 'btnPlanoTaticoTrim'];
    botoesPlano.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.style.display = (perfilUsuario === 'PEDAGOGICO' || perfilUsuario === 'SUPERVISOR') ? 'block' : 'none';
      }
    });

    const btnAcomp = document.getElementById('btnAcompanhamentoPT');
    if (btnAcomp) {
      btnAcomp.style.display = (perfilUsuario === 'SUPERVISOR') ? 'block' : 'none';
    }

    const btnAprovacao = document.getElementById('btnAprovacaoTermos');
    if (btnAprovacao) {
      btnAprovacao.style.display = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br') ? 'block' : 'none';
    }

    const btnMonitoramento = document.getElementById('btnMonitoramento');
    if (btnMonitoramento) {
      btnMonitoramento.style.display = (perfilUsuario === 'SUPERVISOR') ? 'inline-block' : 'none';
    }

    // Botão de upload de modelo da escola (visível para SECRETARIA e SUPERVISOR)
    const btnUploadEscola = document.getElementById('btnUploadModeloEscola');
    if (btnUploadEscola) {
      btnUploadEscola.style.display = (perfilUsuario === 'SECRETARIA' || perfilUsuario === 'SUPERVISOR') ? 'inline-block' : 'none';
    }

    // Ocultar colunas vazias do menu
    function secaoTemBotoesVisiveis(colunaId) {
      const coluna = document.getElementById(colunaId);
      if (!coluna) return false;
      const botoes = coluna.querySelectorAll('button');
      for (const btn of botoes) {
        if (btn.style.display !== 'none') return true;
      }
      return false;
    }

    function esconderColunaMenu(colunaId) {
      const coluna = document.getElementById(colunaId);
      if (coluna) coluna.style.display = 'none';
    }

    if (!secaoTemBotoesVisiveis('menuColunaAlunos')) esconderColunaMenu('menuColunaAlunos');
    if (!secaoTemBotoesVisiveis('menuColunaDocs')) esconderColunaMenu('menuColunaDocs');
    if (!secaoTemBotoesVisiveis('menuColunaGestao')) esconderColunaMenu('menuColunaGestao');
    if (!secaoTemBotoesVisiveis('menuColunaPlanoTatico')) esconderColunaMenu('menuColunaPlanoTatico');
    if (!secaoTemBotoesVisiveis('menuColunaAdmin')) esconderColunaMenu('menuColunaAdmin');

    esconderLoading();
  });
}
// ------ TURMAS ------
async function carregarTurmas(escola = "") {
  mostrarLoading();
  
  // Se for secretária, força a filtragem pela escola do usuário
  if (perfilUsuario === "SECRETARIA") {
    escola = escolaUsuario;
  }
  
  const chaveCache = getChaveTurmasCache(escola || "todas");
  const turmasCache = lerCache(chaveCache);
  
  if (turmasCache && turmasCache.length > 0) {
    turmasGlobais = turmasCache;
    renderListaTurmas(turmasCache);
    preencherSelectEscolasTurma();
    esconderLoading();
    return;
  }

  let url = `${API_URL}?tipo=turmas&email=${emailUsuario}`;
  if (escola) url += `&escola=${encodeURIComponent(escola)}`;
  
  jsonp(url, function(turmas) {
    turmasGlobais = turmas;
    salvarCache(chaveCache, turmas);
    renderListaTurmas(turmas);
    preencherSelectEscolasTurma();
    esconderLoading();
  });
}
function aplicarEstadoInicialMobile() {
  if (window.innerWidth <= 600) {
    const lista = document.getElementById('lista');
    const paginacao = document.getElementById('paginacao');
    const filtros = document.querySelector('.filtros-container');
    if (lista) lista.style.display = 'none';
    if (paginacao) paginacao.style.display = 'none';
    if (filtros) filtros.style.display = 'none';
  }
}
async function carregarTurmasParaFiltro() {
  const selectTurma = document.getElementById("filtroTurma");
  if (!selectTurma) return;

  let escolaFiltro = "";
  if (perfilUsuario === "SUPERVISOR") {
    escolaFiltro = document.getElementById("filtroEscola").value;
  } else {
    escolaFiltro = escolaUsuario;
  }

  if (!escolaFiltro) {
    selectTurma.innerHTML = '<option value="">Selecione uma escola primeiro</option>';
    return;
  }

  const chaveCache = getChaveTurmasCache(escolaFiltro);
  const turmasCache = lerCache(chaveCache);

  if (turmasCache && turmasCache.length > 0) {
    turmasDisponiveis = turmasCache;
    bloqueiaChangeTurma = true;
    const valorAnterior = selectTurma.getAttribute('data-valor-anterior') || "";
    selectTurma.innerHTML = '<option value="">Todas as turmas</option>';
    turmasCache.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      selectTurma.appendChild(opt);
    });
    if (valorAnterior && Array.from(selectTurma.options).some(opt => opt.value === valorAnterior)) {
      selectTurma.value = valorAnterior;
    }
    setTimeout(() => { bloqueiaChangeTurma = false; }, 100);
    return;
  }

  bloqueiaChangeTurma = true;
  selectTurma.innerHTML = '<option value="">Carregando turmas...</option>';
  bloqueiaChangeTurma = false;

  const url = `${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escolaFiltro)}`;

  jsonp(url, function(turmas) {
    turmasDisponiveis = turmas;
    salvarCache(chaveCache, turmas);

    bloqueiaChangeTurma = true;
    const valorAnterior = selectTurma.getAttribute('data-valor-anterior') || "";
    selectTurma.innerHTML = '<option value="">Todas as turmas</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      selectTurma.appendChild(opt);
    });
    if (valorAnterior && Array.from(selectTurma.options).some(opt => opt.value === valorAnterior)) {
      selectTurma.value = valorAnterior;
    }
    setTimeout(() => { bloqueiaChangeTurma = false; }, 100);
  });
}

async function carregarTurmasParaEdicao(escola, turmaAtual) {
  const select = document.getElementById("editTurma");
  if (!escola) {
    select.innerHTML = '<option value="">Selecione a escola primeiro</option>';
    return;
  }

  const chaveCache = getChaveTurmasCache(escola);
  const turmasCache = lerCache(chaveCache);

  if (turmasCache && turmasCache.length > 0) {
    select.innerHTML = '<option value="">Selecione a turma</option>';
    turmasCache.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      if (t.turma === turmaAtual) opt.selected = true;
      select.appendChild(opt);
    });
    return;
  }

  select.innerHTML = '<option value="">Carregando turmas...</option>';
  const url = `${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;

  jsonp(url, function(turmas) {
    salvarCache(chaveCache, turmas);
    select.innerHTML = '<option value="">Selecione a turma</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      if (t.turma === turmaAtual) opt.selected = true;
      select.appendChild(opt);
    });
  });
}

async function carregarTurmasParaCadastro(escola) {
  const select = document.getElementById("selectTurmaAluno");
  select.innerHTML = '<option value="">Carregando turmas...</option>';
  const url = `${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;
  
  jsonp(url, function(turmas) {
    select.innerHTML = '<option value="">Selecione a turma</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      select.appendChild(opt);
    });
  });
}

// ------ ATOS AUTORIZATIVOS ------
async function carregarAtos() {
  mostrarLoading();
  const escola = document.getElementById("filtroEscolaAto").value;
  const tipoAto = document.getElementById("filtroTipoAto").value;
  const status = document.getElementById("filtroStatusAto").value;
  let url = `${API_URL}?tipo=atos&email=${emailUsuario}`;
  if (escola) url += `&filtroEscola=${encodeURIComponent(escola)}`;
  if (tipoAto) url += `&filtroTipoAto=${encodeURIComponent(tipoAto)}`;
  if (status) url += `&filtroStatus=${encodeURIComponent(status)}`;
  
  jsonp(url, function(atos) {
    atosGlobais = atos;   // <-- importante
    renderizarListaAtos(atos);
    esconderLoading();
  });
}

async function salvarAto() {
  const id = document.getElementById("atoId").value;
  const escola = document.getElementById("atoEscola").value;
  const tipoAto = document.getElementById("atoTipo").value;
  const cursoEtapa = document.getElementById("atoCursoEtapa").value;
  const fundamentacao = document.getElementById("atoFundamentacao").value;
  const cursoTecnico = document.getElementById("atoCursoTecnico").value;
  const numeroAto = document.getElementById("atoNumero").value;
  const dataPublicacao = document.getElementById("atoDataPublicacao").value;
  const dataHomologacao = document.getElementById("atoDataHomologacao").value;
  const validadeAnos = document.getElementById("atoValidadeAnos").value;
  const observacoes = document.getElementById("atoObservacoes").value;
  const arquivoInput = document.getElementById("atoArquivo");
  const file = arquivoInput.files[0];

  const isAtoCurso = tipoAto === 'Ato de curso (criação)' || tipoAto === 'Ato de curso (aprovação/renovação)';
  if (!escola || !tipoAto || !numeroAto || !dataPublicacao || !dataHomologacao) {
    mostrarToast("Preencha todos os campos obrigatórios.", "warning");
    return;
  }
  if (isAtoCurso && !cursoEtapa) {
    mostrarToast("Selecione o Curso/Etapa.", "warning");
    return;
  }

  const btnSalvar = document.querySelector("#modalFormAto .btn-salvar");
  showButtonLoading(btnSalvar);

  let fileBase64 = null, fileName = null, mimeType = null;

  try {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        mostrarToast("Arquivo muito grande. Máximo 10 MB.", "warning");
        hideButtonLoading(btnSalvar);
        return;
      }
      fileName = file.name;
      mimeType = file.type;
      fileBase64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
    }

    const dados = {
      acao: "salvarAtoAutorizativo",
      email: emailUsuario,
      id: id,
      escola: escola,
      tipoAto: tipoAto,
      cursoEtapa: cursoEtapa,
      fundamentacao: fundamentacao,
      cursoTecnico: cursoTecnico,
      numeroAto: numeroAto,
      dataPublicacao: dataPublicacao,
      dataHomologacao: dataHomologacao,
      validadeAnos: validadeAnos,
      observacoes: observacoes,
      fileBase64: fileBase64,
      fileName: fileName,
      mimeType: mimeType
    };

    postSemResposta(dados, "Ato salvo com sucesso!", () => {
      hideButtonLoading(btnSalvar);
      fecharFormAto();
      carregarAtos();
    });
  } catch (error) {
    console.error("Erro ao salvar ato:", error);
    mostrarToast("Erro ao processar o arquivo.", "error");
    hideButtonLoading(btnSalvar);
  }
}

async function excluirAto(id) {
  if (!confirm("Deseja realmente excluir este ato autorizativo?")) return;
  
  const dados = {
    acao: "excluirAtoAutorizativo",
    email: emailUsuario,
    id: id
  };
  
  postSemResposta(dados, "Ato excluído com sucesso!");
  carregarAtos();
}

function carregarModelosEscola() {
  mostrarLoading();
  const url = `${API_URL}?tipo=listarModelosEscola&email=${emailUsuario}&_=${new Date().getTime()}`;
  jsonp(url, function(modelos) {
    esconderLoading();
    const container = document.getElementById("listaModelosContainer");
    container.innerHTML = "";
    
    if (!modelos || modelos.length === 0) {
      container.innerHTML = "<p>Nenhum modelo disponível no momento.</p>";
      return;
    }

    let html = '<h3 style="margin-top:0;">Modelos Oficiais</h3>';
    let temPersonalizados = false;

    modelos.forEach(modelo => {
      if (modelo.isPersonalizado) {
        if (!temPersonalizados) {
          html += '<h3 style="margin-top:16px;">Modelos da Escola</h3>';
          temPersonalizados = true;
        }
      }

      const div = document.createElement('div');
      div.className = 'usuario-card';
      div.style.marginBottom = '8px';
      div.innerHTML = `
        <div class="usuario-avatar"><i class="fas fa-file-word"></i></div>
        <div class="usuario-info">
          <strong>${modelo.nome}</strong>
          <p>${modelo.fileName || '<span style="color:#ef4444;">Nenhum arquivo</span>'}</p>
          <div style="margin-top:8px;">
            ${modelo.viewUrl ? `
              <a href="${modelo.viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar</a>
              <a href="${modelo.downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>
            ` : `
              <button class="btn-pequeno" disabled style="opacity:0.5;"><i class="fas fa-exclamation-triangle"></i> Sem arquivo</button>
            `}
          </div>
        </div>
      `;
      container.appendChild(div);
    });

    esconderLoading();
  });
}

async function fazerUploadModeloEscola() {
  const nomeModelo = document.getElementById('nomeModeloEscola')?.value.trim();
  const fileInput = document.getElementById('arquivoModeloEscola');
  const file = fileInput?.files[0];

  if (!nomeModelo) { mostrarToast('Digite um nome para o modelo.', 'warning'); return; }
  if (!file) { mostrarToast('Selecione um arquivo.', 'warning'); return; }
  if (file.size > 20 * 1024 * 1024) { mostrarToast('Arquivo muito grande. Máximo 20 MB.', 'warning'); return; }

  const btnEnviar = document.querySelector('#abaUploadModeloEscola .btn-salvar');
  showButtonLoading(btnEnviar);

  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    postSemResposta({
      acao: 'uploadModeloEscola',
      email: emailUsuario,
      nomeModelo: nomeModelo,
      fileName: file.name,
      mimeType: file.type,
      fileBase64: base64
    }, 'Modelo enviado com sucesso!', () => {
      fileInput.value = '';
      document.getElementById('nomeModeloEscola').value = '';
      hideButtonLoading(btnEnviar);
      carregarModelosEscola(); // atualiza a lista
    });
  } catch (error) {
    mostrarToast('Erro ao enviar.', 'error');
    hideButtonLoading(btnEnviar);
  }
}

async function fazerUploadModelo() {
  const select = document.getElementById("selectTipoModelo");
  const modeloNome = select.value;
  const fileInput = document.getElementById("arquivoModelo");
  const file = fileInput.files[0];
  
  if (!modeloNome) { mostrarToast("Selecione o tipo de modelo.", "warning"); return; }
  if (!file) { mostrarToast("Selecione um arquivo.", "warning"); return; }
  if (file.size > 20 * 1024 * 1024) { mostrarToast("Arquivo muito grande. Máximo 20 MB.", "warning"); return; }
  
  const btnEnviar = document.querySelector("#abaUploadModelo .btn-salvar");
  showButtonLoading(btnEnviar);
  
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    const dados = {
      acao: "uploadModelo",
      email: emailUsuario,
      modeloNome: modeloNome,
      fileName: file.name,
      mimeType: file.type,
      fileBase64: base64
    };
    
    // Envia sem esperar resposta JSON (no-cors)
    const response = await fetch(API_URL, {
      method: "POST",
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(dados)
    });
    
    mostrarToast("Modelo enviado com sucesso! Atualize a lista.", "success");
    fileInput.value = "";
    select.value = "";
    mostrarAbaListarModelos();
    
  } catch (error) {
    console.error("Erro no upload do modelo:", error);
    mostrarToast("Erro ao enviar. Tente novamente.", "error");
  } finally {
    hideButtonLoading(btnEnviar);
  }
}

// ------ PROCESSOS (EDOCS) ------
async function buscarProcessos() {
  const tipo = document.getElementById("filtroProcessoTipo").value;
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("filtroProcessoEscola").value : "";
  const aluno = document.getElementById("filtroProcessoAluno")?.value.trim() || "";
  
  mostrarLoading();
  let url = `${API_URL}?tipo=processos&email=${emailUsuario}`;
  if (tipo) url += `&filtroTipo=${encodeURIComponent(tipo)}`;
  if (perfilUsuario === "SUPERVISOR" && escola) url += `&filtroEscola=${encodeURIComponent(escola)}`;
  if (aluno) url += `&filtroAluno=${encodeURIComponent(aluno)}`;
  
  jsonp(url, function(processos) {
    renderizarListaProcessos(processos);
    esconderLoading();
  });
}

async function cadastrarProcesso() {
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("cadastroProcessoEscola").value : escolaUsuario;
  const tipo = document.getElementById("cadastroProcessoTipo").value;
  const codigo = document.getElementById("cadastroProcessoCodigo").value.trim();
  const observacoes = document.getElementById("cadastroProcessoObs").value.trim();
  const link = document.getElementById("cadastroProcessoLink").value.trim();
  
  if (!escola) { mostrarToast("Selecione a escola.", "warning"); return; }
  if (!tipo) { mostrarToast("Selecione o tipo de processo.", "warning"); return; }
  if (!codigo) { mostrarToast("Informe o código do processo.", "warning"); return; }
  
  let aluno = "", categoria = "", subcategoria = "";
  
  const tiposComAluno = [
    "Cuidador", 
    "Regularização AEE", 
    "Regularização de Vida Escolar",
    "Manifestação GENPRO",
    "Ata Especial de RVE",
    "Ata de Classificação/Reclassificação/Avanço Escolar"
  ];
  
  if (tiposComAluno.includes(tipo)) {
    aluno = document.getElementById("cadastroProcessoAluno")?.value.trim() || "";
    if (!aluno) { mostrarToast("Informe o nome do aluno.", "warning"); return; }
  } else if (tipo === "Livro de ponto") {
    categoria = document.getElementById("cadastroProcessoCategoria")?.value || "";
    if (!categoria) { mostrarToast("Selecione a categoria.", "warning"); return; }
    if (categoria === "Profissionais do Magistério") {
      subcategoria = document.getElementById("cadastroProcessoSubcategoria")?.value || "";
      if (!subcategoria) { mostrarToast("Selecione a subcategoria.", "warning"); return; }
    }
  } else if (tipo === "Plano de Intervenção PFA") {
    subcategoria = document.getElementById("cadastroProcessoSubtopicoPFA")?.value || "";
    if (!subcategoria) { mostrarToast("Selecione o componente do PFA.", "warning"); return; }
  }
  
  const btnSalvar = document.querySelector("#abaCadastroProcesso .btn-salvar");
  showButtonLoading(btnSalvar);
  
  const dados = {
    acao: "cadastrarProcesso",
    email: emailUsuario,
    escola: escola,
    tipo: tipo,
    codigo: codigo,
    aluno: aluno,
    categoria: categoria,
    subcategoria: subcategoria,
    observacoes: observacoes,
    link: link
  };
  
  postSemResposta(dados, "Processo cadastrado com sucesso!", () => {
    document.getElementById("cadastroProcessoCodigo").value = "";
    document.getElementById("cadastroProcessoObs").value = "";
    document.getElementById("cadastroProcessoTipo").value = "";
    document.getElementById("camposExtrasProcesso").innerHTML = "";
    if (perfilUsuario === "SUPERVISOR") document.getElementById("cadastroProcessoEscola").value = "";
    
    hideButtonLoading(btnSalvar);
  });
}

// ------ GESTÃO DE DOCUMENTOS ------
async function fazerUpload() {
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("uploadEscola").value : escolaUsuario;
  const tipo = document.getElementById("uploadTipoDoc").value;
  const nomeTitular = document.getElementById("uploadNomeTitular").value.trim();
  const fileInput = document.getElementById("arquivoUpload");
  const file = fileInput.files[0];
  
  if (!escola) { mostrarToast("Selecione a escola.", "warning"); return; }
  if (!tipo) { mostrarToast("Selecione o tipo de documento.", "warning"); return; }
  
  // Nome só é obrigatório se o campo estiver visível e vazio
  if (!tiposDocumentoSemNome.includes(tipo) && !nomeTitular) {
    mostrarToast("Informe o nome do titular do documento.", "warning");
    return;
  }
  if (!file) { mostrarToast("Selecione um arquivo.", "warning"); return; }
  
  const btnSalvar = document.querySelector("#abaUpload .btn-salvar");
  showButtonLoading(btnSalvar);
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    
    const dados = {
      acao: "uploadDocumento",
      email: emailUsuario,
      escola: escola,
      tipo: tipo,
      nomeAluno: nomeTitular,   // continua enviando como "nomeAluno" para compatibilidade
      fileName: file.name,
      mimeType: file.type,
      fileBase64: base64
    };
    
    postSemResposta(dados, "Upload realizado com sucesso!", () => {
      fileInput.value = "";
      document.getElementById("uploadNomeTitular").value = "";
      document.getElementById("uploadTipoDoc").value = "";
      if (perfilUsuario === "SUPERVISOR") document.getElementById("uploadEscola").value = "";
      
      hideButtonLoading(btnSalvar);
      
      if (document.getElementById("modalDocumentos").style.display === "flex") {
        buscarDocumentos();
      }
    });
  };
  
  reader.onerror = function() {
    mostrarToast("Erro ao ler o arquivo.", "error");
    hideButtonLoading(btnSalvar);
  };
  
  reader.readAsDataURL(file);
}
  
function buscarDocumentos() {
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("filtroEscolaDoc").value : "";
  const tipo = document.getElementById("filtroTipoDoc").value;
  const nomeAluno = document.getElementById("filtroNomeAlunoDoc").value.trim();
  
  mostrarLoading();
  let url = `${API_URL}?tipo=documentos&email=${emailUsuario}`;
  if (escola) url += `&filtroEscola=${encodeURIComponent(escola)}`;
  if (tipo) url += `&filtroTipo=${encodeURIComponent(tipo)}`;
  if (nomeAluno) url += `&filtroNome=${encodeURIComponent(nomeAluno)}`;
  
  jsonp(url, function(docs) {
    renderizarListaDocumentos(docs);
    esconderLoading();
  });
}

// ------ ALUNOS INATIVOS ------
function buscarInativos(pagina = 1) {
  mostrarLoading();
  
  const nome = document.getElementById("filtroNomeInativo").value.trim();
  const turma = document.getElementById("filtroTurmaInativo").value;
  
  filtrosInativosAtuais = { nome, turma };
  
  let url = `${API_URL}?tipo=inativos&email=${emailUsuario}&pagina=${pagina}&limite=${alunosPorPaginaInativos}`;
  if (nome) url += `&nome=${encodeURIComponent(nome)}`;
  if (turma) url += `&turma=${encodeURIComponent(turma)}`;
  
  jsonp(url, function(dados) {
    paginaAtualInativos = dados.paginaAtual;
    totalPaginasInativos = dados.totalPaginas;
    
    renderizarListaInativos(dados.alunos);
    renderizarPaginacaoInativos();
    esconderLoading();
  });
}

function reativarAlunoInativo(id, nome, row, escola) {
  if (!confirm(`Deseja reativar o aluno "${nome}"? Ele voltará a aparecer na lista principal como "Ativo".`)) return;
  
  const dados = {
    acao: "alterarSituacao",
    email: emailUsuario,
    row: row,
    escola: escola,
    situacao: "Ativo"
  };
  
  postSemResposta(dados, "Aluno reativado com sucesso!", () => {
    buscarInativos(paginaAtualInativos);
    if (escola === escolaUsuario || perfilUsuario === "SUPERVISOR") {
      carregarAlunos();
    }
  });
}

// ------ SALVAR DADOS DE ALUNO (MODAL DETALHES) ------
async function salvarDadosAluno() {
  if (!dadosAlunoAtual) return;
  
  const nome = document.getElementById("editNomeAluno").value.trim();
  const idAluno = document.getElementById("editIdAluno")?.value.trim() || "";
  const responsavel = document.getElementById("editResponsavel").value.trim();
  const telefone = coletarTelefonesEdicao();
  const turma = document.getElementById("editTurma").value;
  const edEspecial = document.getElementById("editEdEspecial").checked;
  const observacoes = document.getElementById("observacoesAluno")?.value || "";
  const cpfNumero = document.getElementById("editCpfNumero")?.value.trim() || "";
  const racaCor = document.getElementById("editRacaCor")?.value || "";

  // NOVOS CAMPOS
  const filiacao1 = document.getElementById("editFiliacao1")?.value.trim() || "";
  const filiacao2 = document.getElementById("editFiliacao2")?.value.trim() || "";
  const dataNascimento = document.getElementById("editDataNascimento")?.value || "";
  const naturalidade = document.getElementById("editNaturalidade")?.value.trim() || "";
  const ufNascimento = document.getElementById("ufNascimentoCadastro")?.value || "";
  const nacionalidade = document.getElementById("editNacionalidade")?.value.trim() || "";
  
  if (!nome) {
    mostrarToast("Nome do aluno é obrigatório.", "warning");
    return;
  }

  const telefoneNumeros = telefone.replace(/\D/g, '');
  if (telefoneNumeros.length > 0 && telefoneNumeros.length < 10) {
    mostrarToast("Telefone incompleto. Informe DDD + número (mínimo 10 dígitos).", "warning");
    return;
  }
  
    // Valida CPF (se preenchido)
  if (cpfNumero && cpfNumero.replace(/\D/g, '') !== '') {
    if (!validarCPF(cpfNumero)) {
      mostrarToast("CPF inválido. Verifique o número digitado.", "warning");
      return;
    }
  }

  const btn = document.getElementById("btnSalvarInfoAluno");
  showButtonLoading(btn);
  
  const dados = {
    acao: "atualizarDadosAluno",
    row: dadosAlunoAtual._row,
    escola: dadosAlunoAtual.ESCOLA,
    nome: nome,
    idAluno: idAluno,
    responsavel: responsavel,
    telefone: telefone,
    turma: turma,
    edEspecial: edEspecial,
    observacoes: observacoes,
    cpfNumero: cpfNumero,
    racaCor: racaCor,
    filiacao1: filiacao1,
    filiacao2: filiacao2,
    dataNascimento: dataNascimento,
    naturalidade: naturalidade,
    ufNascimento: ufNascimento,
    nacionalidade: nacionalidade,
    email: emailUsuario
  };
  
  postSemResposta(dados, "Dados atualizados com sucesso!", () => {
    registrarUltimaAcao('Dados de aluno atualizados');

    dadosAlunoAtual.ALUNO = nome;
    dadosAlunoAtual.ID = idAluno;
    dadosAlunoAtual.RESPONSAVEL = responsavel;
    dadosAlunoAtual.TELEFONE = telefone;
    dadosAlunoAtual.TURMA = turma;
    dadosAlunoAtual.ED_ESPECIAL = edEspecial;
    dadosAlunoAtual.OBSERVACOES = observacoes;
    dadosAlunoAtual.CPF_NUMERO = cpfNumero;
    dadosAlunoAtual.RACA_COR = racaCor;
    dadosAlunoAtual.FILIACAO_1 = filiacao1;
    dadosAlunoAtual.FILIACAO_2 = filiacao2;
    dadosAlunoAtual.DATA_NASCIMENTO = dataNascimento;
    dadosAlunoAtual.NATURALIDADE = naturalidade;
    dadosAlunoAtual.UF_NASCIMENTO = ufNascimento;
    dadosAlunoAtual.NACIONALIDADE = nacionalidade;
    
    document.getElementById("detalhesTitulo").textContent = nome;
    
    hideButtonLoading(btn);
  });
}

async function salvarAlteracoesEmLote(row) {
  if (!dadosAlunoAtual || dadosAlunoAtual._row != row) return;
  
  const alteracoesDocs = [];
  for (let chave in alteracoesPendentes) {
    const [linha, coluna] = chave.split('_').map(Number);
    if (linha === row) {
      alteracoesDocs.push({
        row: linha,
        coluna: coluna,
        valor: alteracoesPendentes[chave],
        escola: dadosAlunoAtual.ESCOLA
      });
    }
  }
  
  const nome = document.getElementById("editNomeAluno").value.trim();
  const responsavel = document.getElementById("editResponsavel").value.trim();
  const telefone = coletarTelefonesEdicao();
  const turma = document.getElementById("editTurma").value;
  const edEspecial = document.getElementById("editEdEspecial").checked;
  const observacoes = document.getElementById("observacoesAluno")?.value || "";
  const cpfNumero = document.getElementById("editCpfNumero")?.value.trim() || "";
  
  const dadosBasicosAlterados = (
    nome !== dadosAlunoAtual.ALUNO ||
    responsavel !== dadosAlunoAtual.RESPONSAVEL ||
    telefone !== dadosAlunoAtual.TELEFONE ||
    turma !== dadosAlunoAtual.TURMA ||
    edEspecial !== dadosAlunoAtual.ED_ESPECIAL ||
    observacoes !== (dadosAlunoAtual.OBSERVACOES || "") ||
    cpfNumero !== (dadosAlunoAtual.CPF_NUMERO || "")
  );
  
  if (alteracoesDocs.length === 0 && !dadosBasicosAlterados) {
    mostrarToast("Nenhuma alteração para salvar.", "warning");
    return;
  }
  
  const btn = document.getElementById("btnSalvarDetalhes");
  showButtonLoading(btn);
  
  try {
    if (dadosBasicosAlterados) {
      const dadosBasicos = {
        acao: "atualizarDadosAluno",
        row: row,
        escola: dadosAlunoAtual.ESCOLA,
        nome: nome,
        responsavel: responsavel,
        telefone: telefone,
        turma: turma,
        edEspecial: edEspecial,
        observacoes: observacoes,
        cpfNumero: cpfNumero,
        email: emailUsuario
      };
      
      await new Promise((resolve) => {
        postSemResposta(dadosBasicos, "", () => resolve());
      });
      
      dadosAlunoAtual.ALUNO = nome;
      dadosAlunoAtual.RESPONSAVEL = responsavel;
      dadosAlunoAtual.TELEFONE = telefone;
      dadosAlunoAtual.TURMA = turma;
      dadosAlunoAtual.ED_ESPECIAL = edEspecial;
      dadosAlunoAtual.OBSERVACOES = observacoes;
      dadosAlunoAtual.CPF_NUMERO = cpfNumero;
      document.getElementById("detalhesTitulo").textContent = nome;
    }
    
    if (alteracoesDocs.length > 0) {
      const dadosLote = {
        acao: "atualizarDocumentosEmLote",
        alteracoes: alteracoesDocs,
        email: emailUsuario
      };
      
      await new Promise((resolve) => {
        postSemResposta(dadosLote, "", () => resolve());
      });
      
      for (let chave in alteracoesPendentes) {
        const [linha] = chave.split('_').map(Number);
        if (linha === row) delete alteracoesPendentes[chave];
      }
    }
    
    mostrarToast("Alterações salvas com sucesso!", "success");
    fecharModalDetalhes();
    carregarAlunos();
    
  } catch (error) {
    console.error("Erro ao salvar:", error);
    mostrarToast("Erro ao salvar. Tente novamente.", "error");
  } finally {
    hideButtonLoading(btn);
  }
}

async function salvarChecklistEmLote() {
  const checkboxes = document.querySelectorAll('#listaChecklistContainer .check-doc-individual');
  const alteracoes = [];

  checkboxes.forEach(cb => {
    const row = parseInt(cb.dataset.row);
    const escola = cb.dataset.escola;
    const coluna = cb.dataset.col;
    const original = cb.dataset.original === 'true';
    const atual = cb.checked;

    if (original !== atual) {
      const colunasIndices = {
        CERTIDAO: 8, CPF: 9, RG: 10, VACINA: 11, SUS: 12,
        RESIDENCIA: 13, RESP_DOCS: 14, HISTORICO: 15, DECL_TRANSF: 16,
        ED_ESPECIAL: 17
      };
      const colIndex = colunasIndices[coluna];
      if (colIndex !== undefined) {
        alteracoes.push({
          row: row,
          coluna: colIndex,
          valor: atual,
          escola: escola
        });
      }
    }
  });

  if (alteracoes.length === 0) {
    mostrarToast("Nenhuma alteração detectada.", "warning");
    return;
  }

  console.log("📦 Alterações em lote:", alteracoes);

  const btn = document.querySelector('#modalChecklistLote .btn-salvar');
  showButtonLoading(btn);

  const dados = {
    acao: "atualizarDocumentosEmLote",
    alteracoes: alteracoes,
    email: emailUsuario
  };

  postSemResposta(dados, "Documentação atualizada em lote com sucesso!", () => {
    registrarUltimaAcao('Checklist em lote atualizado');   // 🔥
    hideButtonLoading(btn);
    fecharModalChecklistLote();
    carregarAlunos();
  });
}

// ------ USUÁRIOS ------
async function salvarUsuario() {
  const nome = document.getElementById("novoNome").value.trim(); // 🔥 NOVO
  const email = document.getElementById("novoEmail").value.trim();
  const perfil = document.getElementById("perfil").value;
  const escola = document.getElementById("escola").value.trim();
  const erroDiv = document.getElementById("erroUsuario");
  const btnSalvar = document.getElementById("btnSalvarUsuario");

  if (!nome) {
    erroDiv.textContent = "Nome completo é obrigatório";
    erroDiv.style.display = "block";
    return;
  }
  if (!email) {
    erroDiv.textContent = "E-mail obrigatório";
    erroDiv.style.display = "block";
    return;
  }
  if ((perfil === "SECRETARIA" || perfil === "PEDAGOGICO") && !escola) {
    erroDiv.textContent = "Escola obrigatória para este perfil";
    erroDiv.style.display = "block";
    return;
  }
  erroDiv.style.display = "none";

  showButtonLoading(btnSalvar);

  const dados = {
    acao: "cadastrarUsuario",
    email: email,
    nome: nome, // 🔥 NOVO
    perfil: perfil,
    escola: escola,
    emailLogado: emailUsuario
  };

  postSemResposta(dados, "Usuário cadastrado com sucesso!", async () => {
    hideButtonLoading(btnSalvar);
    fecharModalCadastroUsuario();
    if (document.getElementById("modalListaUsuarios").style.display === "flex") {
      carregarUsuarios();
    }
  });
}

async function resetarSenhaUsuario(emailAlvo) {
  if (!confirm(`Deseja redefinir a senha do usuário ${emailAlvo}? Uma nova senha será enviada por e-mail.`)) return;
  
  mostrarLoading();
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        acao: "resetarSenhaAdmin",
        emailLogado: emailUsuario,
        email: emailAlvo
      })
    });
    const result = await resp.json();
    esconderLoading();
    mostrarToast(result.msg, result.status === "ok" ? "success" : "error");
  } catch (e) {
    esconderLoading();
    mostrarToast("Erro de conexão.", "error");
  }
}

// ------ IMPORTAÇÃO DE DADOS ------
async function importarDaPlanilha() {
  if (!confirm("Certifique-se de que os dados do CSV foram colados na aba 'IMPORT_TEMP' da planilha. Deseja continuar?")) {
    return;
  }
  
  const dados = {
    acao: 'importarDaAbaTemp',
    email: emailUsuario
  };
  
  postSemResposta(dados, "Importação concluída! Atualize a lista.");
  carregarAlunos();
}

function executarImportacao() {
  console.log("Email:", emailUsuario, "Alunos:", alunosImportados.length);
  if (alunosImportados.length === 0) {
    mostrarToast("Nenhum aluno para importar.", "warning");
    return;
  }

  mostrarLoading();
  const dados = {
    acao: "enviarCSVParaFila",
    email: emailUsuario,
    alunos: alunosImportados   // array de objetos de aluno
  };

  postSemResposta(dados, "Importação agendada!...", () => {
    esconderLoading();
    fecharModalImportacao();
    alunosImportados = [];
  });
}

function processarCSV() {
  const fileInput = document.getElementById('arquivoCSV');
  const file = fileInput.files[0];
  if (!file) {
    mostrarToast('Selecione um arquivo CSV.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: function(results) {
        const dados = results.data;
        if (dados.length === 0) {
          mostrarToast('Nenhum dado encontrado no CSV.', 'warning');
          return;
        }
        
        alunosImportados = dados.map(linha => {
          const dataMatricula = parseDataCSV(linha['Aluno: Data de matrícula']);
          const rawDef = (linha['Aluno: Deficiência, transtorno do espectro autista e altas habilidades ou superdotação'] || '').toLowerCase();
          const edEspecial = rawDef.includes('sim');
          
          // Normaliza UF (maiúscula, sem espaços)
          const ufNascimento = (linha['Aluno: UF de nascimento'] || linha['Aluno: UF de Nascimento'] || '').trim().toUpperCase();

          return {
            id: linha['id'] || '',
            nome: linha['Aluno: Nome'] || '',
            responsavel: linha['Aluno: Nome do responsável'] || '',
            telefone: extrairPrimeiroTelefone(linha['Aluno: Telefones']),
            escola: linha['Escola: Nome'] || '',
            turma: normalizarTexto(linha['Turma: Nome'] || ''),
            dataMatricula: dataMatricula,
            edEspecial: edEspecial,
            cpfAluno: linha['Aluno: CPF'] || '',
            sus: linha['Aluno: Cartão do SUS'] || '',
            certidao: linha['Aluno: Número de matrícula da certidão nascimento'] || '',
            rg: linha['Aluno: Identidade'] || '',
            residencia: linha['Endereço: Código de instalação elétrica'] || '',
            racaCor: linha['Aluno: Raça'] || '',
            // NOVOS CAMPOS
            filiacao1: linha['Aluno: Filiação 1'] || '',
            filiacao2: linha['Aluno: Filiação 2'] || '',
            dataNascimento: parseDataCSV(linha['Aluno: Data de nascimento'] || linha['Aluno: Data de Nascimento']),
            naturalidade: linha['Aluno: Naturalidade'] || '',
            ufNascimento: ufNascimento,
            nacionalidade: linha['Aluno: Nacionalidade'] || ''
          };
        }).filter(a => a.nome && a.escola);

        renderizarPreview(alunosImportados);
        document.getElementById('btnExecutarImportacao').disabled = (alunosImportados.length === 0);
      },
      error: function(err) {
        mostrarToast('Erro ao processar CSV: ' + err, 'error');
      }
    });
  };
  
  reader.readAsText(file, 'ISO-8859-1');
}

async function salvarAluno() {
  const nomeInput = document.getElementById("nomeAluno");
  const idAluno = document.getElementById("idAlunoCadastro")?.value.trim() || "";
  const responsavelInput = document.getElementById("nomeResponsavel");
  const edEspecialCheck = document.getElementById("alunoEdEspecial");
  const turmaSelect = document.getElementById("selectTurmaAluno");
  const dataMatriculaInput = document.getElementById("dataMatricula").value;
  const observacoes = document.getElementById("observacoesNovoAluno")?.value || "";
  const cpfNumero = document.getElementById("cpfNumeroCadastro")?.value || "";
  const racaCor = document.getElementById("racaCorCadastro")?.value || "";

  // NOVOS CAMPOS
  const filiacao1 = document.getElementById("filiacao1Cadastro")?.value.trim() || "";
  const filiacao2 = document.getElementById("filiacao2Cadastro")?.value.trim() || "";
  const dataNascimento = document.getElementById("dataNascimentoCadastro")?.value || "";
  const naturalidade = document.getElementById("naturalidadeCadastro")?.value.trim() || "";
  const ufNascimento = document.getElementById("editUfNascimento")?.value || ""; // no modal de cadastro o id é editUfNascimento (herdado do detalhes)
  const nacionalidade = document.getElementById("nacionalidadeCadastro")?.value.trim() || "";

  const nome = nomeInput ? nomeInput.value.trim() : "";
  const responsavel = responsavelInput ? responsavelInput.value.trim() : "";
  const telefone = coletarTelefonesCadastro();
  const edEspecial = edEspecialCheck ? edEspecialCheck.checked : false;
  const turma = turmaSelect ? turmaSelect.value : "";
  
  const erroDiv = document.getElementById("erroNome");
  const btnSalvar = document.getElementById("btnSalvarAluno");

  if (!nome) {
    if (erroDiv) erroDiv.style.display = "block";
    if (nomeInput) nomeInput.style.borderColor = "#dc2626";
    return;
  }

  if (erroDiv) erroDiv.style.display = "none";
  if (nomeInput) nomeInput.style.borderColor = "#e2e8f0";

  const telefoneNumeros = telefone.replace(/\D/g, '');
  if (telefoneNumeros.length > 0 && telefoneNumeros.length < 10) {
    mostrarToast("Telefone incompleto. Informe DDD + número (mínimo 10 dígitos).", "warning");
    return;
  }

    // Valida CPF (se preenchido)
  if (cpfNumero && cpfNumero.replace(/\D/g, '') !== '') {
    if (!validarCPF(cpfNumero)) {
      mostrarToast("CPF inválido. Verifique o número digitado.", "warning");
      return;
    }
  }

  showButtonLoading(btnSalvar);

  const dados = {
    acao: "cadastrarAluno",
    nome: nome,
    idAluno: idAluno,
    responsavel: responsavel,
    telefone: telefone,
    turma: turma,
    dataMatricula: dataMatriculaInput,
    edEspecial: edEspecial,
    observacoes: observacoes,
    cpfNumero: cpfNumero,
    racaCor: racaCor,
    filiacao1: filiacao1,
    filiacao2: filiacao2,
    dataNascimento: dataNascimento,
    naturalidade: naturalidade,
    ufNascimento: ufNascimento,
    nacionalidade: nacionalidade,
    email: emailUsuario
  };

  postSemResposta(dados, "Aluno cadastrado com sucesso!", () => {
    registrarUltimaAcao('Novo aluno cadastrado');

    if (nomeInput) nomeInput.value = "";
    if (responsavelInput) responsavelInput.value = "";
    if (edEspecialCheck) edEspecialCheck.checked = false;
    document.getElementById("selectTurmaAluno").selectedIndex = 0;
    document.getElementById("dataMatricula").value = "";
    const obsField = document.getElementById("observacoesNovoAluno");
    if (obsField) obsField.value = "";
    const cpfField = document.getElementById("cpfNumeroCadastro");
    if (cpfField) cpfField.value = "";
    const racaField = document.getElementById("racaCorCadastro");
    if (racaField) racaField.value = "";

    // Limpa novos campos
    document.getElementById("filiacao1Cadastro").value = "";
    document.getElementById("filiacao2Cadastro").value = "";
    document.getElementById("dataNascimentoCadastro").value = "";
    document.getElementById("naturalidadeCadastro").value = "";
    document.getElementById("editUfNascimento").value = "";
    document.getElementById("nacionalidadeCadastro").value = "";

    document.getElementById("novoAluno").style.display = "none";
    document.getElementById("lista").style.display = "";
    document.getElementById("painel").style.display = "";

    carregarAlunos();
    hideButtonLoading(btnSalvar);
  });
}

// ------ ALTERAR SITUAÇÃO / EXCLUIR ALUNO ------
async function alterarSituacaoAluno(novaSituacao) {
  if (!dadosAlunoAtual) return;
  
  const confirmacao = confirm(`Deseja marcar este aluno como "${novaSituacao}"?`);
  if (!confirmacao) return;
  
  const dados = {
    acao: "alterarSituacao",
    row: dadosAlunoAtual._row,
    escola: dadosAlunoAtual.ESCOLA,
    situacao: novaSituacao,
    email: emailUsuario
  };
  
  postSemResposta(dados, `Aluno marcado como ${novaSituacao}.`);
  fecharModalDetalhes();
  carregarAlunos();
}

async function excluirAlunoPermanentemente() {
  if (!dadosAlunoAtual) return;
  
  const nomeAluno = dadosAlunoAtual.ALUNO || "este aluno";
  const confirmacao = confirm(`ATENÇÃO! Você está prestes a EXCLUIR PERMANENTEMENTE o aluno:\n\n${nomeAluno}\n\nEsta ação NÃO PODE SER DESFEITA. Deseja continuar?`);
  if (!confirmacao) return;
  
  const confirmacao2 = confirm(`Tem certeza absoluta? O registro será removido da planilha para sempre.`);
  if (!confirmacao2) return;
  
  const dados = {
    acao: "excluirAluno",
    email: emailUsuario,
    row: dadosAlunoAtual._row,
    escola: dadosAlunoAtual.ESCOLA
  };
  
  postSemResposta(dados, "Aluno excluído com sucesso!", () => {
    fecharModalDetalhes();
    carregarAlunos();
  });
}

function executarExportacaoPDF(opcoes = {}) {
  const turma = opcoes.turma !== undefined ? opcoes.turma : document.getElementById('exportTurma').value;
  const status = opcoes.status !== undefined ? opcoes.status : document.getElementById('exportStatus').value;
  const escola = opcoes.escola !== undefined ? opcoes.escola :
    (perfilUsuario === "SUPERVISOR" ? document.getElementById('exportEscola').value : escolaUsuario);

  mostrarLoading();

  let url = `${API_URL}?email=${emailUsuario}&limite=9999`;
  if (escola) url += `&escola=${encodeURIComponent(escola)}`;
  if (turma) url += `&turma=${encodeURIComponent(turma)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;

  jsonp(url, function(dados) {
    esconderLoading();

    if (!dados.alunos || dados.alunos.length === 0) {
      mostrarToast('Nenhum aluno encontrado para os filtros selecionados.', 'warning');
      return;
    }

    const alunos = dados.alunos;

    // Agrupa por turma
    const turmasMap = {};
    alunos.forEach(aluno => {
      const t = aluno.TURMA || 'Sem turma';
      if (!turmasMap[t]) turmasMap[t] = [];
      turmasMap[t].push(aluno);
    });

    const turmasOrdenadas = Object.keys(turmasMap).sort();

    // HTML do relatório com CSS zebrado
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Pendências</title>`;
    html += `<style>
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #333;
        margin: 30px;
      }
      h2 { font-size: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e293b; }
      h3 {
        font-size: 18px; background: #f1f5f9; padding: 10px; margin-top: 30px;
        border-left: 4px solid #2563eb; color: #0f172a;
      }
      p { font-size: 14px; color: #475569; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
      th { background-color: #2563eb; color: white; font-weight: 600; padding: 10px 8px; text-align: center; border: 1px solid #2563eb; }
      td { padding: 8px; border: 1px solid #cbd5e1; text-align: center; }
      tbody tr:nth-child(even) { background-color: #f8fafc; }
      tbody tr:nth-child(odd) { background-color: #ffffff; }
      .nome-aluno { text-align: left; font-weight: 500; }
      .pendente-check { color: #ef4444; font-weight: bold; font-size: 16px; text-align: center; width: 60px; }
      .pendente-check::before { content: "☐"; font-size: 18px; }
      .entregue-check { color: #10b981; font-weight: bold; font-size: 16px; text-align: center; width: 60px; }
      .entregue-check::before { content: "✔"; font-size: 16px; }
      @page { size: A4 landscape; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>`;

    html += `<h2>Relatório de Pendências - ${new Date().toLocaleDateString('pt-BR')}</h2>`;
    html += `<p>Escola: ${escola || 'Todas'} | Turma: ${turma || 'Todas'} | Status: ${status || 'Todos'}</p>`;

    turmasOrdenadas.forEach(t => {
      html += `<h3>Turma: ${t}</h3>`;
      html += `<table><thead><tr><th>Nome</th>`;
      html += `<th>Certidão</th><th>CPF</th><th>RG</th><th>Vacina</th><th>SUS</th><th>Residência</th><th>Resp. Docs</th><th>Histórico</th><th>Decl. Transf.</th>`;
      html += `<th>Ed. Especial</th></tr></thead><tbody>`;

      turmasMap[t].forEach(aluno => {
        html += `<tr><td class="nome-aluno">${aluno.ALUNO}</td>`;
        const docs = [
          { entregue: aluno.CERTIDAO, label: 'Certidão' },
          { entregue: aluno.CPF, label: 'CPF' },
          { entregue: aluno.RG, label: 'RG' },
          { entregue: aluno.VACINA, label: 'Vacina' },
          { entregue: aluno.SUS, label: 'SUS' },
          { entregue: aluno.RESIDENCIA, label: 'Residência' },
          { entregue: aluno.RESP_DOCS, label: 'Resp. Docs' },
          { entregue: aluno.HISTORICO, label: 'Histórico' },
          { entregue: aluno.DECL_TRANSF, label: 'Decl. Transf.' }
        ];
        docs.forEach(doc => {
          html += doc.entregue 
            ? `<td class="entregue-check" title="${doc.label} entregue"></td>`
            : `<td class="pendente-check" title="${doc.label} pendente"></td>`;
        });
        html += aluno.ED_ESPECIAL === true 
          ? `<td class="entregue-check" title="Ed. Especial"></td>`
          : `<td class="pendente-check" title="Ed. Especial"></td>`;
        html += `</tr>`;
      });

      html += `</tbody></table>`;
    });

    html += `</body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = function() {
      printWindow.print();
    };
  });
}

// ------ LOGIN / LOGOUT ------
function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    mostrarToast("E-mail e senha são obrigatórios.", "warning");
    return;
  }

  mostrarLoading();
  // 🔥 Cache-busting adicionado com &_=${Date.now()}
  const url = `${API_URL}?tipo=auth&email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}&_=${Date.now()}`;

  jsonp(url, function(resultado) {
  esconderLoading();

  if (resultado.erro === 'falha_rede') {
    mostrarToast("Não foi possível conectar ao servidor. Verifique sua internet ou desative bloqueadores/VPN.", "error");
    return;
  }

  if (resultado.autorizado) {
      emailUsuario = email.toLowerCase();
      nomeUsuario = resultado.nome || emailUsuario;
      localStorage.setItem("emailUsuario", emailUsuario);
      localStorage.setItem("nomeUsuario", nomeUsuario);

      if (resultado.primeiroAcesso) {
        abrirModalAlterarSenhaObrigatorio();
        return;
      }

      carregarAlunos();
     } else {
      mostrarToast(resultado.msg || "Credenciais inválidas.", "error");
    }
  });
}

function removerStatusLogin() {
  const statusEl = document.getElementById('statusVerificacaoLogin');
  if (statusEl) statusEl.remove();
  document.getElementById("email").disabled = false;
  document.getElementById("senha").disabled = false;
  const btnLogin = document.querySelector('#login button');
  if (btnLogin) btnLogin.disabled = false;
}

function exibirMensagemLogin(mensagem) {
  const antiga = document.getElementById('mensagemLoginErro');
  if (antiga) antiga.remove();

  const div = document.createElement('div');
  div.id = 'mensagemLoginErro';
  div.style.cssText = 'margin-top:20px; padding:16px; background:#fff3cd; border:1px solid #ffc107; border-radius:12px; color:#856404; text-align:center;';
  div.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${mensagem}
    <br><button onclick="logout()" style="margin-top:12px;" class="btn-pequeno">Sair</button>`;
  document.getElementById('login').appendChild(div);
}

function logout() {
  if (!confirm("Deseja sair do sistema?")) return;

  if (window._pollingTermo) {
    clearInterval(window._pollingTermo);
    window._pollingTermo = null;
  }

  limparCacheTurmas();
  pararPollingNotificacoes();
  
  const img = document.getElementById('fotoPerfilImg');
  if (img) img.src = '';
  const iniciais = document.getElementById('fotoPerfilIniciais');
  if (iniciais) iniciais.textContent = '';
  
  // 🔥 LIMPA OS CAMPOS DE LOGIN (SEGURANÇA)
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  if (emailInput) {
    emailInput.value = '';
    emailInput.disabled = false; // reabilita se tiver sido desabilitado
  }
  if (senhaInput) {
    senhaInput.value = '';
    senhaInput.type = 'password'; // força o campo a ficar oculto novamente
    senhaInput.disabled = false;
  }
  
  // Remove mensagens de erro da tela de login
  const msgErro = document.getElementById('mensagemLoginErro');
  if (msgErro) msgErro.remove();
  const statusVer = document.getElementById('statusVerificacaoLogin');
  if (statusVer) statusVer.remove();

  emailUsuario = "";
  localStorage.removeItem("emailUsuario");

  document.getElementById("app").style.display = "none";
  document.body.style.backgroundImage = "";
  document.body.classList.remove("fundo-personalizado");

  // Esconde a dock mobile
  if (typeof esconderDockMobile === 'function') {
    esconderDockMobile();
  }

  // Reseta o botão de login (caso esteja desabilitado)
  const btnLogin = document.querySelector('#login button');
  if (btnLogin) btnLogin.disabled = false;

  // Mostra a tela de login
  const loginEl = document.getElementById("login");
  loginEl.style.display = "";
  dadosGlobais = [];
}

function recuperarSenha() {
  const email = prompt("Digite seu e-mail institucional para receber uma nova senha:");
  if (!email || !email.trim()) return;

  // Validação mínima
  if (!email.includes('@') || !email.includes('.')) {
    mostrarToast("Formato de e-mail inválido.", "warning");
    return;
  }

  mostrarLoading();
  const url = `${API_URL}?tipo=recuperarSenha&email=${encodeURIComponent(email.trim())}`;

  jsonp(url, function(res) {
    esconderLoading();
    // Mensagem genérica – não revela se o e-mail existe
    mostrarToast(res.msg || "Se o e-mail estiver cadastrado, uma nova senha será enviada.", 
                 res.status === "ok" ? "success" : "warning");
  });
}

function alterarMinhaSenha() {
  const senhaAtual = document.getElementById("senhaAtual").value;
  const novaSenha = document.getElementById("novaSenha").value;
  const confirmar = document.getElementById("confirmarNovaSenha").value;

  if (!senhaAtual || !novaSenha || !confirmar) {
    mostrarToast("Preencha todos os campos.", "warning");
    return;
  }
  if (novaSenha.length < 6) {
    mostrarToast("A nova senha deve ter pelo menos 6 caracteres.", "warning");
    return;
  }
  if (novaSenha !== confirmar) {
    mostrarToast("As senhas não coincidem.", "warning");
    return;
  }

  const btnSalvar = document.querySelector("#modalAlterarSenha .btn-salvar");
  showButtonLoading(btnSalvar);

  const isPrimeiroAcesso = document.getElementById("modalAlterarSenha").classList.contains("primeiro-acesso");
  
  // Construir a URL com o parâmetro adicional para primeiro acesso
  let url = `${API_URL}?tipo=alterarSenha&email=${encodeURIComponent(emailUsuario)}&senhaAtual=${encodeURIComponent(senhaAtual)}&novaSenha=${encodeURIComponent(novaSenha)}`;
  if (isPrimeiroAcesso) {
    url += `&primeiroAcesso=true`;
  }

  jsonp(url, function(resultado) {
    hideButtonLoading(btnSalvar);

    if (resultado.status === "ok") {
      mostrarToast(resultado.msg, "success");
      
      if (isPrimeiroAcesso) {
        document.getElementById("modalAlterarSenha").classList.remove("primeiro-acesso");
        fecharModalAlterarSenha();
        verificarStatusTermoEAcessar();
      } else {
        fecharModalAlterarSenha();
      }
    } else {
      mostrarToast(resultado.msg || "Erro ao alterar senha.", "error");
    }
  });
}

// ------ OUTRAS ATUALIZAÇÕES RÁPIDAS ------
async function atualizar(row, coluna, valor) {
  const dados = {
    row: row,
    coluna: coluna,
    valor: valor,
    email: emailUsuario
  };
  postSemResposta(dados, "Atualizado com sucesso.");
}

let alunosPromocao = []; // armazena os dados lidos do CSV

function abrirModalPromocao() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode promover alunos.', 'warning');
    return;
  }
  document.getElementById("modalPromocao").style.display = "flex";
  document.getElementById("arquivoCSVPromocao").value = "";
  document.getElementById("previewPromocao").innerHTML = "";
  document.getElementById("btnExecutarPromocao").disabled = true;
  alunosPromocao = [];
}

function fecharModalPromocao() {
  document.getElementById("modalPromocao").style.display = "none";
}

function processarCSVPromocao() {
  const fileInput = document.getElementById('arquivoCSVPromocao');
  const file = fileInput.files[0];
  if (!file) {
    mostrarToast("Selecione um arquivo CSV.", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: function(results) {
        const dados = results.data;
        if (dados.length === 0) {
          mostrarToast("Nenhum dado encontrado.", "warning");
          return;
        }

        alunosPromocao = dados.map(linha => {
          const id = linha['id'] ? linha['id'].toString().trim() : '';
          const nome = linha['Aluno: Nome'] || '';
          const escola = linha['Escola: Nome'] || '';
          const turma = normalizarTexto(linha['Turma: Nome'] || '');

          return {
            id: id,
            nome: nome,
            responsavel: linha['Aluno: Nome do responsável'] || '',
            telefone: extrairPrimeiroTelefone(linha['Aluno: Telefones']),
            escola: escola,
            turma: turma,
            // Correção da data de matrícula
            dataMatricula: parseDataCSV(linha['Aluno: Data de matrícula']),
            cpf: linha['Aluno: CPF'] || '',
            sus: linha['Aluno: Cartão do SUS'] || '',
            certidao: linha['Aluno: Número de matrícula da certidão nascimento'] || '',
            rg: linha['Aluno: Identidade'] || '',
            residencia: linha['Endereço: Código de instalação elétrica'] || '',
            racaCor: linha['Aluno: Raça'] || '',
            filiacao1: linha['Aluno: Filiação 1'] || '',
            filiacao2: linha['Aluno: Filiação 2'] || '',
            // Correção da data de nascimento
            dataNascimento: parseDataCSV(linha['Aluno: Data de nascimento']),
            naturalidade: linha['Aluno: Naturalidade'] || '',
            ufNascimento: linha['Aluno: UF de nascimento'] || '',
            nacionalidade: linha['Aluno: Nacionalidade'] || ''
          };
        }).filter(a => a.id && a.nome && a.escola);

        // Pré-visualização (mantida a original)
        const container = document.getElementById("previewPromocao");
        let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
        html += '<thead><tr><th>ID</th><th>Nome</th><th>Escola</th><th>Turma</th></tr></thead><tbody>';
        alunosPromocao.slice(0, 50).forEach(a => {
          html += `<tr><td>${a.id}</td><td>${a.nome}</td><td>${a.escola}</td><td>${a.turma}</td></tr>`;
        });
        html += '</tbody></table>';
        if (alunosPromocao.length > 50) html += '<p>Mostrando 50 de ' + alunosPromocao.length + '.</p>';
        container.innerHTML = html;

        document.getElementById('btnExecutarPromocao').disabled = (alunosPromocao.length === 0);
      },
      error: function(err) {
        mostrarToast('Erro ao processar CSV: ' + err, 'error');
      }
    });
  };
  reader.readAsText(file, 'ISO-8859-1');
}

function executarPromocaoCSV() {
  if (alunosPromocao.length === 0) {
    mostrarToast('Nenhum aluno para promover.', 'warning');
    return;
  }

  const btn = document.getElementById('btnExecutarPromocao');
  const statusDiv = document.getElementById('statusPromocao');
  showButtonLoading(btn);

  const loteSize = 50;
  const atrasoEntreLotes = 2000;
  let totalEnviados = 0;

  (async () => {
    for (let i = 0; i < alunosPromocao.length; i += loteSize) {
      const lote = alunosPromocao.slice(i, i + loteSize);

      await new Promise((resolve) => {
        postSemResposta(
          {
            acao: 'promoverAlunosLote',
            email: emailUsuario,
            alunos: lote
          },
          null,
          () => {
            totalEnviados += lote.length;
            if (statusDiv) {
              statusDiv.innerHTML = `Enviando lote ${Math.floor(i / loteSize) + 1} de ${Math.ceil(alunosPromocao.length / loteSize)}...`;
            }
            resolve();
          }
        );
      });

      await new Promise(r => setTimeout(r, atrasoEntreLotes));
    }

    // Chama a finalização da promoção após todos os lotes
    await new Promise((resolve) => {
      postSemResposta(
        {
          acao: 'finalizarPromocao',
          email: emailUsuario,
          alunos: alunosPromocao
        },
        null,
        () => {
          resolve();
        }
      );
    });

    mostrarToast(`Promoção concluída! ${alunosPromocao.length} alunos processados.`, 'success');
    hideButtonLoading(btn);
    fecharModalPromocao();
    carregarAlunos();
  })();
}

let alunosAtualizar = [];

function abrirModalAtualizarMatriculados() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode atualizar matriculados.', 'warning');
    return;
  }
  document.getElementById("modalAtualizarMatriculados").style.display = "flex";
  document.getElementById("arquivoCSVAtualizar").value = "";
  document.getElementById("previewAtualizar").innerHTML = "";
  document.getElementById("btnExecutarAtualizarMatriculados").disabled = true;
  alunosAtualizar = [];
}

function fecharModalAtualizarMatriculados() {
  document.getElementById("modalAtualizarMatriculados").style.display = "none";
}

function processarCSVAtualizar() {
  const fileInput = document.getElementById('arquivoCSVAtualizar');
  const file = fileInput.files[0];
  if (!file) { mostrarToast("Selecione um arquivo CSV.", "warning"); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: function(results) {
        const dados = results.data;
        if (dados.length === 0) { mostrarToast("Nenhum dado encontrado.", "warning"); return; }

        alunosAtualizar = dados.map(linha => {
          const id = linha['id'] ? linha['id'].toString().trim() : '';
          const nome = linha['Aluno: Nome'] || '';
          const escola = linha['Escola: Nome'] || '';
          const turma = normalizarTexto(linha['Turma: Nome'] || '');
          const rawDef = (linha['Aluno: Deficiência, transtorno do espectro autista e altas habilidades ou superdotação'] || '').toLowerCase();
          const edEspecial = rawDef.includes('sim');
          return {
            id, nome,
            responsavel: linha['Aluno: Nome do responsável'] || '',
            telefone: extrairPrimeiroTelefone(linha['Aluno: Telefones']),
            escola, turma,
            // Corrigido para usar parseDataCSV
            dataMatricula: parseDataCSV(linha['Aluno: Data de matrícula']),
            cpf: linha['Aluno: CPF'] || '',
            sus: linha['Aluno: Cartão do SUS'] || '',
            certidao: linha['Aluno: Número de matrícula da certidão nascimento'] || '',
            rg: linha['Aluno: Identidade'] || '',
            residencia: linha['Endereço: Código de instalação elétrica'] || '',
            edEspecial: edEspecial,
            racaCor: linha['Aluno: Raça'] || '',
            filiacao1: linha['Aluno: Filiação 1'] || '',
            filiacao2: linha['Aluno: Filiação 2'] || '',
            // Corrigido para usar parseDataCSV
            dataNascimento: parseDataCSV(linha['Aluno: Data de nascimento']),
            naturalidade: linha['Aluno: Naturalidade'] || '',
            ufNascimento: linha['Aluno: UF de nascimento'] || '',
            nacionalidade: linha['Aluno: Nacionalidade'] || ''
          };
        }).filter(a => a.id && a.nome && a.escola);

        // Pré-visualização
        const container = document.getElementById("previewAtualizar");
        let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
        html += '<thead><tr><th>ID</th><th>Nome</th><th>Escola</th><th>Turma</th></tr></thead><tbody>';
        alunosAtualizar.slice(0, 50).forEach(a => {
          html += `<tr><td>${a.id}</td><td>${a.nome}</td><td>${a.escola}</td><td>${a.turma}</td></tr>`;
        });
        html += '</tbody></table>';
        if (alunosAtualizar.length > 50) html += '<p>Mostrando 50 de ' + alunosAtualizar.length + '.</p>';
        container.innerHTML = html;

        document.getElementById('btnExecutarAtualizarMatriculados').disabled = (alunosAtualizar.length === 0);
      },
      error: function(err) { mostrarToast('Erro ao processar CSV: ' + err, 'error'); }
    });
  };
  reader.readAsText(file, 'ISO-8859-1');
}

function executarAtualizarMatriculados() {
  if (alunosAtualizar.length === 0) {
    mostrarToast('Nenhum aluno para atualizar.', 'warning');
    return;
  }

  const btn = document.getElementById('btnExecutarAtualizarMatriculados');
  const statusDiv = document.getElementById('statusAtualizar');
  showButtonLoading(btn);

  const loteSize = 50;
  const atrasoEntreLotes = 2000;
  let totalEnviados = 0;

  (async () => {
    for (let i = 0; i < alunosAtualizar.length; i += loteSize) {
      const lote = alunosAtualizar.slice(i, i + loteSize);

      await new Promise((resolve) => {
        postSemResposta(
          {
            acao: 'inserirNovosAlunosLote',
            email: emailUsuario,
            alunos: lote
          },
          null,
          () => {
            totalEnviados += lote.length;
            if (statusDiv) {
              statusDiv.innerHTML = `Enviando lote ${Math.floor(i / loteSize) + 1} de ${Math.ceil(alunosAtualizar.length / loteSize)}...`;
            }
            resolve();
          }
        );
      });

      await new Promise(r => setTimeout(r, atrasoEntreLotes));
    }

    mostrarToast(`Atualização concluída! ${alunosAtualizar.length} alunos processados.`, 'success');
    hideButtonLoading(btn);
    fecharModalAtualizarMatriculados();
    carregarAlunos();
  })();
}

function carregarTurmasExportacao(escolaFiltro) {
  const selectTurma = document.getElementById('exportTurma');
  selectTurma.innerHTML = '<option value="">Carregando...</option>';
  
  let url = `${API_URL}?tipo=turmas&email=${emailUsuario}`;
  if (escolaFiltro) url += `&escola=${encodeURIComponent(escolaFiltro)}`;
  
  jsonp(url, function(turmas) {
    selectTurma.innerHTML = '<option value="">Todas as turmas</option>';
    turmas.forEach(t => {
      selectTurma.appendChild(new Option(t.turma, t.turma));
    });
  });
}
function registrarUltimaAcao(descricao) {
  ultimaAcao = descricao;
}
function lerArquivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// ---- CONSENTIMENTO LGPD ----

function verificarConsentimentoUsuario() {
  mostrarLoading();
  // Verifica consentimento LGPD
  jsonp(`${API_URL}?tipo=verificarConsentimento&email=${encodeURIComponent(emailUsuario)}`, function(res) {
    if (res && res.consentiu === false) {
      esconderLoading();
      // Mostra modal de consentimento + termo
      document.getElementById('modalConsentimento').style.display = 'flex';
      document.getElementById('arquivoTermo').value = '';
      document.getElementById('statusUploadTermo').innerHTML = '';
      if (typeof arquivoTermoSelecionado !== 'undefined') arquivoTermoSelecionado = null;
    } else {
      // Já consentiu – verifica termo
      verificarStatusTermoEAcessar();
    }
  });
}

function verificarStatusTermoEAcessar() {
  // EXIBE A TELA DE ESPERA IMEDIATAMENTE para evitar que a interface principal apareça
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // Esconde os componentes principais (modais continuam ocultos por padrão)
  const idsParaOcultar = ['painel', 'lista', 'paginacao', 'muralComunicados'];
  idsParaOcultar.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const barraTitulo = document.querySelector('#app > div[style*="justify-content: space-between"]');
  if (barraTitulo) barraTitulo.style.display = 'none';
  // Cria mensagem de espera enquanto carrega
  let msg = document.getElementById('mensagemEspera');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'mensagemEspera';
    msg.style.cssText = 'text-align:center; padding:60px 20px; color: var(--text-primary);';
    document.getElementById('app').appendChild(msg);
  }
  msg.style.display = 'block';
  msg.innerHTML = `<h2><i class="fas fa-spinner fa-pulse"></i> Verificando autorização...</h2>`;

  // Agora faz a requisição
  jsonp(`${API_URL}?tipo=statusTermo&email=${encodeURIComponent(emailUsuario)}`, function(res) {
    // Se chegou aqui, a chamada funcionou
    if (res && res.enviado && res.status === 'aprovado') {
      // Aprovado: remove espera e carrega sistema
      removerTelaEspera();
      carregarAlunos();
    } else if (res && res.enviado && res.status === 'pendente') {
      // Pendente: exibe tela de espera completa
      exibirTelaEsperaAprovacao();
    } else if (res && res.enviado && res.status === 'recusado') {
      exibirTelaRecusado(res.obs || '');
    } else {
      // Qualquer outro caso (não enviado, erro, etc.) mostra consentimento
      document.getElementById('modalConsentimento').style.display = 'flex';
      document.getElementById('arquivoTermo').value = '';
      document.getElementById('statusUploadTermo').innerHTML = '';
      if (typeof arquivoTermoSelecionado !== 'undefined') arquivoTermoSelecionado = null;
    }
  }, function() {
    // ERRO na requisição: mostra tela de espera (não libera!)
    exibirTelaEsperaAprovacao();
  });
}

async function aceitarConsentimento() {
  if (!document.getElementById('aceiteLgpd').checked) {
    mostrarToast('Você precisa marcar o aceite para continuar.', 'warning');
    return;
  }

  // Obtém o IP do usuário (via serviço público)
  let ip = 'N/A';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    ip = ipData.ip;
  } catch(e) {}

  const dados = {
    acao: 'registrarConsentimento',
    email: emailUsuario,
    versao: '1.0',
    ip: ip
  };

  postSemResposta(dados, 'Consentimento registrado!', () => {
    document.getElementById('modalConsentimento').style.display = 'none';
    carregarAlunos();
  });
}
function preencherCursoEtapa() {
  const select = document.getElementById('atoCursoEtapa');
  select.innerHTML = '<option value="">Curso/Etapa</option>';
  CURSOS_ETAPAS.forEach(curso => {
    const opt = document.createElement('option');
    opt.value = curso;
    opt.textContent = curso;
    select.appendChild(opt);
  });
}

function atualizarFundamentacoes() {
  const cursoSelecionado = document.getElementById('atoCursoEtapa').value;
  const wrapper = document.getElementById('fundamentacaoWrapper');
  const select = document.getElementById('atoFundamentacao');
  const cursoTecnicoWrapper = document.getElementById('cursoTecnicoWrapper');

  if (!cursoSelecionado) {
    wrapper.style.display = 'none';
    cursoTecnicoWrapper.style.display = 'none';
    return;
  }

  // Preencher fundamentações
  const fundamentacoes = FUNDAMENTACOES_POR_CURSO[cursoSelecionado] || [];
  select.innerHTML = '<option value="">Selecione a fundamentação legal</option>';
  fundamentacoes.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    select.appendChild(opt);
  });
  wrapper.style.display = 'block';

  // Mostrar campo de curso técnico se for educação profissional
  if (cursoSelecionado.toUpperCase().includes('EDUCAÇÃO PROFISSIONAL')) {
    cursoTecnicoWrapper.style.display = 'block';
    preencherCursosTecnicos(cursoSelecionado);
  } else {
    cursoTecnicoWrapper.style.display = 'none';
  }
}

function preencherCursosTecnicos(cursoEtapa) {
  const select = document.getElementById('atoCursoTecnico');
  select.innerHTML = '<option value="">Nome do curso técnico (opcional)</option>';
  Object.keys(CURSOS_TECNICOS).forEach(nomeCurso => {
    if (CURSOS_TECNICOS[nomeCurso].includes(cursoEtapa)) {
      const opt = document.createElement('option');
      opt.value = nomeCurso;
      opt.textContent = nomeCurso;
      select.appendChild(opt);
    }
  });
}
function exibirDockMobile() {
  if (window.innerWidth <= 600) {
    const dock = document.getElementById('dockMobile');
    if (dock) dock.style.display = 'flex';
  }
}

function esconderDockMobile() {
  const dock = document.getElementById('dockMobile');
  if (dock) dock.style.display = 'none';
}

function gerarHistoricoAluno(idAluno) {
  mostrarLoading();
  const modeloAba = 'TEMPLATE_EF';
  const url = API_URL + '?tipo=gerarHistorico&email=' + encodeURIComponent(emailUsuario) + '&idAluno=' + encodeURIComponent(idAluno) + '&modelo=' + encodeURIComponent(modeloAba);
  jsonp(url, function(res) {
    esconderLoading();
    if (res.erro) {
      mostrarToast(res.erro, 'error');
      return;
    }
    window.open(res.url, '_blank');
    mostrarToast('Histórico gerado com sucesso!', 'success');
  });
}

function atualizarBadgeTermosPendentes() {
  if (emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') return;
  
  const url = `${API_URL}?tipo=contarTermosPendentes&email=${encodeURIComponent(emailUsuario)}`;
  jsonp(url, function(res) {
    const badge = document.getElementById('badgeTermosPendentes');
    if (badge) {
      if (res.pendentes > 0) {
        badge.textContent = res.pendentes;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  });
}

// Iniciar verificação ao carregar o sistema e depois a cada 60 segundos
setInterval(atualizarBadgeTermosPendentes, 60000);
// =========================
// CAMPANHAS MENSAIS
// =========================
const CAMPANHAS = {
  5: { // Junho (mês 5, pois janeiro=0)
    cor: '#2e7d32',
    texto: '🌿 Junho Verde: Educação Ambiental se constrói em rede.',
    link: 'https://drive.google.com/drive/u/0/mobile/folders/1xEo6qYJ7oHl-3PoSe3jhqFUlNY5kjQkA'
  },
  6: { // Julho (mês 6, pois janeiro=0)
    cor: '#f59e0b',
    texto: 'Julho Amarelo: Mês de prevenção e controle de hepatites virais.',
    link: 'https://saude.es.gov.br/julho-amarelo-saude-fortalece-as-acoes-de-capacitacoes-para-deteccao-das-hepatites-virais'
  },
  7: { // Agosto (mês 7, pois janeiro=0)
    cor: '#c8a2c8',
    texto: 'Agosto Lilás: Prevenção e enfrentamento à violência doméstica e familiar contra a mulher.',
    link: 'https://agostolilas.com.br/'
  }
};

function aplicarCampanha() {
  const mesAtual = new Date().getMonth();
  const campanha = CAMPANHAS[mesAtual];
  const faixa = document.getElementById('faixaCampanha');
  const texto = document.getElementById('textoCampanha');
  const link = document.getElementById('linkCampanha');

  if (!faixa || !texto || !link) return;

  if (campanha) {
    faixa.style.backgroundColor = campanha.cor;
    texto.textContent = campanha.texto;
    link.href = campanha.link;
    faixa.style.display = 'block';
  } else {
    faixa.style.display = 'none';
  }
}

// =========================
// DESEMPENHO – ESTRELAS
// =========================

function carregarDesempenho() {
  if (!emailUsuario) return;

  var escola = '';
  if (perfilUsuario === 'SECRETARIA' || perfilUsuario === 'PEDAGOGICO') {
    escola = escolaUsuario;
  } else if (perfilUsuario === 'SUPERVISOR') {
    // 🔥 NÃO ENVIA ESCOLA – o backend usará a média de todas supervisionadas
    escola = '';
  } else {
    return;
  }

  var url = API_URL + '?tipo=desempenho&email=' + encodeURIComponent(emailUsuario) + '&_=' + Date.now();
  if (escola) {
    url += '&escola=' + encodeURIComponent(escola);
  }

  jsonp(url, function(dados) {
    if (dados && dados.erro) {
      console.warn('Erro ao carregar desempenho:', dados.erro);
      return;
    }
    if (dados && dados.nivel) {
      atualizarEstrelas(dados);
    }
  });
}

function atualizarEstrelas(dados) {
  var container = document.getElementById('estrelasContainer');
  if (!container) return;

  var nivel = dados.nivel || 0;

  // Gera estrelas com Font Awesome
  var estrelas = '';
  for (var i = 0; i < nivel; i++) {
    estrelas += '<i class="fas fa-star" style="font-size: 1.2rem; margin: 0 3px;"></i>';
  }
  container.innerHTML = estrelas;

  // 🔥 Remove tooltip (data-tooltip) e adiciona clique
  container.removeAttribute('data-tooltip');
  container.classList.remove('tooltip-below');
  container.style.cursor = 'pointer';

  // Armazena os dados para uso no clique
  container._desempenhoData = dados;

  // Remove listener antigo para evitar duplicação
  if (container._clickHandler) {
    container.removeEventListener('click', container._clickHandler);
  }

  // Cria novo handler
  container._clickHandler = function() {
    abrirModalDesempenho(this._desempenhoData);
  };
  container.addEventListener('click', container._clickHandler);
}

// =========================
// MODAL DE DESEMPENHO
// =========================

function abrirModalDesempenho(dados) {
  if (!dados) return;
  const modal = document.getElementById('modalDesempenho');
  const body = document.getElementById('modalDesempenhoBody');
  if (!modal || !body) return;

  const nivel = dados.nivel || 0;
  const nota = dados.notaGeral || 0;
  const d = dados.detalhes || {};

  // Estrelas grandes
  const estrelas = '⭐'.repeat(nivel);

  let html = `
    <div class="estrelas-grandes">${estrelas}</div>
    <div class="nivel-texto">⭐ Nível ${nivel} (${nota}%)</div>
    <div style="display: grid; gap: 10px;">
      <div class="metric-item">
        <strong><i class="fas fa-user-graduate"></i> Alunos</strong>
        <span class="valor">${d.alunos ? d.alunos.percentual : 0}% (${d.alunos ? d.alunos.completos : 0}/${d.alunos ? d.alunos.total : 0})</span>
      </div>
      <div class="metric-item">
        <strong><i class="fas fa-user-tie"></i> Profissionais</strong>
        <span class="valor">${d.profissionais ? d.profissionais.percentual : 0}% (${d.profissionais ? d.profissionais.emDia : 0}/${d.profissionais ? d.profissionais.total : 0})</span>
      </div>
      <div class="metric-item">
        <strong><i class="fas fa-school"></i> Dados da Escola</strong>
        <span class="valor">${d.dadosEscola ? d.dadosEscola.percentual : 0}% (${d.dadosEscola ? d.dadosEscola.preenchidos : 0}/${d.dadosEscola ? d.dadosEscola.total : 0})</span>
      </div>
      <div class="metric-item">
        <strong><i class="fas fa-gavel"></i> Atos Autorizativos</strong>
        <span class="valor">${d.atos ? d.atos.percentual : 0}% (${d.atos ? d.atos.validos : 0}/${d.atos ? d.atos.total : 0})</span>
      </div>
    </div>
  `;

  body.innerHTML = html;
  modal.style.display = 'flex';
}

function fecharModalDesempenho() {
  document.getElementById('modalDesempenho').style.display = 'none';
}

// Fechar com Esc e clique fora: tratado de forma central em main.js
// (função obterModaisEPaginasAbertos), não precisa de listener aqui.

// =========================
// RANKING – BADGE E MODAL
// =========================

function carregarRanking() {
  console.log('🔄 carregarRanking iniciado');
  
  var container = document.getElementById('rankingContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'rankingContainer';
    container.style.cssText = 'position: absolute; bottom: 12px; left: 16px; z-index: 10; pointer-events: auto;';
    var header = document.querySelector('header');
    if (header) header.appendChild(container);
  }
  
  // Mostra "Carregando..." enquanto o ranking é carregado
  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; background: rgba(255,255,255,0.12); backdrop-filter: blur(4px); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); color: #f8fafc; opacity: 0.7;">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Carregando...</span>
    </div>
  `;
  
  if (!emailUsuario) {
    console.warn('❌ emailUsuario não definido');
    return;
  }

  var escolaAlvo = '';
  if (perfilUsuario === 'SECRETARIA' || perfilUsuario === 'PEDAGOGICO') {
    escolaAlvo = escolaUsuario;
  } else if (perfilUsuario === 'SUPERVISOR') {
    var selectEscola = document.getElementById('filtroEscola');
    if (selectEscola && selectEscola.value) {
      escolaAlvo = selectEscola.value;
    } else {
      var escolas = getEscolasPermitidas();
      if (escolas && escolas.length > 0) {
        escolaAlvo = escolas[0];
      } else {
        console.warn('⚠️ Nenhuma escola supervisionada disponível');
        container.innerHTML = '';
        return;
      }
    }
  } else {
    console.warn('⚠️ Perfil sem permissão para ranking:', perfilUsuario);
    container.innerHTML = '';
    return;
  }

  if (!escolaAlvo) {
    console.warn('⚠️ Escola alvo não definida');
    container.innerHTML = '';
    return;
  }

  // 🔥 Usa a rota rankingCache (dados já pré-calculados)
  var url = API_URL + '?tipo=rankingCache&email=' + encodeURIComponent(emailUsuario) + '&escola=' + encodeURIComponent(escolaAlvo) + '&_=' + Date.now();
  console.log('📤 URL do ranking cache:', url);

  jsonp(url, function(dados) {
    console.log('📥 Resposta do ranking cache:', dados);
    
    if (dados && dados.erro) {
      console.warn('❌ Erro no ranking:', dados.erro);
      container.innerHTML = '';
      return;
    }
    
    if (dados && dados.ranking) {
      // Encontra a posição da escola alvo
      var posicao = null;
      var nota = null;
      var dicas = [];
      var total = dados.totalEscolas;
      
      for (var i = 0; i < dados.ranking.length; i++) {
        if (dados.ranking[i].escola === escolaAlvo) {
          posicao = dados.ranking[i].posicao;
          nota = dados.ranking[i].nota;
          dicas = dados.ranking[i].dicas || [];
          break;
        }
      }
      
      if (posicao !== null) {
        var resultado = {
          posicao: posicao,
          totalEscolas: total,
          nota: nota,
          dicas: dicas,
          ranking: dados.ranking,
          escolaAtual: escolaAlvo
        };
        atualizarBadgeRanking(resultado);
      } else {
        console.warn('⚠️ Escola não encontrada no ranking:', escolaAlvo);
        container.innerHTML = '';
      }
    } else {
      console.warn('⚠️ Nenhum ranking retornado');
      container.innerHTML = '';
    }
  });
}

function atualizarBadgeRanking(dados) {
  var container = document.getElementById('rankingContainer');
  if (!container) return;

  var posicao = dados.posicao;
  var total = dados.totalEscolas;
  var nota = dados.nota || 0;

  // Define ícone e cor baseados na posição
  var icone = '';
  var cor = '#9ca3af';
  var fundo = 'rgba(255,255,255,0.12)';
  var borda = 'rgba(255,255,255,0.2)';
  
  if (posicao === 1) {
    icone = 'fa-solid fa-trophy';
    cor = '#fbbf24'; // ouro
    fundo = 'rgba(251, 191, 36, 0.2)';
    borda = 'rgba(251, 191, 36, 0.4)';
  } else if (posicao === 2) {
    icone = 'fa-solid fa-trophy';
    cor = '#c0c0c0'; // prata
    fundo = 'rgba(192, 192, 192, 0.2)';
    borda = 'rgba(192, 192, 192, 0.4)';
  } else if (posicao === 3) {
    icone = 'fa-solid fa-trophy';
    cor = '#cd7f32'; // bronze
    fundo = 'rgba(205, 127, 50, 0.2)';
    borda = 'rgba(205, 127, 50, 0.4)';
  } else if (posicao <= 10) {
    icone = 'fa-regular fa-medal';
    cor = '#9ca3af';
    fundo = 'rgba(255,255,255,0.08)';
    borda = 'rgba(255,255,255,0.15)';
  } else {
    icone = 'fa-regular fa-circle';
    cor = '#64748b';
    fundo = 'rgba(255,255,255,0.05)';
    borda = 'rgba(255,255,255,0.1)';
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; background: ${fundo}; backdrop-filter: blur(4px); padding: 6px 14px 6px 10px; border-radius: 20px; border: 1px solid ${borda}; transition: all 0.2s; color: #f8fafc; box-shadow: 0 2px 8px rgba(0,0,0,0.12);"
         onclick="abrirModalRanking()"
         onmouseenter="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='scale(1.02)';"
         onmouseleave="this.style.background='${fundo}'; this.style.transform='scale(1)';"
         data-tooltip="Clique para ver o ranking completo e dicas de melhoria">
      <i class="${icone}" style="font-size: 1.1rem; color: ${cor};"></i>
      <span style="font-weight: 600; color: ${cor};">#${posicao}</span>
      <span style="font-size: 0.7rem; opacity: 0.6;">/${total}</span>
    </div>
  `;

  // Armazena os dados para uso no modal
  container._rankingData = dados;
}

function abrirModalRanking() {
  var container = document.getElementById('rankingContainer');
  if (!container || !container._rankingData) return;

  var dados = container._rankingData;
  var modal = document.getElementById('modalRanking');
  var body = document.getElementById('modalRankingBody');
  if (!modal || !body) return;

  // Monta o HTML do modal
  var html = `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 4px;">
        🏆 Posição #${dados.posicao} de ${dados.totalEscolas}
      </div>
      <div style="color: var(--text-muted); font-size: 0.9rem;">
        Nota geral: ${dados.nota}%
      </div>
    </div>
  `;

  // Dicas de melhoria
  if (dados.dicas && dados.dicas.length > 0) {
    html += `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
        <strong style="display: block; margin-bottom: 4px;">💡 Dicas para melhorar:</strong>
        <ul style="margin: 0; padding-left: 20px; font-size: 0.95rem;">
          ${dados.dicas.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Ranking (top 10)
  if (dados.ranking && dados.ranking.length > 0) {
    html += `
      <div style="margin-top: 12px;">
        <strong style="display: block; margin-bottom: 6px;">🏅 Top ${Math.min(dados.ranking.length, 10)} escolas:</strong>
        <div style="max-height: 260px; overflow-y: auto; padding-right: 4px;">
    `;
    dados.ranking.forEach(function(item) {
      var medalha = '';
      if (item.posicao === 1) medalha = '🥇';
      else if (item.posicao === 2) medalha = '🥈';
      else if (item.posicao === 3) medalha = '🥉';
      else medalha = '#' + item.posicao;
      var destaque = (item.escola === dados.escolaAtual || (dados.ranking.find(function(r) { return r.posicao === dados.posicao; })?.escola === item.escola)) 
        ? 'font-weight: 600; background: #e0e7ff; border-radius: 6px;' 
        : '';
      html += `
        <div style="display: flex; justify-content: space-between; padding: 6px 10px; ${destaque}">
          <span>${medalha} ${item.escola}</span>
          <span style="font-weight: 500;">${item.nota}%</span>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  body.innerHTML = html;
  modal.style.display = 'flex';
}

function fecharModalRanking() {
  document.getElementById('modalRanking').style.display = 'none';
}

// Fechar com Esc e clique fora: tratado de forma central em main.js
// (função obterModaisEPaginasAbertos), não precisa de listener aqui.
