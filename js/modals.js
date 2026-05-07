let fotoAlunoCarregada = null;
let vinculosEdicaoSelecionados = [];

// =========================
// MODAIS: ABERTURA, FECHAMENTO E AÇÕES INTERNAS
// =========================

// ------ MODAL DETALHES DO ALUNO ------
function abrirAluno(row) {
  const aluno = dadosGlobais.find(a => a._row == row);
  if (!aluno) {
    mostrarToast("Aluno não encontrado", "error");
    return;
  }
  abrirModalDetalhes(aluno);
}

function abrirModalDetalhes(aluno) {
  dadosAlunoAtual = aluno;
  
  document.getElementById("detalhesTitulo").textContent = aluno.ALUNO;
  
  // ---- Exibe a foto do aluno (se existir) ----
  if (aluno.FOTO) {
    exibirFotoAluno(aluno.FOTO);
  } else {
    exibirFotoAluno(null);
  }
  
  // ---- Monta a lista de checkboxes de documentos ----
  let html = `
    <p style="margin-top:0; color:#64748b; display:flex; gap:12px;">
      <span><i class="fas fa-school"></i> ${aluno.ESCOLA}</span>
      <span><i class="fas fa-calendar-alt"></i> Matrícula: ${new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR')}</span>
    </p>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <h3 style="margin:0;">Documentos</h3>
      <button type="button" class="btn-pequeno" onclick="toggleTodosDocumentos()" style="background: var(--card-border);">
        <i class="fas fa-check-double"></i> Marcar/Desmarcar Todos
      </button>
    </div>
    <div class="checkboxes-container">
  `;
  
  const docsBasicos = [
    { label: "Certidão de Nascimento", coluna: 8, valor: aluno.CERTIDAO },
    { label: "CPF do aluno", coluna: 9, valor: aluno.CPF },
    { label: "RG do aluno", coluna: 10, valor: aluno.RG },
    { label: "Carteira de Vacinação", coluna: 11, valor: aluno.VACINA },
    { label: "Cartão do SUS", coluna: 12, valor: aluno.SUS },
    { label: "Comprovante de Residência", coluna: 13, valor: aluno.RESIDENCIA },
    { label: "Documentos do Responsável", coluna: 14, valor: aluno.RESP_DOCS },
    { label: "Histórico Escolar", coluna: 15, valor: aluno.HISTORICO },
    { label: "Declaração de Transferência", coluna: 16, valor: aluno.DECL_TRANSF }
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
    const docEspecial = { label: "Laudo/Relatório Pedagógico (Ed. Especial)", coluna: 17, valor: aluno.ED_ESPECIAL };
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
  
  html += `</div>`; // fecha checkboxes-container

  const observacoesEscapadas = (aluno.OBSERVACOES || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html += `
    <div style="margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 16px;">
      <label for="observacoesAluno" style="font-weight: 500; display: block; margin-bottom: 8px;">
        <i class="fas fa-pencil-alt"></i> Observações internas:
      </label>
      <textarea id="observacoesAluno" rows="3" style="width: 100%; padding: 8px; border-radius: 12px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-primary); font-family: inherit;">${observacoesEscapadas}</textarea>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Campo interno – não aparece em relatórios.</p>
    </div>
  `;
  
  document.getElementById("detalhesConteudo").innerHTML = html;
  
  // ---- Preenche os campos editáveis ----
  document.getElementById("editNomeAluno").value = aluno.ALUNO || "";
  document.getElementById("editIdAluno").value = aluno.ID || '';
  document.getElementById("editResponsavel").value = aluno.RESPONSAVEL || "";
  preencherCamposTelefoneEdicao(aluno.TELEFONE || "");
  document.getElementById("editEdEspecial").checked = aluno.ED_ESPECIAL === true;
  document.getElementById("editCpfNumero").value = aluno.CPF_NUMERO || '';
  
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

function toggleTodosDocumentos() {
  const container = document.querySelector('#modalDetalhes .checkboxes-container');
  if (!container) return;
  
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length === 0) return;
  
  const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);
  const novoEstado = !todosMarcados;
  
  checkboxes.forEach(cb => {
    cb.checked = novoEstado;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  mostrarToast(novoEstado ? 'Todos os documentos marcados.' : 'Todos os documentos desmarcados.', 'info');
}

// ------ MODAL IMPORTAÇÃO CSV ------
function abrirModalImportacao() {
  document.getElementById('modalImportacao').style.display = 'flex';
  document.getElementById('arquivoCSV').value = '';
  document.getElementById('previewContainer').innerHTML = '<p style="padding:16px;color:#64748b;">Selecione um arquivo CSV para visualizar os dados.</p>';
  document.getElementById('btnExecutarImportacao').disabled = true;
  document.getElementById('statusImportacao').innerHTML = '';
}

function fecharModalImportacao() {
  document.getElementById('modalImportacao').style.display = 'none';
}

// ------ MODAL INATIVOS ------
function abrirModalInativos() {
  document.getElementById("modalInativos").style.display = "flex";
  carregarTurmasParaFiltroInativos();
  buscarInativos(1);
}

function fecharModalInativos() {
  document.getElementById("modalInativos").style.display = "none";
}

function carregarTurmasParaFiltroInativos() {
  const select = document.getElementById("filtroTurmaInativo");
  select.innerHTML = '<option value="">Todas as turmas</option>';
  
  if (turmasDisponiveis.length > 0) {
    turmasDisponiveis.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      select.appendChild(opt);
    });
  } else {
    const url = `${API_URL}?tipo=turmas&email=${emailUsuario}`;
    jsonp(url, function(turmas) {
      turmasDisponiveis = turmas;
      turmas.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.turma;
        opt.textContent = t.turma;
        select.appendChild(opt);
      });
    });
  }
}

// ------ MODAL TURMAS (SUPERVISOR) ------
function abrirModalTurmas() {
  document.getElementById("modalTurmas").style.display = "flex";
  carregarTurmas();
}

function fecharModalTurmas() {
  document.getElementById("modalTurmas").style.display = "none";
}

function abrirModalCadastroTurma() {
  document.getElementById("modalCadastroTurma").style.display = "flex";
  
  // Se for secretária, esconde o campo de escola e usa a escola do usuário
  const selectEscola = document.getElementById("selectEscolaTurma");
  const labelEscola = selectEscola.parentElement; // div.input-icon
  if (perfilUsuario === "SECRETARIA") {
    labelEscola.style.display = "none";
    // Define o valor da escola para enviar ao backend (mesmo oculto)
    selectEscola.value = escolaUsuario;
  } else {
    labelEscola.style.display = "block";
    preencherSelectEscolasTurma(); // preenche o select para supervisores
  }
}

function fecharModalCadastroTurma() {
  document.getElementById("modalCadastroTurma").style.display = "none";
  document.getElementById("nomeTurma").value = "";
  document.getElementById("erroTurma").style.display = "none";
}

