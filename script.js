const API_URL = "https://script.google.com/macros/s/AKfycbyoqaNL2Ik1XlZDpghG12eS96yUNPFgYRulupEsk5vUk1ae6N8dGDWBYd3JwoNsIbXEzQ/exec";

let dadosGlobais = [];
let emailUsuario = "";
let perfilUsuario = "";
let escolaUsuario = "";
let alteracoesPendentes = {};
let dadosAlunoAtual = null; // guarda o aluno que está aberto no modal
let turmasDisponiveis = []; // armazenará as turmas para os filtros

// Lista oficial de escolas (disponível para o supervisor)
const LISTA_ESCOLAS = [
  "CEEFMTI Afonso Cláudio",
  "CEEFMTI Elisa Paiva",
  "EEEF Ivana Casagrande Scabelo",
  "EEEF Severino Paste",
  "EEEFM Alto Rio Possmoser",
  "EEEFM Álvaro Castelo",
  "EEEFM Domingos Perim",
  "EEEFM Elvira Barros",
  "EEEFM Fazenda Camporês",
  "EEEFM Fazenda Emílio Schroeder",
  "EEEFM Fioravante Caliman",
  "EEEFM Frederico Boldt",
  "EEEFM Gisela Salloker Fayet",
  "EEEFM Graça Aranha",
  "EEEFM Joaquim Caetano de Paiva",
  "EEEFM José Cupertino",
  "EEEFM José Giestas",
  "EEEFM José Roberto Christo",
  "EEEFM Leogildo Severiano de Souza",
  "EEEFM Luiz Jouffroy",
  "EEEFM Maria de Abreu Alvim",
  "EEEFM Mário Bergamin",
  "EEEFM Marlene Brandão",
  "EEEFM Pedra Azul",
  "EEEFM Ponto do Alto",
  "EEEFM Profª Aldy Soares Merçon Vargas",
  "EEEFM Prof Hermman Berger",
  "EEEFM São Jorge",
  "EEEFM São Luís",
  "EEEFM Teófilo Paulino",
  "EEEM Francisco Guilherme",
  "EEEM Mata fria",
  "EEEM Sobreiro"
];

function mostrarLoading() {
  document.getElementById("loading").style.display = "flex";
}

function esconderLoading() {
  document.getElementById("loading").style.display = "none";
}
// =========================
// LOGIN
// =========================
function login() {
  const email = document.getElementById("email").value;

  if (!email) {
    alert("Digite um e-mail");
    return;
  }

  emailUsuario = email;

  // 💾 salva no navegador
  localStorage.setItem("emailUsuario", email);

  carregarAlunos();
}

// Preenche os selects de filtro (escola, turma, status)
function inicializarFiltros() {
  // Preencher escolas (apenas supervisor, mas já preenchemos para usar no filtro de turmas)
  const selectEscola = document.getElementById("filtroEscola");
  if (selectEscola) {
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    LISTA_ESCOLAS.forEach(esc => {
      const opt = document.createElement("option");
      opt.value = esc;
      opt.textContent = esc;
      selectEscola.appendChild(opt);
    });
  }

  // Status já está fixo no HTML, nada a fazer.

  // Turmas serão carregadas dinamicamente conforme a escola selecionada
  carregarTurmasParaFiltro();
}

