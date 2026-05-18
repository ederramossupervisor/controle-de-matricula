let ultimaAcao = null;

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
      mostrarToast("Acesso não autorizado", "error");
      esconderLoading();
      return;
    }

    if (dados.escolasSupervisionadas) {
      window.escolasSupervisionadas = dados.escolasSupervisionadas;
    } else {
      window.escolasSupervisionadas = [];
    }

    perfilUsuario = dados.perfil;
    // Exibir o nome do perfil abaixo da foto
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

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    carregarComunicados();
    iniciarPollingNotificacoes();
    carregarFotoPerfil();
    ajustarInterfacePorPerfil();
    inicializarFiltros();
    preencherSelectsProcessos();
    preencherSelectEscolasDoc();
    preencherSelectEscolasTurma();

    if (perfilUsuario === "SECRETARIA") {
      carregarTurmasParaFiltro();
    }

    // ---- INDICADOR DE ÚLTIMA ATUALIZAÇÃO ----
    if (dados.ultimaAtualizacao) {
      const data = new Date(dados.ultimaAtualizacao);
      const textoData = data.toLocaleString('pt-BR');
      const acao = ultimaAcao ? ultimaAcao + ' em ' : '';
      document.getElementById('textoUltimaAtualizacao').textContent = `${acao}${textoData}`;
    } else {
      document.getElementById('textoUltimaAtualizacao').textContent = 'Nenhuma atualização recente';
    }

    // ---- MÉTRICAS GLOBAIS ----
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

    // =========================
    // CONTROLE DE VISIBILIDADE DOS BOTÕES DO MENU
    // =========================
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

    // Exibe botões do Plano Tático
    const botoesPlano = ['btnPlanoTatico', 'btnPlanoTaticoTrim'];
    botoesPlano.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.style.display = (perfilUsuario === 'PEDAGOGICO' || perfilUsuario === 'SUPERVISOR') ? 'block' : 'none';
      }
    });

    // Acompanhamento apenas supervisor
    const btnAcomp = document.getElementById('btnAcompanhamentoPT');
    if (btnAcomp) {
      btnAcomp.style.display = (perfilUsuario === 'SUPERVISOR') ? 'block' : 'none';
    }

    // Aprovação de termos apenas Admin
    const btnAprovacao = document.getElementById('btnAprovacaoTermos');
    if (btnAprovacao) {
      btnAprovacao.style.display = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br') ? 'block' : 'none';
    }

    // =========================
    // OCULTAR SEÇÕES VAZIAS DO MENU
    // =========================
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
    atosGlobais = atos;
    renderizarListaAtos(atos);
    esconderLoading();
  });
}

