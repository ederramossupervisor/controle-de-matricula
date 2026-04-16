const API_URL = "https://script.google.com/macros/s/AKfycbywuDF9k450K1MjOeRQ0UAJ2_uzGq0dZ3gzEfmsVK1QkDwiiheRmhI7fGFlW-tUf3JPcw/exec";

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

// Lista de modelos (a mesma do backend)
const LISTA_MODELOS = [
  "HISTÓRICO ESCOLAR - EF",
  "HISTÓRICO ESCOLAR - EF - EJA",
  "HISTÓRICO ESCOLAR - EM",
  "HISTÓRICO ESCOLAR - EM - EJA",
  "CERTIFICADO CONCLUSÃO - EM",
  "CERTIFICADO CONCLUSÃO - EM - EJA",
  "CERTIFICADO CONCLUSÃO - QUALIFICAÇÃO INTEGRADO - EJA",
  "HISTÓRICO ESCOLAR - TÉCNICO INTEGRADO",
  "HISTÓRICO ESCOLAR - TÉCNICO INTEGRADO - EJA",
  "HISTÓRICO ESCOLAR - QUALIFICAÇÃO INTEGRADO - EJA",
  "HISTÓRICO ESCOLAR - TÉCNICO (CONCOMITANTE E SUBSEQUENTE)",
  "DIPLOMA - TÉCNICO INTEGRADO - EJA",
  "DIPLOMA - TÉCNICO CONCOMITANTE",
  "DIPLOMA - TÉCNICO INTEGRADO",
  "DIPLOMA - TÉCNICO SUBSEQUENTE",
  "CERTIFICADO NEEJA - 1º SEGMENTO",
  "CERTIFICADO NEEJA - 2º SEGMENTO",
  "CERTIFICADO NEEJA - EM",
  "REQUERIMENTO DOCUMENTO ESCOLAR",
  "OBSERVAÇÃO DE AULA",
  "PLANO INTERVENÇÃO - PFA"
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
let paginaAtual = 1;
let alunosPorPagina = 20;
let dadosFiltradosGlobais = [];

let alunosImportados = [];
// =========================
// LEGALIZAÇÃO (ATOS AUTORIZATIVOS)
// =========================
let atosGlobais = [];

// Função para requisições GET usando JSONP (contorna CORS)
// Função para requisições GET usando JSONP (contorna CORS)
function jsonp(url, callback) {
  const callbackName = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  window[callbackName] = function(data) {
    callback(data);
    document.body.removeChild(script);
    delete window[callbackName];
  };
  const script = document.createElement('script');
  script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
  script.onerror = function() {
    callback({ erro: 'Falha na requisição JSONP' });
    document.body.removeChild(script);
    delete window[callbackName];
  };
  document.body.appendChild(script);
}

function abrirModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "flex";
  carregarEscolasParaFiltroAto();
  carregarAtos();
}

function fecharModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "none";
}

function carregarEscolasParaFiltroAto() {
  // Para supervisor master, carrega todas as escolas (usando LISTA_ESCOLAS)
  // Para supervisor comum, carrega apenas as que supervisiona
  const escolas = getEscolasPermitidas();
  const selectFiltro = document.getElementById("filtroEscolaAto");
  selectFiltro.innerHTML = '<option value="">Todas as escolas</option>';
  escolas.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectFiltro.appendChild(opt);
  });
}

// Adiciona um novo campo de telefone no modal de cadastro
function adicionarCampoTelefoneCadastro() {
  const container = document.getElementById("telefonesContainerCadastro");
  const novoCampo = document.createElement("div");
  novoCampo.className = "input-icon";
  novoCampo.style.marginBottom = "8px";
  novoCampo.innerHTML = `
    <span class="icon"><i class="fas fa-phone-alt"></i></span>
    <input type="tel" class="telefone-cadastro" placeholder="Telefone adicional" oninput="aplicarMascaraTelefone(event)">
    <button type="button" class="btn-icone" onclick="removerCampoTelefone(this)" style="margin-left: 8px; color: #dc2626;">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(novoCampo);
}

// Remove um campo de telefone (o botão "x" chama essa função)
function removerCampoTelefone(botao) {
  botao.closest('.input-icon').remove();
}

// Coleta todos os telefones preenchidos no cadastro e retorna uma string concatenada
function coletarTelefonesCadastro() {
  const inputs = document.querySelectorAll("#telefonesContainerCadastro .telefone-cadastro");
  const telefones = [];
  inputs.forEach(input => {
    const valor = input.value.trim();
    if (valor) telefones.push(valor);
  });
  return telefones.join("; ");
}

// Preenche os campos de telefone no modal de detalhes com base na string salva
function preencherCamposTelefoneEdicao(telefonesStr) {
  const container = document.getElementById("telefonesContainerEdicao");
  container.innerHTML = ""; // Limpa
  
  const telefones = telefonesStr ? telefonesStr.split(";").map(t => t.trim()).filter(t => t) : [];
  
  if (telefones.length === 0) {
    // Pelo menos um campo vazio
    adicionarCampoTelefoneEdicao();
  } else {
    telefones.forEach((tel, index) => {
      adicionarCampoTelefoneEdicao(tel);
    });
  }
}

// Adiciona um campo de telefone no modal de edição. Se 'valor' for fornecido, preenche.
function adicionarCampoTelefoneEdicao(valor = "") {
  const container = document.getElementById("telefonesContainerEdicao");
  const novoCampo = document.createElement("div");
  novoCampo.className = "input-icon";
  novoCampo.style.marginBottom = "8px";
  novoCampo.innerHTML = `
    <span class="icon"><i class="fas fa-phone-alt"></i></span>
    <input type="tel" class="telefone-edicao" placeholder="Telefone" value="${valor}" oninput="aplicarMascaraTelefone(event)">
    <button type="button" class="btn-icone" onclick="removerCampoTelefone(this)" style="margin-left: 8px; color: #dc2626;">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(novoCampo);
}

// Coleta os telefones da edição
function coletarTelefonesEdicao() {
  const inputs = document.querySelectorAll("#telefonesContainerEdicao .telefone-edicao");
  const telefones = [];
  inputs.forEach(input => {
    const valor = input.value.trim();
    if (valor) telefones.push(valor);
  });
  return telefones.join("; ");
}

function abrirModalModelos() {
  document.getElementById("modalModelos").style.display = "flex";
  
  const isMaster = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');
  const abaUploadBtn = document.getElementById("abaUploadModeloBtn");
  
  if (isMaster) {
    abaUploadBtn.style.display = "inline-block";
    preencherSelectTipoModelo();
  } else {
    abaUploadBtn.style.display = "none";
  }
  
  mostrarAbaListarModelos();
}

function fecharModalModelos() {
  document.getElementById("modalModelos").style.display = "none";
}

function mostrarAbaListarModelos() {
  document.getElementById("abaListarModelos").style.display = "block";
  document.getElementById("abaUploadModelo").style.display = "none";
  carregarModelos();
}

