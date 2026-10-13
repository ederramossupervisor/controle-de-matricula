// js/previa-importacao.js – Pré-visualização inteligente da importação de alunos (CSV)
//
// Depois de ler o CSV, compara cada linha com o que já está na base e mostra:
//   • Novos ................. serão criados
//   • Já existem (iguais) ... mesmo ID na escola, nenhum campo diferente
//   • Já existem (diferem) .. mesmo ID na escola, mas algum campo do CSV é diferente
//   • Com erro .............. linhas que NÃO serão importadas (sem nome/escola, escola sem permissão, ID repetido)
//   • Avisos ................ linhas que serão importadas, mas com algo estranho (CPF/data/telefone/UF, sem turma)
//
// IMPORTANTE: a importação por arquivo só CRIA alunos (alunos que já existem são ignorados, nunca alterados).
// Por isso só os alunos novos seguem para a gravação (alunosImportados). Quem quiser atualizar quem já existe
// usa "Atualizar matriculados" / "Promover alunos".
(function () {
  'use strict';

  var UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO','EX'];

  // chave no objeto do CSV → coluna na tabela "alunos"
  var CAMPOS = [
    { k: 'nome',          col: 'nome',           rotulo: 'Nome',            tipo: 'texto' },
    { k: 'responsavel',   col: 'responsavel',    rotulo: 'Responsável',     tipo: 'texto' },
    { k: 'telefone',      col: 'telefone',       rotulo: 'Telefone',        tipo: 'fone' },
    { k: 'turma',         col: 'turma',          rotulo: 'Turma',           tipo: 'texto' },
    { k: 'cpfAluno',      col: 'cpf_numero',     rotulo: 'CPF',             tipo: 'cpf' },
    { k: 'racaCor',       col: 'raca_cor',       rotulo: 'Raça/cor',        tipo: 'raca' },
    { k: 'filiacao1',     col: 'filiacao_1',     rotulo: 'Filiação 1',      tipo: 'texto' },
    { k: 'filiacao2',     col: 'filiacao_2',     rotulo: 'Filiação 2',      tipo: 'texto' },
    { k: 'dataNascimento',col: 'data_nascimento',rotulo: 'Nascimento',      tipo: 'data' },
    { k: 'naturalidade',  col: 'naturalidade',   rotulo: 'Naturalidade',    tipo: 'texto' },
    { k: 'ufNascimento',  col: 'uf_nascimento',  rotulo: 'UF nasc.',        tipo: 'texto' },
    { k: 'nacionalidade', col: 'nacionalidade',  rotulo: 'Nacionalidade',   tipo: 'texto' },
    { k: 'edEspecial',    col: 'ed_especial',    rotulo: 'Ed. Especial',    tipo: 'bool' }
  ];
  var COLUNAS_BANCO = ['codigo', 'escola'].concat(CAMPOS.map(function (c) { return c.col; })).join(',');

  var MAX_LINHAS_TABELA = 200;
  var estado = { token: 0, itens: [], filtro: 'todos', limite: MAX_LINHAS_TABELA, semComparacao: false };

  // ---------- utilitários ----------
  function esc(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function vazio(v) { return v === undefined || v === null || String(v).trim() === ''; }
  function minusc(v) {
    return String(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }
  function dataReal(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return false;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }
  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || '');
  }
  function hojeIso() { return new Date().toISOString().slice(0, 10); }

  // valor "normalizado" de um campo para comparar CSV x base
  function normalizar(tipo, v) {
    if (tipo === 'bool') return v === true;
    if (vazio(v)) return '';
    if (tipo === 'fone' || tipo === 'cpf') return soDigitos(v);
    if (tipo === 'data') return String(v).slice(0, 10);
    return minusc(v);
  }
  function exibir(tipo, v) {
    if (tipo === 'bool') return v === true ? 'Sim' : 'Não';
    if (vazio(v)) return '(vazio)';
    if (tipo === 'data') return dataBR(v);
    return String(v).trim();
  }

  // ---------- validação de uma linha (só com o que está no CSV) ----------
  // Devolve { erros: [...], avisos: [...] }
  function validarLinha(a, cab) {
    var erros = [], avisos = [];
    if (vazio(a.nome)) erros.push('Sem nome');
    if (vazio(a.escola)) erros.push('Sem escola');

    if (!vazio(a.cpfAluno)) {
      var d = soDigitos(a.cpfAluno);
      if (d.length !== 11) avisos.push('CPF com ' + d.length + ' dígitos (será ignorado)');
      else if (typeof validarCPF === 'function' && !validarCPF(d)) avisos.push('CPF inválido (dígitos verificadores)');
    }
    if (a._brutoNascimento && !dataReal(a.dataNascimento)) avisos.push('Data de nascimento não reconhecida: "' + a._brutoNascimento + '"');
    else if (a.dataNascimento && dataReal(a.dataNascimento) && a.dataNascimento > hojeIso()) avisos.push('Data de nascimento no futuro');
    else if (a.dataNascimento && dataReal(a.dataNascimento) && a.dataNascimento < '1950-01-01') avisos.push('Data de nascimento antes de 1950');
    if (a._brutoMatricula && !dataReal(a.dataMatricula)) avisos.push('Data de matrícula não reconhecida: "' + a._brutoMatricula + '"');

    if (!vazio(a.telefone)) {
      var t = soDigitos(a.telefone);
      if (t.length < 10) avisos.push('Telefone incompleto (' + t.length + ' dígitos)');
    }
    if (!vazio(a.ufNascimento) && UFS.indexOf(String(a.ufNascimento).trim().toUpperCase()) < 0) {
      avisos.push('UF de nascimento inválida: "' + String(a.ufNascimento).trim() + '"');
    }
    if (!vazio(a.nome) && vazio(a.turma)) avisos.push('Sem turma (entra como Inativo)');
    return { erros: erros, avisos: avisos };
  }

  // ---------- consulta à base ----------
  async function buscarExistentes(porEscola, token, aoProgredir) {
    // porEscola: { escolaCanonica: [ids] } → Map "escola|id" → registro
    var mapa = new Map();
    var tarefas = [];
    Object.keys(porEscola).forEach(function (escola) {
      var ids = porEscola[escola];
      for (var i = 0; i < ids.length; i += 150) tarefas.push({ escola: escola, ids: ids.slice(i, i + 150) });
    });
    var feitas = 0, proximo = 0;
    async function trabalhador() {
      while (proximo < tarefas.length) {
        var t = tarefas[proximo++];
        var r = await sb.from('alunos').select(COLUNAS_BANCO).eq('escola', t.escola).in('codigo', t.ids);
        if (r.error) throw r.error;
        r.data.forEach(function (row) { mapa.set(row.escola + '|' + row.codigo, row); });
        feitas++;
        if (token === estado.token) aoProgredir(feitas, tarefas.length);
      }
    }
    var n = Math.min(3, tarefas.length);
    var ws = [];
    for (var i = 0; i < n; i++) ws.push(trabalhador());
    await Promise.all(ws);
    return mapa;
  }

  function compararComBase(a, row, cab) {
    var difs = [];
    CAMPOS.forEach(function (c) {
      if (c.tipo === 'bool') {
        if (!cab.edEspecial) return;                // coluna não veio no CSV → não dá pra comparar
      } else if (vazio(a[c.k])) {
        return;                                    // CSV em branco não é "mudança" (nada seria gravado)
      }
      var novo = normalizar(c.tipo, a[c.k]);
      var atual = normalizar(c.tipo, row[c.col]);
      if (c.tipo === 'raca') { novo = minusc(typeof racaCorSb === 'function' ? racaCorSb(a[c.k]) || '' : a[c.k]); }
      if (novo !== atual) {
        difs.push({ rotulo: c.rotulo, de: exibir(c.tipo, row[c.col]), para: exibir(c.tipo, a[c.k]) });
      }
    });
    return difs;
  }

  // ---------- análise principal ----------
  // linhas: [{ linha: nºNoArquivo, aluno: {...} }]   cab: { edEspecial: bool }
  async function analisar(linhas, cab) {
    var token = ++estado.token;
    var container = document.getElementById('previewContainer');
    var btn = document.getElementById('btnExecutarImportacao');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-download"></i> Iniciar Importação'; btn.title = ''; }
    alunosImportados = [];

    function status(msg) {
      if (token === estado.token && container) container.innerHTML = '<p class="pi-status">' + esc(msg) + '</p>';
    }
    status('Analisando ' + linhas.length + ' linhas…');

    var itens = linhas.map(function (l) {
      var v = validarLinha(l.aluno, cab);
      return { linha: l.linha, aluno: l.aluno, erros: v.erros, avisos: v.avisos, situacao: null, difs: [] };
    });

    // 1) escola existe e o usuário pode gravar nela? (mesma regra da gravação)
    var mapaEscolas = null;
    try { mapaEscolas = (typeof mapaEscolasEditaveisSb === 'function') ? await mapaEscolasEditaveisSb() : null; }
    catch (e) { console.warn('Prévia: não foi possível validar as escolas', e); }
    if (token !== estado.token) return;
    if (mapaEscolas) {
      itens.forEach(function (it) {
        if (vazio(it.aluno.escola)) return;
        var canon = mapaEscolas[normEscolaSb(it.aluno.escola)];
        if (!canon) it.erros.push('Escola "' + String(it.aluno.escola).trim() + '" não cadastrada ou sem permissão');
        else it.escolaCanon = canon;
      });
    }

    // 2) ID repetido dentro do próprio arquivo (a 2ª ocorrência é ignorada na gravação)
    var vistos = {};
    itens.forEach(function (it) {
      if (it.erros.length || vazio(it.aluno.id)) return;
      var chave = (it.escolaCanon || minusc(it.aluno.escola)) + '|' + String(it.aluno.id).trim();
      if (vistos[chave]) it.erros.push('ID repetido no arquivo (igual à linha ' + vistos[chave] + ')');
      else vistos[chave] = it.linha;
    });

    // 3) compara com a base (só linhas com ID e escola válida)
    var porEscola = {};
    itens.forEach(function (it) {
      if (it.erros.length || vazio(it.aluno.id) || !it.escolaCanon) return;
      (porEscola[it.escolaCanon] = porEscola[it.escolaCanon] || []).push(String(it.aluno.id).trim());
    });
    var existentes = new Map();
    estado.semComparacao = false;
    try {
      if (Object.keys(porEscola).length) {
        existentes = await buscarExistentes(porEscola, token, function (f, t) {
          status('Comparando com a base… (' + f + ' de ' + t + ')');
        });
      }
    } catch (e) {
      console.error('Prévia: falha ao consultar a base', e);
      estado.semComparacao = true;
    }
    if (token !== estado.token) return;

    itens.forEach(function (it) {
      if (it.erros.length) { it.situacao = 'erro'; return; }
      if (estado.semComparacao || vazio(it.aluno.id) || !it.escolaCanon) { it.situacao = 'novo'; return; }
      var row = existentes.get(it.escolaCanon + '|' + String(it.aluno.id).trim());
      if (!row) { it.situacao = 'novo'; return; }
      it.difs = compararComBase(it.aluno, row, cab);
      it.situacao = it.difs.length ? 'mudou' : 'igual';
    });

    estado.itens = itens;
    estado.filtro = 'todos';
    estado.limite = MAX_LINHAS_TABELA;

    // Só alunos novos seguem para a gravação (quem já existe é ignorado pela importação; mandar só
    // geraria "falsos enviados" — e o "Desfazer importação" apagaria alunos antigos).
    alunosImportados = itens.filter(function (it) { return it.situacao === 'novo'; }).map(function (it) {
      var limpo = Object.assign({}, it.aluno);
      delete limpo._brutoMatricula; delete limpo._brutoNascimento;   // campos só da prévia
      return limpo;
    });
    renderizar();
  }

  // ---------- interface ----------
  function injetarEstilo() {
    if (document.getElementById('previaImportacaoEstilo')) return;
    var st = document.createElement('style');
    st.id = 'previaImportacaoEstilo';
    st.textContent =
      '.pi-status{padding:16px;color:#64748b;margin:0}' +
      '.pi-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;padding:10px}' +
      '.pi-card{border:2px solid transparent;border-radius:10px;padding:8px 10px;text-align:left;cursor:pointer;font:inherit;color:inherit;background:#f1f5f9;transition:border-color .15s,transform .1s}' +
      '.pi-card:hover{transform:translateY(-1px)}' +
      '.pi-card.pi-sel{border-color:#2563eb}' +
      '.pi-card b{display:block;font-size:22px;line-height:1.1}' +
      '.pi-card span{font-size:12px;opacity:.85}' +
      '.pi-card.pi-novo{background:rgba(22,163,74,.12)}.pi-card.pi-novo b{color:#15803d}' +
      '.pi-card.pi-igual{background:rgba(100,116,139,.14)}' +
      '.pi-card.pi-mudou{background:rgba(217,119,6,.14)}.pi-card.pi-mudou b{color:#b45309}' +
      '.pi-card.pi-erro{background:rgba(220,38,38,.12)}.pi-card.pi-erro b{color:#b91c1c}' +
      '.pi-card.pi-aviso{background:rgba(234,179,8,.16)}.pi-card.pi-aviso b{color:#a16207}' +
      '.pi-nota{margin:0;padding:0 10px 8px;font-size:12px;color:#64748b;line-height:1.4}' +
      '.pi-nota.pi-forte{color:#b45309}' +
      '.pi-tab{width:100%;border-collapse:collapse;font-size:13px}' +
      '.pi-tab th{position:sticky;top:0;background:#f1f5f9;color:#334155;text-align:left;padding:6px 8px;z-index:1}' +
      '.pi-tab td{padding:6px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}' +
      '.pi-badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}' +
      '.pi-b-novo{background:#dcfce7;color:#166534}.pi-b-igual{background:#e2e8f0;color:#334155}' +
      '.pi-b-mudou{background:#fef3c7;color:#92400e}.pi-b-erro{background:#fee2e2;color:#991b1b}' +
      '.pi-det{font-size:12px;line-height:1.45}' +
      '.pi-det .pi-e{color:#b91c1c}.pi-det .pi-w{color:#a16207}.pi-det .pi-d{color:#92400e}' +
      '.pi-det s{opacity:.65}' +
      '.pi-mais{display:block;margin:8px auto;padding:6px 14px;border:1px solid #cbd5e1;border-radius:8px;background:transparent;color:inherit;cursor:pointer}' +
      '[data-theme="dark"] .pi-card{background:#1e293b}' +
      '[data-theme="dark"] .pi-card.pi-novo{background:rgba(22,163,74,.2)}[data-theme="dark"] .pi-card.pi-novo b{color:#4ade80}' +
      '[data-theme="dark"] .pi-card.pi-igual{background:rgba(148,163,184,.18)}' +
      '[data-theme="dark"] .pi-card.pi-mudou{background:rgba(217,119,6,.22)}[data-theme="dark"] .pi-card.pi-mudou b{color:#fbbf24}' +
      '[data-theme="dark"] .pi-card.pi-erro{background:rgba(220,38,38,.22)}[data-theme="dark"] .pi-card.pi-erro b{color:#f87171}' +
      '[data-theme="dark"] .pi-card.pi-aviso{background:rgba(234,179,8,.2)}[data-theme="dark"] .pi-card.pi-aviso b{color:#facc15}' +
      '[data-theme="dark"] .pi-tab th{background:#1e293b;color:#cbd5e1}' +
      '[data-theme="dark"] .pi-tab td{border-color:#334155}' +
      '[data-theme="dark"] .pi-det .pi-e{color:#f87171}[data-theme="dark"] .pi-det .pi-w{color:#facc15}[data-theme="dark"] .pi-det .pi-d{color:#fbbf24}' +
      '[data-theme="dark"] .pi-b-novo{background:rgba(22,163,74,.3);color:#86efac}[data-theme="dark"] .pi-b-igual{background:#334155;color:#e2e8f0}' +
      '[data-theme="dark"] .pi-b-mudou{background:rgba(217,119,6,.3);color:#fde68a}[data-theme="dark"] .pi-b-erro{background:rgba(220,38,38,.3);color:#fecaca}';
    document.head.appendChild(st);
  }

  function contagens() {
    var c = { todos: estado.itens.length, novo: 0, igual: 0, mudou: 0, erro: 0, aviso: 0, semId: 0 };
    estado.itens.forEach(function (it) {
      c[it.situacao]++;
      if (it.situacao !== 'erro' && it.avisos.length) c.aviso++;
      if (it.situacao === 'novo' && vazio(it.aluno.id)) c.semId++;
    });
    return c;
  }

  function passaFiltro(it) {
    var f = estado.filtro;
    if (f === 'todos') return true;
    if (f === 'aviso') return it.situacao !== 'erro' && it.avisos.length > 0;
    return it.situacao === f;
  }

  var ROTULO = { novo: 'Novo', igual: 'Já existe', mudou: 'Já existe · difere', erro: 'Erro' };

  function detalhe(it) {
    var h = [];
    it.erros.forEach(function (m) { h.push('<div class="pi-e">✖ ' + esc(m) + '</div>'); });
    it.difs.forEach(function (d) {
      h.push('<div class="pi-d">≠ ' + esc(d.rotulo) + ': <s>' + esc(d.de) + '</s> → ' + esc(d.para) + '</div>');
    });
    if (it.situacao !== 'erro') it.avisos.forEach(function (m) { h.push('<div class="pi-w">⚠ ' + esc(m) + '</div>'); });
    return h.join('') || '<span style="opacity:.6">—</span>';
  }

  function renderizar() {
    var container = document.getElementById('previewContainer');
    var btn = document.getElementById('btnExecutarImportacao');
    if (!container) return;
    var c = contagens();

    if (c.todos === 0) {
      container.innerHTML = '<p class="pi-status" style="color:#dc2626">Nenhuma linha com dados foi encontrada no arquivo.</p>';
      return;
    }

    function card(chave, cls, numero, texto) {
      return '<button type="button" class="pi-card ' + cls + (estado.filtro === chave ? ' pi-sel' : '') +
        '" data-pi-filtro="' + chave + '"><b>' + numero + '</b><span>' + texto + '</span></button>';
    }
    var h = '<div class="pi-cards">' +
      card('novo', 'pi-novo', c.novo, 'Novos (serão criados)') +
      card('igual', 'pi-igual', c.igual, 'Já existem, iguais') +
      card('mudou', 'pi-mudou', c.mudou, 'Já existem, com diferenças') +
      card('erro', 'pi-erro', c.erro, 'Com erro (ignorados)') +
      card('aviso', 'pi-aviso', c.aviso, 'Com avisos') +
      card('todos', '', c.todos, 'Todas as linhas') +
      '</div>';

    if (estado.semComparacao) {
      h += '<p class="pi-nota pi-forte">Não foi possível comparar com a base agora (falha na consulta). Todas as linhas válidas serão tratadas como novas; alunos que já existirem serão ignorados na gravação.</p>';
    } else if (c.igual + c.mudou > 0) {
      h += '<p class="pi-nota pi-forte">Alunos que já existem <b>não são alterados</b> por esta importação, mesmo os que diferem do cadastro. Para atualizar dados de quem já está matriculado, use “Atualizar matriculados”.</p>';
    }
    if (c.semId > 0) {
      h += '<p class="pi-nota">' + c.semId + ' aluno(s) sem ID no arquivo: não dá para saber se já existem, então serão criados como novos.</p>';
    }

    var visiveis = estado.itens.filter(passaFiltro);
    h += '<table class="pi-tab"><thead><tr><th>Linha</th><th>Situação</th><th>Nome</th><th>Escola</th><th>Turma</th><th>Detalhes</th></tr></thead><tbody>';
    visiveis.slice(0, estado.limite).forEach(function (it) {
      h += '<tr><td>' + it.linha + '</td>' +
        '<td><span class="pi-badge pi-b-' + it.situacao + '">' + ROTULO[it.situacao] + '</span></td>' +
        '<td>' + esc(it.aluno.nome || '-') + '</td><td>' + esc(it.aluno.escola || '-') + '</td><td>' + esc(it.aluno.turma || '-') + '</td>' +
        '<td class="pi-det">' + detalhe(it) + '</td></tr>';
    });
    if (!visiveis.length) h += '<tr><td colspan="6" style="padding:14px;opacity:.7">Nenhuma linha nesta categoria.</td></tr>';
    h += '</tbody></table>';
    if (visiveis.length > estado.limite) {
      h += '<button type="button" class="pi-mais" data-pi-mais="1">Mostrar mais (' + (visiveis.length - estado.limite) + ' restantes)</button>';
    }
    container.innerHTML = h;

    if (btn) {
      btn.disabled = (c.novo === 0);
      btn.innerHTML = '<i class="fas fa-download"></i> Iniciar Importação' + (c.novo ? ' (' + c.novo + ' novo' + (c.novo > 1 ? 's' : '') + ')' : '');
      btn.title = c.novo === 0 ? 'Não há alunos novos neste arquivo' : '';
    }
  }

  function aoClicar(ev) {
    var alvo = ev.target.closest && ev.target.closest('[data-pi-filtro],[data-pi-mais]');
    if (!alvo || !alvo.closest('#previewContainer')) return;
    if (alvo.hasAttribute('data-pi-mais')) { estado.limite += MAX_LINHAS_TABELA; }
    else { estado.filtro = alvo.getAttribute('data-pi-filtro'); estado.limite = MAX_LINHAS_TABELA; }
    renderizar();
  }

  // ---------- ponto de entrada (chamado por processarCSV em data.js) ----------
  window.analisarPreviaImportacao = function (linhas, cab) {
    injetarEstilo();
    return analisar(linhas, cab || {}).catch(function (e) {
      console.error('Erro na pré-visualização:', e);
      var container = document.getElementById('previewContainer');
      if (container) container.innerHTML = '<p class="pi-status" style="color:#dc2626">Erro ao analisar o arquivo: ' + esc(e && e.message || e) + '</p>';
    });
  };
  // para testes
  window._previaImportacao = { validarLinha: validarLinha, compararComBase: compararComBase, estado: estado };

  document.addEventListener('click', aoClicar);
})();