// Carrega turmas para o select de filtro (baseado na escola selecionada ou perfil)
async function carregarTurmasParaFiltro() {
  const selectTurma = document.getElementById("filtroTurma");
  if (!selectTurma) return;

  let escolaFiltro = "";
  if (perfilUsuario === "SUPERVISOR") {
    escolaFiltro = document.getElementById("filtroEscola").value;
  } else {
    escolaFiltro = escolaUsuario; // secretaria vê apenas turmas da própria escola
  }

  if (!escolaFiltro) {
    // Se nenhuma escola selecionada, mostra placeholder
    selectTurma.innerHTML = '<option value="">Selecione uma escola primeiro</option>';
    return;
  }

  selectTurma.innerHTML = '<option value="">Carregando turmas...</option>';

  try {
    const resp = await fetch(`${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escolaFiltro)}`);
    const turmas = await resp.json();
    turmasDisponiveis = turmas;

    selectTurma.innerHTML = '<option value="">Todas as turmas</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      selectTurma.appendChild(opt);
    });
  } catch (e) {
    selectTurma.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

function abrirModalTurmas() {
  document.getElementById("modalTurmas").style.display = "flex";
  carregarTurmas();
}

function abrirModalDetalhes(aluno) {
  dadosAlunoAtual = aluno;
  
  document.getElementById("detalhesTitulo").textContent = aluno.ALUNO;
  
  let html = `
    <p style="margin-top:0; color:#64748b; display:flex; gap:12px;">
      <span>🏫 ${aluno.ESCOLA}</span>
      <span>📅 Matrícula: ${new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR')}</span>
    </p>
    <h3 style="margin-bottom:8px;">Documentos</h3>
    <div class="checkboxes-container">
  `;
  
  // Lista de documentos básicos (9 itens)
  const docsBasicos = [
    { label: "Certidão de Nascimento", coluna: 9, valor: aluno.CERTIDAO },
    { label: "CPF do aluno", coluna: 10, valor: aluno.CPF },
    { label: "RG do aluno", coluna: 11, valor: aluno.RG },
    { label: "Carteira de Vacinação", coluna: 12, valor: aluno.VACINA },
    { label: "Cartão do SUS", coluna: 13, valor: aluno.SUS },
    { label: "Comprovante de Residência", coluna: 14, valor: aluno.RESIDENCIA },
    { label: "Documentos do Responsável", coluna: 15, valor: aluno.RESP_DOCS },
    { label: "Histórico Escolar", coluna: 16, valor: aluno.HISTORICO },
    { label: "Declaração de Transferência", coluna: 17, valor: aluno.DECL_TRANSF }
  ];
  
  // Adiciona os básicos
  docsBasicos.forEach(doc => {
    const chave = `${aluno._row}_${doc.coluna}`;
    const checked = (alteracoesPendentes.hasOwnProperty(chave)) ? alteracoesPendentes[chave] : doc.valor;
    html += `
      <div class="checkbox-moderno">
        <input type="checkbox" 
          id="doc_${doc.coluna}" 
          ${checked ? "checked" : ""} 
          onchange="marcarAlteracao(${aluno._row}, ${doc.coluna}, this.checked)">
        <label for="doc_${doc.coluna}">${doc.label}</label>
      </div>
    `;
  });
  
  // Se o aluno for da Educação Especial, adiciona o documento extra
  if (aluno.ED_ESPECIAL === true) {
    const docEspecial = { label: "Laudo/Relatório Pedagógico (Ed. Especial)", coluna: 18, valor: aluno.ED_ESPECIAL };
    const chave = `${aluno._row}_${docEspecial.coluna}`;
    const checked = (alteracoesPendentes.hasOwnProperty(chave)) ? alteracoesPendentes[chave] : false;
    html += `
      <div class="checkbox-moderno">
        <input type="checkbox" 
          id="doc_${docEspecial.coluna}" 
          ${checked ? "checked" : ""} 
          onchange="marcarAlteracao(${aluno._row}, ${docEspecial.coluna}, this.checked)">
        <label for="doc_${docEspecial.coluna}">${docEspecial.label}</label>
      </div>
    `;
  }
  
  html += `</div>`;
  
  document.getElementById("detalhesConteudo").innerHTML = html;
  document.getElementById("modalDetalhes").style.display = "flex";
}

function fecharModalDetalhes() {
  document.getElementById("modalDetalhes").style.display = "none";
  dadosAlunoAtual = null;
}

function marcarAlteracao(row, coluna, valor) {
  const chave = `${row}_${coluna}`;
  alteracoesPendentes[chave] = valor;
  console.log(`📝 Alteração pendente: linha ${row}, coluna ${coluna} = ${valor}`);
}

async function alterarSituacaoAluno(novaSituacao) {
  if (!dadosAlunoAtual) return;
  
  const confirmacao = confirm(`Deseja marcar este aluno como "${novaSituacao}"?`);
  if (!confirmacao) return;
  
  mostrarLoading();
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "alterarSituacao",
        row: dadosAlunoAtual._row,
        situacao: novaSituacao,
        email: emailUsuario
      })
    });
    const result = await resp.json();
    if (result.status === "ok") {
      fecharModalDetalhes();
      await carregarAlunos();
    } else {
      alert("Erro: " + (result.msg || "Tente novamente"));
    }
  } catch (e) {
    console.error(e);
    alert("Erro de conexão.");
  }
  esconderLoading();
}