function mostrarAbaUploadModelo() {
  document.getElementById("abaListarModelos").style.display = "none";
  document.getElementById("abaUploadModelo").style.display = "block";
}

function preencherSelectTipoModelo() {
  const select = document.getElementById("selectTipoModelo");
  select.innerHTML = '<option value="">Selecione o tipo de modelo</option>';
  LISTA_MODELOS.forEach(modelo => {
    const opt = document.createElement("option");
    opt.value = modelo;
    opt.textContent = modelo;
    select.appendChild(opt);
  });
}

function carregarModelos() {
  mostrarLoading();
  const url = `${API_URL}?tipo=modelos&email=${emailUsuario}`;
  
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
  
  if (!modeloNome) {
    mostrarToast("Selecione o tipo de modelo.", "warning");
    return;
  }
  if (!file) {
    mostrarToast("Selecione um arquivo.", "warning");
    return;
  }
  
  // Verificar tamanho do arquivo (exemplo: máximo 20MB)
  if (file.size > 20 * 1024 * 1024) {
    mostrarToast("Arquivo muito grande. Máximo 20 MB.", "warning");
    return;
  }
  
  mostrarLoading();
  
  try {
    // Ler arquivo como base64
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
    
    // Usar AbortController para timeout de 60 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(dados),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Tentar ler a resposta como JSON (pode falhar se a resposta não for JSON válido)
    let result = { status: "ok", msg: "Modelo enviado com sucesso!" };
    try {
      const text = await resp.text();
      if (text) {
        result = JSON.parse(text);
      }
    } catch (parseError) {
      // Se não conseguir parsear, assumimos sucesso (upload funcionou)
      console.warn("Resposta não é JSON, assumindo sucesso.", parseError);
    }
    
    esconderLoading();
    
    if (result.status === "ok") {
      mostrarToast(result.msg || "Modelo enviado com sucesso!", "success");
      fileInput.value = "";
      select.value = "";
      mostrarAbaListarModelos(); // Recarrega a lista automaticamente
    } else {
      mostrarToast("Erro: " + (result.msg || "Falha no upload"), "error");
    }
  } catch (error) {
    esconderLoading();
    console.error("Erro no upload do modelo:", error);
    
    if (error.name === 'AbortError') {
      mostrarToast("Tempo limite excedido. O arquivo pode ter sido enviado. Verifique a lista.", "warning");
    } else {
      // Como o upload pode ter funcionado apesar do erro de rede, damos uma mensagem otimista
      mostrarToast("Upload pode ter sido concluído. Verifique a lista de modelos.", "warning");
    }
    
    // Mesmo com erro, tenta recarregar a lista após um pequeno delay
    setTimeout(() => {
      if (document.getElementById("modalModelos").style.display === "flex") {
        mostrarAbaListarModelos();
      }
    }, 1000);
  }
}
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

function renderizarListaAtos(atos) {
  const container = document.getElementById("listaAtosContainer");
  container.innerHTML = "";
  if (!atos.length) {
    container.innerHTML = "<p>Nenhum ato cadastrado.</p>";
    return;
  }
  atos.forEach(ato => {
    const card = document.createElement("div");
    card.className = "usuario-card";
    let statusClass = "";
    if (ato.status === "Válido") statusClass = "status-completo";
    else if (ato.status === "Vencendo (até 90 dias)") statusClass = "status-pendente";
    else if (ato.status === "Vencido") statusClass = "status-vencido";

    card.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-file-contract"></i></div>
      <div class="usuario-info">
        <strong>${ato.numeroAto}</strong>
        <p><i class="fas fa-school"></i> ${ato.escola} | <i class="fas fa-tag"></i> ${ato.tipoAto}</p>
        <p><i class="fas fa-graduation-cap"></i> ${ato.cursoEtapa || "—"} | 
        <i class="fas fa-calendar-alt"></i> Homologação: ${new Date(ato.dataHomologacao).toLocaleDateString('pt-BR')} | 
        <i class="fas fa-calendar-check"></i> Publicação: ${new Date(ato.dataPublicacao).toLocaleDateString('pt-BR')}</p>
        <p><span class="status-badge ${statusClass}">${ato.status}</span></p>
        <div style="margin-top:8px;">
          ${ato.arquivoId ? `<a href="https://drive.google.com/file/d/${ato.arquivoId}/view" target="_blank" class="btn-pequeno"><i class="fas fa-file-pdf"></i> Ver Ato</a>` : ''}
          <button class="btn-pequeno" onclick="editarAto('${ato.id}')"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-pequeno" onclick="excluirAto('${ato.id}')"><i class="fas fa-trash"></i> Excluir</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function abrirFormAto() {
  document.getElementById("formAtoTitulo").textContent = "Novo Ato Autorizativo";
  document.getElementById("atoId").value = "";
  document.getElementById("atoEscola").value = "";
  document.getElementById("atoTipo").value = "";
  document.getElementById("atoCursoEtapa").value = "";
  document.getElementById("atoNumero").value = "";
  document.getElementById("atoDataPublicacao").value = "";
  document.getElementById("atoValidadeAnos").value = "5";
  document.getElementById("atoObservacoes").value = "";
  document.getElementById("atoArquivo").value = "";
  document.getElementById("atoDataHomologacao").value = "";
  // Preencher select de escolas
  const selectEscola = document.getElementById("atoEscola");
  const escolas = getEscolasPermitidas();
  selectEscola.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectEscola.appendChild(opt);
  });
  document.getElementById("modalFormAto").style.display = "flex";
}

function fecharFormAto() {
  document.getElementById("modalFormAto").style.display = "none";
}

function editarAto(id) {
  const ato = atosGlobais.find(a => a.id === id);
  if (!ato) return;
  document.getElementById("formAtoTitulo").textContent = "Editar Ato Autorizativo";
  document.getElementById("atoId").value = ato.id;
  document.getElementById("atoEscola").value = ato.escola;
  document.getElementById("atoTipo").value = ato.tipoAto;
  document.getElementById("atoCursoEtapa").value = ato.cursoEtapa || "";
  document.getElementById("atoNumero").value = ato.numeroAto;
  document.getElementById("atoDataPublicacao").value = ato.dataPublicacao.split('T')[0];
  document.getElementById("atoValidadeAnos").value = ato.validadeAnos;
  document.getElementById("atoObservacoes").value = ato.observacoes || "";
  document.getElementById("atoArquivo").value = ""; // não é possível pré‑carregar arquivo
  document.getElementById("modalFormAto").style.display = "flex";
  document.getElementById("atoDataHomologacao").value = ato.dataHomologacao ? ato.dataHomologacao.split('T')[0] : "";
}