// Salvar turma (múltiplas linhas) - função usada no modal
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
  
  const btnSalvar = document.querySelector("#modalCadastroTurma .btn-salvar");
  showButtonLoading(btnSalvar);
  
  let sucessos = 0;
  let erros = [];
  
  try {
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
  } finally {
    hideButtonLoading(btnSalvar);
  }
  
  let mensagem = "";
  if (sucessos > 0) mensagem += `${sucessos} turma(s) cadastrada(s) com sucesso. `;
  if (erros.length > 0) mensagem += `Erros: ${erros.join(', ')}`;
  
  if (erros.length === 0) {
    mostrarToast(mensagem, "success");
    limparCacheTurmas(escola);
    limparCacheTurmas("todas");
  } else {
    mostrarToast(mensagem, "error", 8000);
  }
  
  if (sucessos > 0) {
    fecharModalCadastroTurma();
    carregarTurmas(document.getElementById("filtroEscolaTurma").value);
  }
}

// ------ MODAL LEGALIZAÇÃO (ATOS) ------
function abrirModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "flex";
  carregarEscolasParaFiltroAto();
  carregarAtos();
}

function fecharModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "none";
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
  document.getElementById("atoArquivo").value = "";
  document.getElementById("atoDataHomologacao").value = ato.dataHomologacao ? ato.dataHomologacao.split('T')[0] : "";
  document.getElementById("modalFormAto").style.display = "flex";
}

// ------ MODAL MODELOS ------
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

// ------ MODAL GESTÃO DE DOCUMENTOS ------
function abrirModalDocumentos() {
  document.getElementById("modalDocumentos").style.display = "flex";
  preencherSelectEscolasDoc();
  mostrarAbaUpload();
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
  buscarDocumentos();
}

// ------ MODAL PROCESSOS (EDOCS) ------
function abrirModalProcessos() {
  document.getElementById("modalProcessos").style.display = "flex";
  preencherSelectsProcessos();
  mostrarAbaCadastroProcesso();
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
  buscarProcessos();
}

// ------ MODAL LISTA DE USUÁRIOS ------
function abrirModalListaUsuarios() {
  document.getElementById("modalListaUsuarios").style.display = "flex";
  carregarUsuarios();
}

function fecharModalListaUsuarios() {
  document.getElementById("modalListaUsuarios").style.display = "none";
}

function abrirModalCadastroUsuario() {
  document.getElementById("novoEmail").value = "";
  document.getElementById("perfil").value = "SECRETARIA";
  document.getElementById("erroUsuario").style.display = "none";

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

  ajustarOpcoesCadastroUsuario();

  document.getElementById("modalCadastroUsuario").style.display = "flex";
}

function fecharModalCadastroUsuario() {
  document.getElementById("modalCadastroUsuario").style.display = "none";
}

// ------ MODAL ALTERAR SENHA ------
function abrirModalAlterarSenha() {
  document.getElementById("modalAlterarSenha").style.display = "flex";
  document.getElementById("senhaAtual").value = "";
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarNovaSenha").value = "";
}

function fecharModalAlterarSenha() {
  document.getElementById("modalAlterarSenha").style.display = "none";
}

// ------ MODAL EXPORTAÇÃO ------
function abrirModalExportacao() {
  // Preencher escolas (apenas para supervisor)
  if (perfilUsuario === "SUPERVISOR") {
    const selectEscola = document.getElementById('exportEscola');
    const escolas = getEscolasPermitidas();
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => selectEscola.appendChild(new Option(esc, esc)));
    document.getElementById('exportEscolaWrapper').style.display = 'block';
    // Quando a escola mudar, recarregar turmas
    selectEscola.onchange = function() {
      carregarTurmasExportacao(this.value);
    };
  } else {
    document.getElementById('exportEscolaWrapper').style.display = 'none';
  }

  // Preencher turmas
  carregarTurmasExportacao( perfilUsuario === "SUPERVISOR" ? "" : escolaUsuario );
  
  document.getElementById('exportStatus').value = '';
  document.getElementById('modalExportacao').style.display = 'flex';
}

function fecharModalExportacao() {
  document.getElementById('modalExportacao').style.display = 'none';
}

// ------ MODAL CHECKLIST EM LOTE ------
function abrirModalChecklistLote() {
  document.getElementById("modalChecklistLote").style.display = "flex";
  document.getElementById("escolaAtualChecklist").textContent = escolaUsuario;
  
  const select = document.getElementById("selectTurmaChecklist");
  select.innerHTML = '<option value="">Selecione uma turma</option>';
  
  const turmasDaEscola = turmasDisponiveis.filter(t => t.escola === escolaUsuario);
  if (turmasDaEscola.length === 0) {
    carregarTurmas(escolaUsuario).then(() => {
      const turmas = turmasGlobais.filter(t => t.escola === escolaUsuario);
      turmas.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.turma;
        opt.textContent = t.turma;
        select.appendChild(opt);
      });
    });
  } else {
    turmasDaEscola.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      select.appendChild(opt);
    });
  }
  
  document.getElementById("listaChecklistContainer").innerHTML = '<p style="padding:20px; text-align:center;">Selecione uma turma...</p>';
}

function fecharModalChecklistLote() {
  document.getElementById("modalChecklistLote").style.display = "none";
}

