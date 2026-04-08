const API_URL = "https://script.google.com/macros/s/AKfycbyoqaNL2Ik1XlZDpghG12eS96yUNPFgYRulupEsk5vUk1ae6N8dGDWBYd3JwoNsIbXEzQ/exec";

let dadosGlobais = [];
let emailUsuario = "";
let perfilUsuario = "";
let escolaUsuario = "";
let alteracoesPendentes = {};
let dadosAlunoAtual = null; // guarda o aluno que está aberto no modal

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

function abrirModalDetalhes(aluno) {
  dadosAlunoAtual = aluno;
  
  // Preencher título
  document.getElementById("detalhesTitulo").textContent = aluno.ALUNO;
  
  // Construir HTML dos documentos
  let html = `
    <p style="margin-top:0; color:#64748b; display:flex; gap:12px;">
      <span>🏫 ${aluno.ESCOLA}</span>
      <span>📅 Matrícula: ${new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR')}</span>
    </p>
    <h3 style="margin-bottom:8px;">Documentos</h3>
    <div class="checkboxes-container">
  `;
  
  // Lista de documentos (mesma ordem dos checkboxes originais)
  const docs = [
  { label: "Certidão de Nascimento", coluna: 9, valor: aluno.CERTIDAO },    // I
  { label: "CPF do aluno", coluna: 10, valor: aluno.CPF },                  // J
  { label: "RG do aluno", coluna: 11, valor: aluno.RG },                    // K
  { label: "Carteira de Vacinação", coluna: 12, valor: aluno.VACINA },      // L
  { label: "Cartão do SUS", coluna: 13, valor: aluno.SUS },                 // M
  { label: "Comprovante de Residência", coluna: 14, valor: aluno.RESIDENCIA }, // N
  { label: "Documentos do Responsável", coluna: 15, valor: aluno.RESP_DOCS },  // O
  { label: "Histórico Escolar", coluna: 16, valor: aluno.HISTORICO },       // P
  { label: "Declaração de Transferência", coluna: 17, valor: aluno.DECL_TRANSF } // Q
];  
  docs.forEach(doc => {
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
  
  html += `</div>`;
  
  // Inserir no modal
  document.getElementById("detalhesConteudo").innerHTML = html;
  
  // Exibir modal
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

    // 🔥 VERIFICAÇÃO EXTRA: se alunos não for array, algo deu errado
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

    // Agora passamos apenas o array de alunos
    preencherFiltroEscolas(dados.alunos);
    renderLista(dados.alunos);

    const resumo = gerarResumo(dados.alunos);
    renderPainel(resumo);

    const mapa = resumoPorEscola(dados.alunos);
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

  dados.forEach(aluno => {
    const div = document.createElement("div");
    div.className = "card-compacto fade";
    
    // Determinar classes de status
    let statusClass = "";
    if (aluno.STATUS.includes("✅")) statusClass = "status-completo";
    else if (aluno.STATUS.includes("⚠️")) statusClass = "status-pendente";
    else if (aluno.STATUS.includes("🔴")) statusClass = "status-vencido";

    // Calcular dias restantes ou formatar data
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

    // Avatar com inicial do aluno
    const inicial = aluno.ALUNO ? aluno.ALUNO.charAt(0).toUpperCase() : "?";

    div.innerHTML = `
      <div class="aluno-avatar">${inicial}</div>
      <div class="aluno-info">
        <div class="aluno-nome" title="${aluno.ALUNO}">${aluno.ALUNO}</div>
        <div class="aluno-meta">
          <span class="status-badge ${statusClass}">${aluno.STATUS}</span>
          <span class="prazo-info ${prazoClasse}">${prazoTexto}</span>
        </div>
      </div>
      <div class="aluno-acoes">
        <button class="btn-icone" onclick="abrirAluno(${aluno._row})" title="Abrir ficha">👁️</button>
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

  if (perfilUsuario === "SECRETARIA") {
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
    if (btnNovoAluno) btnNovoAluno.style.display = "inline-block";
    if (filtrosContainer) filtrosContainer.style.display = "none";   // 🔥 esconde filtros
  } else if (perfilUsuario === "SUPERVISOR") {
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "inline-block";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "inline-block";
    if (btnNovoAluno) btnNovoAluno.style.display = "none";
    if (filtrosContainer) filtrosContainer.style.display = "flex";    // 🔥 mostra filtros
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
function preencherFiltroEscolas(dados) {
 if (!Array.isArray(dados)) {
    console.error("preencherFiltroEscolas: dados não é array", dados);
    return;
  }    
  const select = document.getElementById("filtroEscola");

  select.innerHTML = '<option value="">Todas as escolas</option>';

  const escolas = [...new Set(dados.map(a => a.ESCOLA))];

  escolas.forEach(escola => {
    const option = document.createElement("option");
    option.value = escola;
    option.textContent = escola;
    select.appendChild(option);
  });
}

function filtrarPorEscola() {
  // Simplesmente chama a função que combina os dois filtros
  filtrarPorNome();
}

function filtrarPorNome() {
  // 1. Pega o texto digitado e converte para minúsculas
  const termo = document.getElementById("pesquisaNome").value.toLowerCase();
  
  // 2. Pega a escola selecionada no filtro de escolas
  const escolaSelecionada = document.getElementById("filtroEscola").value;
  
  // 3. Começa com todos os alunos (dadosGlobais)
  let dadosFiltrados = dadosGlobais;
  
  // 4. Se uma escola foi selecionada, filtra primeiro por escola
  if (escolaSelecionada) {
    dadosFiltrados = dadosFiltrados.filter(a => a.ESCOLA === escolaSelecionada);
  }
  
  // 5. Se algo foi digitado, filtra pelo nome do aluno
  if (termo) {
    dadosFiltrados = dadosFiltrados.filter(a => 
      a.ALUNO.toLowerCase().includes(termo)
    );
  }
  
  // 6. Renderiza a lista com os dados filtrados
  renderLista(dadosFiltrados);
}


function abrirNovoAluno() {
  document.getElementById("novoAluno").style.display = "flex";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";
  // Exibir a escola da secretária logada
  document.getElementById("escolaVinculada").textContent = 
    `Aluno será matriculado em: ${escolaUsuario}`;
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
  document.getElementById("escola").value = "";
  document.getElementById("erroUsuario").style.display = "none";
  
  // Se for Supervisor, mostrar campo escola; se não, esconder? (Melhor mostrar sempre e validar)
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

  const nome = nomeInput ? nomeInput.value.trim() : "";
  const responsavel = responsavelInput ? responsavelInput.value.trim() : "";
  const telefone = telefoneInput ? telefoneInput.value.trim() : "";

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

      // Fechar modal e voltar à lista
      document.getElementById("novoAluno").style.display = "none";
      document.getElementById("lista").style.display = "block";
      document.getElementById("painel").style.display = "block";

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
  if (lista) lista.style.display = "block";
  if (painel) painel.style.display = "block";

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

  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "block";

  document.getElementById("email").value = "";

  dadosGlobais = [];
}


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