async function salvarAto() {
  const id = document.getElementById("atoId").value;
  const escola = document.getElementById("atoEscola").value;
  const tipoAto = document.getElementById("atoTipo").value;
  const cursoEtapa = document.getElementById("atoCursoEtapa").value;
  const numeroAto = document.getElementById("atoNumero").value;
  const dataPublicacao = document.getElementById("atoDataPublicacao").value;
  const dataHomologacao = document.getElementById("atoDataHomologacao").value;
  const validadeAnos = document.getElementById("atoValidadeAnos").value;
  const observacoes = document.getElementById("atoObservacoes").value;
  const arquivoInput = document.getElementById("atoArquivo");
  const file = arquivoInput.files[0];

  if (!escola || !tipoAto || !numeroAto || !dataPublicacao || !dataHomologacao) {
    mostrarToast("Preencha todos os campos obrigatórios.", "warning");
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

// ------ MODELOS DE DOCUMENTOS ------
function carregarModelos() {
  mostrarLoading();
  const url = `${API_URL}?tipo=modelos&email=${emailUsuario}&_=${new Date().getTime()}`;
  jsonp(url, function(modelos) {
    const container = document.getElementById("listaModelosContainer");
    container.innerHTML = "";
    
    if (!modelos || modelos.length === 0) {
      container.innerHTML = "<p>Nenhum modelo disponível no momento.</p>";
      esconderLoading();
      return;
    }
    
    modelos.forEach(modelo => {
      const div = document.createElement("div");
      div.className = "usuario-card";
      div.style.marginBottom = "8px";
      
      const temArquivo = modelo.temArquivo;
      
      div.innerHTML = `
        <div class="usuario-avatar"><i class="fas fa-file-word"></i></div>
        <div class="usuario-info">
          <strong>${modelo.nome}</strong>
          <p>${temArquivo ? modelo.fileName : '<span style="color:#ef4444;">Nenhum arquivo</span>'}</p>
          <div style="margin-top:8px;">
            ${temArquivo ? `
              <a href="${modelo.downloadUrl}" class="btn-pequeno" target="_blank"><i class="fas fa-download"></i> Baixar</a>
              <a href="${modelo.viewUrl}" class="btn-pequeno" target="_blank"><i class="fas fa-eye"></i> Visualizar</a>
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
  
  if (!nome) {
    mostrarToast("Nome do aluno é obrigatório.", "warning");
    return;
  }

  const telefoneNumeros = telefone.replace(/\D/g, '');
  if (telefoneNumeros.length > 0 && telefoneNumeros.length < 10) {
    mostrarToast("Telefone incompleto. Informe DDD + número (mínimo 10 dígitos).", "warning");
    return;
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
    email: emailUsuario
  };
  
  postSemResposta(dados, "Dados atualizados com sucesso!", () => {
    registrarUltimaAcao('Dados de aluno atualizados');   // 🔥

    dadosAlunoAtual.ALUNO = nome;
    dadosAlunoAtual.ID = idAluno;
    dadosAlunoAtual.RESPONSAVEL = responsavel;
    dadosAlunoAtual.TELEFONE = telefone;
    dadosAlunoAtual.TURMA = turma;
    dadosAlunoAtual.ED_ESPECIAL = edEspecial;
    dadosAlunoAtual.OBSERVACOES = observacoes;
    dadosAlunoAtual.CPF_NUMERO = cpfNumero;
    
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
  const email = document.getElementById("novoEmail").value.trim();
  const perfil = document.getElementById("perfil").value;
  const escola = document.getElementById("escola").value.trim();
  const erroDiv = document.getElementById("erroUsuario");
  const btnSalvar = document.getElementById("btnSalvarUsuario");
  
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
  if (alunosImportados.length === 0) return;
  
  const btn = document.getElementById('btnExecutarImportacao');
  const statusDiv = document.getElementById('statusImportacao');
  
  showButtonLoading(btn);
  
  const loteSize = 20;
  let lotesEnviados = 0;
  
  function enviarLote(lote) {
    return new Promise((resolve) => {
      postSemResposta(
        {
          acao: 'importarAlunosLote',
          email: emailUsuario,
          alunos: lote
        },
        null,
        () => {
          lotesEnviados++;
          statusDiv.innerHTML = `Importando lote ${lotesEnviados} de ${Math.ceil(alunosImportados.length / loteSize)}...`;
          resolve();
        }
      );
    });
  }
  
  (async () => {
    try {
      for (let i = 0; i < alunosImportados.length; i += loteSize) {
        const lote = alunosImportados.slice(i, i + loteSize);
        await enviarLote(lote);
      }
      statusDiv.innerHTML = `Importação concluída! ${alunosImportados.length} alunos enviados.`;
      registrarUltimaAcao('Importação de alunos');   // 🔥
      mostrarToast(`Importação concluída! ${alunosImportados.length} alunos processados.`, 'success');
    } catch (error) {
      console.error('Erro na importação:', error);
      mostrarToast('Erro durante a importação.', 'error');
    } finally {
      hideButtonLoading(btn);
      btn.innerHTML = '<i class="fas fa-download"></i> Iniciar Importação';
      carregarAlunos();
    }
  })();
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
          const dataMatricula = linha['Aluno: Data de matrícula'] || '';
          const rawDef = (linha['Aluno: Deficiência, transtorno do espectro autista e altas habilidades ou superdotaçăo'] || '').toLowerCase();
          const edEspecial = rawDef.includes('sim');
          
          return {
            id: linha['id'] || '',               // ← ADICIONE ESTA LINHA
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
            observacaoExtra: ''
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
  const url = `${API_URL}?tipo=auth&email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`;

  jsonp(url, function(resultado) {
    esconderLoading();

    if (resultado.autorizado) {
      emailUsuario = email;
      localStorage.setItem("emailUsuario", email);

      if (resultado.primeiroAcesso) {
        abrirModalAlterarSenhaObrigatorio();
        return;
      }

      // Simplesmente tenta carregar os alunos – o backend decide
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
  
  emailUsuario = "";
  localStorage.removeItem("emailUsuario");

  document.getElementById("app").style.display = "none";
  document.body.style.backgroundImage = "";
  document.body.classList.remove("fundo-personalizado");
  
  // Limpa mensagens de erro no login
  const msgErro = document.getElementById('mensagemLoginErro');
  if (msgErro) msgErro.remove();
  const statusVer = document.getElementById('statusVerificacaoLogin');
  if (statusVer) statusVer.remove();
  document.getElementById("email").disabled = false;
  document.getElementById("senha").disabled = false;
  const btnLogin = document.querySelector('#login button');
  if (btnLogin) btnLogin.disabled = false;

  const loginEl = document.getElementById("login");
  loginEl.style.display = "";
  document.getElementById("email").value = "";
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
        // Remove a classe de obrigatório e fecha o modal
        document.getElementById("modalAlterarSenha").classList.remove("primeiro-acesso");
        fecharModalAlterarSenha();
        // Agora carrega o sistema
        carregarAlunos();
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
          // Captura o ID (a primeira coluna do CSV)
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
            dataMatricula: linha['Aluno: Data de matrícula'] || '',
            cpf: linha['Aluno: CPF'] || '',
            sus: linha['Aluno: Cartão do SUS'] || '',
            certidao: linha['Aluno: Número de matrícula da certidão nascimento'] || '',
            rg: linha['Aluno: Identidade'] || '',
            residencia: linha['Endereço: Código de instalação elétrica'] || ''
          };
        }).filter(a => a.id && a.nome && a.escola);

        // Pré-visualização
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

async function executarPromocaoCSV() {
  if (alunosPromocao.length === 0) return;

  const btn = document.getElementById('btnExecutarPromocao');
  showButtonLoading(btn);

  const loteSize = 20;
  const atrasoEntreLotes = 2000;

  let totalEnviados = 0;

  for (let i = 0; i < alunosPromocao.length; i += loteSize) {
    const lote = alunosPromocao.slice(i, i + loteSize);
    const numeroLote = Math.floor(i / loteSize) + 1;
    const totalLotes = Math.ceil(alunosPromocao.length / loteSize);

    document.getElementById('statusPromocao').innerHTML =
      `Enviando lote ${numeroLote} de ${totalLotes}…`;

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
          resolve();
        }
      );
    });

    await new Promise(r => setTimeout(r, atrasoEntreLotes));
  }

  await new Promise((resolve) => {
    postSemResposta(
      {
        acao: 'finalizarPromocao',
        email: emailUsuario,
        alunos: alunosPromocao
      },
      null,
      () => {
        registrarUltimaAcao('Promoção de alunos');   // 🔥
        mostrarToast(`Promoção concluída! ${totalEnviados} alunos enviados.`, 'success');
        resolve();
      }
    );
  });

  hideButtonLoading(btn);
  fecharModalPromocao();
  carregarAlunos();
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
          const rawDef = (linha['Aluno: Deficiência, transtorno do espectro autista e altas habilidades ou superdotaçăo'] || '').toLowerCase();
          const edEspecial = rawDef.includes('sim');
          return {
            id, nome,
            responsavel: linha['Aluno: Nome do responsável'] || '',
            telefone: extrairPrimeiroTelefone(linha['Aluno: Telefones']),
            escola, turma,
            dataMatricula: linha['Aluno: Data de matrícula'] || '',
            cpf: linha['Aluno: CPF'] || '',
            sus: linha['Aluno: Cartão do SUS'] || '',
            certidao: linha['Aluno: Número de matrícula da certidão nascimento'] || '',
            rg: linha['Aluno: Identidade'] || '',
            residencia: linha['Endereço: Código de instalação elétrica'] || '',
            edEspecial: edEspecial
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

async function executarAtualizarMatriculados() {
  if (alunosAtualizar.length === 0) return;

  const btn = document.getElementById('btnExecutarAtualizarMatriculados');
  showButtonLoading(btn);

  const loteSize = 20;
  const atrasoEntreLotes = 2000;
  let totalEnviados = 0;

  for (let i = 0; i < alunosAtualizar.length; i += loteSize) {
    const lote = alunosAtualizar.slice(i, i + loteSize);
    const numeroLote = Math.floor(i / loteSize) + 1;
    const totalLotes = Math.ceil(alunosAtualizar.length / loteSize);

    document.getElementById('statusAtualizar').innerHTML = `Enviando lote ${numeroLote} de ${totalLotes}…`;

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
          resolve();
        }
      );
    });

    await new Promise(r => setTimeout(r, atrasoEntreLotes));
  }

  registrarUltimaAcao('Atualização de matriculados');   // 🔥
  mostrarToast(`Atualização concluída! ${totalEnviados} alunos enviados.`, 'success');
  hideButtonLoading(btn);
  fecharModalAtualizarMatriculados();
  carregarAlunos();
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