async function salvarAto() {
  const id = document.getElementById("atoId").value;
  const escola = document.getElementById("atoEscola").value;
  const tipoAto = document.getElementById("atoTipo").value;
  const cursoEtapa = document.getElementById("atoCursoEtapa").value;
  const numeroAto = document.getElementById("atoNumero").value;
  const dataPublicacao = document.getElementById("atoDataPublicacao").value;
  const validadeAnos = document.getElementById("atoValidadeAnos").value;
  const observacoes = document.getElementById("atoObservacoes").value;
  const arquivoInput = document.getElementById("atoArquivo");
  const file = arquivoInput.files[0];

  if (!escola || !tipoAto || !numeroAto || !dataPublicacao) {
    mostrarToast("Preencha todos os campos obrigatórios.", "warning");
    return;
  }

  let fileBase64 = null, fileName = null, mimeType = null;

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast("Arquivo muito grande. Máximo 10 MB.", "warning");
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

  postSemResposta(dados, "Ato salvo com sucesso!");
  fecharFormAto();
  carregarAtos();
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
function abrirModalImportacao() {
  document.getElementById('modalImportacao').style.display = 'flex';
  document.getElementById('arquivoCSV').value = '';
  document.getElementById('previewContainer').innerHTML = '<p style="padding:16px;color:#64748b;">Selecione um arquivo CSV para visualizar os dados.</p>';
  document.getElementById('btnExecutarImportacao').disabled = true;
  document.getElementById('statusImportacao').innerHTML = '';
}

// =========================
// DEBOUNCE
// =========================
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
/*
function atualizarListaPaginada() {
  const totalAlunos = dadosFiltradosGlobais.length;
  const totalPaginas = Math.ceil(totalAlunos / alunosPorPagina);
  if (paginaAtual > totalPaginas && totalPaginas > 0) paginaAtual = totalPaginas;
  if (paginaAtual < 1) paginaAtual = 1;

  const inicio = (paginaAtual - 1) * alunosPorPagina;
  const fim = inicio + alunosPorPagina;
  const alunosPagina = dadosFiltradosGlobais.slice(inicio, fim);
  renderLista(alunosPagina);
  renderizarPaginacao(totalPaginas);
}
*/

function renderizarPaginacao(totalPaginas, totalRegistros = dadosFiltradosGlobais.length) {
  const container = document.getElementById('paginacao');
  if (!container) return;
  
  if (totalPaginas <= 1 && alunosPorPagina >= totalRegistros) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  container.innerHTML = '';

  // Botão Primeira Página
  const btnFirst = document.createElement('button');
  btnFirst.innerHTML = '<i class="fas fa-angle-double-left"></i>';
  btnFirst.className = 'btn-paginacao';
  btnFirst.disabled = (paginaAtual === 1);
  btnFirst.addEventListener('click', () => {
    if (paginaAtual !== 1) {
      aplicarFiltros(1); // recarrega com página 1
    }
  });
  container.appendChild(btnFirst);

  // Botão Anterior
  const btnPrev = document.createElement('button');
  btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  btnPrev.className = 'btn-paginacao';
  btnPrev.disabled = (paginaAtual === 1);
  btnPrev.addEventListener('click', () => {
    if (paginaAtual > 1) {
      aplicarFiltros(paginaAtual - 1);
    }
  });
  container.appendChild(btnPrev);

  // Informação de página + total de registros
  const paginaSpan = document.createElement('span');
  paginaSpan.className = 'pagina-info';
  paginaSpan.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalRegistros} registros)`;
  container.appendChild(paginaSpan);

  // Botão Próximo
  const btnNext = document.createElement('button');
  btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
  btnNext.className = 'btn-paginacao';
  btnNext.disabled = (paginaAtual === totalPaginas);
  btnNext.addEventListener('click', () => {
    if (paginaAtual < totalPaginas) {
      aplicarFiltros(paginaAtual + 1);
    }
  });
  container.appendChild(btnNext);

  // Botão Última Página
  const btnLast = document.createElement('button');
  btnLast.innerHTML = '<i class="fas fa-angle-double-right"></i>';
  btnLast.className = 'btn-paginacao';
  btnLast.disabled = (paginaAtual === totalPaginas);
  btnLast.addEventListener('click', () => {
    if (paginaAtual !== totalPaginas) {
      aplicarFiltros(totalPaginas);
    }
  });
  container.appendChild(btnLast);

  // Seletor de itens por página
  const selectItens = document.createElement('select');
  selectItens.className = 'btn-paginacao';
  selectItens.style.marginLeft = '12px';
  [20, 50, 100, 200].forEach(qtd => {
    const opt = document.createElement('option');
    opt.value = qtd;
    opt.textContent = `${qtd} por página`;
    if (alunosPorPagina === qtd) opt.selected = true;
    selectItens.appendChild(opt);
  });
  selectItens.addEventListener('change', (e) => {
    alunosPorPagina = parseInt(e.target.value);
    paginaAtual = 1;
    aplicarFiltros(1);
  });
  container.appendChild(selectItens);
}
// =========================
// TOAST NOTIFICATIONS
// =========================
function mostrarToast(mensagem, tipo = 'info', duracao = 4000) {
  // Cria container se não existir
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Ícone baseado no tipo
  let icone = '';
  switch (tipo) {
    case 'success': icone = '<i class="fas fa-check-circle"></i>'; break;
    case 'error': icone = '<i class="fas fa-exclamation-circle"></i>'; break;
    case 'warning': icone = '<i class="fas fa-exclamation-triangle"></i>'; break;
    default: icone = '<i class="fas fa-info-circle"></i>';
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    ${icone}
    <div class="toast-content">${mensagem}</div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  // Fechar ao clicar no X
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  });

  // Auto-fechar após duração
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, duracao);
}

function fecharModalImportacao() {
  document.getElementById('modalImportacao').style.display = 'none';
}

function extrairPrimeiroTelefone(telefones) {
  if (!telefones) return '';
  const match = telefones.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
  return match ? match[0] : telefones.split(/[e\s]+/)[0];
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
          const edEspecial = (linha['Aluno: Deficiência, transtorno do espectro autista e altas habilidades ou superdotaçăo'] || '').toLowerCase() === 'sim';
          
          return {
            nome: linha['Aluno: Nome'] || '',
            responsavel: linha['Aluno: Nome do responsável'] || '',
            telefone: extrairPrimeiroTelefone(linha['Aluno: Telefones']),
            escola: linha['Escola: Nome'] || '',
            turma: linha['Turma: Nome'] || '',
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

function renderizarPreview(alunos) {
  const container = document.getElementById('previewContainer');
  if (alunos.length === 0) {
    container.innerHTML = '<p style="padding:16px;color:#dc2626;">Nenhum aluno válido encontrado.</p>';
    return;
  }

  let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
  html += '<thead><tr style="background:#f1f5f9;">';
  html += '<th>Nome</th><th>Escola</th><th>Turma</th><th>Resp.</th><th>Tel.</th><th>CPF</th><th>SUS</th><th>RG</th><th>Resid.</th><th>Ed.Especial</th>';
  html += '</tr></thead><tbody>';
  alunos.slice(0, 50).forEach(a => {
    html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
    html += `<td>${a.nome || '-'}</td><td>${a.escola || '-'}</td><td>${a.turma || '-'}</td><td>${a.responsavel || '-'}</td><td>${a.telefone || '-'}</td>`;
    html += `<td>${a.cpfAluno ? '✓' : '-'}</td><td>${a.sus ? '✓' : '-'}</td><td>${a.rg ? '✓' : '-'}</td><td>${a.residencia ? '✓' : '-'}</td>`;
    html += `<td>${a.edEspecial ? 'Sim' : 'Não'}</td>`;
    html += `</tr>`;
  });
  html += '</tbody></table>';
  if (alunos.length > 50) html += `<p style="padding:8px;">Exibindo 50 de ${alunos.length} alunos.</p>`;
  container.innerHTML = html;
}

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

async function executarImportacao() {
  if (alunosImportados.length === 0) return;
  
  const btn = document.getElementById('btnExecutarImportacao');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Importando...';
  const statusDiv = document.getElementById('statusImportacao');
  
  const loteSize = 20;
  let sucessos = 0;
  
  for (let i = 0; i < alunosImportados.length; i += loteSize) {
    const lote = alunosImportados.slice(i, i + loteSize);
    statusDiv.innerHTML = `Importando lote ${Math.floor(i/loteSize)+1} de ${Math.ceil(alunosImportados.length/loteSize)}...`;
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          acao: 'importarAlunosLote',
          email: emailUsuario,
          alunos: lote
        })
      });
      sucessos += lote.length;
    } catch (e) {
      console.error('Erro no lote:', e);
    }
  }
  
  statusDiv.innerHTML = `Importação concluída! ${sucessos} alunos enviados.`;
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-download"></i> Iniciar Importação';
  
  carregarAlunos();
}

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

function getEscolasPermitidas() {
  if (perfilUsuario === 'SUPERVISOR' && emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') {
    return window.escolasSupervisionadas || [];
  }
  return LISTA_ESCOLAS;
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
      mostrarToast(`Código ${codigo} copiado!`, "success");
    })
    .catch(err => {
      console.error('Erro ao copiar:', err);
      mostrarToast('Não foi possível copiar o código.', "error");
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
  const escolas = getEscolasPermitidas();
  
  [selectEscolaCad, selectEscolaFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id.includes('filtro') ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
  // Visibilidade dos campos de escola conforme perfil
  const cadWrapper = document.getElementById("cadastroProcessoEscolaWrapper");
  const filtroWrapper = document.getElementById("filtroProcessoEscolaWrapper");
  if (perfilUsuario === "SECRETARIA") {
    if (cadWrapper) cadWrapper.style.display = "none";
    if (filtroWrapper) filtroWrapper.style.display = "none";
  } else {
    if (cadWrapper) cadWrapper.style.display = "block";
    if (filtroWrapper) filtroWrapper.style.display = "block";
  }
}

function atualizarCamposProcesso() {
  const tipo = document.getElementById("cadastroProcessoTipo").value;
  const container = document.getElementById("camposExtrasProcesso");
  container.innerHTML = "";
  
  // Tipos que exigem o nome do aluno
  const tiposComAluno = [
    "Cuidador", 
    "Regularização AEE", 
    "Regularização de Vida Escolar",
    "Manifestação GENPRO",
    "Ata Especial de RVE",
    "Ata de Classificação/Reclassificação/Avanço Escolar"
  ];
  
  if (tiposComAluno.includes(tipo)) {
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon"><i class="fas fa-user"></i></span>
        <input type="text" id="cadastroProcessoAluno" placeholder="Nome do aluno">
      </div>
    `;
  } else if (tipo === "Livro de ponto") {
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon"><i class="fas fa-folder"></i></span>
        <select id="cadastroProcessoCategoria" onchange="atualizarSubcategorias()">
          <option value="">Categoria</option>
          <option value="Técnico Administrativo">Técnico Administrativo</option>
          <option value="Profissionais do Magistério">Profissionais do Magistério</option>
        </select>
      </div>
      <div class="input-icon" id="subcategoriaWrapper" style="display:none;">
        <span class="icon"><i class="fas fa-file-alt"></i></span>
        <select id="cadastroProcessoSubcategoria">
          <option value="">Subcategoria</option>
          <option value="Técnico Pedagógico">Técnico Pedagógico</option>
          <option value="Matutino ou Integral">Matutino ou Integral</option>
          <option value="Vespertino">Vespertino</option>
          <option value="Noturno">Noturno</option>
          <option value="Educação Profissional">Educação Profissional</option>
        </select>
      </div>
    `;
  } else if (tipo === "Plano de Intervenção PFA") {
    // 🔥 NOVO: campo para selecionar o subtópico
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon"><i class="fas fa-book-open"></i></span>
        <select id="cadastroProcessoSubtopicoPFA">
          <option value="">Selecione o componente</option>
          <option value="PFA Língua Portuguesa">PFA Língua Portuguesa</option>
          <option value="PFA Matemática">PFA Matemática</option>
        </select>
      </div>
    `;
  }
  // Para os demais tipos, nenhum campo extra é exibido.
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
  
  const dados = {
    acao: "cadastrarProcesso",
    email: emailUsuario,
    escola: escola,
    tipo: tipo,
    codigo: codigo,
    aluno: aluno,
    categoria: categoria,
    subcategoria: subcategoria,
    observacoes: observacoes
  };
  
  postSemResposta(dados, "Processo cadastrado com sucesso!");
  
  // Limpar campos
  document.getElementById("cadastroProcessoCodigo").value = "";
  document.getElementById("cadastroProcessoObs").value = "";
  document.getElementById("cadastroProcessoTipo").value = "";
  document.getElementById("camposExtrasProcesso").innerHTML = "";
  if (perfilUsuario === "SUPERVISOR") document.getElementById("cadastroProcessoEscola").value = "";
}
  
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