async function carregarAlunosParaChecklist() {
  const turmaSelecionada = document.getElementById("selectTurmaChecklist").value;
  const container = document.getElementById("listaChecklistContainer");

  if (!turmaSelecionada) {
    container.innerHTML = '<p style="padding:20px; text-align:center;">Selecione uma turma...</p>';
    return;
  }

  mostrarLoading();

  let url = `${API_URL}?email=${emailUsuario}&turma=${encodeURIComponent(turmaSelecionada)}&limite=1000`;

  jsonp(url, function(dados) {
    const alunos = dados.alunos.filter(a => a.SITUACAO === "Ativo");

    if (alunos.length === 0) {
      container.innerHTML = '<p style="padding:20px; text-align:center;">Nenhum aluno ativo encontrado nesta turma.</p>';
      esconderLoading();
      return;
    }

    const documentos = [
      { col: 'CERTIDAO', label: 'Certidão', icon: 'fa-certificate' },
      { col: 'CPF', label: 'CPF', icon: 'fa-id-card' },
      { col: 'RG', label: 'RG', icon: 'fa-address-card' },
      { col: 'VACINA', label: 'Vacina', icon: 'fa-syringe' },
      { col: 'SUS', label: 'SUS', icon: 'fa-hospital' },
      { col: 'RESIDENCIA', label: 'Residência', icon: 'fa-home' },
      { col: 'RESP_DOCS', label: 'Resp. Docs', icon: 'fa-file-signature' },
      { col: 'HISTORICO', label: 'Histórico', icon: 'fa-history' },
      { col: 'DECL_TRANSF', label: 'Decl. Transf.', icon: 'fa-exchange-alt' },
      { col: 'ED_ESPECIAL', label: 'Laudo Ed. Especial', icon: 'fa-puzzle-piece', especial: true }
    ];

    let html = '<div style="display:flex; flex-direction:column; min-width:700px;">';
    
    // Cabeçalho com nomes
    html += '<div style="display:flex; align-items:center; padding:10px 16px; background:var(--card-border); font-weight:600; font-size:11px; gap:4px; position:sticky; top:0; z-index:10;">';
    html += '<div style="flex:1; min-width:150px;">Aluno</div>';
    documentos.forEach(doc => {
      html += `<div style="width:50px; text-align:center; line-height:1.2;" title="${doc.label}">
        <i class="fas ${doc.icon}" style="font-size:16px;"></i><br>
        <span style="display:block; margin-top:2px;">${doc.label}</span>
      </div>`;
    });
    html += '</div>';

    alunos.forEach(aluno => {
      html += '<div style="display:flex; align-items:center; padding:8px 16px; border-bottom:1px solid var(--card-border); gap:4px;">';
      html += `<div style="flex:1; min-width:150px; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${aluno.ALUNO}">${aluno.ALUNO}</div>`;

      documentos.forEach(doc => {
        // Para o laudo de Ed. Especial, só exibe checkbox se o aluno for Ed. Especial
        if (doc.especial && aluno.ED_ESPECIAL !== true) {
          html += '<div style="width:50px; text-align:center; color:#ccc;">–</div>';
        } else {
          const valor = aluno[doc.col] === true;
          const bgColor = valor ? '#d4edda' : '#fff';
          html += `<div style="width:50px; text-align:center; background:${bgColor}; border-radius:4px; padding:2px 0;">
            <input type="checkbox" 
                   class="check-doc-individual"
                   data-row="${aluno._row}" 
                   data-escola="${aluno.ESCOLA}"
                   data-col="${doc.col}"
                   data-original="${valor}"
                   ${valor ? 'checked' : ''}
                   style="transform:scale(1.1); cursor:pointer;">
          </div>`;
        }
      });
      
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
    esconderLoading();
  });
}

// ------ NOVO ALUNO (MODAL) ------
function abrirNovoAluno() {
  document.getElementById("novoAluno").style.display = "flex";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";
  document.getElementById("escolaVinculada").textContent = 
    `Aluno será matriculado em: ${escolaUsuario}`;
  carregarTurmasParaCadastro(escolaUsuario);
}

function voltarApp() {
  const idsParaEsconder = ["usuarios", "cadastro", "novoAluno", "modalListaUsuarios", "modalCadastroUsuario"];
  idsParaEsconder.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const lista = document.getElementById("lista");
  const painel = document.getElementById("painel");
  if (lista) lista.style.display = "";
  if (painel) painel.style.display = "";

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

  const edEspCheck = document.getElementById("alunoEdEspecial");
  if (edEspCheck) edEspCheck.checked = false;
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
    email: emailUsuario
  };

  postSemResposta(dados, "Aluno cadastrado com sucesso!", () => {
    registrarUltimaAcao('Novo aluno cadastrado');   // 🔥

    if (nomeInput) nomeInput.value = "";
    if (responsavelInput) responsavelInput.value = "";
    if (edEspecialCheck) edEspecialCheck.checked = false;
    document.getElementById("selectTurmaAluno").selectedIndex = 0;
    document.getElementById("dataMatricula").value = "";
    const obsField = document.getElementById("observacoesNovoAluno");
    if (obsField) obsField.value = "";
    const cpfField = document.getElementById("cpfNumero");
    if (cpfField) cpfField.value = "";

    document.getElementById("novoAluno").style.display = "none";
    document.getElementById("lista").style.display = "";
    document.getElementById("painel").style.display = "";

    carregarAlunos();
    hideButtonLoading(btnSalvar);
  });
}

// ------ CAMPOS DE TELEFONE (MODAL CADASTRO E EDIÇÃO) ------
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

function removerCampoTelefone(botao) {
  botao.closest('.input-icon').remove();
}

function coletarTelefonesCadastro() {
  const inputs = document.querySelectorAll("#telefonesContainerCadastro .telefone-cadastro");
  const telefones = [];
  inputs.forEach(input => {
    const valor = input.value.trim();
    if (valor) telefones.push(valor);
  });
  return telefones.join("; ");
}

function preencherCamposTelefoneEdicao(telefonesStr) {
  const container = document.getElementById("telefonesContainerEdicao");
  container.innerHTML = "";
  
  const telefones = telefonesStr ? telefonesStr.split(";").map(t => t.trim()).filter(t => t) : [];
  
  if (telefones.length === 0) {
    adicionarCampoTelefoneEdicao();
  } else {
    telefones.forEach((tel, index) => {
      adicionarCampoTelefoneEdicao(tel);
    });
  }
}

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

function coletarTelefonesEdicao() {
  const inputs = document.querySelectorAll("#telefonesContainerEdicao .telefone-edicao");
  const telefones = [];
  inputs.forEach(input => {
    const valor = input.value.trim();
    if (valor) telefones.push(valor);
  });
  return telefones.join("; ");
}

// ------ TOGGLE DE SENHA NO MODAL ALTERAR SENHA ------
function toggleSenha(iconElement) {
  const input = iconElement.parentElement.querySelector('input');
  if (!input) return;
  
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
  
  const icon = iconElement.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  }
}

// ------ MENU DROPDOWN (USUÁRIO NO HEADER) ------
function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

// Clicar fora fecha menu (será tratado em main.js, mas podemos deixar aqui também se quisermos; 
// mas para evitar duplicação, main.js terá o listener global. Deixaremos apenas a função toggleMenu.)

// ------ COPIAR CÓDIGO DO PROCESSO ------
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

// ------ PREENCHER DATA DE HOJE NO CADASTRO DE ALUNO ------
function preencherDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const dataFormatada = `${ano}-${mes}-${dia}`;
  document.getElementById("dataMatricula").value = dataFormatada;
}
function alterarFotoAluno() {
  const fileInput = document.getElementById('uploadFotoAluno');
  const file = fileInput.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    mostrarToast("A imagem deve ter no máximo 5 MB.", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(',')[1];
    const dados = {
      acao: 'uploadFotoAluno',
      email: emailUsuario,
      escola: dadosAlunoAtual.ESCOLA,
      row: dadosAlunoAtual._row,
      fileBase64: base64,
      fileName: `aluno_${dadosAlunoAtual.ID || dadosAlunoAtual._row}.jpg`,
      mimeType: file.type
    };
    
    postSemResposta(dados, "Foto salva com sucesso!", function() {
      // Atualiza a pré-visualização
      const url = `https://drive.google.com/thumbnail?id=${dados.fileName}&sz=w100`;
      fotoAlunoCarregada = URL.createObjectURL(file); // usa blob local para preview imediato
      exibirFotoAluno(fotoAlunoCarregada);
    });
  };
  reader.readAsDataURL(file);
}

