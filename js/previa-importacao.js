// js/previa-importacao.js – Pré-visualização inteligente da importação de alunos (CSV)
//
// Substitui renderizarPreview() (ui.js). Em vez de só listar as linhas, analisa o arquivo ANTES de gravar:
//   • Novos            → serão importados
//   • Já cadastrados   → o sistema já tem esse ID na escola; a importação os IGNORA (não altera ninguém)
//   • Com erro         → a importação vai ignorar a linha (escola desconhecida/sem permissão, ID repetido no arquivo)
//   • Com aviso        → entra na importação, mas há algo para conferir (CPF, datas, sem turma...)
// Nada aqui grava dados: só lê (a comparação com o banco é uma consulta de leitura).
// As regras espelham as de inserirAlunosSb() (supabase-client.js), para a prévia não prometer o que a importação não faz.
(function () {
  var LIMITE_LINHAS = 100;
  var tokenAtual = 0;      // evita que uma análise antiga (arquivo anterior) sobrescreva a nova

  function esc(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function dataIsoValida(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return false;
    var a = +m[1], me = +m[2], d = +m[3];
    var t = new Date(Date.UTC(a, me - 1, d));
    return t.getUTCFullYear() === a && t.getUTCMonth() === me - 1 && t.getUTCDate() === d;
  }

  function hojeIso() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()); }
    catch (_) { return new Date().toISOString().slice(0, 10); }
  }

  // ---------- 1) Validação do arquivo (sem banco) ----------
  function analisarLinhas(alunos, mapaEscolas) {
    var hoje = hojeIso();
    var vistos = {};
    return alunos.map(function (a, i) {
      var erros = [], avisos = [];
      var chaveEsc = normEscolaSb(a.escola);
      var escolaOficial = mapaEscolas[chaveEsc] || null;
      var id = String(a.id || '').trim();

      if (!escolaOficial) erros.push('Escola não encontrada ou sem permissão para importar');
      if (id && escolaOficial) {
        var k = escolaOficial + '|' + id;
        if (vistos[k]) erros.push('ID repetido no arquivo (só a primeira linha vale)');
        vistos[k] = true;
      }

      if (!String(a.turma || '').trim()) avisos.push('Sem turma: entra como Inativo');
      if (String(a.nome || '').trim().split(/\s+/).length < 2) avisos.push('Nome sem sobrenome');

      var cpfBruto = String(a.cpfAluno || '').trim();
      if (cpfBruto) {
        var digitos = cpfBruto.replace(/\D/g, '');
        if (digitos.length !== 11) avisos.push('CPF incompleto: não será gravado');
        else if (typeof validarCPF === 'function' && !validarCPF(cpfBruto)) avisos.push('CPF com dígitos inválidos');
      }

      if (!a.dataNascimento) avisos.push('Sem data de nascimento válida');
      else if (!dataIsoValida(a.dataNascimento)) avisos.push('Data de nascimento impossível: será ignorada');
      else if (a.dataNascimento > hoje) avisos.push('Data de nascimento no futuro');

      if (!a.dataMatricula) avisos.push('Sem data de matrícula válida: usará a data de hoje');
      else if (!dataIsoValida(a.dataMatricula)) avisos.push('Data de matrícula impossível: usará a data de hoje');
      else if (a.dataMatricula > hoje) avisos.push('Data de matrícula no futuro');

      return { aluno: a, linha: i, id: id, escolaOficial: escolaOficial, erros: erros, avisos: avisos, jaCadastrado: false };
    });
  }

  // ---------- 2) Comparação com o banco (somente leitura) ----------
  async function marcarJaCadastrados(itens) {
    var porEscola = {};
    itens.forEach(function (it) {
      if (it.id && it.escolaOficial && !it.erros.length) (porEscola[it.escolaOficial] = porEscola[it.escolaOficial] || []).push(it);
    });

    var tarefas = [];
    Object.keys(porEscola).forEach(function (escola) {
      var lista = porEscola[escola];
      for (var i = 0; i < lista.length; i += 150) tarefas.push({ escola: escola, lote: lista.slice(i, i + 150) });
    });

    var existentes = {};
    var proxima = 0;
    async function trabalhador() {
      while (proxima < tarefas.length) {
        var t = tarefas[proxima++];
        var codigos = t.lote.map(function (it) { return it.id; });
        var res = await sb.from('alunos').select('codigo').eq('escola', t.escola).in('codigo', codigos).limit(1000);
        if (res.error) throw res.error;
        res.data.forEach(function (r) { existentes[t.escola + '|' + r.codigo] = true; });
      }
    }
    await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);

    itens.forEach(function (it) {
      if (it.id && it.escolaOficial && existentes[it.escolaOficial + '|' + it.id]) it.jaCadastrado = true;
    });
  }

  // ---------- 3) Resultado ----------
  function situacao(it) {
    if (it.erros.length) return 'erro';
    if (it.jaCadastrado) return 'ja';
    return 'novo';
  }

  function resumir(itens) {
    var r = { novos: 0, ja: 0, erro: 0, aviso: 0 };
    itens.forEach(function (it) {
      var s = situacao(it);
      if (s === 'erro') r.erro++;
      else if (s === 'ja') r.ja++;
      else { r.novos++; if (it.avisos.length) r.aviso++; }
    });
    return r;
  }

  var ROTULO = { erro: ['Erro', '#dc2626'], ja: ['Já cadastrado', '#64748b'], novo: ['Novo', '#16a34a'] };

  function linhaHtml(it) {
    var a = it.aluno, s = situacao(it);
    var cor = ROTULO[s][1];
    var obs = it.erros.map(function (t) { return '<div style="color:#dc2626;">⛔ ' + esc(t) + '</div>'; })
      .concat(it.jaCadastrado ? ['<div style="opacity:.75;">Já existe nesta escola: será ignorado</div>'] : [])
      .concat(it.avisos.map(function (t) { return '<div style="color:#b45309;">⚠ ' + esc(t) + '</div>'; })).join('');
    return '<tr>' +
      '<td class="col-situacao"><span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:' + cor + ';">' + ROTULO[s][0] + '</span></td>' +
      '<td data-label="Nome">' + esc(a.nome || '-') + '</td><td data-label="Escola">' + esc(a.escola || '-') + '</td><td data-label="Turma">' + esc(a.turma || '-') + '</td>' +
      '<td data-label="Resp.">' + esc(a.responsavel || '-') + '</td><td class="col-tel" data-label="Tel.">' + esc(a.telefone || '-') + '</td>' +
      '<td class="col-chk" data-label="CPF">' + (a.cpfAluno ? '✓' : '-') + '</td><td class="col-chk" data-label="SUS">' + (a.sus ? '✓' : '-') + '</td>' +
      '<td class="col-chk" data-label="RG">' + (a.rg ? '✓' : '-') + '</td><td class="col-chk" data-label="Resid.">' + (a.residencia ? '✓' : '-') + '</td>' +
      '<td data-label="Ed. Especial">' + (a.edEspecial ? 'Sim' : 'Não') + '</td>' +
      '<td class="col-obs">' + (obs || '<span style="opacity:.5;">—</span>') + '</td></tr>';
  }

  function filtrar(itens, filtro) {
    var lista = itens.filter(function (it) {
      var s = situacao(it);
      if (filtro === 'novos') return s === 'novo';
      if (filtro === 'ja') return s === 'ja';
      if (filtro === 'erro') return s === 'erro';
      if (filtro === 'aviso') return s === 'novo' && it.avisos.length > 0;
      return true;
    });
    // problemas primeiro (erro, aviso, já cadastrado, novo); dentro de cada grupo mantém a ordem do arquivo
    var peso = function (it) { var s = situacao(it); return s === 'erro' ? 0 : (s === 'novo' && it.avisos.length) ? 1 : s === 'ja' ? 2 : 3; };
    return lista.slice().sort(function (x, y) { return peso(x) - peso(y) || x.linha - y.linha; });
  }

  function montarPainel(container, itens, resumo, extras) {
    var filtro = 'todos';

    function chip(chave, rotulo, valor, cor, dica) {
      return '<button type="button" data-filtro="' + chave + '" title="' + esc(dica) + '" style="flex:1 1 140px;text-align:left;cursor:pointer;' +
        'padding:10px 12px;border-radius:10px;border:2px solid ' + cor + ';background:transparent;color:inherit;font:inherit;">' +
        '<div style="font-size:22px;font-weight:800;color:' + cor + ';line-height:1.1;">' + valor + '</div>' +
        '<div style="font-size:12px;font-weight:600;">' + rotulo + '</div></button>';
    }

    function desenhar() {
      var lista = filtrar(itens, filtro);
      var html = '<div style="padding:12px;">';
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
        chip('novos', 'Novos (serão importados)', resumo.novos, '#16a34a', 'Mostrar só os novos') +
        chip('ja', 'Já cadastrados (ignorados)', resumo.ja, '#64748b', 'Mostrar só os que já existem') +
        chip('erro', 'Com erro (ignorados)', resumo.erro, '#dc2626', 'Mostrar só as linhas com erro') +
        chip('aviso', 'Novos com aviso (conferir)', resumo.aviso, '#d97706', 'Mostrar só os novos com aviso') + '</div>';
      html += '<div style="font-size:12px;opacity:.8;margin-bottom:8px;">' +
        (extras.linhasLidas ? extras.linhasLidas + ' linhas no arquivo' : itens.length + ' linhas válidas') +
        (extras.descartadas > 0 ? ' · ' + extras.descartadas + ' descartadas por falta de nome ou escola' : '') +
        (extras.semBanco ? ' · <strong style="color:#b45309;">não foi possível comparar com os alunos já cadastrados</strong>' : '') +
        (filtro !== 'todos' ? ' · <a href="#" data-filtro="todos">mostrar todos</a>' : '') + '</div>';
      html += '<div><table class="tabela-previa">' +
        '<thead><tr><th>Situação</th><th>Nome</th><th>Escola</th><th>Turma</th><th>Resp.</th><th>Tel.</th>' +
        '<th class="col-chk">CPF</th><th class="col-chk">SUS</th><th class="col-chk">RG</th><th class="col-chk">Resid.</th><th>Ed.Especial</th><th>Observações</th></tr></thead><tbody>' +
        lista.slice(0, LIMITE_LINHAS).map(linhaHtml).join('') + '</tbody></table></div>';
      if (!lista.length) html += '<p style="padding:8px;opacity:.7;">Nenhuma linha neste filtro.</p>';
      if (lista.length > LIMITE_LINHAS) html += '<p style="padding:8px 0;font-size:12px;">Exibindo ' + LIMITE_LINHAS + ' de ' + lista.length + ' linhas (os problemas aparecem primeiro).</p>';
      html += '</div>';
      container.innerHTML = html;
    }

    container.onclick = function (ev) {
      var alvo = ev.target.closest && ev.target.closest('[data-filtro]');
      if (!alvo || !container.contains(alvo)) return;
      ev.preventDefault();
      filtro = (filtro === alvo.getAttribute('data-filtro')) ? 'todos' : alvo.getAttribute('data-filtro');
      desenhar();
    };
    desenhar();
  }

  // ---------- 4) Substitui a pré-visualização antiga ----------
  window.renderizarPreview = function (alunos) {
    var container = document.getElementById('previewContainer');
    if (!container) return;
    if (!alunos || alunos.length === 0) {
      container.innerHTML = '<p style="padding:16px;color:#dc2626;">Nenhum aluno válido encontrado.</p>';
      return;
    }
    var meuToken = ++tokenAtual;
    container.onclick = null;
    container.innerHTML = '<p style="padding:16px;opacity:.8;">Analisando o arquivo…</p>';

    (async function () {
      var itens, mapa, semBanco = false;
      try { mapa = await mapaEscolasEditaveisSb(); } catch (_) { mapa = null; }
      if (meuToken !== tokenAtual) return;
      if (!mapa) {   // sem como saber as escolas permitidas: mantém só a lista simples, sem bloquear a importação
        container.innerHTML = '<p style="padding:16px;color:#b45309;">Não foi possível analisar o arquivo agora. Você ainda pode importar normalmente.</p>';
        return;
      }
      itens = analisarLinhas(alunos, mapa);
      try { await marcarJaCadastrados(itens); } catch (e) { console.warn('Prévia: comparação com o banco falhou', e); semBanco = true; }
      if (meuToken !== tokenAtual) return;

      var resumo = resumir(itens);
      var lidas = window._csvLinhasLidas || 0;
      montarPainel(container, itens, resumo, {
        linhasLidas: lidas, descartadas: Math.max(0, lidas - alunos.length), semBanco: semBanco
      });

      // Nada novo para gravar: não há o que importar (só trava se a comparação com o banco funcionou)
      var botao = document.getElementById('btnExecutarImportacao');
      if (botao && !semBanco) {
        botao.disabled = (resumo.novos === 0);
        if (resumo.novos === 0 && typeof mostrarToast === 'function') mostrarToast('Nenhum aluno novo para importar neste arquivo.', 'warning');
      }
    })();
  };
})();
