// =========================
// GERADOR DE DOCUMENTOS (SUPERVISORES)
// =========================

// ---------- Definições (mesmas do seu documents.js) ----------
const DOCUMENT_TYPES = {
  cuidador:        { nome: "Cuidador",                icon: "fas fa-user-nurse" },
  justificativa:   { nome: "Justificativa",           icon: "fas fa-file-signature" },
  parecer:         { nome: "Parecer",                 icon: "fas fa-gavel" },
  regularizacao_aee: { nome: "Regularização AEE",     icon: "fas fa-universal-access" },
  viagem_pedagogica: { nome: "Viagem Pedagógica",     icon: "fas fa-bus" },
  manifestacao:    { nome: "Manifestação",            icon: "fas fa-comment-alt" },
  eletivas:        { nome: "Eletivas",                icon: "fas fa-book-open" },
  projeto:         { nome: "Projeto",                 icon: "fas fa-project-diagram" },
  localizacao_provisoria: { nome: "Localização Provisória", icon: "fas fa-map-marker-alt" },
  atividade_pesquisa: { nome: "Atividade de Pesquisa", icon: "fas fa-search" },
  pca:             { nome: "PCA",                     icon: "fas fa-chalkboard-teacher" },
  coordenacao_escolar: { nome: "Coordenação Escolar", icon: "fas fa-user-tie" }
};

// Campos de cada documento (mesmo conteúdo do seu DOCUMENT_FIELDS, apenas removendo autoFill complexo)
const GERADOR_FIELDS = {
  cuidador: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Município", type: "text", required: true, readOnly: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Número do Ofício", type: "text", required: true },
    { name: "Nome do(a) Aluno(a)", type: "text", required: true },
    { name: "Série", type: "serie_dropdown", required: true },
    { name: "Etapa de Ensino", type: "text", required: true, readOnly: true },
    { name: "Diagnóstico", type: "textarea", required: true },
    { name: "CID", type: "text", required: true }
  ],
  justificativa: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Função", type: "text", required: true },
    { name: "Nome indicado", type: "text", required: true },
    { name: "Número Funcional", type: "text", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true },
    { name: "Data", type: "date", required: true }
  ],
  parecer: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Município", type: "text", required: true, readOnly: true },
    { name: "Nome do Diretor", type: "text", required: true, readOnly: true },
    { name: "Função", type: "text", required: true },
    { name: "Motivo da contratação", type: "text", required: true },
    { name: "Oferta", type: "dropdown", required: true, options: ["Regular", "EJA/Neeja", "Técnico"] },
    { name: "Nome indicado", type: "text", required: true },
    { name: "Componente Curricular", type: "text", required: true },
    { name: "Formação", type: "text", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true }
  ],
  regularizacao_aee: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Município", type: "text", required: true, readOnly: true },
    { name: "Data", type: "date", required: true },
    { name: "Número do Ofício", type: "text", required: true },
    { name: "Data do Ofício", type: "date", required: true },
    { name: "Nome do(a) Aluno(a)", type: "text", required: true },
    { name: "Série", type: "serie_dropdown", required: true },
    { name: "Etapa de Ensino", type: "text", required: true, readOnly: true },
    { name: "Diagnóstico", type: "textarea", required: true },
    { name: "CID", type: "text", required: true }
  ],
  viagem_pedagogica: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Nome do Projeto", type: "text", required: true },
    { name: "Local de Visitação", type: "text", required: true }
  ],
  manifestacao: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Relato", type: "textarea", required: true },
    { name: "Número da Manifestação", type: "text", required: true }
  ],
  eletivas: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Nome das Eletivas", type: "textarea", required: true },
    { name: "Número Edocs", type: "text", required: true }
  ],
  projeto: [
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Nome do Projeto", type: "text", required: true }
  ],
  localizacao_provisoria: [
    { name: "Escola de Interesse", type: "school_dropdown", required: true },
    { name: "Município da Escola de Interesse", type: "text", required: true, readOnly: true },
    { name: "Nome do Professor", type: "text", required: true },
    { name: "Número Funcional", type: "text", required: true },
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Município", type: "text", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true }
  ],
  atividade_pesquisa: [
    { name: "Nome do Projeto", type: "text", required: true },
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Município", type: "text", required: false, readOnly: true },
    { name: "Etapa de Ensino", type: "dropdown", required: true, options: ["Ensino Fundamental - Anos Iniciais","Ensino Fundamental - Anos Finais","Ensino Médio"] },
    { name: "Data", type: "date", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true }
  ],
  pca: [
    { name: "Nome do Professor", type: "text", required: true },
    { name: "Número Funcional", type: "text", required: true },
    { name: "Área do Conhecimento", type: "dropdown", required: true, options: ["Linguagens e Códigos","Ciências da Natureza e Matemática","Ciências Humanas"] },
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Data", type: "date", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true }
  ],
  coordenacao_escolar: [
    { name: "Número Edocs", type: "text", required: true },
    { name: "Nome da Escola", type: "school_dropdown", required: true },
    { name: "Nome do Professor", type: "text", required: true },
    { name: "Turno", type: "dropdown", required: true, options: ["Matutino","Vespertino","Noturno","Integral"] },
    { name: "Data", type: "date", required: true },
    { name: "Nome do Supervisor", type: "supervisor_name", required: true }
  ]
};