function removerFotoAluno() {
  if (!confirm("Remover a foto do aluno?")) return;
  // Envia um upload sem arquivo? Não temos backend para excluir, mas podemos limpar a coluna.
  // Para simplificar, apenas limpa a visualização e marca a coluna como vazia enviando uma flag.
  const dados = {
    acao: 'uploadFotoAluno',
    email: emailUsuario,
    escola: dadosAlunoAtual.ESCOLA,
    row: dadosAlunoAtual._row,
    fileBase64: '', // vazio sinaliza remoção
    fileName: '',
    mimeType: ''
  };
  postSemResposta(dados, "Foto removida.", function() {
    fotoAlunoCarregada = null;
    exibirFotoAluno(null);
  });
}
function exibirFotoAluno(url) {
  const img = document.getElementById('fotoAlunoPreview');
  const inicial = document.getElementById('fotoAlunoInicial');
  if (url) {
    img.src = url;
    img.style.display = 'block';
    inicial.style.display = 'none';
  } else {
    img.style.display = 'none';
    inicial.style.display = 'flex';
    const letra = dadosAlunoAtual ? dadosAlunoAtual.ALUNO.charAt(0).toUpperCase() : '?';
    inicial.textContent = letra;
  }
}
function carregarFotoAluno(id, escola) {
  const urlAPI = `${API_URL}?tipo=fotoAluno&id=${id}&escola=${encodeURIComponent(escola)}&_=${Date.now()}`;
  jsonp(urlAPI, function(res) {
    if (res.url && res.url.trim() !== "") {
      fotoAlunoCarregada = res.url;
      exibirFotoAluno(res.url);
    } else {
      fotoAlunoCarregada = null;
      exibirFotoAluno(null);
    }
  });
}

function abrirModalAlterarSenhaObrigatorio() {
  const modal = document.getElementById("modalAlterarSenha");
  if (!modal) return;

  // Exibe o modal
  modal.style.display = "flex";

  // Esconde o botão de fechar (X)
  const closeBtn = modal.querySelector(".close-btn");
  if (closeBtn) closeBtn.style.display = "none";

  // Marca o modal como "obrigatório" para impedir fechamento via Esc/clique fora
  modal.classList.add("primeiro-acesso");

  // Limpa os campos
  document.getElementById("senhaAtual").value = "";
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarNovaSenha").value = "";

  // Foco no campo de senha atual (que será a senha enviada por e-mail)
  document.getElementById("senhaAtual").focus();
}
function marcarTodosDocumentos(marcar) {
  const checkboxes = document.querySelectorAll('#listaChecklistContainer .check-doc-individual');
  checkboxes.forEach(cb => { cb.checked = marcar; });
}

function desmarcarTodosDocumentos() {
  marcarTodosDocumentos(false);
}
// =========================
// MODAL LEGISLAÇÃO
// =========================

let vinculosSelecionados = [];

// ---- ABERTURA / FECHAMENTO / ABAS ----
function abrirModalLegislacao() {
  document.body.style.overflow = 'hidden';
  document.getElementById('modalLegislacao').style.display = 'flex';
  
  const abaCadastroBtn = document.getElementById('abaCadastrarLegislacaoBtn');
  const emailsPermitidos = [
    "eder.ramos@educador.edu.es.gov.br",
    "ecramos@sedu.es.gov.br"
  ];
  
  // Exibe ou oculta o botão de cadastro conforme permissão
  if (abaCadastroBtn) {
    abaCadastroBtn.style.display = emailsPermitidos.includes(emailUsuario) ? 'inline-block' : 'none';
  }
  
  // 🔥 Sempre abre na aba de consulta
  mostrarAbaConsultaLegislacao();
}

function fecharModalLegislacao() {
  document.body.style.overflow = '';         // 🔓 libera o fundo
  document.getElementById('modalLegislacao').style.display = 'none';
}

function mostrarAbaCadastroLegislacao() {
  document.getElementById('abaCadastroLegislacao').style.display = 'block';
  document.getElementById('abaConsultaLegislacao').style.display = 'none';
  carregarDocumentosParaVinculacao();   // ← ADICIONE ESTA LINHA
}

function mostrarAbaConsultaLegislacao() {
  document.getElementById('abaCadastroLegislacao').style.display = 'none';
  document.getElementById('abaConsultaLegislacao').style.display = 'block';
  buscarLegislacao();
}

// ---- CADASTRAR ----
// ---- CADASTRAR ----
async function cadastrarLegislacao() {
  const tipo = document.getElementById('tipoLegislacao').value;
  const numero = document.getElementById('numeroLegislacao').value.trim();
  const ano = document.getElementById('anoLegislacao').value.trim();
  const assunto = document.getElementById('assuntoLegislacao').value.trim();
  const dataPublicacao = document.getElementById('dataPublicacaoLegislacao').value;
  const observacoes = document.getElementById('observacoesLegislacao').value.trim();
  const palavrasChave = document.getElementById('palavrasChaveLegislacao').value.trim();
  const fileInput = document.getElementById('arquivoLegislacao');
  const file = fileInput.files[0];

  if (!tipo || !numero || !ano) {
    mostrarToast('Tipo, número e ano são obrigatórios.', 'warning');
    return;
  }

  const btnSalvar = document.querySelector('#abaCadastroLegislacao .btn-salvar');
  showButtonLoading(btnSalvar);

  let fileBase64 = null, fileName = null, mimeType = null;

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning');
      hideButtonLoading(btnSalvar);
      return;
    }
    const extensao = file.name.split('.').pop();
    fileName = `${tipo} ${numero}/${ano} - ${assunto}.${extensao}`;
    mimeType = file.type;
    fileBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  const dados = {
    acao: 'salvarLegislacao',
    email: emailUsuario,
    tipo: tipo,
    numero: numero,
    ano: ano,
    assunto: assunto,
    dataPublicacao: dataPublicacao,
    observacoes: observacoes,
    palavrasChave: palavrasChave,
    fileName: fileName,
    mimeType: mimeType,
    fileBase64: fileBase64,
    vinculos: vinculosSelecionados
  };

  postSemResposta(dados, 'Legislação cadastrada!', () => {
    hideButtonLoading(btnSalvar);
    document.getElementById('tipoLegislacao').value = '';
    document.getElementById('numeroLegislacao').value = '';
    document.getElementById('anoLegislacao').value = '';
    document.getElementById('assuntoLegislacao').value = '';
    document.getElementById('dataPublicacaoLegislacao').value = '';
    document.getElementById('observacoesLegislacao').value = '';
    document.getElementById('palavrasChaveLegislacao').value = '';
    fileInput.value = '';
    vinculosSelecionados = [];
    renderizarVinculosAdicionados();
    mostrarAbaConsultaLegislacao();
  });
}

