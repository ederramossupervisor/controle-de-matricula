// js/ver-como.js – "Ver como escola" (SOMENTE LEITURA) para o administrador
//
// Como funciona:
//  - O administrador escolhe uma escola; o estado fica em sessionStorage ('verComoEscola')
//    e a página recarrega. Daí em diante o sistema se comporta como para a SECRETARIA
//    daquela escola (perfil simulado em supabase-client.js: aplicarVerComoSb).
//  - As consultas são filtradas pela escola escolhida (supabase-client.js).
//  - Este arquivo cuida do que sobra: seletor, faixa de aviso e o BLOQUEIO DE GRAVAÇÕES.
//  - Sair da visualização = remover a chave e recarregar. O logout também limpa (sessionStorage.clear()).
(function () {
  var MSG = 'Modo "ver como escola": somente leitura. Nada foi gravado.';

  // ---------- 1) BLOQUEIO DE GRAVAÇÕES ----------

  // 1a) todas as ações que gravam no Supabase (cobre também chamadas diretas, como a importação)
  if (typeof ACAO_ALUNO_SB !== 'undefined') {
    Object.keys(ACAO_ALUNO_SB).forEach(function (nome) {
      var original = ACAO_ALUNO_SB[nome];
      if (typeof original !== 'function') return;
      ACAO_ALUNO_SB[nome] = function () {
        if (verComoEscolaAtiva()) {
          if (nome === 'registrarLogAcao') return Promise.resolve();   // log de ações: ignora em silêncio
          return Promise.reject(new Error(MSG));
        }
        return original.apply(this, arguments);
      };
    });
  }

  // 1b) porta única de envio (Supabase e Apps Script): barra antes de sair do navegador
  var postOriginal = window.postSemResposta;
  window.postSemResposta = function (dados, msgSucesso, callback, aoFalhar) {
    if (verComoEscolaAtiva()) {
      var btn = window._clickedButton;
      if (btn && typeof hideButtonLoading === 'function') hideButtonLoading(btn);
      window._clickedButton = null;
      if (dados && dados.acao === 'registrarLogAcao') return;      // silencioso
      if (typeof esconderLoading === 'function') esconderLoading();
      mostrarToast(MSG, 'warning');
      if (typeof aoFalhar === 'function') aoFalhar(new Error('somente_leitura'));
      return;
    }
    return postOriginal.apply(this, arguments);
  };

  // 1c) "marcar notificação como lida" também grava (estado do administrador): bloqueia
  if (typeof marcarNotificacoesNoBanco === 'function') {
    var marcarOriginal = marcarNotificacoesNoBanco;
    window.marcarNotificacoesNoBanco = async function () {
      if (verComoEscolaAtiva()) { mostrarToast(MSG, 'warning'); return; }
      return marcarOriginal.apply(this, arguments);
    };
  }

  // ---------- 2) BOTÃO NO MENU (só o administrador, fora do modo) ----------
  if (typeof ajustarInterfacePorPerfil === 'function') {
    var ajustarOriginal = ajustarInterfacePorPerfil;
    window.ajustarInterfacePorPerfil = function () {
      var r = ajustarOriginal.apply(this, arguments);
      var b = document.getElementById('btnVerComo');
      if (b) b.style.display = ehAdministrador() ? 'inline-block' : 'none';
      return r;
    };
  }

  // ---------- 3) SELETOR DE ESCOLA ----------
  function fecharSeletor() {
    var el = document.getElementById('verComoSeletor');
    if (el) el.remove();
    document.removeEventListener('keydown', aoTeclar, true);
  }
  function aoTeclar(ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fecharSeletor(); }
  }

  window.abrirVerComoEscola = function () {
    if (!ehAdministrador()) return;
    fecharSeletor();

    var escolas = (typeof LISTA_ESCOLAS !== 'undefined' ? LISTA_ESCOLAS : []).slice()
      .sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });

    var overlay = document.createElement('div');
    overlay.id = 'verComoSeletor';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99995;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.addEventListener('mousedown', function (ev) { if (ev.target === overlay) fecharSeletor(); });

    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:#fff;border-radius:14px;max-width:440px;width:100%;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.35);font-family:inherit;';

    var titulo = document.createElement('h3');
    titulo.textContent = 'Ver como escola';
    titulo.style.cssText = 'margin:0 0 6px;font-size:18px;color:#0f172a;';

    var texto = document.createElement('p');
    texto.textContent = 'Você verá o sistema como a secretaria da escola escolhida o vê. Nesse modo nada pode ser alterado (somente leitura).';
    texto.style.cssText = 'margin:0 0 14px;font-size:13px;color:#475569;line-height:1.4;';

    var select = document.createElement('select');
    select.className = 'select-moderno';
    select.style.cssText = 'width:100%;margin-bottom:16px;';
    select.appendChild(new Option('Selecione a escola…', ''));
    escolas.forEach(function (e) { select.appendChild(new Option(e, e)); });

    var linha = document.createElement('div');
    linha.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

    var cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.textContent = 'Cancelar';
    cancelar.style.cssText = 'padding:9px 16px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#334155;cursor:pointer;font-weight:600;';
    cancelar.addEventListener('click', fecharSeletor);

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'Visualizar';
    ok.style.cssText = 'padding:9px 16px;border-radius:8px;border:none;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;';
    ok.addEventListener('click', function () {
      if (!select.value) { mostrarToast('Selecione uma escola.', 'warning'); return; }
      window.verComoIniciar(select.value);
    });

    linha.append(cancelar, ok);
    caixa.append(titulo, texto, select, linha);
    overlay.appendChild(caixa);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', aoTeclar, true);
    select.focus();
  };

  window.verComoIniciar = function (escola) {
    if (!ehAdministrador()) return;
    try { sessionStorage.setItem('verComoEscola', escola); } catch (_) {}
    location.reload();
  };

  window.verComoSair = function () {
    try { sessionStorage.removeItem('verComoEscola'); } catch (_) {}
    location.reload();
  };

  // ---------- 4) FAIXA DE AVISO ----------
  function montarFaixa() {
    var escola = verComoEscolaAtiva();
    if (!escola || document.getElementById('verComoFaixa')) return;

    var estilo = document.createElement('style');
    estilo.textContent = 'body.ver-como-ativo{padding-top:40px;}';
    document.head.appendChild(estilo);
    document.body.classList.add('ver-como-ativo');

    var faixa = document.createElement('div');
    faixa.id = 'verComoFaixa';
    faixa.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99990;background:#facc15;color:#1f2937;' +
      'font:600 13px/1.25 system-ui,-apple-system,Segoe UI,sans-serif;display:flex;flex-wrap:wrap;gap:6px 14px;' +
      'align-items:center;justify-content:center;padding:7px 12px;box-shadow:0 2px 8px rgba(0,0,0,.25);';

    var rotulo = document.createElement('span');
    rotulo.textContent = '👁 Visualizando como: ' + escola + ' — somente leitura';

    var sair = document.createElement('button');
    sair.type = 'button';
    sair.textContent = 'Sair da visualização';
    sair.style.cssText = 'padding:4px 12px;border-radius:6px;border:1px solid #1f2937;background:#1f2937;color:#fff;cursor:pointer;font-weight:600;font-size:12px;';
    sair.addEventListener('click', window.verComoSair);

    faixa.append(rotulo, sair);
    document.body.appendChild(faixa);
  }

  if (document.body) montarFaixa();
  else document.addEventListener('DOMContentLoaded', montarFaixa);
})();
