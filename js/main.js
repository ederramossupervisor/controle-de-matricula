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
  // --- Fechar modais ao clicar fora (overlay) ---
  document.getElementById("novoAluno").addEventListener("click", function(e) {
    if (e.target === this) voltarApp();
  });

  document.getElementById('modalEditarLegislacao').addEventListener('click', function(e) {
    if (e.target === this) fecharEdicaoLegislacao();
  });

  document.getElementById("modalDetalhes").addEventListener("click", function(e) {
    if (e.target === this) fecharModalDetalhes();
  });

  document.getElementById("modalListaUsuarios").addEventListener("click", function(e) {
    if (e.target === this) fecharModalListaUsuarios();
  });

  document.getElementById("modalCadastroUsuario").addEventListener("click", function(e) {
    if (e.target === this) fecharModalCadastroUsuario();
  });

  document.getElementById('modalAtualizarMatriculados').addEventListener('click', function(e) {
    if (e.target === this) fecharModalAtualizarMatriculados();
  });

  document.getElementById('modalDashboard').addEventListener('click', function(e) {
    if (e.target === this) fecharModalDashboard();
  });

  document.getElementById('modalComunicado').addEventListener('click', function(e) {
    if (e.target === this) fecharModalComunicado();
  });

  document.getElementById('modalAprovacaoTermos').addEventListener('click', function(e) {
    if (e.target === this) fecharModalAprovacaoTermos();
  });

  document.getElementById('modalPromocao').addEventListener('click', function(e) {
    if (e.target === this) fecharModalPromocao();
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

// Esc: Fechar menu dropdown ou modais abertos
if (e.key === 'Escape') {
  const menuDropdown = document.getElementById('menuDropdown');

  // Lista de modais em ordem de fechamento: filhos primeiro, depois pais
  const modaisAbertos = [
    // Filhos (formulários sobre listas)
    { element: document.getElementById('modalFormAto'), close: fecharFormAto },
    { element: document.getElementById('modalCadastroTurma'), close: fecharModalCadastroTurma },
    { element: document.getElementById('modalCadastroUsuario'), close: fecharModalCadastroUsuario },
    { element: document.getElementById('modalEditarLegislacao'), close: fecharEdicaoLegislacao },
    { element: document.getElementById('modalComunicado'), close: fecharModalComunicado },
    { element: document.getElementById('modalAlterarSenha'), close: fecharModalAlterarSenha },
    { element: document.getElementById('modalImportacao'), close: fecharModalImportacao },
    { element: document.getElementById('modalExportacao'), close: fecharModalExportacao },
    { element: document.getElementById('modalPromocao'), close: fecharModalPromocao },
    { element: document.getElementById('modalAtualizarMatriculados'), close: fecharModalAtualizarMatriculados },
    { element: document.getElementById('modalConsentimento'), close: logout }, // logout fecha o consentimento
    { element: document.getElementById('modalGeradorDocumentos'), close: fecharModalGeradorDocumentos },
    { element: document.getElementById('modalPlanoTaticoMensal'), close: fecharModalPlanoTaticoMensal },
    { element: document.getElementById('modalPlanoTaticoTrimestral'), close: fecharModalPlanoTaticoTrimestral },
    { element: document.getElementById('modalAcompanhamentoPT'), close: fecharModalAcompanhamentoPT },
    
    // Pais (listas e modais principais)
    { element: document.getElementById('modalDetalhes'), close: fecharModalDetalhes },
    { element: document.getElementById('modalChecklistLote'), close: fecharModalChecklistLote },
    { element: document.getElementById('modalDocumentos'), close: fecharModalDocumentos },
    { element: document.getElementById('modalModelos'), close: fecharModalModelos },
    { element: document.getElementById('modalInativos'), close: fecharModalInativos },
    { element: document.getElementById('modalProcessos'), close: fecharModalProcessos },
    { element: document.getElementById('modalLegalizacao'), close: fecharModalLegalizacao },
    { element: document.getElementById('modalLegislacao'), close: fecharModalLegislacao },
    { element: document.getElementById('modalTurmas'), close: fecharModalTurmas },
    { element: document.getElementById('modalListaUsuarios'), close: fecharModalListaUsuarios },
    { element: document.getElementById('modalNotificacoes'), close: fecharNotificacoes },
    { element: document.getElementById('modalAgenda'), close: fecharModalAgenda },
    { element: document.getElementById('modalDashboard'), close: fecharModalDashboard },
    { element: document.getElementById('modalAprovacaoTermos'), close: fecharModalAprovacaoTermos },
    { element: document.getElementById('modalMonitoramento'), close: fecharModalMonitoramento },
    { element: document.getElementById('novoAluno'), close: voltarApp }
  ];

  let modalFechado = false;
  for (let modal of modaisAbertos) {
    if (modal.element && modal.element.style.display === 'flex') {
      e.preventDefault();
      modal.close();
      modalFechado = true;
      break; // Fecha apenas o primeiro encontrado (o mais interno)
    }
  }

    // Se nenhum modal foi fechado, tenta fechar o menu dropdown
  if (!modalFechado && menuDropdown) {
    const menuVisivel = (menuDropdown.style.display !== 'none') || menuDropdown.classList.contains('menu-aberto');
    if (menuVisivel) {
      e.preventDefault();
      if (menuDropdown.classList.contains('menu-aberto')) {
        menuDropdown.classList.remove('menu-aberto');
        const overlay = document.getElementById('menuOverlay');
        if (overlay) overlay.classList.remove('ativo');
      } else {
        menuDropdown.style.display = 'none';
      }
    }
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