// ---- CONSULTAR ----
function buscarLegislacao() {
  mostrarLoading();
  const filtroTipo = document.getElementById('filtroTipoLegislacao').value;
  const filtroAno = document.getElementById('filtroAnoLegislacao').value.trim();
  const filtroAssunto = document.getElementById('filtroAssuntoLegislacao')?.value.trim() || '';
  const filtroPalavrasChave = document.getElementById('filtroPalavrasChaveLegislacao')?.value.trim() || '';

  let url = `${API_URL}?tipo=legislacao&email=${emailUsuario}`;
  if (filtroTipo) url += `&filtroTipo=${encodeURIComponent(filtroTipo)}`;
  if (filtroAno) url += `&filtroAno=${encodeURIComponent(filtroAno)}`;
  if (filtroAssunto) url += `&filtroAssunto=${encodeURIComponent(filtroAssunto)}`;
  if (filtroPalavrasChave) url += `&filtroPalavrasChave=${encodeURIComponent(filtroPalavrasChave)}`;

  jsonp(url, function(dados) {
    esconderLoading();
    preencherDropdownDocumentos(dados);
    renderizarListaLegislacao(dados);
  });
}

function preencherDropdownDocumentos(dados) {
  const select = document.getElementById('filtroDocumentoId');
  if (!select) return;
  // Mantém a primeira opção (placeholder) e remove as demais
  while (select.options.length > 1) select.remove(1);
  if (Array.isArray(dados)) {
    dados.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`;
      select.appendChild(option);
    });
  }
}

function renderizarListaLegislacao(lista) {
  const container = document.getElementById('listaLegislacaoContainer');
  container.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    container.innerHTML = '<p>Nenhum documento encontrado.</p>';
    return;
  }

  // 🔥 Conjunto de IDs que foram revogados (para indicador visual)
  const idsRevogados = new Set();
  lista.forEach(item => {
    if (item.vinculosDetalhes) {
      item.vinculosDetalhes.forEach(v => {
        if (v.tipoVinculo === 'revoga') {
          idsRevogados.add(v.id);
        }
      });
    }
  });

  const emailsPermitidos = ['eder.ramos@educador.edu.es.gov.br', 'ecramos@sedu.es.gov.br'];
  const podeGerenciar = emailsPermitidos.includes(emailUsuario);

  lista.forEach(item => {
    const div = document.createElement('div');
    div.className = 'usuario-card';

    // Estilo especial se revogado
    if (idsRevogados.has(item.id)) {
      div.style.borderLeft = '4px solid #ef4444';
      div.style.opacity = '0.85';
      div.style.background = '#fef2f2';
    }

    const viewUrl = item.arquivoId ? `https://drive.google.com/file/d/${item.arquivoId}/view` : '';
    const downloadUrl = item.arquivoId ? `https://drive.google.com/uc?export=download&id=${item.arquivoId}` : '';

    // Monta links de vínculos
    let vinculosHtml = '';
    if (item.vinculosDetalhes && item.vinculosDetalhes.length > 0) {
      const links = item.vinculosDetalhes.map(v => 
        `<span onclick="event.stopPropagation(); abrirDetalheLegislacao('${v.id}')" 
               title="${v.tipoVinculo}" 
               style="cursor:pointer; color:#2563eb; text-decoration:underline; margin-right:8px;">
           ${v.tipo} ${v.numero}/${v.ano} (${v.tipoVinculo})
         </span>`
      ).join('|');
      vinculosHtml = `<div class="legislacao-vinculos">Vinculado a: ${links}</div>`;
    }

    // Badge de revogado
    const badgeRevogado = idsRevogados.has(item.id) ? 
      '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:12px;font-size:11px;margin-left:8px;">Revogado</span>' : '';

    // Botões de ação
    const botaoEditar = podeGerenciar ? 
      `<button class="btn-pequeno" onclick="event.stopPropagation(); abrirEdicaoLegislacao('${item.id}')" style="margin-left:4px;">
        <i class="fas fa-edit"></i> Editar
      </button>` : '';

    const botaoExcluir = podeGerenciar ? 
      `<button class="btn-pequeno" onclick="event.stopPropagation(); excluirLegislacaoItem('${item.id}')" style="background:#ef4444;color:white;margin-left:4px;">
        <i class="fas fa-trash"></i> Excluir
      </button>` : '';

    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-file-contract"></i></div>
      <div class="usuario-info">
        <strong>${item.tipo} ${item.numero}/${item.ano}${badgeRevogado}</strong>
        <p>${item.assunto || 'Sem assunto'}</p>
        <p style="font-size:12px;">
          <i class="fas fa-calendar-alt"></i> ${item.dataPublicacao ? new Date(item.dataPublicacao).toLocaleDateString('pt-BR') : '—'}
        </p>
        ${vinculosHtml}
        <div style="margin-top:8px;">
          ${viewUrl ? `<a href="${viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar</a>` : ''}
          ${downloadUrl ? `<a href="${downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>` : ''}
          <button class="btn-pequeno" onclick="event.stopPropagation(); abrirDetalheLegislacao('${item.id}')">
            <i class="fas fa-info-circle"></i> Detalhes
          </button>
          ${botaoEditar}
          ${botaoExcluir}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function abrirDetalheLegislacao(id) {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=legislacaoPorId&email=${emailUsuario}&id=${encodeURIComponent(id)}`, function(item) {
    esconderLoading();
    if (!item) {
      mostrarToast('Documento não encontrado.', 'warning');
      return;
    }

    let vinculosHtml = '';
    if (item.vinculosDetalhes && item.vinculosDetalhes.length > 0) {
      vinculosHtml = '<h4>Vínculos:</h4><ul>';
      item.vinculosDetalhes.forEach(v => {
        vinculosHtml += `<li><a href="#" onclick="abrirDetalheLegislacao('${v.id}')">${v.tipo} ${v.numero}/${v.ano} (${v.tipoVinculo})</a></li>`;
      });
      vinculosHtml += '</ul>';
    }

    const viewUrl = item.arquivoId ? `https://drive.google.com/file/d/${item.arquivoId}/view` : '';
    const downloadUrl = item.arquivoId ? `https://drive.google.com/uc?export=download&id=${item.arquivoId}` : '';

    const conteudo = `
      <div style="background:var(--card-bg); padding:16px; border-radius:12px; border:1px solid var(--card-border); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="margin:0;">${item.tipo} ${item.numero}/${item.ano}</h3>
          <button onclick="fecharDetalheLegislacao()" style="background:none; border:none; font-size:20px; cursor:pointer; color:var(--text-muted); padding:4px;" title="Fechar">✕</button>
        </div>
        <p><strong>Assunto:</strong> ${item.assunto || '—'}</p>
        <p><strong>Publicação:</strong> ${item.dataPublicacao ? new Date(item.dataPublicacao).toLocaleDateString('pt-BR') : '—'}</p>
        ${vinculosHtml}
        <div style="margin-top:12px;">
          ${viewUrl ? `<a href="${viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar PDF</a>` : ''}
          ${downloadUrl ? `<a href="${downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>` : ''}
        </div>
      </div>
    `;

    let detalheContainer = document.getElementById('detalheLegislacaoContainer');
    if (!detalheContainer) {
      detalheContainer = document.createElement('div');
      detalheContainer.id = 'detalheLegislacaoContainer';
      document.getElementById('abaConsultaLegislacao').appendChild(detalheContainer);
    }
    detalheContainer.innerHTML = conteudo;
  });
}

function fecharDetalheLegislacao() {
  const container = document.getElementById('detalheLegislacaoContainer');
  if (container) {
    container.innerHTML = '';
  }
}

// Função auxiliar para buscar um documento vinculado específico
function buscarLegislacaoPorId(id) {
  // Por enquanto, apenas exibe o ID. Futuramente pode abrir um modal detalhado.
  mostrarToast(`Documento vinculado: ${id}`, 'info');
}
// =========================
// VÍNCULOS (MODIFICADO PARA USAR DROPDOWN NO CADASTRO)
// =========================

// Preenche o dropdown de vínculos ao abrir a aba de cadastro
function carregarDocumentosParaVinculacao() {
  const select = document.getElementById('selectVinculo');
  if (!select) return;
  select.innerHTML = '<option value="">Selecionar...</option>';
  const url = `${API_URL}?tipo=legislacao&email=${emailUsuario}`;
  jsonp(url, function(dados) {
    if (Array.isArray(dados)) {
      dados.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`;
        select.appendChild(option);
      });
    }
  });
}