// =========================
// CARREGAR DADOS
// =========================
async function carregarAlunos() {
  mostrarLoading();
  try {
    const resposta = await fetch(`${API_URL}?email=${emailUsuario}`);
    const dados = await resposta.json();

    if (dados.erro) {
      alert("Acesso não autorizado");
      esconderLoading();
      return;
    }

    // Guardar perfil/escola
    perfilUsuario = dados.perfil;
    escolaUsuario = dados.escola;

    document.getElementById("escolaUsuarioDisplay").textContent = 
      perfilUsuario === "SUPERVISOR" ? "🔭 Supervisor" : `🏫 ${escolaUsuario}`;

    // Verificação extra: se alunos não for array, algo deu errado
    if (!Array.isArray(dados.alunos)) {
      console.error("Resposta inválida, 'alunos' não é array:", dados);
      alert("Erro na comunicação com o servidor.");
      esconderLoading();
      return;
    }

    dadosGlobais = dados.alunos;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    ajustarInterfacePorPerfil();

    // Inicializar os filtros (preenche selects de escola, status etc.)
    inicializarFiltros();

    // Para secretária, carregar imediatamente as turmas da escola dela
    if (perfilUsuario === "SECRETARIA") {
      await carregarTurmasParaFiltro();
    }

    // Renderizar a lista com todos os alunos (os filtros ainda estão vazios)
    renderLista(dadosGlobais);

    // Atualizar painel de resumo
    const resumo = gerarResumo(dadosGlobais);
    renderPainel(resumo);

    // Resumo por escola (opcional, pode manter ou remover)
    const mapa = resumoPorEscola(dadosGlobais);
    renderPorEscola(mapa);

  } catch (erro) {
    console.error("Erro:", erro);
  }
  esconderLoading();
}
// =========================
// LISTA
// =========================
function renderLista(dados) {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  lista.style.display = "grid";
  lista.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
  lista.style.gap = "12px";
  lista.style.padding = "0 20px 20px";

  dados.forEach(aluno => {
    const div = document.createElement("div");
    div.className = "fade"; // apenas para animação
    
    // Estilos inline para garantir o layout compacto
    div.style.background = "white";
    div.style.borderRadius = "16px";
    div.style.padding = "12px 16px";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
    div.style.border = "1px solid #f1f5f9";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "12px";
    div.style.transition = "all 0.2s";
    
    // Determinar classes de status (ainda usamos para cores)
    let statusClass = "";
    if (aluno.STATUS.includes("✅")) statusClass = "status-completo";
    else if (aluno.STATUS.includes("⚠️")) statusClass = "status-pendente";
    else if (aluno.STATUS.includes("🔴")) statusClass = "status-vencido";

    // Calcular dias restantes
    let prazoTexto = "";
    let prazoClasse = "";
    if (aluno.PRAZO_FINAL) {
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      const prazo = new Date(aluno.PRAZO_FINAL);
      prazo.setHours(0,0,0,0);
      const diff = Math.floor((prazo - hoje) / (1000*60*60*24));
      
      if (diff < 0) {
        prazoTexto = `🔴 Vencido há ${Math.abs(diff)} dia(s)`;
        prazoClasse = "prazo-urgente";
      } else if (diff === 0) {
        prazoTexto = "🟡 Vence hoje";
        prazoClasse = "prazo-atencao";
      } else if (diff <= 5) {
        prazoTexto = `🟡 ${diff} dia(s) restante(s)`;
        prazoClasse = "prazo-atencao";
      } else {
        prazoTexto = `🟢 ${diff} dias restantes`;
        prazoClasse = "prazo-normal";
      }
    } else {
      prazoTexto = "📅 Sem prazo";
      prazoClasse = "";
    }

    const inicial = aluno.ALUNO ? aluno.ALUNO.charAt(0).toUpperCase() : "?";

    div.innerHTML = `
      <div class="aluno-avatar" style="width:44px;height:44px;background:#e0e7ff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#2563eb;flex-shrink:0;">${inicial}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;color:#0f172a;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;" title="${aluno.ALUNO}">${aluno.ALUNO}</div>
        ${aluno.TURMA ? `<div style="font-size:11px;color:#64748b;margin-bottom:4px;">📚 ${aluno.TURMA}</div>` : ''}
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
          <span class="status-badge ${statusClass}" style="padding:2px 8px;border-radius:40px;font-size:11px;font-weight:500;">${aluno.STATUS}</span>
          <span class="prazo-info ${prazoClasse}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#64748b;">${prazoTexto}</span>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button onclick="abrirAluno(${aluno._row})" title="Abrir ficha" style="background:none;border:none;font-size:20px;padding:6px;border-radius:40px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all 0.2s;">👁️</button>
      </div>
    `;

    lista.appendChild(div);
  });
}
function ajustarInterfacePorPerfil() {
  const btnCadastroUsuario = document.querySelector("button[onclick*='abrirModalCadastroUsuario']");
  const btnListarUsuarios = document.querySelector("button[onclick*='abrirModalListaUsuarios']");
  const btnNovoAluno = document.querySelector("button[onclick*='abrirNovoAluno']");
  const filtrosContainer = document.querySelector(".filtros-container");
  const btnTurmas = document.getElementById("btnTurmas");
  const filtroEscolaWrapper = document.getElementById("filtroEscolaWrapper");
  const filtroTurmaWrapper = document.getElementById("filtroTurmaWrapper");
  const filtroStatusWrapper = document.getElementById("filtroStatusWrapper");

  if (perfilUsuario === "SECRETARIA") {
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "none";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
    if (btnNovoAluno) btnNovoAluno.style.display = "inline-block";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "none";
    
  } else if (perfilUsuario === "SUPERVISOR") {
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "block";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "inline-block";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "inline-block";
    if (btnNovoAluno) btnNovoAluno.style.display = "none";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "inline-block";
  }
}

