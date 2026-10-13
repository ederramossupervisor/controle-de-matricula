// js/dropzone-csv.js – Arrastar e soltar CSV nas telas de importação
//
// Melhora TODO <input type="file" accept=".csv"> do sistema (importar alunos, importar
// profissionais, promover alunos e atualizar matriculados) sem alterar a leitura nem a gravação:
//  - cria uma área "Arraste o arquivo CSV aqui" (clicar nela também abre o seletor de arquivos);
//  - ao soltar/escolher o arquivo, preenche o <input> original e já aciona o botão
//    "Carregar Pré-visualização" (que só mostra os dados, não grava nada);
//  - aceita VÁRIOS arquivos de uma vez: eles são combinados (na ordem do nome) em um único CSV,
//    desde que tenham as mesmas colunas, e aparecem numa só pré-visualização;
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

  var MAX_ARQUIVOS = 30;

  function cabecalhoComoTexto(bytes, fim) {
    var t = '';
    for (var i = 0; i < fim; i++) if (bytes[i] !== 13) t += String.fromCharCode(bytes[i]);
    return t.trim();
  }

  // Junta vários CSV em um só trabalhando nos bytes (não decodifica, então acentos ficam intactos).
  // Devolve um File, ou null (depois de avisar) se algo impedir a combinação.
  async function combinarArquivos(arquivos) {
    if (arquivos.length > MAX_ARQUIVOS) { toast('Envie no máximo ' + MAX_ARQUIVOS + ' arquivos por vez.'); return null; }
    var lista = arquivos.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'pt-BR', { numeric: true }); });
    var partes = [], cabecalhoBase = null, quebra = new Uint8Array([10]);
    for (var i = 0; i < lista.length; i++) {
      var bytes = new Uint8Array(await lista[i].arrayBuffer());
      if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) bytes = bytes.subarray(3);   // BOM UTF-8
      var fim = bytes.indexOf(10);
      if (fim < 0) fim = bytes.length;
      var cab = cabecalhoComoTexto(bytes, fim);
      if (!cab) { toast('O arquivo "' + lista[i].name + '" está vazio.'); return null; }
      if (cabecalhoBase === null) cabecalhoBase = cab;
      else if (cab !== cabecalhoBase) {
        toast('Os arquivos precisam ter as mesmas colunas. "' + lista[i].name + '" é diferente dos demais.');
        return null;
      }
      var corpo = (i === 0) ? bytes : bytes.subarray(Math.min(fim + 1, bytes.length));   // só o 1º mantém o cabeçalho
      if (!corpo.length) continue;
      partes.push(corpo);
      if (corpo[corpo.length - 1] !== 10) partes.push(quebra);
    }
    return new File(partes, lista.length + ' arquivos combinados.csv', { type: 'text/csv' });
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

    input.multiple = true;
    input.style.display = 'none';
    input.parentNode.insertBefore(zona, input);

    // O texto vem do arquivo realmente selecionado no input (textContent: nome do arquivo nunca vira HTML)
    function atualizar() {
      var arq = input.files && input.files[0];
      if (arq) {
        zona.classList.add('csv-dz-ok');
        titulo.textContent = arq.name + ' (' + formatarTamanho(arq.size) + ')';
        sub.textContent = 'Clique ou arraste outros arquivos para trocar';
      } else {
        zona.classList.remove('csv-dz-ok');
        titulo.textContent = 'Arraste um ou mais arquivos CSV aqui';
        sub.textContent = 'ou clique para escolher (vários arquivos viram uma única pré-visualização)';
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
      var todos = Array.prototype.slice.call(arquivos);
      if (todos.some(function (a) { return !/\.csv$/i.test(a.name); })) {
        toast(todos.length > 1 ? 'Todos os arquivos precisam ser .csv' : 'O arquivo precisa ser .csv');
        return;
      }
      var dt = new DataTransfer();
      todos.forEach(function (a) { dt.items.add(a); });
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));   // o tratamento de 1 ou vários fica no 'change'
    });

    // Vale para arquivo solto OU escolhido pelo seletor: mostra o nome e já carrega a pré-visualização
    input.addEventListener('change', async function () {
      if (input.files && input.files.length > 1) {
        var unico = null;
        try { unico = await combinarArquivos(Array.prototype.slice.call(input.files)); }
        catch (e) { console.warn('Combinar arquivos falhou', e); toast('Não foi possível ler os arquivos.'); }
        if (!unico) { input.value = ''; atualizar(); return; }
        var dt2 = new DataTransfer();
        dt2.items.add(unico);
        input.files = dt2.files;    // atribuir files por código não dispara outro 'change'
      }
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
