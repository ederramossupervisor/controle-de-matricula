// =========================
// VARIÁVEIS GLOBAIS MUTÁVEIS
// =========================
let dadosGlobais = [];
let emailUsuario = "";
let perfilUsuario = "";
let escolaUsuario = "";
let alteracoesPendentes = {};
let dadosAlunoAtual = null;
let turmasDisponiveis = [];
let resumoPorEscolaGlobal = {};

let paginaAtual = 1;
let alunosPorPagina = 20;
let dadosFiltradosGlobais = [];

let alunosImportados = [];

let atosGlobais = [];

let paginaAtualInativos = 1;
let totalPaginasInativos = 1;
let alunosPorPaginaInativos = 20;
let filtrosInativosAtuais = {};

let modoVisualizacao = 'cards'; // 'cards' ou 'lista'

// =========================
// INICIALIZAÇÃO
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

// =========================
// EVENTOS GLOBAIS (quando o DOM estiver pronto)
// =========================
document.addEventListener('DOMContentLoaded', function() {

  // Lista de todos os modais com seus respectivos métodos de fechamento
  const todosOsModais = [
    { id: 'novoAluno', close: voltarApp },
    { id: 'modalDetalhes', close: fecharModalDetalhes },
    { id: 'modalTurmas', close: fecharModalTurmas },
    { id: 'modalCadastroTurma', close: fecharModalCadastroTurma },
    { id: 'modalExportacao', close: fecharModalExportacao },
    { id: 'modalDocumentos', close: fecharModalDocumentos },
    { id: 'modalLegalizacao', close: fecharModalLegalizacao },
    { id: 'modalFormAto', close: fecharFormAto },
    { id: 'modalImportacao', close: fecharModalImportacao },
    { id: 'modalPromocao', close: fecharModalPromocao },
    { id: 'modalAtualizarMatriculados', close: fecharModalAtualizarMatriculados },
    { id: 'modalModelos', close: fecharModalModelos },
    { id: 'modalInativos', close: fecharModalInativos },
    { id: 'modalNotificacoes', close: fecharNotificacoes },
    { id: 'modalAgenda', close: fecharModalAgenda },
    { id: 'modalDashboard', close: fecharModalDashboard },
    { id: 'modalAlterarSenha', close: fecharModalAlterarSenha },
    { id: 'modalChecklistLote', close: fecharModalChecklistLote },
    { id: 'modalLegislacao', close: fecharModalLegislacao },
    { id: 'modalEditarLegislacao', close: fecharEdicaoLegislacao },
    { id: 'modalComunicado', close: fecharModalComunicado },
    { id: 'modalConsentimento', close: logout },
    { id: 'modalHistorico', close: fecharModalHistorico },
    { id: 'modalListaUsuarios', close: fecharModalListaUsuarios },
    { id: 'modalCadastroUsuario', close: fecharModalCadastroUsuario },
    { id: 'modalPlanoTaticoMensal', close: fecharModalPlanoTaticoMensal },
    { id: 'modalPlanoTaticoTrimestral', close: fecharModalPlanoTaticoTrimestral },
    { id: 'modalAcompanhamentoPT', close: fecharModalAcompanhamentoPT },
    { id: 'modalProcessos', close: fecharModalProcessos },
    { id: 'modalAprovacaoTermos', close: fecharModalAprovacaoTermos },
    { id: 'modalPainelDiretor', close: fecharPainelDiretor }
  ];

  // Adiciona evento de clique no overlay para fechar todos os modais
  todosOsModais.forEach(({ id, close }) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        close();
      }
    });
  });

  // Fecha modais com a tecla ESC (substitui o array anterior)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // Fecha o primeiro modal aberto encontrado
      for (const { id, close } of todosOsModais) {
        const modal = document.getElementById(id);
        if (modal && modal.style.display === 'flex') {
          e.preventDefault();
          close();
          // Não quebra aqui para permitir fechar o menu dropdown também se necessário
        }
      }
      // Fecha o menu dropdown se estiver aberto
      const menu = document.getElementById('menuDropdown');
      if (menu && menu.style.display !== 'none') {
        menu.style.display = 'none';
      }
    }
  });

  // --- Listener do filtro de turma (guardar valor anterior) ---
  const selectTurma = document.getElementById("filtroTurma");
  if (selectTurma) {
    selectTurma.addEventListener('change', function() {
      this.setAttribute('data-valor-anterior', this.value);
    });
  }

  // --- Atalhos de teclado ---
  document.addEventListener('keydown', function(e) {
    const app = document.getElementById('app');
    if (!app || app.style.display === 'none') return;

    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (!(e.ctrlKey && e.key === 'f')) {
        return;
      }
    }

    // Ctrl + N: Novo Aluno
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      abrirNovoAluno();
    }

    // Ctrl + F: Focar no campo de busca
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      const inputBusca = document.getElementById('pesquisaNome');
      if (inputBusca) {
        inputBusca.focus();
        inputBusca.select();
      }
    }
  });

  // --- Fechar menu dropdown ao clicar fora ---
  window.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      const menu = document.getElementById("menuDropdown");
      if (menu) menu.style.display = 'none';
    }
  });

  // --- Ajuste de tooltips (classe tooltip-below) ---
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

  function checkTooltipPosition(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < 80) {
      el.classList.add('tooltip-below');
    } else {
      el.classList.remove('tooltip-below');
    }
  }

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', function() {
      checkTooltipPosition(this);
    });
  });

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