// =========================
// DETALHE
// =========================
function abrirAluno(row) {
  const aluno = dadosGlobais.find(a => a._row == row);
  if (!aluno) {
    alert("Aluno não encontrado");
    return;
  }
  abrirModalDetalhes(aluno);
}

// =========================
// CHECKBOX
// =========================
function checkbox(label, valor, row, coluna) {
  const chave = `${row}_${coluna}`;
  // Se houver alteração pendente para esta célula, use esse valor; senão, use o valor original do aluno
  const checked = (alteracoesPendentes.hasOwnProperty(chave)) ? alteracoesPendentes[chave] : valor;
  
  return `
    <label>
      <input type="checkbox" 
        ${checked ? "checked" : ""} 
        onchange="marcarAlteracao(${row}, ${coluna}, this.checked)">
      ${label}
    </label><br>
  `;
}

async function salvarAlteracoesEmLote(row) {
  const alteracoes = [];
  
  for (let chave in alteracoesPendentes) {
    const [linha, coluna] = chave.split('_').map(Number);
    if (linha === row) { // só envia alterações da linha atual (aluno aberto)
      alteracoes.push({
        row: linha,
        coluna: coluna,
        valor: alteracoesPendentes[chave]
      });
    }
  }
  
  if (alteracoes.length === 0) {
    alert("Nenhuma alteração para salvar.");
    return;
  }
  
  mostrarLoading();
  
  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "atualizarDocumentosEmLote",
        alteracoes: alteracoes,
        email: emailUsuario
      })
    });
    
    const resultado = await resposta.json();
    
    if (resultado.status === "ok") {
    // Limpar pendências da linha salva
    for (let chave in alteracoesPendentes) {
        const [linha] = chave.split('_').map(Number);
        if (linha === row) delete alteracoesPendentes[chave];
    }
    
    // Fechar o modal
    fecharModalDetalhes();
    
    // Recarregar os dados da lista (já atualiza tudo)
    await carregarAlunos();
    } else {
    alert("Erro ao salvar: " + (resultado.msg || "Tente novamente"));
    }
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro de conexão.");
  }
  
  esconderLoading();
}

// =========================
// ATUALIZAR
// =========================
async function atualizar(row, coluna, valor) {
  mostrarLoading();

  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        row: row,
        coluna: coluna,
        valor: valor,
        email: emailUsuario
      })
    });

  } catch (erro) {
    alert("Erro ao salvar");
  }

  esconderLoading();
}

// =========================
// FILTRO
// =========================
function preencherFiltroEscolas() {
  const select = document.getElementById("filtroEscola");
  select.innerHTML = '<option value="">Todas as escolas</option>';
  LISTA_ESCOLAS.forEach(escola => {
    const option = document.createElement("option");
    option.value = escola;
    option.textContent = escola;
    select.appendChild(option);
  });
}

