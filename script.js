const API_URL = "https://script.google.com/macros/s/AKfycbw12jOhILj7RA3f60M69upWvCvgVgK0emCwnrgJ24L3Bfqt838g084UuW46E5xFRUd5ag/exec";

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

const FUNDOS_ESCOLAS = {
  "CEEFMTI Afonso Cláudio": "fundos/CEEFMTI_Afonso_Cláudio.png",
  "CEEFMTI Elisa Paiva": "fundos/CEEFMTI_Elisa_Paiva.png",
  "EEEF Ivana Casagrande Scabelo": "fundos/EEEF_Ivana_Casagrande_Scabelo.png",
  "EEEF Severino Paste": "fundos/EEEF_Severino_Paste.png",
  "EEEFM Alto Rio Possmoser": "fundos/EEEFM_Alto_Rio_Possmoser.png",
  "EEEFM Álvaro Castelo": "fundos/EEEFM_Álvaro_Castelo.png",
  "EEEFM Domingos Perim": "fundos/EEEFM_Domingos_Perim.png",
  "EEEFM Elvira Barros": "fundos/EEEFM_Elvira_Barros.png",
  "EEEFM Fazenda Camporês": "fundos/EEEFM_Fazenda_Camporês.png",
  "EEEFM Fazenda Emílio Schroeder": "fundos/EEEFM_Fazenda_Emílio_Schroeder.png",
  "EEEFM Fioravante Caliman": "fundos/EEEFM_Fioravante_Caliman.png",
  "EEEFM Frederico Boldt": "fundos/EEEFM_Frederico_Boldt.png",
  "EEEFM Gisela Salloker Fayet": "fundos/EEEFM_Gisela_Salloker_Fayet.png",
  "EEEFM Graça Aranha": "fundos/EEEFM_Graça_Aranha.png",
  "EEEFM Joaquim Caetano de Paiva": "fundos/EEEFM_Joaquim_Caetano_de_Paiva.png",
  "EEEFM José Cupertino": "fundos/EEEFM_José_Cupertino.png",
  "EEEFM José Giestas": "fundos/EEEFM_José_Giestas.png",
  "EEEFM José Roberto Christo": "fundos/EEEFM_José_Roberto_Christo.png",
  "EEEFM Leogildo Severiano de Souza": "fundos/EEEFM_Leogildo_Severiano_de_Souza.png",
  "EEEFM Luiz Jouffroy": "fundos/EEEFM_Luiz_Jouffroy.png",
  "EEEFM Maria de Abreu Alvim": "fundos/EEEFM_Maria_de_Abreu_Alvim.png",
  "EEEFM Mário Bergamin": "fundos/EEEFM_Mário_Bergamin.png",
  "EEEFM Marlene Brandão": "fundos/EEEFM_Marlene_Brandão.png",
  "EEEFM Pedra Azul": "fundos/EEEFM_Pedra_Azul.png",
  "EEEFM Ponto do Alto": "fundos/EEEFM_Ponto_do_Alto.png",
  "EEEFM Profª Aldy Soares Merçon Vargas": "fundos/EEEFM_Profª_Aldy_Soares_Merçon_Vargas.png",
  "EEEFM Prof Hermman Berger": "fundos/EEEFM_Prof_Hermman_Berger.png",
  "EEEFM São Jorge": "fundos/EEEFM_São_Jorge.png",
  "EEEFM São Luís": "fundos/EEEFM_São_Luís.png",
  "EEEFM Teófilo Paulino": "fundos/EEEFM_Teófilo_Paulino.png",
  "EEEM Francisco Guilherme": "fundos/EEEM_Francisco_Guilherme.png",
  "EEEM Mata fria": "fundos/EEEM_Mata_Fria.png",
  "EEEM Sobreiro": "fundos/EEEM_Sobreiro.png",
  "default": "fundos/default.png"
};

function aplicarFundoPorEscola(escola) {
  const body = document.body;
  let imagemFundo = FUNDOS_ESCOLAS[escola];
  
  if (!imagemFundo) {
    imagemFundo = FUNDOS_ESCOLAS["default"];
  }
  
  if (imagemFundo) {
    body.style.backgroundImage = `url('${imagemFundo}')`;
    body.classList.add("fundo-personalizado");
  } else {
    // Se não houver imagem definida, remove qualquer fundo personalizado
    body.style.backgroundImage = "";
    body.classList.remove("fundo-personalizado");
  }
}

