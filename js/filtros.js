// =========================
// FILTROS, PREENCHIMENTO DE SELECTS E AJUSTES DE INTERFACE
// =========================

// ------ APLICAR FILTROS E PESQUISAR ------
function aplicarFiltros(pagina = 1) {
  if (bloqueiaChangeTurma) return;

  console.log("✅ aplicarFiltros chamada com página:", pagina);
  const filtros = {
    escola: document.getElementById("filtroEscola")?.value || "",
    turma: document.getElementById("filtroTurma")?.value || "",
    status: document.getElementById("filtroStatus")?.value || "",
    situacao: document.getElementById("filtroSituacao")?.value || "",
    nome: document.getElementById("pesquisaNome")?.value.toLowerCase() || ""
  };

  carregarAlunos(pagina, filtros);
}

// ------ INICIALIZAR FILTROS PRINCIPAIS ------
function inicializarFiltros() {
  const selectEscola = document.getElementById("filtroEscola");
  if (selectEscola) {
    const valorSelecionado = selectEscola.value;
    
    const escolas = getEscolasPermitidas();
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => {
      const opt = document.createElement("option");
      opt.value = esc;
      opt.textContent = esc;
      selectEscola.appendChild(opt);
    });
    
    if (valorSelecionado) {
      selectEscola.value = valorSelecionado;
    }
  }

  const campoBusca = document.getElementById("pesquisaNome");
  if (campoBusca) {
    const buscarDebounced = debounce(aplicarFiltros, 300);
    campoBusca.removeEventListener("input", buscarDebounced);
    campoBusca.addEventListener("input", buscarDebounced);
  }

  carregarTurmasParaFiltro();
}

// ------ SELECT DE ESCOLAS PARA FILTRO DE ATOS ------
function carregarEscolasParaFiltroAto() {
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

// ------ SELECTS DE PROCESSOS ------
function preencherSelectsProcessos() {
  const selectEscolaCad = document.getElementById("cadastroProcessoEscola");
  const selectEscolaFiltro = document.getElementById("filtroProcessoEscola");
  const escolas = getEscolasPermitidas();
  
  [selectEscolaCad, selectEscolaFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id.includes('filtro') ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
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

// ------ SELECTS DE GESTÃO DE DOCUMENTOS ------
function preencherSelectEscolasDoc() {
  const selectUpload = document.getElementById("uploadEscola");
  const selectFiltro = document.getElementById("filtroEscolaDoc");
  const escolas = getEscolasPermitidas();
  
  [selectUpload, selectFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id === 'filtroEscolaDoc' ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
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

// ------ SELECTS DE TURMAS (MODAL TURMAS) ------
function preencherSelectEscolasTurma() {
  // Se for secretária, esconde o filtro de escola no modal de turmas
  if (perfilUsuario === "SECRETARIA") {
    const wrapperFiltro = document.getElementById("filtroEscolaTurma");
    if (wrapperFiltro) wrapperFiltro.parentElement.style.display = "none"; // esconde a div pai do select
    return;
  }
  
  // Para supervisor, preenche normalmente
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

// ------ ATUALIZAR CAMPOS EXTRAS NO CADASTRO DE PROCESSO ------
function atualizarCamposProcesso() {
  const tipo = document.getElementById("cadastroProcessoTipo").value;
  const container = document.getElementById("camposExtrasProcesso");
  container.innerHTML = "";
  
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
}

function atualizarSubcategorias() {
  const cat = document.getElementById("cadastroProcessoCategoria")?.value;
  const wrapper = document.getElementById("subcategoriaWrapper");
  if (cat === "Profissionais do Magistério") {
    wrapper.style.display = "block";
  } else {
    wrapper.style.display = "none";
    document.getElementById("cadastroProcessoSubcategoria").value = "";
  }
}

// ------ AJUSTES DE INTERFACE POR PERFIL ------
function ajustarOpcoesCadastroUsuario() {
  const perfil = document.getElementById('perfil').value;
  const campoEscola = document.getElementById('campoEscolaContainer');
  if (perfil === 'SECRETARIA' || perfil === 'PEDAGOGICO') {
    campoEscola.style.display = 'block';
  } else {
    campoEscola.style.display = 'none';
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
  const btnModelos = document.getElementById("btnModelos");
  const btnAlterarSenha = document.getElementById("btnAlterarSenha");
  if (btnAlterarSenha) btnAlterarSenha.style.display = "inline-block";

  const btnInativos = document.getElementById("btnInativos");
  if (perfilUsuario === "SECRETARIA" || perfilUsuario === "SUPERVISOR") {
    if (btnInativos) btnInativos.style.display = "inline-block";
  } else {
    if (btnInativos) btnInativos.style.display = "none";
  }

  const isSupervisorMaster = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');
  const btnLegalizacao = document.getElementById("btnLegalizacao");
  if (perfilUsuario === "SUPERVISOR") {
    if (btnLegalizacao) btnLegalizacao.style.display = "inline-block";
  } else {
    if (btnLegalizacao) btnLegalizacao.style.display = "none";
  }

  if (perfilUsuario === "SECRETARIA") {
    if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = "none";
    if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
    if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
    if (btnCadastroUsuario) btnCadastroUsuario.style.display = "none";
    if (btnListarUsuarios) btnListarUsuarios.style.display = "none";
    if (btnNovoAluno) btnNovoAluno.style.display = "inline-block";
    if (btnImportarCSV) btnImportarCSV.style.display = "inline-block";
    if (filtrosContainer) filtrosContainer.style.display = "flex";
    if (btnTurmas) btnTurmas.style.display = "inline-block";
    if (filtroSituacaoWrapper) filtroSituacaoWrapper.style.display = "none";
    if (btnModelos) btnModelos.style.display = "inline-block";

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
    if (btnModelos) btnModelos.style.display = "inline-block";

    if (isSupervisorMaster) {
      if (btnImportarCSV) btnImportarCSV.style.display = "inline-block";
    } else {
      if (btnImportarCSV) btnImportarCSV.style.display = "none";
    }
  }
}