function aplicarFiltros() {
  const termoNome = document.getElementById("pesquisaNome").value.toLowerCase();
  const escolaSelecionada = document.getElementById("filtroEscola")?.value || "";
  const turmaSelecionada = document.getElementById("filtroTurma")?.value || "";
  const statusSelecionado = document.getElementById("filtroStatus")?.value || "";

  let dadosFiltrados = dadosGlobais;

  // Filtro por escola (supervisor)
  if (perfilUsuario === "SUPERVISOR" && escolaSelecionada) {
    dadosFiltrados = dadosFiltrados.filter(a => a.ESCOLA === escolaSelecionada);
  }

  // Filtro por turma
  if (turmaSelecionada) {
    dadosFiltrados = dadosFiltrados.filter(a => a.TURMA === turmaSelecionada);
  }

  // Filtro por status
  if (statusSelecionado) {
    dadosFiltrados = dadosFiltrados.filter(a => a.STATUS === statusSelecionado);
  }

  // Filtro por nome
  if (termoNome) {
    dadosFiltrados = dadosFiltrados.filter(a =>
      a.ALUNO.toLowerCase().includes(termoNome)
    );
  }

  // Dentro de aplicarFiltros, após os outros filtros:
  if (perfilUsuario === "SECRETARIA") {
    dadosFiltrados = dadosFiltrados.filter(a => a.SITUACAO === "Ativo");
  }

  renderLista(dadosFiltrados);
}
  
  
async function carregarTurmasParaCadastro(escola) {
  const select = document.getElementById("selectTurmaAluno");
  select.innerHTML = '<option value="">Carregando turmas...</option>';
  try {
    const resp = await fetch(`${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`);
    const turmas = await resp.json();
    select.innerHTML = '<option value="">Selecione a turma</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      select.appendChild(opt);
    });
  } catch (e) {
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

function abrirNovoAluno() {
  document.getElementById("novoAluno").style.display = "flex";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";
  // Exibir a escola da secretária logada
  document.getElementById("escolaVinculada").textContent = 
    `Aluno será matriculado em: ${escolaUsuario}`;
  carregarTurmasParaCadastro(escolaUsuario);
}

// =========================
// GESTÃO DE USUÁRIOS (MODAIS)
// =========================

function abrirModalListaUsuarios() {
  document.getElementById("modalListaUsuarios").style.display = "flex";
  carregarUsuarios();
}

function fecharModalListaUsuarios() {
  document.getElementById("modalListaUsuarios").style.display = "none";
}

function abrirModalCadastroUsuario() {
  // Limpar campos
  document.getElementById("novoEmail").value = "";
  document.getElementById("perfil").value = "SECRETARIA";
  document.getElementById("erroUsuario").style.display = "none";

  // Preencher dropdown de escolas (usando a constante LISTA_ESCOLAS)
  const selectEscola = document.getElementById("escola");
  selectEscola.innerHTML = '<option value="">Selecione a escola</option>';
  LISTA_ESCOLAS.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectEscola.appendChild(opt);
  });
  selectEscola.value = ""; // garante que nenhuma escola fique selecionada

  document.getElementById("modalCadastroUsuario").style.display = "flex";
}

function fecharModalCadastroUsuario() {
  document.getElementById("modalCadastroUsuario").style.display = "none";
}

// Atualiza a lista de usuários no modal
async function carregarUsuarios() {
  mostrarLoading();
  try {
    const resposta = await fetch(`${API_URL}?tipo=usuarios&email=${emailUsuario}`);
    const dados = await resposta.json();

    if (dados.erro) {
      alert("Acesso não autorizado");
      esconderLoading();
      return;
    }

    renderUsuarios(dados);
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro ao carregar usuários");
  }
  esconderLoading();
}

function renderUsuarios(usuarios) {
  const container = document.getElementById("listaUsuariosContainer");
  container.innerHTML = "";

  if (!Array.isArray(usuarios)) {
    container.innerHTML = "<p>Erro ao carregar usuários</p>";
    return;
  }

  if (usuarios.length === 0) {
    container.innerHTML = "<p>Nenhum usuário cadastrado</p>";
    return;
  }

  usuarios.forEach(u => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    
    const perfilClass = u.PERFIL === "SUPERVISOR" ? "perfil-supervisor" : "perfil-secretaria";
    const avatarIcon = u.PERFIL === "SUPERVISOR" ? "👑" : "📋";
    
    div.innerHTML = `
      <div class="usuario-avatar">${avatarIcon}</div>
      <div class="usuario-info">
        <strong>${u.EMAIL}</strong>
        <p>🏫 ${u.ESCOLA || "—"} · <span class="perfil-badge ${perfilClass}">${u.PERFIL}</span></p>
      </div>
    `;
    container.appendChild(div);
  });
}