// Modo escuro
function toggleDarkMode() {
  const body = document.body;
  const isDark = body.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateDarkModeIcon(newTheme);
}

// =========================
// GESTÃO DE PROCESSOS (Edocs)
// =========================

function abrirModalProcessos() {
  document.getElementById("modalProcessos").style.display = "flex";
  preencherSelectsProcessos();
  mostrarAbaCadastroProcesso(); // inicia no cadastro
}

function copiarCodigo(codigo) {
  if (!codigo) return;
  
  navigator.clipboard.writeText(codigo)
    .then(() => {
      // Feedback visual rápido (opcional)
      alert(`✅ Código ${codigo} copiado!`);
    })
    .catch(err => {
      console.error('Erro ao copiar:', err);
      alert('❌ Não foi possível copiar o código.');
    });
}

function fecharModalProcessos() {
  document.getElementById("modalProcessos").style.display = "none";
}

function mostrarAbaCadastroProcesso() {
  document.getElementById("abaCadastroProcesso").style.display = "block";
  document.getElementById("abaBuscaProcesso").style.display = "none";
}

function mostrarAbaBuscaProcesso() {
  document.getElementById("abaCadastroProcesso").style.display = "none";
  document.getElementById("abaBuscaProcesso").style.display = "block";
  buscarProcessos(); // já carrega a lista
}

function preencherSelectsProcessos() {
  const selectEscolaCad = document.getElementById("cadastroProcessoEscola");
  const selectEscolaFiltro = document.getElementById("filtroProcessoEscola");
  
  [selectEscolaCad, selectEscolaFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id.includes('filtro') ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    LISTA_ESCOLAS.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
  // Visibilidade dos campos de escola conforme perfil
  const cadWrapper = document.getElementById("cadastroProcessoEscolaWrapper");
  const filtroWrapper = document.getElementById("filtroProcessoEscolaWrapper");
  if (perfilUsuario === "SECRETARIA") {
    if (cadWrapper) cadWrapper.style.display = "none";
    if (filtroWrapper) filtroWrapper.style.display = "none";
    // Para secretaria, a escola é automática (escolaUsuario)
  } else {
    if (cadWrapper) cadWrapper.style.display = "block";
    if (filtroWrapper) filtroWrapper.style.display = "block";
  }
}

function atualizarCamposProcesso() {
  const tipo = document.getElementById("cadastroProcessoTipo").value;
  const container = document.getElementById("camposExtrasProcesso");
  container.innerHTML = "";
  
  if (tipo === "Cuidador" || tipo === "Regularização AEE") {
    // Campo de aluno (poderia ser um select, mas vamos simplificar com input por enquanto)
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon">👤</span>
        <input type="text" id="cadastroProcessoAluno" placeholder="Nome do aluno">
      </div>
    `;
  } else if (tipo === "Livro de ponto") {
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon">📂</span>
        <select id="cadastroProcessoCategoria" onchange="atualizarSubcategorias()">
          <option value="">Categoria</option>
          <option value="Técnico Administrativo">Técnico Administrativo</option>
          <option value="Profissionais do Magistério">Profissionais do Magistério</option>
        </select>
      </div>
      <div class="input-icon" id="subcategoriaWrapper" style="display:none;">
        <span class="icon">📑</span>
        <select id="cadastroProcessoSubcategoria">
          <option value="">Subcategoria</option>
          <option value="Técnico Pedagógico">Técnico Pedagógico</option>
          <option value="Matutino ou Integral">Matutino ou Integral</option>
          <option value="Vespertino">Vespertino</option>
          <option value="Noturno">Noturno</option>
        </select>
      </div>
    `;
  }
}

function atualizarSubcategorias() {
  const cat = document.getElementById("cadastroProcessoCategoria")?.value;
  const wrapper = document.getElementById("subcategoriaWrapper");
  if (cat === "Profissionais do Magistério") {
    wrapper.style.display = "block";
  } else {
    wrapper.style.display = "none";
    // Limpa seleção
    document.getElementById("cadastroProcessoSubcategoria").value = "";
  }
}

async function cadastrarProcesso() {
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("cadastroProcessoEscola").value : escolaUsuario;
  const tipo = document.getElementById("cadastroProcessoTipo").value;
  const codigo = document.getElementById("cadastroProcessoCodigo").value.trim();
  const observacoes = document.getElementById("cadastroProcessoObs").value.trim();
  
  if (!escola) { alert("Selecione a escola."); return; }
  if (!tipo) { alert("Selecione o tipo de processo."); return; }
  if (!codigo) { alert("Informe o código do processo."); return; }
  
  let aluno = "", categoria = "", subcategoria = "";
  if (tipo === "Cuidador" || tipo === "Regularização AEE") {
    aluno = document.getElementById("cadastroProcessoAluno")?.value.trim() || "";
    if (!aluno) { alert("Informe o nome do aluno."); return; }
  } else if (tipo === "Livro de ponto") {
    categoria = document.getElementById("cadastroProcessoCategoria")?.value || "";
    if (!categoria) { alert("Selecione a categoria."); return; }
    if (categoria === "Profissionais do Magistério") {
      subcategoria = document.getElementById("cadastroProcessoSubcategoria")?.value || "";
      if (!subcategoria) { alert("Selecione a subcategoria."); return; }
    }
  }
  
  mostrarLoading();
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "cadastrarProcesso",
        email: emailUsuario,
        escola: escola,
        tipo: tipo,
        codigo: codigo,
        aluno: aluno,
        categoria: categoria,
        subcategoria: subcategoria,
        observacoes: observacoes
      })
    });
    const result = await resp.json();
    esconderLoading();
    if (result.status === "ok") {
      alert("✅ Processo cadastrado com sucesso!");
      // Limpar campos
      document.getElementById("cadastroProcessoCodigo").value = "";
      document.getElementById("cadastroProcessoObs").value = "";
      document.getElementById("cadastroProcessoTipo").value = "";
      document.getElementById("camposExtrasProcesso").innerHTML = "";
      if (perfilUsuario === "SUPERVISOR") document.getElementById("cadastroProcessoEscola").value = "";
    } else {
      alert("Erro: " + (result.msg || "Falha no cadastro"));
    }
  } catch (e) {
    esconderLoading();
    alert("Erro de conexão.");
  }
}

