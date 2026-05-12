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

  // Lista COMPLETA de modais com seus métodos de fechamento
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
    { id: 'modalEditarEvento', close: fecharEdicaoEvento },
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

  // Adiciona evento de clique no overlay para fechar cada modal
  todosOsModais.forEach(({ id, close }) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        close();
      }
    });
  });

  // ÚNICO listener de teclado – trata ESC (fechar modais/menu) e atalhos
  document.addEventListener('keydown', function(e) {
    // ---- ESC: fecha o primeiro modal aberto e/ou menu dropdown ----
    if (e.key === 'Escape') {
      // Verifica modais (usando style.display inline, mais confiável)
      let modalFechado = false;
      for (const { id, close } of todosOsModais) {
        const modal = document.getElementById(id);
        // Verifica o estilo inline: se foi setado 'flex', está visível
        if (modal && modal.style.display === 'flex') {
          e.preventDefault();
          e.stopPropagation();   // impede que outros listeners atrapalhem
          close();
          modalFechado = true;
          break;                 // fecha apenas UM modal por vez
        }
      }

      // Se nenhum modal foi fechado, tenta fechar o menu dropdown
      if (!modalFechado) {
        const menu = document.getElementById('menuDropdown');
        if (menu && menu.style.display !== 'none') {
          menu.style.display = 'none';
          e.preventDefault();
        }
      }
      return;                   // encerra o tratamento da tecla ESC
    }

    // ---- Atalhos de teclado (somente quando o app está visível) ----
    const app = document.getElementById('app');
    if (!app || app.style.display === 'none') return;

    const tag = e.target.tagName.toLowerCase();
    const isInput = (tag === 'input' || tag === 'textarea' || tag === 'select');

    // Ctrl + N: Novo Aluno
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      abrirNovoAluno();
      return;
    }

    // Ctrl + F: Focar no campo de busca da lista
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      const inputBusca = document.getElementById('pesquisaNome');
      if (inputBusca) {
        inputBusca.focus();
        inputBusca.select();
      }
      return;
    }

    // Outros atalhos podem ser adicionados aqui
  });

  // --- Listener do filtro de turma (guardar valor anterior) ---
  const selectTurma = document.getElementById("filtroTurma");
  if (selectTurma) {
    selectTurma.addEventListener('change', function() {
      this.setAttribute('data-valor-anterior', this.value);
    });
  }

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
