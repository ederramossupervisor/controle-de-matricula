// js/dialogs.js — caixas de diálogo do sistema (substituem alert / confirm / prompt nativos)
//
// Todas retornam Promise, então use com await dentro de função async:
//
//   if (!await Dialogo.confirmar('Excluir este item?', { perigo: true })) return;
//   const nome = await Dialogo.perguntar('Nome do tipo:');   // string ou null (cancelou)
//   await Dialogo.aviso('A senha precisa ter 6 caracteres.');
//
// Opções comuns: titulo, textoConfirmar, textoCancelar, perigo (botão vermelho)
// Opções do perguntar: valor, placeholder, tipoCampo ('text' | 'password' | 'email'),
//   multilinha, somenteLeitura (mostra botão Copiar), validar(valor) -> texto do erro ou ''
(function () {
  'use strict';

  var CSS = '' +
    '.dlg-overlay{position:fixed;inset:0;background:var(--modal-overlay,rgba(0,0,0,.5));display:flex;align-items:center;justify-content:center;padding:16px;z-index:100000;animation:dlgFade .15s ease;backdrop-filter:blur(2px)}' +
    '.dlg-box{background:var(--card-bg,#fff);color:var(--text-primary,#0f172a);width:100%;max-width:420px;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:24px;animation:dlgPop .18s ease;max-height:90vh;overflow:auto}' +
    '.dlg-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}' +
    '.dlg-icone{flex:0 0 40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:#dbeafe;color:#2563eb}' +
    '.dlg-box.dlg-perigo .dlg-icone{background:#fee2e2;color:#dc2626}' +
    '.dlg-box.dlg-aviso .dlg-icone{background:#fef9c3;color:#a16207}' +
    '.dlg-titulo{margin:0;font-size:17px;font-weight:700;line-height:1.3}' +
    '.dlg-msg{margin:0 0 16px;font-size:14.5px;line-height:1.55;color:var(--text-secondary,#475569);white-space:pre-line;word-break:break-word}' +
    '.dlg-input{width:100%;box-sizing:border-box;padding:10px 12px;font-size:15px;border:1px solid var(--input-border,#e2e8f0);border-radius:10px;background:var(--input-bg,#fff);color:var(--text-primary,#0f172a);font-family:inherit;margin-bottom:6px}' +
    '.dlg-input:focus{outline:none;border-color:var(--btn-primary-bg,#2563eb);box-shadow:0 0 0 3px var(--input-focus-shadow,rgba(37,99,235,.15))}' +
    'textarea.dlg-input{min-height:84px;resize:vertical}' +
    '.dlg-erro{min-height:18px;margin:0 0 10px;font-size:13px;color:#dc2626}' +
    '.dlg-acoes{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}' +
    '.dlg-btn{border:1px solid var(--btn-cancelar-border,#e2e8f0);background:var(--btn-cancelar-bg,#fff);color:var(--text-primary,#0f172a);padding:9px 18px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}' +
    '.dlg-btn:hover{filter:brightness(.96)}' +
    '.dlg-btn:focus-visible{outline:2px solid var(--btn-primary-bg,#2563eb);outline-offset:2px}' +
    '.dlg-btn.dlg-ok{background:var(--btn-primary-bg,#2563eb);border-color:var(--btn-primary-bg,#2563eb);color:#fff}' +
    '.dlg-btn.dlg-ok:hover{background:var(--btn-primary-hover,#1d4ed8)}' +
    '.dlg-box.dlg-perigo .dlg-btn.dlg-ok{background:#dc2626;border-color:#dc2626}' +
    '.dlg-box.dlg-perigo .dlg-btn.dlg-ok:hover{background:#b91c1c}' +
    '[data-theme="dark"] .dlg-box{background:#1e293b;color:#f1f5f9}' +
    '[data-theme="dark"] .dlg-msg{color:#cbd5e1}' +
    '[data-theme="dark"] .dlg-input{background:#0f172a;color:#f1f5f9;border-color:#334155}' +
    '[data-theme="dark"] .dlg-btn{background:#334155;border-color:#475569;color:#f1f5f9}' +
    '[data-theme="dark"] .dlg-btn.dlg-ok{background:#2563eb;border-color:#2563eb}' +
    '[data-theme="dark"] .dlg-box.dlg-perigo .dlg-btn.dlg-ok{background:#dc2626;border-color:#dc2626}' +
    '@keyframes dlgFade{from{opacity:0}to{opacity:1}}' +
    '@keyframes dlgPop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}' +
    '@media (max-width:480px){.dlg-acoes .dlg-btn{flex:1}}';

  function injetarCss() {
    if (document.getElementById('dlg-estilos')) return;
    var st = document.createElement('style');
    st.id = 'dlg-estilos';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  // Cria e exibe o diálogo. cfg: { tipo:'confirmar'|'aviso'|'perguntar', mensagem, ... }
  function abrir(cfg) {
    injetarCss();
    return new Promise(function (resolve) {
      var anterior = document.activeElement;
      var perigo = !!cfg.perigo;
      var ehAviso = cfg.tipo === 'aviso';
      var ehPergunta = cfg.tipo === 'perguntar';

      var overlay = el('div', 'dlg-overlay');
      var box = el('div', 'dlg-box' + (perigo ? ' dlg-perigo' : '') + (ehAviso ? ' dlg-aviso' : ''));
      box.setAttribute('role', ehAviso ? 'alertdialog' : 'dialog');
      box.setAttribute('aria-modal', 'true');

      var icones = { perigo: 'fa-exclamation-triangle', aviso: 'fa-info-circle', perguntar: 'fa-pen', confirmar: 'fa-question-circle' };
      var chaveIcone = perigo ? 'perigo' : cfg.tipo;
      var titulo = cfg.titulo || (perigo ? 'Atenção' : ehAviso ? 'Aviso' : ehPergunta ? 'Informe' : 'Confirmação');

      var head = el('div', 'dlg-head');
      var ic = el('div', 'dlg-icone');
      ic.innerHTML = '<i class="fas ' + icones[chaveIcone] + '"></i>';
      var h = el('h3', 'dlg-titulo', titulo);
      h.id = 'dlg-titulo-' + Date.now();
      box.setAttribute('aria-labelledby', h.id);
      head.appendChild(ic);
      head.appendChild(h);
      box.appendChild(head);

      box.appendChild(el('p', 'dlg-msg', cfg.mensagem || ''));

      var input = null, erro = null;
      if (ehPergunta) {
        input = cfg.multilinha ? el('textarea', 'dlg-input') : el('input', 'dlg-input');
        if (!cfg.multilinha) input.type = cfg.tipoCampo || 'text';
        input.value = cfg.valor || '';
        if (cfg.placeholder) input.placeholder = cfg.placeholder;
        if (cfg.somenteLeitura) input.readOnly = true;
        input.autocomplete = 'off';
        box.appendChild(input);
        erro = el('p', 'dlg-erro');
        erro.setAttribute('role', 'alert');
        box.appendChild(erro);
      }

      var acoes = el('div', 'dlg-acoes');
      var btnCancelar = null;
      if (!ehAviso) {
        btnCancelar = el('button', 'dlg-btn', cfg.textoCancelar || 'Cancelar');
        btnCancelar.type = 'button';
        acoes.appendChild(btnCancelar);
      }
      var btnOk = el('button', 'dlg-btn dlg-ok', cfg.textoConfirmar || (ehAviso ? 'OK' : ehPergunta ? 'Confirmar' : 'Sim'));
      btnOk.type = 'button';
      acoes.appendChild(btnOk);
      box.appendChild(acoes);

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      var fechado = false;
      function fechar(resultado) {
        if (fechado) return;
        fechado = true;
        document.removeEventListener('keydown', aoTeclar, true);
        overlay.remove();
        try { if (anterior && anterior.focus) anterior.focus(); } catch (_) {}
        resolve(resultado);
      }

      function aceitar() {
        if (ehPergunta) {
          if (cfg.somenteLeitura) {
            // modo "copiar": copia o texto e fecha
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value);
              else { input.select(); document.execCommand('copy'); }
            } catch (_) {}
            fechar(input.value);
            return;
          }
          var v = input.value;
          if (cfg.validar) {
            var msg = cfg.validar(v);
            if (msg) { erro.textContent = msg; input.focus(); return; }
          }
          fechar(v);
        } else if (ehAviso) {
          fechar(true);
        } else {
          fechar(true);
        }
      }

      function cancelar() {
        fechar(ehPergunta ? null : ehAviso ? true : false);
      }

      function aoTeclar(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cancelar(); }
        else if (ev.key === 'Enter' && !(ev.target && ev.target.tagName === 'TEXTAREA') && !(ev.target && ev.target.tagName === 'BUTTON')) {
          ev.preventDefault(); ev.stopPropagation(); aceitar();
        } else if (ev.key === 'Tab') {
          // mantém o foco dentro do diálogo
          var foco = box.querySelectorAll('input,textarea,button');
          if (!foco.length) return;
          var primeiro = foco[0], ultimo = foco[foco.length - 1];
          if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
          else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
        }
      }

      document.addEventListener('keydown', aoTeclar, true);
      btnOk.addEventListener('click', aceitar);
      if (btnCancelar) btnCancelar.addEventListener('click', cancelar);
      // clicar fora cancela (exceto em perguntas, para não perder o que foi digitado)
      overlay.addEventListener('mousedown', function (ev) {
        if (ev.target === overlay && !ehPergunta) cancelar();
      });

      // foco inicial: campo de texto; em ações perigosas, o botão Cancelar (evita confirmar sem querer)
      setTimeout(function () {
        if (input) { input.focus(); if (!cfg.somenteLeitura) input.select(); else input.select(); }
        else if (perigo && btnCancelar) btnCancelar.focus();
        else btnOk.focus();
      }, 30);
    });
  }

  window.Dialogo = {
    // -> true / false
    confirmar: function (mensagem, opcoes) {
      return abrir(Object.assign({ tipo: 'confirmar', mensagem: mensagem }, opcoes || {}));
    },
    // -> string (pode ser vazia) ou null se cancelou
    perguntar: function (mensagem, opcoes) {
      return abrir(Object.assign({ tipo: 'perguntar', mensagem: mensagem }, opcoes || {}));
    },
    // -> true quando o usuário clica OK
    aviso: function (mensagem, opcoes) {
      return abrir(Object.assign({ tipo: 'aviso', mensagem: mensagem }, opcoes || {}));
    }
  };
})();