async function buscarProcessos() {
  const tipo = document.getElementById("filtroProcessoTipo").value;
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("filtroProcessoEscola").value : "";
  
  mostrarLoading();
  try {
    let url = `${API_URL}?tipo=processos&email=${emailUsuario}`;
    if (tipo) url += `&filtroTipo=${encodeURIComponent(tipo)}`;
    if (escola) url += `&filtroEscola=${encodeURIComponent(escola)}`;
    
    const resp = await fetch(url);
    const processos = await resp.json();
    renderizarListaProcessos(processos);
  } catch (e) {
    alert("Erro ao buscar processos.");
  }
  esconderLoading();
}

function renderizarListaProcessos(processos) {
  const container = document.getElementById("listaProcessosContainer");
  container.innerHTML = "";
  
  if (!processos || processos.length === 0) {
    container.innerHTML = "<p>Nenhum processo encontrado.</p>";
    return;
  }
  
  processos.forEach(p => {
    // Ignora itens sem código ou tipo (segurança extra)
    if (!p.codigo && !p.tipo) return;
    
    const div = document.createElement("div");
    div.className = "usuario-card";
    
    let detalhes = `🏫 ${p.escola || '—'}`;
    if (p.aluno) detalhes += ` | 👤 ${p.aluno}`;
    if (p.categoria) detalhes += ` | 📂 ${p.categoria}`;
    if (p.subcategoria) detalhes += ` / ${p.subcategoria}`;
    if (p.observacoes) detalhes += `<br>📝 ${p.observacoes}`;
    
    div.innerHTML = `
    <div class="usuario-avatar">📄</div>
    <div class="usuario-info">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <strong>${p.codigo || 'Sem código'} (${p.tipo || 'Sem tipo'})</strong>
        <button class="btn-icone" onclick="copiarCodigo('${p.codigo}')" title="Copiar código" style="margin-left: 8px;">📋</button>
      </div>
      <p>${detalhes}</p>
    </div>
  `;
    container.appendChild(div);
  });
}
// Máscara para telefone
function aplicarMascaraTelefone(event) {
  let valor = event.target.value.replace(/\D/g, ''); // remove tudo que não é dígito
  if (valor.length > 11) valor = valor.slice(0, 11);
  
  // Formata conforme o tamanho
  if (valor.length > 10) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d*)/, '($1');
  }
  
  event.target.value = valor;
}