// Salvar usuário (atualizada)
async function salvarUsuario() {
  const email = document.getElementById("novoEmail").value.trim();
  const perfil = document.getElementById("perfil").value;
  const escola = document.getElementById("escola").value.trim();
  const erroDiv = document.getElementById("erroUsuario");
  
  // Validação
  if (!email) {
    erroDiv.textContent = "E-mail obrigatório";
    erroDiv.style.display = "block";
    return;
  }
  if (perfil === "SECRETARIA" && !escola) {
    erroDiv.textContent = "Escola obrigatória para Secretaria";
    erroDiv.style.display = "block";
    return;
  }
  erroDiv.style.display = "none";
  
  const btnSalvar = document.getElementById("btnSalvarUsuario");
  const btnText = btnSalvar.querySelector(".btn-text");
  const spinner = btnSalvar.querySelector(".spinner-btn");
  
  btnText.style.display = "none";
  spinner.style.display = "inline-block";
  btnSalvar.disabled = true;
  
  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "cadastrarUsuario",
        email: email,
        perfil: perfil,
        escola: escola
      })
    });
    
    const resultado = await resposta.json();
    
    if (resultado.status === "ok") {
      btnText.textContent = "✅ Cadastrado!";
      spinner.style.display = "none";
      btnText.style.display = "inline";
      await new Promise(r => setTimeout(r, 600));
      
      fecharModalCadastroUsuario();
      // Se o modal de lista estiver aberto, recarregar a lista
      if (document.getElementById("modalListaUsuarios").style.display === "flex") {
        carregarUsuarios();
      }
    } else {
      erroDiv.textContent = resultado.msg || "Erro ao cadastrar";
      erroDiv.style.display = "block";
    }
  } catch (erro) {
    console.error(erro);
    erroDiv.textContent = "Erro de conexão";
    erroDiv.style.display = "block";
  } finally {
    btnText.textContent = "Salvar";
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btnSalvar.disabled = false;
  }
}

async function salvarAluno() {
  const nomeInput = document.getElementById("nomeAluno");
  const responsavelInput = document.getElementById("nomeResponsavel");
  const telefoneInput = document.getElementById("telefoneContato");
  const edEspecialCheck = document.getElementById("alunoEdEspecial");

  const nome = nomeInput ? nomeInput.value.trim() : "";
  const responsavel = responsavelInput ? responsavelInput.value.trim() : "";
  const telefone = telefoneInput ? telefoneInput.value.trim() : "";
  const edEspecial = edEspecialCheck ? edEspecialCheck.checked : false;   // ✅ declaração correta

  const erroDiv = document.getElementById("erroNome");
  const btnSalvar = document.getElementById("btnSalvarAluno");
  const btnText = btnSalvar.querySelector(".btn-text");
  const spinner = btnSalvar.querySelector(".spinner-btn");

  // Validação (apenas nome obrigatório)
  if (!nome) {
    if (erroDiv) erroDiv.style.display = "block";
    if (nomeInput) nomeInput.style.borderColor = "#dc2626";
    return;
  }

  if (erroDiv) erroDiv.style.display = "none";
  if (nomeInput) nomeInput.style.borderColor = "#e2e8f0";

  // Mostrar loading no botão
  btnText.style.display = "none";
  spinner.style.display = "inline-block";
  btnSalvar.disabled = true;

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "cadastrarAluno",
        nome: nome,
        responsavel: responsavel,
        telefone: telefone,
        turma: document.getElementById("selectTurmaAluno").value,
        edEspecial: edEspecial,   // ✅ enviando o valor
        email: emailUsuario
      })
    });

    const resultado = await resposta.json();

    if (resultado.status === "ok") {
      btnText.textContent = "✅ Cadastrado!";
      spinner.style.display = "none";
      btnText.style.display = "inline";

      // Limpar campos
      if (nomeInput) nomeInput.value = "";
      if (responsavelInput) responsavelInput.value = "";
      if (telefoneInput) telefoneInput.value = "";
      if (edEspecialCheck) edEspecialCheck.checked = false;
      document.getElementById("selectTurmaAluno").selectedIndex = 0;

      // Fechar modal e voltar à lista
      document.getElementById("novoAluno").style.display = "none";
      document.getElementById("lista").style.display = "";
      document.getElementById("painel").style.display = "";

      await carregarAlunos(); // recarrega a lista
    } else {
      alert("Erro: " + (resultado.msg || "Tente novamente"));
    }
  } catch (erro) {
    console.error(erro);
    alert("Erro de conexão.");
  } finally {
    btnText.textContent = "Salvar";
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btnSalvar.disabled = false;
  }
}
function voltarApp() {
  // Esconde os modais (com verificação)
  const idsParaEsconder = ["usuarios", "cadastro", "novoAluno", "modalListaUsuarios", "modalCadastroUsuario"];
  idsParaEsconder.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Mostra lista e painel
  const lista = document.getElementById("lista");
  const painel = document.getElementById("painel");
  if (lista) lista.style.display = "";
  if (painel) painel.style.display = "";

  // Limpa campos do cadastro de aluno (se existirem)
  const nomeAluno = document.getElementById("nomeAluno");
  if (nomeAluno) {
    nomeAluno.value = "";
    nomeAluno.style.borderColor = "#e2e8f0";
  }
  const erroNome = document.getElementById("erroNome");
  if (erroNome) erroNome.style.display = "none";

  const nomeResp = document.getElementById("nomeResponsavel");
  if (nomeResp) nomeResp.value = "";

  const tel = document.getElementById("telefoneContato");
  if (tel) tel.value = "";

  // 🔥 LIMPA O CHECKBOX DE EDUCAÇÃO ESPECIAL
  const edEspCheck = document.getElementById("alunoEdEspecial");
  if (edEspCheck) edEspCheck.checked = false;
}
// =========================
// PAINEL
// =========================
function gerarResumo(dados) {
  let resumo = {
    total: dados.length,
    completos: 0,
    pendentes: 0,
    vencidos: 0
  };

  dados.forEach(aluno => {
    if (aluno.STATUS === "✅ Completo") resumo.completos++;
    if (aluno.STATUS === "⚠️ Pendente") resumo.pendentes++;
    if (aluno.ALERTA === "🔴 Vencido") resumo.vencidos++;
  });

  return resumo;
}