// Mapeamento de série → etapa
const SERIE_TO_ETAPA = {
  "1º ano":"Ensino Fundamental - Anos Iniciais","2º ano":"Ensino Fundamental - Anos Iniciais","3º ano":"Ensino Fundamental - Anos Iniciais","4º ano":"Ensino Fundamental - Anos Iniciais","5º ano":"Ensino Fundamental - Anos Iniciais",
  "6º ano":"Ensino Fundamental - Anos Finais","7º ano":"Ensino Fundamental - Anos Finais","8º ano":"Ensino Fundamental - Anos Finais","9º ano":"Ensino Fundamental - Anos Finais",
  "1ª série":"Ensino Médio","2ª série":"Ensino Médio","3ª série":"Ensino Médio"
};

let currentDocType = null;
let supervisorName = localStorage.getItem('supervisorName') || '';

// ---------- ABERTURA / FECHAMENTO ----------
function abrirModalGeradorDocumentos() {
  document.getElementById('modalGeradorDocumentos').style.display = 'flex';
  renderizarTiposDocumento();
}

function fecharModalGeradorDocumentos() {
  document.getElementById('modalGeradorDocumentos').style.display = 'none';
  resetarGerador();
}

function resetarGerador() {
  document.getElementById('geradorFormContainer').style.display = 'none';
  document.getElementById('geradorResultado').style.display = 'none';
  document.getElementById('geradorForm').innerHTML = '';
  currentDocType = null;
}

// ---------- TIPOS DE DOCUMENTO ----------
function renderizarTiposDocumento() {
  const container = document.getElementById('geradorTiposDocumento');
  container.innerHTML = '';
  for (let key in DOCUMENT_TYPES) {
    const tipo = DOCUMENT_TYPES[key];
    const card = document.createElement('div');
    card.className = 'usuario-card';
    card.style.cssText = 'cursor:pointer; flex:1 1 180px; display:flex; align-items:center; gap:12px; padding:16px;';
    card.innerHTML = `<i class="${tipo.icon}" style="font-size:24px;"></i><span>${tipo.nome}</span>`;
    card.addEventListener('click', () => selecionarTipoDocumento(key));
    container.appendChild(card);
  }
}

function selecionarTipoDocumento(tipo) {
  currentDocType = tipo;
  document.getElementById('geradorFormTitulo').innerHTML = `<i class="${DOCUMENT_TYPES[tipo].icon}"></i> ${DOCUMENT_TYPES[tipo].nome}`;
  construirFormulario(tipo);
  document.getElementById('geradorFormContainer').style.display = 'block';
  document.getElementById('geradorResultado').style.display = 'none';
}