function updateDarkModeIcon(theme) {
  const btn = document.getElementById('darkModeToggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function initDarkMode() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.body.setAttribute('data-theme', theme);
  updateDarkModeIcon(theme);
}

function mostrarLoading() {
  document.getElementById("loading").style.display = "flex";
}

async function carregarTurmasParaEdicao(escola, turmaAtual) {
  const select = document.getElementById("editTurma");
  select.innerHTML = '<option value="">Carregando turmas...</option>';
  try {
    const resp = await fetch(`${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`);
    const turmas = await resp.json();
    select.innerHTML = '<option value="">Selecione a turma</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      if (t.turma === turmaAtual) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (e) {
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

async function salvarDadosAluno() {
  if (!dadosAlunoAtual) return;
  
  const nome = document.getElementById("editNomeAluno").value.trim();
  const responsavel = document.getElementById("editResponsavel").value.trim();
  const telefone = document.getElementById("editTelefone").value.trim();
  const turma = document.getElementById("editTurma").value;
  const edEspecial = document.getElementById("editEdEspecial").checked;
  
  if (!nome) {
    alert("Nome do aluno é obrigatório.");
    return;
  }

   // 🔥 VALIDAÇÃO DE TELEFONE (INSIRA AQUI)
  const telefoneNumeros = telefone.replace(/\D/g, '');
  if (telefoneNumeros.length > 0 && telefoneNumeros.length < 10) {
    alert("Telefone incompleto. Informe DDD + número (mínimo 10 dígitos).");
    return;
  }
  
  const btn = document.getElementById("btnSalvarInfoAluno");
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-btn");
  
  btnText.style.display = "none";
  spinner.style.display = "inline-block";
  btn.disabled = true;
  
  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "atualizarDadosAluno",
        row: dadosAlunoAtual._row,
        nome: nome,
        responsavel: responsavel,
        telefone: telefone,
        turma: turma,
        edEspecial: edEspecial,
        email: emailUsuario
      })
    });
    
    const resultado = await resposta.json();
    
    if (resultado.status === "ok") {
      dadosAlunoAtual.ALUNO = nome;
      dadosAlunoAtual.RESPONSAVEL = responsavel;
      dadosAlunoAtual.TELEFONE = telefone;
      dadosAlunoAtual.TURMA = turma;
      dadosAlunoAtual.ED_ESPECIAL = edEspecial;
      
      document.getElementById("detalhesTitulo").textContent = nome;
      
      btnText.textContent = "✅ Salvo!";
      setTimeout(() => {
        btnText.textContent = "💾 Salvar informações";
      }, 2000);
    } else {
      alert("Erro: " + (resultado.msg || "Tente novamente"));
    }
  } catch (erro) {
    console.error(erro);
    alert("Erro de conexão.");
  } finally {
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btn.disabled = false;
  }
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

// =========================
// GESTÃO DE DOCUMENTOS
// =========================
function abrirModalDocumentos() {
  document.getElementById("modalDocumentos").style.display = "flex";
  preencherSelectEscolasDoc();
  mostrarAbaUpload(); // inicia na aba de upload
}

function fecharModalDocumentos() {
  document.getElementById("modalDocumentos").style.display = "none";
}

function mostrarAbaUpload() {
  document.getElementById("abaUpload").style.display = "block";
  document.getElementById("abaListagem").style.display = "none";
}

function mostrarAbaListagem() {
  document.getElementById("abaUpload").style.display = "none";
  document.getElementById("abaListagem").style.display = "block";
  buscarDocumentos(); // carrega lista ao abrir
}