function renderPainel(resumo) {
  const painel = document.getElementById("painel");
  painel.innerHTML = `
    <div class="metrica-card">
      <div class="metrica-titulo">📋 Total de alunos</div>
      <div class="metrica-valor">${resumo.total}</div>
      <div class="metrica-detalhe">matriculados</div>
    </div>
    <div class="metrica-card">
      <div class="metrica-titulo">✅ Completos</div>
      <div class="metrica-valor">${resumo.completos}</div>
      <div class="metrica-detalhe">documentação ok</div>
    </div>
    <div class="metrica-card">
      <div class="metrica-titulo">⚠️ Pendentes</div>
      <div class="metrica-valor">${resumo.pendentes}</div>
      <div class="metrica-detalhe">faltam documentos</div>
    </div>
    <div class="metrica-card">
      <div class="metrica-titulo">🔴 Vencidos</div>
      <div class="metrica-valor">${resumo.vencidos}</div>
      <div class="metrica-detalhe">prazo expirado</div>
    </div>
  `;
}

// =========================
// POR ESCOLA
// =========================
function resumoPorEscola(dados) {
  const mapa = {};

  dados.forEach(aluno => {
    const escola = aluno.ESCOLA;

    if (!mapa[escola]) {
      mapa[escola] = { total: 0, pendentes: 0 };
    }

    mapa[escola].total++;

    if (aluno.STATUS === "⚠️ Pendente") {
      mapa[escola].pendentes++;
    }
  });

  return mapa;
}

function renderPorEscola(mapa) {
  const painel = document.getElementById("painel");

  let html = `<div class="card"><h3>🏫 Por Escola</h3>`;

  for (let escola in mapa) {
    html += `
      <p>
        ${escola}: 
        ${mapa[escola].pendentes} pendentes / ${mapa[escola].total}
      </p>
    `;
  }

  html += `</div>`;

  painel.innerHTML += html;
}

// =========================
// LOGOUT
// =========================
function logout() {
  if (!confirm("Deseja sair do sistema?")) return;

  emailUsuario = "";
  localStorage.removeItem("emailUsuario");

  // Esconde o app
  document.getElementById("app").style.display = "none";
  
  // Mostra o login removendo qualquer estilo inline para que o CSS (flex) funcione
  const loginEl = document.getElementById("login");
  loginEl.style.display = "";   // ✅ remove display inline, volta ao padrão CSS

  document.getElementById("email").value = "";
  dadosGlobais = [];
}

