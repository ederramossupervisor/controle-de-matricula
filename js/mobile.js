// js/mobile.js — interface de celular (liga/desliga conforme a largura da tela)
// Não duplica funções: reaproveita os mesmos botões, filtros, menu e modais do desktop.
(function () {
  'use strict';
  if (window.__mobileUI) return;
  window.__mobileUI = true;
  var mq = window.matchMedia('(max-width: 800px)');
  var $ = function (id) { return document.getElementById(id); };
  var criado = false, ativo = false, muralRecolhido = false;
  var movidos = [];            // [{el, parent, next}] para restaurar no desktop
  var historicoEmpurrado = false, ignorarPop = false, pollTimer = null;
  var nav, fab, sheet, backdrop, search, bell, status;

  function mover(el, destino, antes) {
    if (!el || !destino) return;
    movidos.push({ el: el, parent: el.parentNode, next: el.nextSibling });
    destino.insertBefore(el, antes || null);
  }
  function restaurar() {
    while (movidos.length) {
      var m = movidos.pop();
      if (m.parent) m.parent.insertBefore(m.el, m.next && m.next.parentNode === m.parent ? m.next : null);
    }
  }
  function criar(tag, id, cls, html) {
    var e = document.createElement(tag);
    if (id) e.id = id;
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  function abaAlunosAtiva() {
    var a = $('abaProfissionais');
    return !(a && a.classList.contains('ativo'));
  }

  // ---------- construção única dos elementos ----------
  function construir() {
    if (criado) return;
    criado = true;
    var header = document.querySelector('header');

    // sino no topo (espelha o contador original)
    bell = criar('button', 'mBell', '', '<i class="fas fa-bell"></i><span class="m-badge" id="mBellBadge"></span>');
    bell.setAttribute('aria-label', 'Notificações');
    bell.onclick = function () { if (window.abrirNotificacoes) abrirNotificacoes(); };
    header.appendChild(bell);
    var orig = $('badgeNotificacoes');
    function espelharBadge() {
      var b = $('mBellBadge'); if (!b || !orig) return;
      var vis = orig.style.display !== 'none' && (orig.textContent || '').trim() !== '' && orig.textContent.trim() !== '0';
      b.textContent = orig.textContent; b.style.display = vis ? 'block' : 'none';
    }
    if (orig) { new MutationObserver(espelharBadge).observe(orig, { childList: true, characterData: true, subtree: true, attributes: true }); espelharBadge(); }

    // faixa de status (estrelas + ranking) logo abaixo do topo
    status = criar('div', 'mStatus');
    header.parentNode.insertBefore(status, header.nextSibling);
    new MutationObserver(function () { sincronizar(); }).observe(status, { childList: true, subtree: true, characterData: true });

    // backdrop + folha de filtros
    backdrop = criar('div', 'mBackdrop'); backdrop.onclick = fecharCamadas;
    document.body.appendChild(backdrop);
    sheet = criar('div', 'mFiltrosSheet', '',
      '<h3><i class="fas fa-sliders-h"></i> Filtros</h3><div id="mGrpAlunos"></div><div id="mGrpProf"></div>' +
      '<div class="m-linha"><button type="button" id="mLimpar">Limpar</button><button type="button" class="m-primario" id="mConcluir">Concluir</button></div>');
    document.body.appendChild(sheet);
    $('mLimpar').onclick = limparFiltros;
    $('mConcluir').onclick = fecharCamadas;
    sheet.addEventListener('change', atualizarContagem);

    // busca global em tela cheia
    search = criar('div', 'mSearch', '',
      '<div class="m-topo"><button type="button" class="m-voltar" aria-label="Voltar"><i class="fas fa-arrow-left"></i></button><button type="button" class="m-ir" aria-label="Buscar"><i class="fas fa-search"></i></button></div>' +
      '<div class="m-corpo"><div class="m-dica">Busque alunos, profissionais e documentos em todo o sistema.</div></div>');
    document.body.appendChild(search);
    search.querySelector('.m-voltar').onclick = fecharCamadas;
    search.querySelector('.m-ir').onclick = function () { if (window.buscarGlobalmente) buscarGlobalmente(); };
    search.querySelector('.m-corpo').addEventListener('click', function (e) {
      if (e.target.closest('#dropdownBuscaGlobal')) setTimeout(fecharCamadas, 50);
    });

    // botão flutuante "novo aluno" e barra inferior
    fab = criar('button', 'mFab', '', '<i class="fas fa-user-plus"></i>');
    fab.setAttribute('aria-label', 'Novo aluno');
    fab.onclick = function () { if (window.abrirNovoAluno) abrirNovoAluno(); };
    document.body.appendChild(fab);

    nav = criar('nav', 'mNav');
    nav.innerHTML =
      '<button type="button" data-a="alunos"><i class="fas fa-user-graduate"></i><span>Alunos</span></button>' +
      '<button type="button" data-a="prof"><i class="fas fa-user-tie"></i><span>Profissionais</span></button>' +
      '<button type="button" data-a="busca"><i class="fas fa-search"></i><span>Buscar</span></button>' +
      '<button type="button" data-a="painel"><i class="fas fa-chart-pie"></i><span>Painel</span></button>' +
      '<button type="button" data-a="menu"><i class="fas fa-bars"></i><span>Menu</span></button>';
    document.body.appendChild(nav);
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.getAttribute('data-a');
      fecharCamadas();
      if (a === 'alunos' && window.selecionarAba) selecionarAba('alunos');
      else if (a === 'prof' && window.selecionarAba) selecionarAba('profissionais');
      else if (a === 'busca') abrirBusca();
      else if (a === 'painel' && window.abrirDashboard) abrirDashboard();
      else if (a === 'menu') toggleMenu();
      sincronizar();
    });

    // menu: cabeçalho com perfil + fecha ao tocar num atalho
    var menu = $('menuDropdown');
    if (menu) {
      menu.insertBefore(criar('div', 'mMenuPerfil'), menu.firstChild);
      menu.addEventListener('click', function (e) {
        if (e.target.closest('.btn-header') && menu.classList.contains('menu-aberto')) setTimeout(function () { if (menu.classList.contains('menu-aberto')) toggleMenu(); }, 0);
      });
      new MutationObserver(function () { sincronizar(); }).observe(menu, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    }
    var tg = window.toggleMenu;
    if (typeof tg === 'function') {
      window.toggleMenu = function () { if (ativo) atualizarPerfilMenu(); var r = tg.apply(this, arguments); setTimeout(sincronizar, 0); return r; };
    }
    ['abaAlunos', 'abaProfissionais'].forEach(function (id) {
      var el = $(id); if (el) new MutationObserver(sincronizar).observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    if (window.ResizeObserver) new ResizeObserver(medirTopo).observe(header);
    document.addEventListener('keydown', function (e) { if (ativo && e.key === 'Escape') fecharCamadas(); });

    // toque simples no card do aluno abre a ficha (no desktop é duplo clique)
    var lista = $('lista');
    if (lista) lista.addEventListener('click', function (e) {
      if (!ativo || e.target.closest('button, a, input, select, textarea, label, .btn-icone, .btn-acao-card, .aluno-avatar, .aluno-foto, .doc-icon')) return;
      var card = e.target.closest('#lista > div'); if (!card || card.tagName !== 'DIV') return;
      card.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    });
    // mural: a linha do título expande/recolhe
    var mural = $('muralComunicados');
    if (mural) mural.addEventListener('click', function (e) {
      if (!ativo || e.target.closest('button') || !e.target.closest('#muralComunicados > div:first-child')) return;
      if (window.toggleMural) toggleMural();
      var c = $('muralCards'); mural.classList.toggle('m-mural-aberto', !!c && c.style.display !== 'none');
    });
  }

  function atualizarPerfilMenu() {
    var box = $('mMenuPerfil'); if (!box) return;
    var img = $('fotoPerfilImg'), nome = $('nomeUsuarioTexto'), em = $('emailUsuarioTexto'), pf = $('perfilUsuarioTexto');
    var temFoto = img && img.style.display !== 'none' && img.getAttribute('src');
    box.innerHTML = '<div class="m-av">' + (temFoto ? '<img src="' + img.getAttribute('src') + '" alt="">' : '<i class="fas fa-user"></i>') + '</div>' +
      '<div><div class="m-nome"></div><div class="m-sub"></div></div>';
    box.onclick = function () { var f = $('fotoPerfilContainer'); if (f) { fecharCamadas(); f.click(); } };
    box.querySelector('.m-nome').textContent = (nome && nome.textContent) || '';
    box.querySelector('.m-sub').textContent = [(em && em.textContent) || '', (pf && pf.textContent) || ''].filter(Boolean).join(' · ');
  }

  // ---------- relocações (somente no celular) ----------
  function relocar() {
    var header = document.querySelector('header');
    var tool = $('headerActionsRight') && $('headerActionsRight').parentElement;
    if (tool) tool.classList.add('m-toolbar');

    // busca global -> tela cheia
    var inp = $('inputBuscaGlobal'), dd = $('dropdownBuscaGlobal');
    if (inp && dd && search) {
      mover(inp, search.querySelector('.m-topo'), search.querySelector('.m-ir'));
      mover(dd, search.querySelector('.m-corpo'));
    }
    // campanha, estrelas e ranking
    mover($('faixaCampanha'), header.parentNode, status);
    mover($('estrelasContainer'), status);
    mover($('rankingContainer'), status);

    // filtros: busca por nome fica na barra; selects vão para a folha
    [['filtros-container', 'mGrpAlunos'], ['filtros-profissionais-container', 'mGrpProf']].forEach(function (par) {
      var c = $(par[0]), grp = $(par[1]); if (!c || !grp) return;
      var campoBusca = null;
      Array.prototype.forEach.call(c.children, function (el) { if (el.querySelector && el.querySelector('input[type="text"]')) campoBusca = el; });
      Array.prototype.slice.call(c.children).forEach(function (el) {
        if (el !== campoBusca && el.classList.contains('input-icon')) mover(el, grp);
      });
      var b = criar('button', '', 'mFiltroBtn', '<i class="fas fa-sliders-h"></i><span class="m-badge"></span>');
      b.type = 'button'; b.setAttribute('aria-label', 'Filtros');
      b.onclick = function () { abrirFiltros(); };
      c.insertBefore(b, campoBusca); movidos.push({ el: b, parent: c, next: null, remover: true });
    });

    // linha "Alunos/Profissionais + modo foco": o seletor da bottom nav substitui
    var aa = $('abaAlunos'); var grupoAbas = aa && aa.closest('.abas-seletor') && aa.closest('.abas-seletor').parentElement;
    if (grupoAbas) grupoAbas.classList.add('m-oculto-mobile');
  }
  function desrelocar() {
    document.querySelectorAll('.m-oculto-mobile').forEach(function (e) { e.classList.remove('m-oculto-mobile'); });
    var t = document.querySelector('.m-toolbar'); if (t) t.classList.remove('m-toolbar');
    // botões de filtro criados: remover em vez de restaurar
    movidos = movidos.filter(function (m) { if (m.remover) { if (m.el.parentNode) m.el.parentNode.removeChild(m.el); return false; } return true; });
    restaurar();
  }

  // ---------- camadas (menu, filtros, busca) ----------
  function abrirFiltros() { atualizarContagem(); sheet.classList.add('m-aberto'); backdrop.classList.add('m-aberto'); }
  function abrirBusca() {
    search.classList.add('m-aberto');
    setTimeout(function () { var i = $('inputBuscaGlobal'); if (i) i.focus(); }, 260);
  }
  function fecharCamadas() {
    if (!criado) return;
    sheet.classList.remove('m-aberto'); backdrop.classList.remove('m-aberto'); search.classList.remove('m-aberto');
    var m = $('menuDropdown');
    if (m && m.classList.contains('menu-aberto') && window.toggleMenu) toggleMenu();
    var i = $('inputBuscaGlobal'); if (i) i.blur();
  }
  function grupoAtual() { return $(abaAlunosAtiva() ? 'mGrpAlunos' : 'mGrpProf'); }
  function selectsAtuais() { var g = grupoAtual(); return g ? Array.prototype.slice.call(g.querySelectorAll('select')) : []; }
  function atualizarContagem() {
    var n = selectsAtuais().filter(function (s) { return s.value !== ''; }).length;
    document.querySelectorAll('.mFiltroBtn').forEach(function (b) {
      b.classList.toggle('m-ativo', n > 0); var bd = b.querySelector('.m-badge'); if (bd) bd.textContent = n;
    });
  }
  function limparFiltros() {
    selectsAtuais().forEach(function (s) {
      if (s.value !== '') { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    atualizarContagem();
  }

  // ---------- sincronização de estado ----------
  function medirTopo() {
    var h = document.querySelector('header');
    if (h && ativo) document.documentElement.style.setProperty('--m-header-h', h.offsetHeight + 'px');
  }
  function sincronizar() {
    if (!ativo) return;
    var alunos = abaAlunosAtiva();
    document.body.classList.toggle('m-tab-alunos', alunos);
    document.body.classList.toggle('m-tab-prof', !alunos);
    var m = $('menuDropdown'), menuAberto = !!(m && m.classList.contains('menu-aberto'));
    nav.querySelectorAll('button').forEach(function (b) {
      var a = b.getAttribute('data-a');
      b.classList.toggle('m-ativo', (a === 'alunos' && alunos) || (a === 'prof' && !alunos) || (a === 'menu' && menuAberto));
    });
    // botão "novo aluno" só aparece se o menu o oferece para este perfil
    var bn = document.querySelector('#menuDropdown [onclick^="abrirNovoAluno"]');
    var pode = !!(bn && bn.style.display !== 'none' && bn.getClientRects().length > 0);
    document.body.classList.toggle('m-pode-novo', pode);
    if (status) status.classList.toggle('m-vazio', !status.textContent.trim());
    atualizarContagem(); medirTopo();
    // mantém o modo foco do desktop fora do celular
    document.body.classList.remove('modo-foco');
  }

  // ---------- botão voltar do Android fecha a camada do topo ----------
  function algumaCamada() {
    var m = $('menuDropdown');
    return search.classList.contains('m-aberto') || sheet.classList.contains('m-aberto') || !!(m && m.classList.contains('menu-aberto')) || modalAberto();
  }
  function modalAberto() {
    try { return (window.obterModaisEPaginasAbertos ? obterModaisEPaginasAbertos() : []).some(function (x) { return x.element && x.element.style.display === 'flex'; }); }
    catch (e) { return false; }
  }
  function vigiarHistorico() {
    clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (!ativo) return;
      var aberta = algumaCamada();
      if (aberta && !historicoEmpurrado) { try { history.pushState({ m: 1 }, ''); historicoEmpurrado = true; } catch (e) {} }
      else if (!aberta && historicoEmpurrado) { historicoEmpurrado = false; ignorarPop = true; try { history.back(); } catch (e) { ignorarPop = false; } }
    }, 300);
  }
  window.addEventListener('popstate', function () {
    if (!ativo) return;
    if (ignorarPop) { ignorarPop = false; return; }
    historicoEmpurrado = false;
    try {
      var lista = window.obterModaisEPaginasAbertos ? obterModaisEPaginasAbertos() : [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].element && lista[i].element.style.display === 'flex') { lista[i].close(); return; }
      }
    } catch (e) {}
    fecharCamadas();
  });

  // ---------- liga / desliga ----------
  function aplicar() {
    if (mq.matches && !ativo) {
      construir(); ativo = true;
      document.body.classList.add('m-ui');
      var vp = document.querySelector('meta[name="viewport"]');
      if (vp && vp.content.indexOf('viewport-fit') < 0) vp.content += ', viewport-fit=cover';
      relocar(); sincronizar(); vigiarHistorico();
      if (!muralRecolhido) {            // mural começa recolhido no celular (um toque expande)
        muralRecolhido = true;
        var c = $('muralCards');
        if (c && c.style.display !== 'none' && window.toggleMural) toggleMural();
      }
    } else if (!mq.matches && ativo) {
      fecharCamadas(); ativo = false; clearInterval(pollTimer);
      document.body.classList.remove('m-ui', 'm-tab-alunos', 'm-tab-prof', 'm-pode-novo');
      desrelocar();
      if (localStorage.getItem('modoFoco') === '1') document.body.classList.add('modo-foco');
    }
  }
  if (mq.addEventListener) mq.addEventListener('change', aplicar); else mq.addListener(aplicar);
  aplicar();
})();