function preencherSelectEscolasDoc() {
  const selectUpload = document.getElementById("uploadEscola");
  const selectFiltro = document.getElementById("filtroEscolaDoc");
  [selectUpload, selectFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id === 'filtroEscolaDoc' ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    LISTA_ESCOLAS.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
  // Ajustar visibilidade conforme perfil
  const uploadWrapper = document.getElementById("uploadEscolaWrapper");
  const filtroWrapper = document.getElementById("filtroEscolaDocWrapper");
  if (perfilUsuario === "SECRETARIA") {
    if (uploadWrapper) uploadWrapper.style.display = "none";
    if (filtroWrapper) filtroWrapper.style.display = "none";
  } else {
    if (uploadWrapper) uploadWrapper.style.display = "block";
    if (filtroWrapper) filtroWrapper.style.display = "block";
  }
}

async function fazerUpload() {
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("uploadEscola").value : escolaUsuario;
  const tipo = document.getElementById("uploadTipoDoc").value;
  const nomeAluno = document.getElementById("uploadNomeAluno").value.trim();
  const fileInput = document.getElementById("arquivoUpload");
  const file = fileInput.files[0];
  
  if (!escola) { alert("Selecione a escola."); return; }
  if (!tipo) { alert("Selecione o tipo de documento."); return; }
  if (!nomeAluno) { alert("Digite o nome do aluno."); return; }
  if (!file) { alert("Selecione um arquivo."); return; }
  
  mostrarLoading();
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          acao: "uploadDocumento",
          email: emailUsuario,
          escola: escola,
          tipo: tipo,
          nomeAluno: nomeAluno,
          fileName: file.name,
          mimeType: file.type,
          fileBase64: base64
        })
      });
      
      const result = await resp.json();
      esconderLoading();
      
      if (result.status === "ok") {
        alert("✅ Upload realizado com sucesso!");
        fileInput.value = "";
        document.getElementById("uploadNomeAluno").value = "";
        document.getElementById("uploadTipoDoc").value = "";
        if (perfilUsuario === "SUPERVISOR") document.getElementById("uploadEscola").value = "";
        
        // Recarregar lista de documentos se o modal estiver aberto
        if (document.getElementById("modalDocumentos").style.display === "flex") {
          buscarDocumentos();
        }
      } else {
        alert("Erro: " + (result.msg || "Falha no upload"));
      }
    } catch (error) {
      esconderLoading();
      alert("Erro de conexão: " + error.message);
    }
  };
  reader.readAsDataURL(file);
}
async function buscarDocumentos() {
  const escola = (perfilUsuario === "SUPERVISOR") ? document.getElementById("filtroEscolaDoc").value : "";
  const tipo = document.getElementById("filtroTipoDoc").value;
  const nomeAluno = document.getElementById("filtroNomeAlunoDoc").value.trim();
  
  mostrarLoading();
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        acao: "listarDocumentos",
        email: emailUsuario,
        escola: escola,
        tipo: tipo,
        nomeAluno: nomeAluno
      })
    });
    const docs = await resp.json();
    renderizarListaDocumentos(docs);
  } catch (e) { console.error(e); alert("Erro ao buscar documentos."); }
  esconderLoading();
}