// Adiciona o vínculo selecionado no dropdown
function adicionarVinculoDoSelect() {
  const select = document.getElementById('selectVinculo');
  const idDestino = select.value;
  if (!idDestino) return;
  const texto = select.options[select.selectedIndex].text;
  adicionarVinculo(idDestino, texto);
  select.value = '';
}

// Modifica adicionarVinculo para aceitar um texto descritivo
function adicionarVinculo(idDestino, texto = null) {
  if (vinculosSelecionados.find(v => v.idDestino === idDestino)) {
    mostrarToast('Documento já vinculado.', 'warning');
    return;
  }
  vinculosSelecionados.push({ idDestino, tipoVinculo: 'revoga', texto });
  renderizarVinculosAdicionados();
}

function removerVinculo(index) {
  vinculosSelecionados.splice(index, 1);
  renderizarVinculosAdicionados();
}

function alterarTipoVinculo(index, novoTipo) {
  vinculosSelecionados[index].tipoVinculo = novoTipo;
}

function renderizarVinculosAdicionados() {
  const container = document.getElementById('vinculosAdicionados');
  if (vinculosSelecionados.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">Nenhum vínculo adicionado.</p>';
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
  vinculosSelecionados.forEach((v, i) => {
    html += `
      <div style="display:flex; align-items:center; gap:8px; background:var(--card-border); padding:6px 10px; border-radius:8px;">
        <span style="flex:1; font-size:13px;">${v.texto || v.idDestino}</span>
        <select onchange="alterarTipoVinculo(${i}, this.value)" style="width:140px; font-size:12px; padding:2px 4px;">
          <option value="revoga" ${v.tipoVinculo==='revoga'?'selected':''}>Revoga</option>
          <option value="retifica" ${v.tipoVinculo==='retifica'?'selected':''}>Retifica</option>
          <option value="acrescenta" ${v.tipoVinculo==='acrescenta'?'selected':''}>Complementa</option>
          <option value="ver também" ${v.tipoVinculo==='ver também'?'selected':''}>Ver também</option>
        </select>
        <button type="button" class="btn-icone" onclick="removerVinculo(${i})" style="color:#ef4444;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}
function excluirLegislacaoItem(id) {
  if (!confirm('Deseja realmente excluir este documento? Esta ação não pode ser desfeita.')) return;

  const dados = {
    acao: 'excluirLegislacao',
    email: emailUsuario,
    id: id
  };

  postSemResposta(dados, 'Documento excluído!', () => {
    // Recarrega a consulta após a exclusão
    if (document.getElementById('abaConsultaLegislacao').style.display !== 'none') {
      buscarLegislacao();
    }
  });
}
let legislacaoEditandoId = null;

function abrirEdicaoLegislacao(id) {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=legislacaoPorId&email=${emailUsuario}&id=${encodeURIComponent(id)}`, function(item) {
    esconderLoading();
    if (!item) {
      mostrarToast('Documento não encontrado.', 'warning');
      return;
    }
    legislacaoEditandoId = item.id;
    document.getElementById('editTipoLegislacao').value = item.tipo || '';
    document.getElementById('editNumeroLegislacao').value = item.numero || '';
    document.getElementById('editAnoLegislacao').value = item.ano || '';
    document.getElementById('editAssuntoLegislacao').value = item.assunto || '';
    document.getElementById('editDataPublicacaoLegislacao').value = item.dataPublicacao ? item.dataPublicacao.split('T')[0] : '';
    document.getElementById('editObservacoesLegislacao').value = item.observacoes || '';
    document.getElementById('editPalavrasChaveLegislacao').value = item.palavrasChave || '';
    document.getElementById('editArquivoLegislacao').value = '';

    // 🔥 Inicializa vínculos da edição com os dados existentes
    vinculosEdicaoSelecionados = [];
    if (item.vinculosDetalhes && item.vinculosDetalhes.length > 0) {
      item.vinculosDetalhes.forEach(v => {
        vinculosEdicaoSelecionados.push({
          idDestino: v.id,
          tipoVinculo: v.tipoVinculo || 'revoga',
          texto: `${v.tipo} ${v.numero}/${v.ano} - ${v.assunto || 'Sem assunto'}`
        });
      });
    }
    renderizarVinculosEdicaoAdicionados();
    carregarDocumentosParaVinculacaoEdicao(); // carrega o dropdown

    document.getElementById('modalEditarLegislacao').style.display = 'flex';
  });
}

function fecharEdicaoLegislacao() {
  document.getElementById('modalEditarLegislacao').style.display = 'none';
  legislacaoEditandoId = null;
  vinculosEdicaoSelecionados = [];
  document.getElementById('vinculosEdicaoAdicionados').innerHTML = '';
}

async function salvarEdicaoLegislacao() {
  const tipo = document.getElementById('editTipoLegislacao').value;
  const numero = document.getElementById('editNumeroLegislacao').value.trim();
  const ano = document.getElementById('editAnoLegislacao').value.trim();
  const assunto = document.getElementById('editAssuntoLegislacao').value.trim();
  const dataPublicacao = document.getElementById('editDataPublicacaoLegislacao').value;
  const observacoes = document.getElementById('editObservacoesLegislacao').value.trim();
  const palavrasChave = document.getElementById('editPalavrasChaveLegislacao').value.trim();
  const fileInput = document.getElementById('editArquivoLegislacao');
  const file = fileInput.files[0];

  if (!tipo || !numero || !ano) {
    mostrarToast('Tipo, número e ano são obrigatórios.', 'warning');
    return;
  }

  const btnSalvar = document.querySelector('#modalEditarLegislacao .btn-salvar');
  showButtonLoading(btnSalvar);

  let fileBase64 = null, fileName = null, mimeType = null;

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning');
      hideButtonLoading(btnSalvar);
      return;
    }
    const extensao = file.name.split('.').pop();
    fileName = `${tipo} ${numero}/${ano} - ${assunto}.${extensao}`;
    mimeType = file.type;
    fileBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  const dados = {
    acao: 'editarLegislacao',
    email: emailUsuario,
    id: legislacaoEditandoId,
    tipo: tipo,
    numero: numero,
    ano: ano,
    assunto: assunto,
    dataPublicacao: dataPublicacao,
    observacoes: observacoes,
    palavrasChave: palavrasChave,
    fileName: fileName,
    mimeType: mimeType,
    vinculos: vinculosEdicaoSelecionados,
    fileBase64: fileBase64
  };

  postSemResposta(dados, 'Documento atualizado!', () => {
    hideButtonLoading(btnSalvar);
    fecharEdicaoLegislacao();
    // Atualiza a lista se a aba de consulta estiver aberta
    if (document.getElementById('abaConsultaLegislacao').style.display !== 'none') {
      buscarLegislacao();
    }
  });
}
// Preenche o dropdown de vínculos do modal de edição
function carregarDocumentosParaVinculacaoEdicao() {
  const select = document.getElementById('selectEditVinculo');
  if (!select) return;
  select.innerHTML = '<option value="">Selecionar documento...</option>';
  const url = `${API_URL}?tipo=legislacao&email=${emailUsuario}`;
  jsonp(url, function(dados) {
    if (Array.isArray(dados)) {
      dados.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`;
        select.appendChild(option);
      });
    }
  });
}

// Adiciona o vínculo selecionado no dropdown da edição
function adicionarVinculoEdicaoDoSelect() {
  const select = document.getElementById('selectEditVinculo');
  const idDestino = select.value;
  if (!idDestino) return;
  const texto = select.options[select.selectedIndex].text;
  adicionarVinculoEdicao(idDestino, texto);
  select.value = '';
}

function adicionarVinculoEdicao(idDestino, texto = null) {
  if (vinculosEdicaoSelecionados.find(v => v.idDestino === idDestino)) {
    mostrarToast('Documento já vinculado.', 'warning');
    return;
  }
  vinculosEdicaoSelecionados.push({ idDestino, tipoVinculo: 'revoga', texto });
  renderizarVinculosEdicaoAdicionados();
}

function removerVinculoEdicao(index) {
  vinculosEdicaoSelecionados.splice(index, 1);
  renderizarVinculosEdicaoAdicionados();
}

function alterarTipoVinculoEdicao(index, novoTipo) {
  vinculosEdicaoSelecionados[index].tipoVinculo = novoTipo;
}

function renderizarVinculosEdicaoAdicionados() {
  const container = document.getElementById('vinculosEdicaoAdicionados');
  if (vinculosEdicaoSelecionados.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">Nenhum vínculo.</p>';
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
  vinculosEdicaoSelecionados.forEach((v, i) => {
    html += `
      <div style="display:flex; align-items:center; gap:8px; background:var(--card-border); padding:6px 10px; border-radius:8px;">
        <span style="flex:1; font-size:13px;">${v.texto || v.idDestino}</span>
        <select onchange="alterarTipoVinculoEdicao(${i}, this.value)" style="width:140px; font-size:12px; padding:2px 4px;">
          <option value="revoga" ${v.tipoVinculo==='revoga'?'selected':''}>Revoga</option>
          <option value="retifica" ${v.tipoVinculo==='retifica'?'selected':''}>Retifica</option>
          <option value="acrescenta" ${v.tipoVinculo==='acrescenta'?'selected':''}>Complementa</option>
          <option value="ver também" ${v.tipoVinculo==='ver também'?'selected':''}>Ver também</option>
        </select>
        <button type="button" class="btn-icone" onclick="removerVinculoEdicao(${i})" style="color:#ef4444;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}
// =========================
// MURAL DE COMUNICADOS
// =========================

// =========================
// MURAL DE COMUNICADOS
// =========================

function abrirModalComunicado() {
  document.getElementById('modalComunicado').style.display = 'flex';
  document.getElementById('tituloModalComunicado').innerHTML = '<i class="fas fa-bullhorn"></i> Novo Comunicado';
  document.getElementById('tituloComunicado').value = '';
  document.getElementById('textoComunicado').value = '';
  document.getElementById('prioridadeComunicado').value = 'informativo';
  document.getElementById('dataExpiracaoComunicado').value = '';
  document.getElementById('fixarComunicado').checked = false;

  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('comunicadoEscolaWrapper').style.display = 'block';
    carregarEscolasPermitidasNoSelect('selectEscolaComunicado');
  } else {
    document.getElementById('comunicadoEscolaWrapper').style.display = 'none';
  }
}

function fecharModalComunicado() {
  document.getElementById('modalComunicado').style.display = 'none';
}

function salvarComunicado() {
  const titulo = document.getElementById('tituloComunicado').value.trim();
  const texto = document.getElementById('textoComunicado').value.trim();
  const prioridade = document.getElementById('prioridadeComunicado').value;
  const dataExpiracao = document.getElementById('dataExpiracaoComunicado').value;
  const fixado = document.getElementById('fixarComunicado').checked;
  let escola = '';

  if (perfilUsuario === 'SUPERVISOR') {
    escola = document.getElementById('selectEscolaComunicado').value;
    if (!escola) { mostrarToast('Selecione a escola.', 'warning'); return; }
  } else {
    escola = escolaUsuario;
  }

  if (!titulo || !texto) {
    mostrarToast('Título e texto são obrigatórios.', 'warning');
    return;
  }

  // 🔥 Validação da data de expiração (não pode ser anterior à data atual)
  if (dataExpiracao) {
    const dataExp = new Date(dataExpiracao);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataExp < hoje) {
      mostrarToast('Data de expiração não pode ser anterior à data atual.', 'warning');
      return;
    }
  }

  const dados = {
    acao: 'salvarComunicado',
    email: emailUsuario,
    escola: escola,
    titulo: titulo,
    texto: texto,
    prioridade: prioridade,
    fixado: fixado,
    dataExpiracao: dataExpiracao
  };

  postSemResposta(dados, 'Comunicado publicado!', () => {
    fecharModalComunicado();
    carregarComunicados(); // atualiza o mural
  });
}

function carregarComunicados() {
  const mural = document.getElementById('muralComunicados');
  const container = document.getElementById('muralCards');
  const btnNovo = document.getElementById('btnNovoComunicado');

  // 🔥 O mural fica sempre visível para supervisores e secretarias
  const podePublicar = (perfilUsuario === 'SUPERVISOR' || perfilUsuario === 'SECRETARIA');
  if (mural) mural.style.display = podePublicar ? 'block' : 'none';

  if (btnNovo) {
    btnNovo.style.display = podePublicar ? 'inline-block' : 'none';
  }

  const url = `${API_URL}?tipo=comunicados&email=${emailUsuario}&escola=${encodeURIComponent(escolaUsuario)}`;
  jsonp(url, function(dados) {
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(dados) || dados.length === 0) {
      // Exibe mensagem amigável, mantendo o mural aberto
      container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:16px;">
        Nenhum comunicado no momento.
      </p>`;
      return;
    }

    // Cria os cards (código já existente)
    const cores = { urgente: '#ef4444', importante: '#f59e0b', informativo: '#3b82f6' };
    const icones = { urgente: '⚠️', importante: '⚡', informativo: 'ℹ️' };

    dados.forEach(item => {
      const cor = cores[item.prioridade] || cores.informativo;
      const icone = icones[item.prioridade] || icones.informativo;
      const diffHoras = (new Date() - new Date(item.dataInicio)) / 36e5;
      const badgeNovo = diffHoras < 24 ? '<span class="badge-novo">NOVO</span>' : '';
      const badgeFixado = item.fixado ? '📌' : '';

      const card = document.createElement('div');
      card.style.cssText = `
        min-width:260px; max-width:300px; background:var(--card-bg); border-left:4px solid ${cor};
        border-radius:12px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06); flex-shrink:0;
        cursor:pointer; transition:all 0.2s;
      `;
      card.onmouseenter = () => card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      card.onmouseleave = () => card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';

      // Variável de controle de expansão
      let expandido = false;
      const textoOriginal = item.texto;
      const textoCurto = textoOriginal.length > 150 ? textoOriginal.substring(0, 150) + '...' : textoOriginal;
      const textoLinkificado = linkificar(textoOriginal);

      // Renderiza inicialmente com texto truncado
      const atualizarCard = () => {
        card.querySelector('.texto-comunicado').innerHTML = expandido ? textoLinkificado : textoCurto;
        card.querySelector('.texto-comunicado').style.display = '-webkit-box';
        card.querySelector('.texto-comunicado').style.webkitLineClamp = expandido ? 'unset' : '2';
        card.querySelector('.texto-comunicado').style.webkitBoxOrient = 'vertical';
        card.querySelector('.texto-comunicado').style.overflow = expandido ? 'visible' : 'hidden';
      };

      card.onclick = () => {
        expandido = !expandido;
        atualizarCard();
      };

      const botaoExcluir = (item.criador === emailUsuario) ? 
        `<button class="btn-icone" onclick="event.stopPropagation(); excluirComunicadoItem('${item.id}')" 
                style="color:#ef4444; font-size:12px; padding:2px 4px;" title="Excluir">✕</button>` 
        : '';

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="font-size:20px;">${icone}</span>
          <strong style="font-size:14px; color:var(--text-primary);">${badgeFixado} ${item.titulo}</strong>
          ${badgeNovo}
        </div>
        <p class="texto-comunicado" style="font-size:13px; color:var(--text-secondary); margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${textoCurto}
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <span style="font-size:11px; color:var(--text-muted);">
            <i class="fas fa-school"></i> ${item.escola} · ${new Date(item.dataInicio).toLocaleDateString('pt-BR')}
          </span>
          ${botaoExcluir}
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// Função para recolher/expandir o mural (botão “Recolher”)
function toggleMural() {
  const cards = document.getElementById('muralCards');
  const btn = document.getElementById('btnToggleMural');
  if (cards.style.display === 'none') {
    cards.style.display = 'flex';
    btn.innerHTML = '<i class="fas fa-chevron-up"></i> Recolher';
  } else {
    cards.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir';
  }
}
function excluirComunicadoItem(id) {
  if (!confirm('Deseja excluir este comunicado?')) return;

  postSemResposta({ acao: 'excluirComunicado', email: emailUsuario, id: id }, 'Excluído!', () => {
    carregarComunicados();
  });
}
function linkificar(texto) {
  if (!texto) return '';
  // Regex para detectar URLs com http/https
  const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  return texto.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}
let debounceTimer;

function buscarGlobalComDebounce() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => buscarGlobalmente(), 300);
}

function buscarGlobalmente() {
  const termo = document.getElementById('inputBuscaGlobal').value.trim();
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (!dropdown) return;

  if (termo.length < 2) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  mostrarLoading();
  const url = `${API_URL}?tipo=buscaGlobal&email=${encodeURIComponent(emailUsuario)}&termo=${encodeURIComponent(termo)}`;
  jsonp(url, function(dados) {
    esconderLoading();
    renderizarDropdownBusca(dados);
  });
}

function renderizarDropdownBusca(resultados) {
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (!dropdown) return;

  if (!Array.isArray(resultados) || resultados.length === 0) {
    dropdown.innerHTML = '<p style="padding:12px; color:var(--text-muted);">Nenhum resultado encontrado.</p>';
    dropdown.style.display = 'block';
    return;
  }

  // Agrupa por tipo
  const grupos = {};
  resultados.forEach(item => {
    if (!grupos[item.tipo]) grupos[item.tipo] = [];
    grupos[item.tipo].push(item);
  });

  const icones = {
    'Aluno': 'fa-user-graduate',
    'Legislação': 'fa-balance-scale',
    'Comunicado': 'fa-bullhorn',
    'Processo': 'fa-folder',
    'Ata': 'fa-file-alt'
  };

  let html = '';
  for (const tipo in grupos) {
    const icone = icones[tipo] || 'fa-search';
    html += `<div class="grupo-busca">
      <div class="grupo-titulo"><i class="fas ${icone}"></i> ${tipo}</div>`;
    grupos[tipo].forEach(item => {
      html += `
        <div class="item-busca" onclick="abrirResultadoBusca('${item.link.replace(/'/g, "\\'")}'); fecharDropdownBusca()">
          <i class="fas ${icone}"></i>
          <div>
            <strong>${item.titulo}</strong>
            <p style="font-size:12px; color:var(--text-muted); margin:0;">${item.descricao || ''}</p>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

function fecharDropdownBusca() {
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }
}

function abrirResultadoBusca(link) {
  if (!link) return;
  
  const [prefixo, id] = link.split('_');
  
  switch (prefixo) {
    case 'aluno':
      abrirAluno(id);
      break;
    case 'legislacao':
      abrirModalLegislacao();
      setTimeout(() => {
        abrirDetalheLegislacao(id);
      }, 500);
      break;
    case 'comunicado':
      // Por enquanto, abre o mural e destaca? Pode só abrir o modal de comunicação
      abrirModalComunicado();
      break;
    case 'processo':
      abrirModalProcessos();
      // Não temos busca por ID direta, mas já abre a listagem
      break;
    case 'ata':
      abrirModalAtas();
      break;
    default:
      break;
  }
}