// =========================
// GESTÃO DE TURMAS (SUPERVISOR)
// =========================

let turmasGlobais = [];

async function carregarTurmas(escola = "") {
  mostrarLoading();
  try {
    const url = `${API_URL}?tipo=turmas&email=${emailUsuario}` + (escola ? `&escola=${encodeURIComponent(escola)}` : "");
    const resposta = await fetch(url);
    const turmas = await resposta.json();
    turmasGlobais = turmas;
    renderListaTurmas(turmas);
    preencherSelectEscolasTurma();
  } catch (erro) {
    console.error("Erro ao carregar turmas:", erro);
    alert("Erro ao carregar turmas.");
  }
  esconderLoading();
}

function renderListaTurmas(turmas) {
  const container = document.getElementById("listaTurmasContainer");
  if (!container) return;
  container.innerHTML = "";
  if (!turmas.length) {
    container.innerHTML = "<p>Nenhuma turma cadastrada.</p>";
    return;
  }
  turmas.forEach(t => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    div.innerHTML = `
      <div class="usuario-avatar">📚</div>
      <div class="usuario-info">
        <strong>${t.turma}</strong>
        <p>🏫 ${t.escola}</p>
      </div>
    `;
    container.appendChild(div);
  });
}

function preencherSelectEscolasTurma() {
  const selectFiltro = document.getElementById("filtroEscolaTurma");
  const selectCadastro = document.getElementById("selectEscolaTurma");
  
  [selectFiltro, selectCadastro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Todas as escolas</option>';
    LISTA_ESCOLAS.forEach(esc => {
      const opt = document.createElement("option");
      opt.value = esc;
      opt.textContent = esc;
      select.appendChild(opt);
    });
  });
}

function fecharModalTurmas() {
  document.getElementById("modalTurmas").style.display = "none";
}

function abrirModalCadastroTurma() {
  document.getElementById("modalCadastroTurma").style.display = "flex";
  preencherSelectEscolasTurma();
}

function fecharModalCadastroTurma() {
  document.getElementById("modalCadastroTurma").style.display = "none";
  document.getElementById("nomeTurma").value = "";
  document.getElementById("erroTurma").style.display = "none";
}

async function salvarTurma() {
  const escola = document.getElementById("selectEscolaTurma").value;
  const turma = document.getElementById("nomeTurma").value.trim();
  const erroDiv = document.getElementById("erroTurma");
  if (!escola || !turma) {
    erroDiv.textContent = "Preencha todos os campos";
    erroDiv.style.display = "block";
    return;
  }
  erroDiv.style.display = "none";
  mostrarLoading();
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "cadastrarTurma",
        email: emailUsuario,
        escola: escola,
        turma: turma
      })
    });
    const result = await resp.json();
    if (result.status === "ok") {
      fecharModalCadastroTurma();
      carregarTurmas(document.getElementById("filtroEscolaTurma").value);
    } else {
      erroDiv.textContent = result.msg;
      erroDiv.style.display = "block";
    }
  } catch (e) {
    erroDiv.textContent = "Erro de conexão";
    erroDiv.style.display = "block";
  }
  esconderLoading();
}

// Listener para filtro de turmas (pode ficar aqui)
document.addEventListener("DOMContentLoaded", function() {
  const filtro = document.getElementById("filtroEscolaTurma");
  if (filtro) {
    filtro.addEventListener("change", function() {
      carregarTurmas(this.value);
    });
  }
});

// =========================
// AUTO LOGIN
// =========================
window.onload = function () {
  const emailSalvo = localStorage.getItem("emailUsuario");

  if (emailSalvo) {
    emailUsuario = emailSalvo;
    document.getElementById("email").value = emailSalvo;
    carregarAlunos();
  }
};

document.getElementById("novoAluno").addEventListener("click", function(e) {
  if (e.target === this) {
    voltarApp();
  }
});

document.getElementById("modalDetalhes").addEventListener("click", function(e) {
  if (e.target === this) {
    fecharModalDetalhes();
  }
});

document.getElementById("modalListaUsuarios").addEventListener("click", function(e) {
  if (e.target === this) fecharModalListaUsuarios();
});

document.getElementById("modalCadastroUsuario").addEventListener("click", function(e) {
  if (e.target === this) fecharModalCadastroUsuario();
});

document.getElementById("filtroEscola")?.addEventListener("change", function() {
  carregarTurmasParaFiltro();
  aplicarFiltros();
});
