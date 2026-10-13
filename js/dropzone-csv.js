// js/dropzone-csv.js – Arrastar e soltar CSV nas telas de importação
//
// Melhora TODO <input type="file" accept=".csv"> do sistema (importar alunos, importar
// profissionais, promover alunos e atualizar matriculados) sem alterar a leitura nem a gravação:
//  - cria uma área "Arraste o arquivo CSV aqui" (clicar nela também abre o seletor de arquivos);
//  - ao soltar/escolher o arquivo, preenche o <input> original e já aciona o botão
//    "Carregar Pré-visualização" (que só mostra os dados, não grava nada);
//  - o <input> original continua existindo (escondido), então os processadores atuais
//    (processarCSV, processarCSVProfissionais, ...) funcionam exatamente como antes.
(function () {
  var SELETOR = 'input[type="file"][accept*=".csv"]';

  function temArquivos(ev) {
    var tipos = ev.dataTransfer && ev.dataTransfer.types;
    return !!tipos && Array.prototype.indexOf.call(tipos, 'Files') >= 0;
  }

  // Se o arquivo for solto fora da área, o navegador abriria o CSV e o usuário perderia a tela.
  window.addEventListener('dragover', function (ev) { if (temArquivos(ev)) ev.preventDefault(); });
  window.addEventListener('drop', function (ev) { if (temArquivos(ev)) ev.preventDefault(); });

  function injetarEstilo() {
    if (document.getElementById('csvDropzoneEstilo')) return;
    var st = document.createElement('style');
    st.id = 'csvDropzoneEstilo';
    st.textContent =
      '.csv-dropzone{display:flex;flex-direction:column;align-items:center;gap:4px;padding:22px 16px;margin-bottom:12px;' +
      'border:2px dashed #94a3b8;border-radius:12px;background:rgba(37,99,235,.04);color:inherit;cursor:pointer;' +
      'text-align:center;transition:border-color .15s,background .15s,transform .15s;}' +
      '.csv-dropzone:hover,.csv-dropzone:focus-visible{border-color:#2563eb;background:rgba(37,99,235,.08);outline:none;}' +
      '.csv-dropzone.csv-dz-ativo{border-color:#2563eb;background:rgba(37,99,235,.16);transform:scale(1.01);}' +
      '.csv-dropzone.csv-dz-ok{border-style:solid;border-color:#16a34a;background:rgba(22,163,74,.07);}' +
      '.csv-dz-icone{font-size:26px;color:#2563eb;}' +
      '.csv-dropzone.csv-dz-ok .csv-dz-icone{color:#16a34a;}' +
      '.csv-dz-titulo{font-weight:600;word-break:break-all;}' +
      '.csv-dz-sub{font-size:12px;opacity:.7;}';
    document.head.appendChild(st);
  }

  // O botão "Carregar Pré-visualização" fica ao lado do input (mesmo bloco ou bloco logo acima).
  function acharBotaoPreview(input) {
    var el = input.parentElement;
    for (var i = 0; i < 3 && el; i++, el = el.parentElement) {
      var b = el.querySelector('button[onclick*="processarCSV"]');
      if (b) return b;
    }
    return null;
  }

  function formatarTamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function toast(msg) {
    if (typeof mostrarToast === 'function') mostrarToast(msg, 'warning');
  }

  function montar(input) {
    if (input.dataset.dropzone) return;
    input.dataset.dropzone = '1';

    var zona = document.createElement('div');
    zona.className = 'csv-dropzone';
    zona.tabIndex = 0;
    zona.setAttribute('role', 'button');

    var icone = document.createElement('i');
    icone.className = 'fas fa-file-csv csv-dz-icone';
    var titulo = document.createElement('span');
    titulo.className = 'csv-dz-titulo';
    var sub = document.createElement('span');
    sub.className = 'csv-dz-sub';
    zona.append(icone, titulo, sub);

    input.style.display = 'none';
    input.parentNode.insertBefore(zona, input);

    // O texto vem do arquivo realmente selecionado no input (textContent: nome do arquivo nunca vira HTML)
    function atualizar() {
      var arq = input.files && input.files[0];
      if (arq) {
        zona.classList.add('csv-dz-ok');
        titulo.textContent = arq.name + ' (' + formatarTamanho(arq.size) + ')';
        sub.textContent = 'Clique ou arraste outro arquivo para trocar';
      } else {
        zona.classList.remove('csv-dz-ok');
        titulo.textContent = 'Arraste o arquivo CSV aqui';
        sub.textContent = 'ou clique para escolher no computador';
      }
    }
    atualizar();

    zona.addEventListener('click', function () { input.click(); });
    zona.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); input.click(); }
    });

    zona.addEventListener('dragenter', function (ev) { ev.preventDefault(); zona.classList.add('csv-dz-ativo'); });
    zona.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
      zona.classList.add('csv-dz-ativo');
    });
    zona.addEventListener('dragleave', function (ev) {
      if (!ev.relatedTarget || !zona.contains(ev.relatedTarget)) zona.classList.remove('csv-dz-ativo');
    });
    zona.addEventListener('drop', function (ev) {
      ev.preventDefault();
      zona.classList.remove('csv-dz-ativo');
      var arquivos = ev.dataTransfer && ev.dataTransfer.files;
      if (!arquivos || !arquivos.length) return;
      if (arquivos.length > 1) { toast('Envie um arquivo por vez.'); return; }
      if (!/\.csv$/i.test(arquivos[0].name)) { toast('O arquivo precisa ser .csv'); return; }
      var dt = new DataTransfer();
      dt.items.add(arquivos[0]);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Vale para arquivo solto OU escolhido pelo seletor: mostra o nome e já carrega a pré-visualização
    input.addEventListener('change', function () {
      atualizar();
      if (input.files && input.files[0]) {
        var botao = acharBotaoPreview(input);
        if (botao) setTimeout(function () { botao.click(); }, 0);
      }
    });

    // Ao abrir/fechar a janela, o sistema zera o input (value = ''): acompanha para não mostrar nome antigo
    var modal = input.closest('.modal-overlay');
    if (modal) new MutationObserver(atualizar).observe(modal, { attributes: true, attributeFilter: ['style'] });
  }

  function iniciar() {
    injetarEstilo();
    document.querySelectorAll(SELETOR).forEach(montar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