function renderizarListaDocumentos(docs) {
  const container = document.getElementById("listaDocumentosContainer");
  container.innerHTML = "";
  if (!docs.length) { container.innerHTML = "<p>Nenhum documento encontrado.</p>"; return; }
  docs.forEach(doc => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    div.innerHTML = `
      <div class="usuario-avatar">📄</div>
      <div class="usuario-info">
        <strong>${doc.fileName}</strong>
        <p>🏫 ${doc.escola} | 👤 ${doc.nomeAluno} | 📅 ${new Date(doc.dataUpload).toLocaleDateString()}</p>
        <div style="margin-top:8px;">
          <a href="${doc.viewUrl}" target="_blank" class="btn-pequeno">👁️ Visualizar</a>
          <a href="${doc.downloadUrl}" class="btn-pequeno">⬇️ Baixar</a>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
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

function preencherDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const dataFormatada = `${ano}-${mes}-${dia}`;
  document.getElementById("dataMatricula").value = dataFormatada;
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
    const checked = (alteracoesPendentes.hasOwnProperty(chave)) ? alteracoesPendentes[chave] : docEspecial.valor;
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
  // Preencher campos editáveis
  document.getElementById("editNomeAluno").value = aluno.ALUNO || "";
  document.getElementById("editResponsavel").value = aluno.RESPONSAVEL || "";
  document.getElementById("editTelefone").value = aluno.TELEFONE || "";
  document.getElementById("editEdEspecial").checked = aluno.ED_ESPECIAL === true;
  
  // Carregar turmas da escola e selecionar a atual
  carregarTurmasParaEdicao(aluno.ESCOLA, aluno.TURMA);
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

    // Aplicar fundo personalizado para secretarias
    if (perfilUsuario === "SECRETARIA") {
      aplicarFundoPorEscola(escolaUsuario);
    } else {
      // Supervisor pode ter fundo padrão ou nenhum
      aplicarFundoPorEscola("default");
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

    const btnProcessos = document.getElementById("btnProcessos");
    if (perfilUsuario === "SECRETARIA" || perfilUsuario === "SUPERVISOR") {
      if (btnProcessos) btnProcessos.style.display = "inline-block";
    }

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
    div.className = "fade";
    
    div.style.background = "white";
    div.style.borderRadius = "16px";
    div.style.padding = "12px 16px";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
    div.style.border = "1px solid #f1f5f9";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "12px";
    div.style.transition = "all 0.2s";
    
    let statusClass = "";
    if (aluno.STATUS.includes("✅")) statusClass = "status-completo";
    else if (aluno.STATUS.includes("⚠️")) statusClass = "status-pendente";
    else if (aluno.STATUS.includes("🔴")) statusClass = "status-vencido";

    // Calcular dias restantes e barra de progresso (apenas se status NÃO for "✅ Completo")
    let prazoTexto = "";
    let prazoClasse = "";
    let barraProgresso = "";
    let corBarra = "#10b981"; // verde padrão
    
    if (aluno.STATUS !== "✅ Completo") {
      if (aluno.PRAZO_FINAL) {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const prazo = new Date(aluno.PRAZO_FINAL);
        prazo.setHours(0,0,0,0);
        const diff = Math.floor((prazo - hoje) / (1000*60*60*24));
        
        // Definir texto e classe do prazo
        if (diff < 0) {
          prazoTexto = `⏰ Vencido há ${Math.abs(diff)} dia(s)`;
          prazoClasse = "prazo-urgente";
          corBarra = "#ef4444"; // vermelho
        } else if (diff === 0) {
          prazoTexto = "⏳ Vence hoje";
          prazoClasse = "prazo-atencao";
          corBarra = "#f59e0b"; // laranja
        } else if (diff <= 5) {
          prazoTexto = `⚠️ ${diff} dia(s) restante(s)`;
          prazoClasse = "prazo-atencao";
          corBarra = "#f59e0b"; // laranja
        } else {
          prazoTexto = `📅 ${diff} dias restantes`;
          prazoClasse = "prazo-normal";
          corBarra = "#10b981"; // verde
        }
        
        // Calcular percentual da barra (baseado em 30 dias totais)
        const totalDias = 30;
        const percentual = diff > 0 ? Math.min(100, Math.round((diff / totalDias) * 100)) : 0;
        barraProgresso = `
          <div style="margin-top:6px; background:#e2e8f0; border-radius:10px; height:6px; width:100%;">
            <div style="background:${corBarra}; border-radius:10px; height:6px; width:${percentual}%;"></div>
          </div>
        `;
      } else {
        prazoTexto = "📅 Sem prazo";
        prazoClasse = "";
      }
    }

    const inicial = (aluno.ALUNO && typeof aluno.ALUNO === 'string' && aluno.ALUNO.trim().length > 0)
      ? aluno.ALUNO.trim().charAt(0).toUpperCase()
      : "?";

    div.innerHTML = `
      <div class="aluno-avatar" style="width:44px;height:44px;background:#e0e7ff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#2563eb;flex-shrink:0;">${inicial}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;color:#0f172a;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;" title="${aluno.ALUNO || ''}">${aluno.ALUNO || 'Nome inválido'}</div>
        ${aluno.TURMA ? `<div style="font-size:11px;color:#64748b;margin-bottom:4px;">📚 ${aluno.TURMA}</div>` : ''}
        ${aluno.SITUACAO && aluno.SITUACAO !== 'Ativo' ? `<div style="font-size:11px; color:#dc2626; margin-bottom:4px;">📌 ${aluno.SITUACAO}</div>` : ''}
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
          <span class="status-badge ${statusClass}" style="padding:2px 8px;border-radius:40px;font-size:11px;font-weight:500;">${aluno.STATUS}</span>
          ${prazoTexto ? `<span class="prazo-info ${prazoClasse}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#64748b;">${prazoTexto}</span>` : ''}
        </div>
        ${barraProgresso}
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
  const filtroSituacaoWrapper = document.getElementById("filtroSituacaoWrapper"); 

  if (perfilUsuario === "SECRETARIA") {
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "none";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
    if (btnNovoAluno) btnNovoAluno.style.display = "inline-block";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "none";
    if (filtroSituacaoWrapper) filtroSituacaoWrapper.style.display = "none";
  } else if (perfilUsuario === "SUPERVISOR") {
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "block";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "inline-block";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "inline-block";
    if (btnNovoAluno) btnNovoAluno.style.display = "none";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "inline-block";
    if (filtroSituacaoWrapper) filtroSituacaoWrapper.style.display = "block";
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
  const situacaoSelecionada = document.getElementById("filtroSituacao")?.value || "";

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

  if (perfilUsuario === "SUPERVISOR" && situacaoSelecionada) {
    dadosFiltrados = dadosFiltrados.filter(a => a.SITUACAO === situacaoSelecionada);
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
  const turmaSelect = document.getElementById("selectTurmaAluno");
  const dataMatriculaInput = document.getElementById("dataMatricula").value;

  const nome = nomeInput ? nomeInput.value.trim() : "";
  const responsavel = responsavelInput ? responsavelInput.value.trim() : "";
  const telefone = telefoneInput ? telefoneInput.value.trim() : "";
  const edEspecial = edEspecialCheck ? edEspecialCheck.checked : false;   // ✅ declaração correta
  const turma = turmaSelect ? turmaSelect.value : "";
  
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

  // 🔥 VALIDAÇÃO DE TELEFONE (INSIRA AQUI)
  const telefoneNumeros = telefone.replace(/\D/g, '');
  if (telefoneNumeros.length > 0 && telefoneNumeros.length < 10) {
    alert("Telefone incompleto. Informe DDD + número (mínimo 10 dígitos).");
    return;
  }

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
        dataMatricula: dataMatriculaInput,
        edEspecial: edEspecial,   // ✅ enviando o valor
        email: emailUsuario
      })
    });

    const resultado = await resposta.json();

    if (resultado.status === "ok") {
      btnText.textContent = "✅ Cadastrado!";
      spinner.style.display = "none";
      btnText.style.display = "inline";
      document.getElementById("dataMatricula").value = "";

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
  // Só conta como vencido se NÃO estiver completo e o alerta for "🔴 Vencido"
  if (aluno.STATUS !== "✅ Completo" && aluno.ALERTA === "🔴 Vencido") resumo.vencidos++;
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

  document.body.style.backgroundImage = "";
  document.body.classList.remove("fundo-personalizado");
  
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

// NOVA FUNÇÃO SALVAR TURMA (MÚLTIPLAS LINHAS)
async function salvarTurma() {
  const escola = document.getElementById("selectEscolaTurma").value;
  const turmasTexto = document.getElementById("nomeTurma").value.trim();
  const erroDiv = document.getElementById("erroTurma");
  
  if (!escola) {
    erroDiv.textContent = "Selecione uma escola.";
    erroDiv.style.display = "block";
    return;
  }
  if (!turmasTexto) {
    erroDiv.textContent = "Digite pelo menos uma turma.";
    erroDiv.style.display = "block";
    return;
  }
  
  const turmas = turmasTexto.split('\n')
    .map(t => t.trim())
    .filter(t => t !== "");
  
  if (turmas.length === 0) {
    erroDiv.textContent = "Nenhuma turma válida informada.";
    erroDiv.style.display = "block";
    return;
  }
  
  erroDiv.style.display = "none";
  mostrarLoading();
  
  let sucessos = 0;
  let erros = [];
  
  for (let turma of turmas) {
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
        sucessos++;
      } else {
        erros.push(`${turma}: ${result.msg || "Erro desconhecido"}`);
      }
    } catch (e) {
      erros.push(`${turma}: Erro de conexão`);
    }
  }
  
  esconderLoading();
  
  let mensagem = "";
  if (sucessos > 0) mensagem += `✅ ${sucessos} turma(s) cadastrada(s) com sucesso.`;
  if (erros.length > 0) mensagem += `\n❌ Erros:\n${erros.join('\n')}`;
  
  alert(mensagem);
  
  if (sucessos > 0) {
    fecharModalCadastroTurma();
    carregarTurmas(document.getElementById("filtroEscolaTurma").value);
  }
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
  initDarkMode(); 
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

  