// ---------- CONSTRUÇÃO DO FORMULÁRIO ----------
function construirFormulario(tipo) {
  const form = document.getElementById('geradorForm');
  form.innerHTML = '';
  const fields = GERADOR_FIELDS[tipo];
  fields.forEach(field => {
    let html = '';
    if (field.type === 'school_dropdown') {
      html = `<select name="${field.name}" required><option value="">Selecione...</option></select>`;
    } else if (field.type === 'supervisor_name') {
      html = `<input type="text" name="${field.name}" value="${supervisorName}" placeholder="Seu nome completo" required>`;
    } else if (field.type === 'serie_dropdown') {
      html = `<select name="${field.name}" required>
        <option value="">Selecione...</option>
        <option value="1º ano">1º ano</option><option value="2º ano">2º ano</option><option value="3º ano">3º ano</option><option value="4º ano">4º ano</option><option value="5º ano">5º ano</option>
        <option value="6º ano">6º ano</option><option value="7º ano">7º ano</option><option value="8º ano">8º ano</option><option value="9º ano">9º ano</option>
        <option value="1ª série">1ª série</option><option value="2ª série">2ª série</option><option value="3ª série">3ª série</option>
      </select>`;
    } else if (field.type === 'dropdown') {
      const opts = (field.options || []).map(o => `<option value="${o}">${o}</option>`).join('');
      html = `<select name="${field.name}" required><option value="">Selecione...</option>${opts}</select>`;
    } else if (field.type === 'textarea') {
      html = `<textarea name="${field.name}" rows="4" required ${field.readOnly ? 'readonly' : ''}></textarea>`;
    } else {
      html = `<input type="${field.type === 'date' ? 'date' : 'text'}" name="${field.name}" value="${field.type === 'date' ? new Date().toISOString().split('T')[0] : ''}" required ${field.readOnly ? 'readonly' : ''}>`;
    }
    const div = document.createElement('div');
    div.className = 'input-icon';
    div.innerHTML = `<span class="icon"><i class="fas fa-${field.type === 'date' ? 'calendar' : 'pencil'}-alt"></i></span>${html}`;
    form.appendChild(div);
  });

  // Preencher dropdowns de escolas
  const schoolDropdowns = form.querySelectorAll('select[name="Nome da Escola"], select[name="Escola de Interesse"]');
  schoolDropdowns.forEach(select => {
    const escolas = window.escolasSupervisionadas || LISTA_ESCOLAS;
    escolas.forEach(esc => {
      select.innerHTML += `<option value="${esc}">${esc}</option>`;
    });
  });

  // ---- AUTO-PREENCHIMENTO (cidade e diretor) ----
  form.querySelectorAll('select[name="Nome da Escola"], select[name="Escola de Interesse"]').forEach(select => {
    select.addEventListener('change', function() {
      const escola = this.value;
      const dados = ESCOLAS_DADOS[escola] || {};
      
      // Preencher município (campo pode ter nome "Nome do Município" ou "Município da Escola de Interesse")
      const cidadeInput = form.querySelector('[name="Nome do Município"]') || form.querySelector('[name="Município da Escola de Interesse"]');
      if (cidadeInput) {
        cidadeInput.value = dados.city || '';
      }

      // Preencher diretor, se o campo existir (ex.: "Nome do Diretor")
      const diretorInput = form.querySelector('[name="Nome do Diretor"]');
      if (diretorInput) {
        diretorInput.value = dados.director || '';
      }
    });
  });

  // Auto-preenchimento de etapa por série
  form.querySelectorAll('select[name="Série"]').forEach(select => {
    select.addEventListener('change', function() {
      const etapaInput = form.querySelector('[name="Etapa de Ensino"]');
      if (etapaInput && this.value) {
        etapaInput.value = SERIE_TO_ETAPA[this.value] || '';
      }
    });
  });
}
// ---------- GERAÇÃO ----------
async function gerarDocumento() {
  const form = document.getElementById('geradorForm');
  if (!form.checkValidity()) {
    mostrarToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }

  // Salvar nome do supervisor
  const supervisorInput = form.querySelector('[name="Nome do Supervisor"]');
  if (supervisorInput && supervisorInput.value.trim()) {
    supervisorName = supervisorInput.value.trim();
    localStorage.setItem('supervisorName', supervisorName);
  }

  const formData = {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    formData[input.name] = input.value.trim();
  });

  const btn = document.getElementById('btnGerarDocumento');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
  btn.disabled = true;

  try {
    const response = await fetch('https://southamerica-east1-sistema-documentos-sreac.cloudfunctions.net/supervisaoSp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentType: currentDocType,
        formData: formData,
        userEmail: emailUsuario
      })
    });

    if (!response.ok) throw new Error('Erro na geração');

    const result = await response.json();
    if (result.success) {
      mostrarToast('Documento gerado com sucesso!', 'success');
      const container = document.getElementById('geradorResultado');
      container.style.display = 'block';
      container.innerHTML = `
        <div class="usuario-card" style="justify-content:space-between;">
          <span><i class="fas fa-check-circle" style="color:green;"></i> Documento pronto</span>
          <a href="${result.pdfUrl || result.documentUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>
        </div>`;
    } else {
      throw new Error(result.error || 'Erro desconhecido');
    }
  } catch (error) {
    mostrarToast('Erro ao gerar documento: ' + error.message, 'error');
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}