// Função para enviar POST sem esperar resposta (evita CORS)
function postSemResposta(dados, mensagemSucesso, callbackAposSucesso) {
  mostrarLoading();
  fetch(API_URL, {
    method: "POST",
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dados)
  })
  .then(() => {
    esconderLoading();
    if (mensagemSucesso) mostrarToast(mensagemSucesso, "success");
    if (callbackAposSucesso) callbackAposSucesso(); // ← Executa o callback
  })
  .catch(error => {
    esconderLoading();
    console.error("Erro de rede:", error);
    mostrarToast("Erro de conexão. Verifique sua internet.", "error");
  });
}

function renderizarListaProcessos(processos) {
  const container = document.getElementById("listaProcessosContainer");
  container.innerHTML = "";
  
  if (!processos || processos.length === 0) {
    container.innerHTML = "<p>Nenhum processo encontrado.</p>";
    return;
  }
  
  processos.forEach(p => {
    if (!p.codigo && !p.tipo) return;
    
    const div = document.createElement("div");
    div.className = "usuario-card";
    
    let detalhes = `<i class="fas fa-school"></i> ${p.escola || '—'}`;
    if (p.aluno) detalhes += ` | <i class="fas fa-user"></i> ${p.aluno}`;
    if (p.categoria) detalhes += ` | <i class="fas fa-folder"></i> ${p.categoria}`;
    if (p.subcategoria) detalhes += ` / ${p.subcategoria}`;
    if (p.observacoes) detalhes += `<br><i class="fas fa-pencil-alt"></i> ${p.observacoes}`;
    
    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-file-alt"></i></div>
      <div class="usuario-info">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <strong>${p.codigo || 'Sem código'} (${p.tipo || 'Sem tipo'})</strong>
          <button class="btn-icone" onclick="copiarCodigo('${p.codigo}')" title="Copiar código" style="margin-left: 8px;"><i class="fas fa-copy"></i></button>
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
    btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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
  const url = `${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;
  
  jsonp(url, function(turmas) {
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

async function salvarDadosAluno() {
  if (!dadosAlunoAtual) return;
  
  const nome = document.getElementById("editNomeAluno").value.trim();
  const responsavel = document.getElementById("editResponsavel").value.trim();
  const telefone = coletarTelefonesEdicao();
  const turma = document.getElementById("editTurma").value;
  const edEspecial = document.getElementById("editEdEspecial").checked;
  
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
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-btn");
  
  btnText.style.display = "none";
  spinner.style.display = "inline-block";
  btn.disabled = true;
  
  const dados = {
    acao: "atualizarDadosAluno",
    row: dadosAlunoAtual._row,
    nome: nome,
    responsavel: responsavel,
    telefone: telefone,
    turma: turma,
    edEspecial: edEspecial,
    email: emailUsuario
  };
  
  postSemResposta(dados, "Dados atualizados com sucesso!");
  
  dadosAlunoAtual.ALUNO = nome;
  dadosAlunoAtual.RESPONSAVEL = responsavel;
  dadosAlunoAtual.TELEFONE = telefone;
  dadosAlunoAtual.TURMA = turma;
  dadosAlunoAtual.ED_ESPECIAL = edEspecial;
  
  document.getElementById("detalhesTitulo").textContent = nome;
  
  btnText.textContent = "Salvo!";
  setTimeout(() => {
    btnText.textContent = "Salvar informações";
  }, 2000);
  
  btnText.style.display = "inline";
  spinner.style.display = "none";
  btn.disabled = false;
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
    mostrarToast("Digite um e-mail", "warning");
    return;
  }
  emailUsuario = email;
  localStorage.setItem("emailUsuario", email);
  
  // Atualiza exibição imediata (caso o app ainda não esteja visível, será sobrescrito depois)
  const emailSpan = document.getElementById("emailUsuarioTexto");
  if (emailSpan) emailSpan.textContent = email;
  
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
  const escolas = getEscolasPermitidas();
  
  [selectUpload, selectFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id === 'filtroEscolaDoc' ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
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
  
  if (!escola) { mostrarToast("Selecione a escola.", "warning"); return; }
  if (!tipo) { mostrarToast("Selecione o tipo de documento.", "warning"); return; }
  if (!nomeAluno) { mostrarToast("Digite o nome do aluno.", "warning"); return; }
  if (!file) { mostrarToast("Selecione um arquivo.", "warning"); return; }
  
  mostrarLoading();
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    
    const dados = {
      acao: "uploadDocumento",
      email: emailUsuario,
      escola: escola,
      tipo: tipo,
      nomeAluno: nomeAluno,
      fileName: file.name,
      mimeType: file.type,
      fileBase64: base64
    };
    
    postSemResposta(dados, "Upload realizado com sucesso!");
    
    fileInput.value = "";
    document.getElementById("uploadNomeAluno").value = "";
    document.getElementById("uploadTipoDoc").value = "";
    if (perfilUsuario === "SUPERVISOR") document.getElementById("uploadEscola").value = "";
    
    if (document.getElementById("modalDocumentos").style.display === "flex") {
      buscarDocumentos();
    }
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
  
function renderizarListaDocumentos(docs) {
  const container = document.getElementById("listaDocumentosContainer");
  container.innerHTML = "";
  if (!docs.length) { container.innerHTML = "<p>Nenhum documento encontrado.</p>"; return; }
  docs.forEach(doc => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-file"></i></div>
      <div class="usuario-info">
        <strong>${doc.fileName}</strong>
        <p><i class="fas fa-school"></i> ${doc.escola} | <i class="fas fa-user"></i> ${doc.nomeAluno} | <i class="fas fa-calendar-alt"></i> ${new Date(doc.dataUpload).toLocaleDateString()}</p>
        <div style="margin-top:8px;">
          <a href="${doc.viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar</a>
          <a href="${doc.downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}
// Preenche os selects de filtro (escola, turma, status)
function inicializarFiltros() {
  const selectEscola = document.getElementById("filtroEscola");
  if (selectEscola) {
    const escolas = getEscolasPermitidas();
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => {
      const opt = document.createElement("option");
      opt.value = esc;
      opt.textContent = esc;
      selectEscola.appendChild(opt);
    });
  }

  const campoBusca = document.getElementById("pesquisaNome");
  if (campoBusca) {
    const buscarDebounced = debounce(aplicarFiltros, 300);
    campoBusca.removeEventListener("input", buscarDebounced);
    campoBusca.addEventListener("input", buscarDebounced);
  }

  carregarTurmasParaFiltro();
} // <-- esta chave estava faltando, e o comentário "Status já está fixo..." deve ser removido

// Carrega turmas para o select de filtro (baseado na escola selecionada ou perfil)
async function carregarTurmas(escola = "") {
  mostrarLoading();
  let url = `${API_URL}?tipo=turmas&email=${emailUsuario}`;
  if (escola) url += `&escola=${encodeURIComponent(escola)}`;
  
  jsonp(url, function(turmas) {
    turmasGlobais = turmas;
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

  selectTurma.innerHTML = '<option value="">Carregando turmas...</option>';

  const url = `${API_URL}?tipo=turmas&email=${emailUsuario}&escola=${encodeURIComponent(escolaFiltro)}`;
  jsonp(url, function(turmas) {
    turmasDisponiveis = turmas;
    selectTurma.innerHTML = '<option value="">Todas as turmas</option>';
    turmas.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      selectTurma.appendChild(opt);
    });
  });
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
      <span><i class="fas fa-school"></i> ${aluno.ESCOLA}</span>
      <span><i class="fas fa-calendar-alt"></i> Matrícula: ${new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR')}</span>
    </p>
    <h3 style="margin-bottom:8px;">Documentos</h3>
    <div class="checkboxes-container">
  `;
  
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
  document.getElementById("editNomeAluno").value = aluno.ALUNO || "";
  document.getElementById("editResponsavel").value = aluno.RESPONSAVEL || "";
  preencherCamposTelefoneEdicao(aluno.TELEFONE || "");
  document.getElementById("editEdEspecial").checked = aluno.ED_ESPECIAL === true;
  
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
    row: dadosAlunoAtual._row
  };
  
  // Usa postSemResposta (não lê resposta, assume sucesso)
  postSemResposta(dados, "Aluno excluído com sucesso!", () => {
    fecharModalDetalhes();
    carregarAlunos(); // 🔥 Recarrega a lista automaticamente
  });
}
async function alterarSituacaoAluno(novaSituacao) {
  if (!dadosAlunoAtual) return;
  
  const confirmacao = confirm(`Deseja marcar este aluno como "${novaSituacao}"?`);
  if (!confirmacao) return;
  
  const dados = {
    acao: "alterarSituacao",
    row: dadosAlunoAtual._row,
    situacao: novaSituacao,
    email: emailUsuario
  };
  
  postSemResposta(dados, `Aluno marcado como ${novaSituacao}.`);
  fecharModalDetalhes();
  carregarAlunos();
}

// =========================
// CARREGAR DADOS
// =========================
async function carregarAlunos(pagina = 1, filtros = {}) {
  mostrarLoading();
  
  let url = `${API_URL}?email=${emailUsuario}&pagina=${pagina}&limite=${alunosPorPagina}`;
  if (filtros.escola) url += `&escola=${encodeURIComponent(filtros.escola)}`;
  if (filtros.turma) url += `&turma=${encodeURIComponent(filtros.turma)}`;
  if (filtros.nome) url += `&nome=${encodeURIComponent(filtros.nome)}`;
  if (filtros.status) url += `&status=${encodeURIComponent(filtros.status)}`;
  if (filtros.situacao) url += `&situacao=${encodeURIComponent(filtros.situacao)}`;
  
  jsonp(url, function(dados) {
    if (dados.erro) {
      mostrarToast("Acesso não autorizado", "error");
      esconderLoading();
      return;
    }

    window.escolasSupervisionadas = dados.escolasSupervisionadas || [];
    perfilUsuario = dados.perfil;
    escolaUsuario = dados.escola;

    document.getElementById("escolaUsuarioDisplay").textContent = 
      perfilUsuario === "SUPERVISOR" ? "Supervisor" : `${escolaUsuario}`;

    if (!Array.isArray(dados.alunos)) {
      console.error("Resposta inválida:", dados);
      mostrarToast("Erro na comunicação com o servidor.", "error");
      esconderLoading();
      return;
    }

    if (perfilUsuario === "SECRETARIA") {
      aplicarFundoPorEscola(escolaUsuario);
    } else {
      aplicarFundoPorEscola("default");
    }

    // 🔥 Agora dados.alunos contém apenas a página atual
    dadosGlobais = dados.alunos;
    dadosFiltradosGlobais = [...dadosGlobais];
    
    // 🔥 Atualiza informações de paginação vindas do backend
    paginaAtual = dados.paginaAtual;
    const totalPaginas = dados.totalPaginas;
    const totalRegistros = dados.totalRegistros;
    
    // Renderiza a lista com os 20 alunos
    renderLista(dadosGlobais);
    
    // Renderiza a paginação com os totais reais
    renderizarPaginacao(totalPaginas, totalRegistros);

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    ajustarInterfacePorPerfil();
    inicializarFiltros();
    preencherSelectsProcessos();
    preencherSelectEscolasDoc();
    preencherSelectEscolasTurma();

    if (perfilUsuario === "SECRETARIA") {
      carregarTurmasParaFiltro();
    }

    // 🔥 Usa as métricas vindas do backend (já calculadas)
    if (dados.metricas) {
      renderPainel(dados.metricas);
    } else {
      // fallback
      const resumo = gerarResumo(dadosGlobais);
      renderPainel(resumo);
    }
    
    const mapa = resumoPorEscola(dadosGlobais);
    renderPorEscola(mapa);

    const btnProcessos = document.getElementById("btnProcessos");
    if (perfilUsuario === "SECRETARIA" || perfilUsuario === "SUPERVISOR") {
      if (btnProcessos) btnProcessos.style.display = "inline-block";
    }

    esconderLoading();
  });
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

    div.className = "fade " + statusClass;

    let prazoTexto = "";
    let prazoClasse = "";
    let barraProgresso = "";
    let corBarra = "#10b981";
    
    if (aluno.STATUS !== "✅ Completo") {
      if (aluno.PRAZO_FINAL) {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const prazo = new Date(aluno.PRAZO_FINAL);
        prazo.setHours(0,0,0,0);
        const diff = Math.floor((prazo - hoje) / (1000*60*60*24));
        
        if (diff < 0) {
          prazoTexto = `Vencido há ${Math.abs(diff)} dia(s)`;
          prazoClasse = "prazo-urgente";
          corBarra = "#ef4444";
        } else if (diff === 0) {
          prazoTexto = "Vence hoje";
          prazoClasse = "prazo-atencao";
          corBarra = "#f59e0b";
        } else if (diff <= 5) {
          prazoTexto = `${diff} dia(s) restante(s)`;
          prazoClasse = "prazo-atencao";
          corBarra = "#f59e0b";
        } else {
          prazoTexto = `${diff} dias restantes`;
          prazoClasse = "prazo-normal";
          corBarra = "#10b981";
        }
        
        const totalDias = 30;
        const percentual = diff > 0 ? Math.min(100, Math.round((diff / totalDias) * 100)) : 0;
        barraProgresso = `
          <div style="margin-top:6px; background:#e2e8f0; border-radius:10px; height:6px; width:100%;">
            <div style="background:${corBarra}; border-radius:10px; height:6px; width:${percentual}%;"></div>
          </div>
        `;
      } else {
        prazoTexto = "Sem prazo";
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
        ${aluno.TURMA ? `<div style="font-size:11px;color:#64748b;margin-bottom:4px;"><i class="fas fa-book"></i> ${aluno.TURMA}</div>` : ''}
        ${aluno.SITUACAO && aluno.SITUACAO !== 'Ativo' ? `<div style="font-size:11px; color:#dc2626; margin-bottom:4px;"><i class="fas fa-thumbtack"></i> ${aluno.SITUACAO}</div>` : ''}  
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
          <span class="status-badge ${statusClass}" style="padding:2px 8px;border-radius:40px;font-size:11px;font-weight:500;">${aluno.STATUS}</span>
          ${prazoTexto ? `<span class="prazo-info ${prazoClasse}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#64748b;"><i class="fas fa-hourglass-half"></i> ${prazoTexto}</span>` : ''}
        </div>
        ${barraProgresso}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button onclick="abrirAluno(${aluno._row})" data-tooltip="Abrir ficha do aluno" style="background:none;border:none;font-size:20px;padding:6px;border-radius:40px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all 0.2s;"><i class="fas fa-eye"></i></button>
      </div>
    `;

    lista.appendChild(div);
  });
}
function ajustarOpcoesCadastroUsuario() {
  const selectPerfil = document.getElementById('perfil');
  if (perfilUsuario === 'SUPERVISOR' && emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') {
    // Remove a opção Supervisor
    for (let i = 0; i < selectPerfil.options.length; i++) {
      if (selectPerfil.options[i].value === 'SUPERVISOR') {
        selectPerfil.remove(i);
        break;
      }
    }
  }
}

function ajustarInterfacePorPerfil() {
  const btnCadastroUsuario = document.querySelector("button[onclick*='abrirModalCadastroUsuario']");
  const btnListarUsuarios = document.querySelector("button[onclick*='abrirModalListaUsuarios']");
  const btnNovoAluno = document.querySelector("button[onclick*='abrirNovoAluno']");
  const btnImportarCSV = document.querySelector("button[onclick*='abrirModalImportacao']");
  const filtrosContainer = document.querySelector(".filtros-container");
  const btnTurmas = document.getElementById("btnTurmas");
  const filtroEscolaWrapper = document.getElementById("filtroEscolaWrapper");
  const filtroTurmaWrapper = document.getElementById("filtroTurmaWrapper");
  const filtroStatusWrapper = document.getElementById("filtroStatusWrapper");
  const filtroSituacaoWrapper = document.getElementById("filtroSituacaoWrapper");
  const btnModelos = document.getElementById("btnModelos"); // NOVO

  const isSupervisorMaster = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');
  const btnLegalizacao = document.getElementById("btnLegalizacao");
  if (perfilUsuario === "SUPERVISOR") {
    if (btnLegalizacao) btnLegalizacao.style.display = "inline-block";
  } else {
    if (btnLegalizacao) btnLegalizacao.style.display = "none";
  }

  if (perfilUsuario === "SECRETARIA") {
    // Secretaria
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "none";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
    if (btnNovoAluno) btnNovoAluno.style.display = "inline-block";
    if (btnImportarCSV) btnImportarCSV.style.display = "inline-block";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "none";
    if (filtroSituacaoWrapper) filtroSituacaoWrapper.style.display = "none";
    if (btnModelos) btnModelos.style.display = "inline-block"; // NOVO

  } else if (perfilUsuario === "SUPERVISOR") {
    // Supervisor: regras gerais
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "block";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "inline-block";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "inline-block";
    if (btnNovoAluno) btnNovoAluno.style.display = "none";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "inline-block";
    if (filtroSituacaoWrapper) filtroSituacaoWrapper.style.display = "block";
    if (btnModelos) btnModelos.style.display = "inline-block"; // NOVO

    // Regra específica para o botão Importar CSV:
    if (isSupervisorMaster) {
      if (btnImportarCSV) btnImportarCSV.style.display = "inline-block";
    } else {
      if (btnImportarCSV) btnImportarCSV.style.display = "none";
    }
  }
}
// =========================
// DETALHE
// =========================
function abrirAluno(row) {
  const aluno = dadosGlobais.find(a => a._row == row);
  if (!aluno) {
    mostrarToast("Aluno não encontrado", "error");
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
    if (linha === row) {
      alteracoes.push({
        row: linha,
        coluna: coluna,
        valor: alteracoesPendentes[chave]
      });
    }
  }
  
  if (alteracoes.length === 0) {
    mostrarToast("Nenhuma alteração para salvar.", "warning");
    return;
  }
  
  const dados = {
    acao: "atualizarDocumentosEmLote",
    alteracoes: alteracoes,
    email: emailUsuario
  };
  
  postSemResposta(dados, "Documentos atualizados com sucesso!");
  
  for (let chave in alteracoesPendentes) {
    const [linha] = chave.split('_').map(Number);
    if (linha === row) delete alteracoesPendentes[chave];
  }
  
  fecharModalDetalhes();
  carregarAlunos();
}
// =========================
// ATUALIZAR
// =========================
async function atualizar(row, coluna, valor) {
  const dados = {
    row: row,
    coluna: coluna,
    valor: valor,
    email: emailUsuario
  };
  postSemResposta(dados, "Atualizado com sucesso.");
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

function aplicarFiltros(pagina = 1) {
  const filtros = {
    escola: document.getElementById("filtroEscola")?.value || "",
    turma: document.getElementById("filtroTurma")?.value || "",
    status: document.getElementById("filtroStatus")?.value || "",
    situacao: document.getElementById("filtroSituacao")?.value || "",
    nome: document.getElementById("pesquisaNome")?.value.toLowerCase() || ""
  };
  
  carregarAlunos(pagina, filtros);
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

  // Preencher dropdown de escolas com as escolas permitidas
  const selectEscola = document.getElementById("escola");
  const escolas = getEscolasPermitidas();
  selectEscola.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectEscola.appendChild(opt);
  });
  selectEscola.value = "";

  // Remover opção de Supervisor se for supervisor comum
  ajustarOpcoesCadastroUsuario();

  document.getElementById("modalCadastroUsuario").style.display = "flex";
}
function fecharModalCadastroUsuario() {
  document.getElementById("modalCadastroUsuario").style.display = "none";
}

// Atualiza a lista de usuários no modal
async function carregarUsuarios() {
  mostrarLoading();
  const url = `${API_URL}?tipo=usuarios&email=${emailUsuario}`;
  
  jsonp(url, function(dados) {
    if (dados.erro) {
      mostrarToast("Acesso não autorizado", "error");
      esconderLoading();
      return;
    }
    renderUsuarios(dados);
    esconderLoading();
  });
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
    const avatarIcon = u.PERFIL === 'SUPERVISOR' ? '<i class="fas fa-crown"></i>' : '<i class="fas fa-user-tie"></i>';
    
    div.innerHTML = `
      <div class="usuario-avatar">${avatarIcon}</div>
      <div class="usuario-info">
        <strong>${u.EMAIL}</strong>
        <p><i class="fas fa-school"></i> ${u.ESCOLA || "—"} · <span class="perfil-badge ${perfilClass}">${u.PERFIL}</span></p>
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
  
  const dados = {
    acao: "cadastrarUsuario",
    email: email,
    perfil: perfil,
    escola: escola,
    emailLogado: emailUsuario
  };
  
  postSemResposta(dados, "Usuário cadastrado com sucesso!");
  
  btnText.textContent = "Cadastrado!";
  spinner.style.display = "none";
  btnText.style.display = "inline";
  await new Promise(r => setTimeout(r, 600));
  
  fecharModalCadastroUsuario();
  if (document.getElementById("modalListaUsuarios").style.display === "flex") {
    carregarUsuarios();
  }
  
  btnText.textContent = "Salvar";
  btnSalvar.disabled = false;
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
  const telefone = coletarTelefonesCadastro();
  const edEspecial = edEspecialCheck ? edEspecialCheck.checked : false;
  const turma = turmaSelect ? turmaSelect.value : "";
  
  const erroDiv = document.getElementById("erroNome");
  const btnSalvar = document.getElementById("btnSalvarAluno");
  const btnText = btnSalvar.querySelector(".btn-text");
  const spinner = btnSalvar.querySelector(".spinner-btn");

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

  btnText.style.display = "none";
  spinner.style.display = "inline-block";
  btnSalvar.disabled = true;

  const dados = {
    acao: "cadastrarAluno",
    nome: nome,
    responsavel: responsavel,
    telefone: telefone,
    turma: turma,
    dataMatricula: dataMatriculaInput,
    edEspecial: edEspecial,
    email: emailUsuario
  };

  // Passamos uma função de callback que será executada após o envio
  postSemResposta(dados, "Aluno cadastrado com sucesso!", () => {
    // Limpar campos e fechar modal (dentro do callback)
    if (nomeInput) nomeInput.value = "";
    if (responsavelInput) responsavelInput.value = "";
    if (telefoneInput) telefoneInput.value = "";
    if (edEspecialCheck) edEspecialCheck.checked = false;
    document.getElementById("selectTurmaAluno").selectedIndex = 0;
    document.getElementById("dataMatricula").value = "";

    document.getElementById("novoAluno").style.display = "none";
    document.getElementById("lista").style.display = "";
    document.getElementById("painel").style.display = "";

    carregarAlunos(); // 🔥 Agora recarregamos APÓS o servidor confirmar

    btnText.textContent = "Salvar";
    btnText.style.display = "inline";
    spinner.style.display = "none";
    btnSalvar.disabled = false;
  });
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
    <div class="metrica-card metrica-total">
      <div class="metrica-titulo"><i class="fas fa-clipboard-list"></i> Total de alunos</div>
      <div class="metrica-valor">${resumo.total}</div>
      <div class="metrica-detalhe">matriculados</div>
    </div>
    <div class="metrica-card metrica-completos">
      <div class="metrica-titulo"><i class="fas fa-check-circle"></i> Completos</div>
      <div class="metrica-valor">${resumo.completos}</div>
      <div class="metrica-detalhe">documentação ok</div>
    </div>
    <div class="metrica-card metrica-pendentes">
      <div class="metrica-titulo"><i class="fas fa-exclamation-triangle"></i> Pendentes</div>
      <div class="metrica-valor">${resumo.pendentes}</div>
      <div class="metrica-detalhe">faltam documentos</div>
    </div>
    <div class="metrica-card metrica-vencidos">
      <div class="metrica-titulo"><i class="fas fa-circle" style="color:#dc2626;"></i> Vencidos</div>
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
  
  const isMaster = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');
  
  const card = document.createElement('div');
  card.className = 'metrica-card metrica-escola';
  
  if (isMaster) {
    // Supervisor master: resumo agregado da SRE
    const totalAlunos = dadosGlobais.length;
    const pendentes = dadosGlobais.filter(a => a.STATUS === "⚠️ Pendente").length;
    const completos = dadosGlobais.filter(a => a.STATUS === "✅ Completo").length;
    const vencidos = dadosGlobais.filter(a => a.STATUS !== "✅ Completo" && a.ALERTA === "🔴 Vencido").length;
    
    card.innerHTML = `
      <div class="metrica-titulo"><i class="fas fa-building"></i> Por SRE</div>
      <div class="metrica-valor" style="font-size: 28px;">${totalAlunos}</div>
      <div class="metrica-detalhe">total de alunos</div>
      <div style="margin-top: 12px; display: flex; justify-content: space-between; gap: 8px;">
        <div style="text-align: center; flex:1;">
          <span style="font-weight:bold; color:#10b981;">${completos}</span><br>
          <span style="font-size:11px;">Completos</span>
        </div>
        <div style="text-align: center; flex:1;">
          <span style="font-weight:bold; color:#f59e0b;">${pendentes}</span><br>
          <span style="font-size:11px;">Pendentes</span>
        </div>
        <div style="text-align: center; flex:1;">
          <span style="font-weight:bold; color:#dc2626;">${vencidos}</span><br>
          <span style="font-size:11px;">Vencidos</span>
        </div>
      </div>
    `;
  } else {
    // Demais perfis: lista de escolas (com scroll se necessário)
    let listaEscolas = '';
    for (let escola in mapa) {
      listaEscolas += `<p style="margin:2px 0; font-size:13px;">
        <strong>${escola}:</strong> ${mapa[escola].pendentes} pendentes / ${mapa[escola].total}
      </p>`;
    }
    card.innerHTML = `
      <div class="metrica-titulo"><i class="fas fa-school"></i> Por Escola</div>
      <div class="metrica-valor" style="font-size: 24px; line-height: 1.2;"><i class="fas fa-chart-bar"></i></div>
      <div class="metrica-detalhe" style="margin-top: 8px; max-height: 200px; overflow-y: auto;">
        ${listaEscolas}
      </div>
    `;
  }
  
  painel.appendChild(card);
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
      <div class="usuario-avatar"><i class="fas fa-book"></i></div>
      <div class="usuario-info">
        <strong>${t.turma}</strong>
        <p><i class="fas fa-school"></i> ${t.escola}</p>
      </div>
    `;
    container.appendChild(div);
  });
}
function preencherSelectEscolasTurma() {
  const selectFiltro = document.getElementById("filtroEscolaTurma");
  const selectCadastro = document.getElementById("selectEscolaTurma");
  const escolas = getEscolasPermitidas();
  
  [selectFiltro, selectCadastro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => {
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
  
  const turmas = turmasTexto.split('\n').map(t => t.trim()).filter(t => t !== "");
  
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
      await fetch(API_URL, {
        method: "POST",
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          acao: "cadastrarTurma",
          email: emailUsuario,
          escola: escola,
          turma: turma
        })
      });
      sucessos++;
    } catch (e) {
      erros.push(`${turma}: Erro de conexão`);
    }
  }
  
  esconderLoading();
  
  let mensagem = "";
  if (sucessos > 0) mensagem += `${sucessos} turma(s) cadastrada(s) com sucesso.`;
  if (erros.length > 0) mensagem += `\nErros:\n${erros.join('\n')}`;
  
  if (erros.length === 0) {
    mostrarToast(mensagem, "success");
  } else {
    mostrarToast(mensagem, "error", 8000);
  }
  
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

document.addEventListener('DOMContentLoaded', function() {
  // Adiciona estilo para tooltip abaixo (com !important para garantir)
  const style = document.createElement('style');
  style.textContent = `
    [data-tooltip].tooltip-below:before {
      bottom: auto !important;
      top: 125% !important;
    }
    [data-tooltip].tooltip-below:after {
      bottom: auto !important;
      top: 125% !important;
      border-top: none !important;
      border-bottom: 6px solid #1e293b !important;
    }
    [data-theme="dark"] [data-tooltip].tooltip-below:after {
      border-bottom-color: #f1f5f9 !important;
    }
  `;
  document.head.appendChild(style);

  // Função para verificar posição e aplicar classe
  function checkTooltipPosition(el) {
    const rect = el.getBoundingClientRect();
    // Se o topo do elemento estiver a menos de 80px do topo da janela
    if (rect.top < 80) {
      el.classList.add('tooltip-below');
    } else {
      el.classList.remove('tooltip-below');
    }
  }

  // Aplica a todos os elementos com data-tooltip
  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', function() {
      checkTooltipPosition(this);
    });
  });

  // Também verificar elementos adicionados dinamicamente (como cards)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-tooltip')) {
          node.addEventListener('mouseenter', function() {
            checkTooltipPosition(this);
          });
        }
        if (node.nodeType === 1 && node.querySelectorAll) {
          node.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', function() {
              checkTooltipPosition(this);
            });
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
