const API_URL = "https://script.google.com/macros/s/AKfycbyoqaNL2Ik1XlZDpghG12eS96yUNPFgYRulupEsk5vUk1ae6N8dGDWBYd3JwoNsIbXEzQ/exec";

let dadosGlobais = [];
let emailUsuario = "";
let perfilUsuario = "";
let escolaUsuario = "";
let alteracoesPendentes = {};

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
    div.className = "card fade";
    
    let statusClass = "";
    if (aluno.STATUS.includes("✅")) statusClass = "status-completo";
    else if (aluno.STATUS.includes("⚠️")) statusClass = "status-pendente";
    else if (aluno.STATUS.includes("🔴")) statusClass = "status-vencido";

    div.innerHTML = `
      <strong>${aluno.ALUNO}</strong>
      <p>🏫 ${aluno.ESCOLA}</p>
      <span class="status-badge ${statusClass}">${aluno.STATUS}</span>
      ${aluno.ALERTA ? `<span class="status-badge status-vencido">${aluno.ALERTA}</span>` : ''}
      <button onclick="abrirAluno(${aluno._row})">Abrir ficha</button>
    `;

    lista.appendChild(div);
  });
}

function ajustarInterfacePorPerfil() {
  const btnCadastroUsuario = document.querySelector("button[onclick*='abrirCadastro']");
  const btnListarUsuarios = document.querySelector("button[onclick*='listarUsuariosTela']");
  const btnNovoAluno = document.querySelector("button[onclick*='abrirNovoAluno']");

  if (perfilUsuario === "SECRETARIA") {
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
    if (btnNovoAluno) btnNovoAluno.style.display = "inline-block";   // Secretária vê o botão
  } else if (perfilUsuario === "SUPERVISOR") {
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "inline-block";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "inline-block";
    if (btnNovoAluno) btnNovoAluno.style.display = "none";           // Supervisor não vê
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

  const lista = document.getElementById("lista");

  lista.innerHTML = `
    <div class="card">
      <h2>${aluno.ALUNO}</h2>

      <p><strong>Escola:</strong> ${aluno.ESCOLA}</p>

      <h3>Documentos</h3>

      ${checkbox("Certidão", aluno.CERTIDAO, aluno._row, 6)}
      ${checkbox("CPF", aluno.CPF, aluno._row, 7)}
      ${checkbox("RG", aluno.RG, aluno._row, 8)}
      ${checkbox("Vacina", aluno.VACINA, aluno._row, 9)}
      ${checkbox("SUS", aluno.SUS, aluno._row, 10)}
      ${checkbox("Residência", aluno.RESIDENCIA, aluno._row, 11)}
      ${checkbox("Responsável", aluno.RESP_DOCS, aluno._row, 12)}
      ${checkbox("Histórico", aluno.HISTORICO, aluno._row, 13)}

      <br><br>
      <button onclick="salvarAlteracoesEmLote(${aluno._row})">💾 Salvar alterações</button>
      <button onclick="carregarAlunos()">⬅ Voltar</button>
    </div>
  `;
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
      alert("Alterações salvas com sucesso!");
      // Limpar pendências apenas da linha salva
      for (let chave in alteracoesPendentes) {
        const [linha] = chave.split('_').map(Number);
        if (linha === row) delete alteracoesPendentes[chave];
      }
      // Recarregar os dados para atualizar status/alerta na tela
      carregarAlunos();
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

function abrirCadastro() {
  document.getElementById("cadastro").style.display = "block";
  document.getElementById("usuarios").style.display = "none";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";
}

function abrirNovoAluno() {
  document.getElementById("novoAluno").style.display = "flex";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";
  // Exibir a escola da secretária logada
  document.getElementById("escolaVinculada").textContent = 
    `Aluno será matriculado em: ${escolaUsuario}`;
}

async function salvarAluno() {
  const nomeInput = document.getElementById("nomeAluno");
  const nome = nomeInput.value.trim();
  const erroDiv = document.getElementById("erroNome");
  const btnSalvar = document.getElementById("btnSalvarAluno");
  const btnText = btnSalvar.querySelector(".btn-text");
  const spinner = btnSalvar.querySelector(".spinner-btn");

  // Validação
  if (!nome) {
    erroDiv.style.display = "block";
    nomeInput.style.borderColor = "#dc2626";
    return;
  }
  
  erroDiv.style.display = "none";
  nomeInput.style.borderColor = "#e2e8f0";

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
        email: emailUsuario
      })
    });

    const resultado = await resposta.json();

    if (resultado.status === "ok") {
      // Feedback visual rápido antes de fechar
      btnText.textContent = "✅ Cadastrado!";
      spinner.style.display = "none";
      btnText.style.display = "inline";
      await new Promise(r => setTimeout(r, 600)); // pequena pausa para ver o sucesso

      nomeInput.value = "";
      voltarApp();
      carregarAlunos();
    } else {
      alert("Erro: " + (resultado.msg || "Tente novamente"));
    }
  } catch (erro) {
    console.error(erro);
    alert("Erro de conexão.");
  } finally {
    // Restaurar botão
    btnText.textContent = "Salvar";
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btnSalvar.disabled = false;
  }
}

function voltarApp() {
  document.getElementById("usuarios").style.display = "none";
  document.getElementById("cadastro").style.display = "none";
  document.getElementById("novoAluno").style.display = "none";
  document.getElementById("lista").style.display = "block";
  document.getElementById("painel").style.display = "block";
  
  // Limpar campos e mensagens de erro
  document.getElementById("nomeAluno").value = "";
  document.getElementById("erroNome").style.display = "none";
  document.getElementById("nomeAluno").style.borderColor = "#e2e8f0";
}

function fecharCadastro() {
  document.getElementById("cadastro").style.display = "none";
  document.getElementById("lista").style.display = "block";
  document.getElementById("painel").style.display = "block";
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
// USUÁRIOS
// =========================
function listarUsuariosTela() {
  document.getElementById("usuarios").style.display = "block";
  document.getElementById("cadastro").style.display = "none";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";

  carregarUsuarios();
}

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
  const lista = document.getElementById("listaUsuarios");

  lista.innerHTML = "";

  // 🚨 proteção contra erro
  if (!Array.isArray(usuarios)) {
    lista.innerHTML = "<p>Erro ao carregar usuários</p>";
    console.error("Resposta inválida:", usuarios);
    return;
  }

  if (usuarios.length === 0) {
    lista.innerHTML = "<p>Nenhum usuário cadastrado</p>";
    return;
  }

  usuarios.forEach(u => {
    const div = document.createElement("div");
    div.className = "card fade";

    div.innerHTML = `
      <strong>${u.EMAIL}</strong><br>
      Perfil: ${u.PERFIL}<br>
      Escola: ${u.ESCOLA || "-"}
    `;

    lista.appendChild(div);
  });
}

// =========================
// CADASTRO DE USUÁRIO
// =========================
async function salvarUsuario() {
  const email = document.getElementById("novoEmail").value;
  const perfil = document.getElementById("perfil").value;
  const escola = document.getElementById("escola").value;

  if (!email) {
    alert("Informe o e-mail");
    return;
  }

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
      alert("Usuário cadastrado com sucesso!");
      fecharCadastro();
    }

  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro ao cadastrar");
  }
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
