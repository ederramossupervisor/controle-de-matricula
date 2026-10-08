// =========================
// NOTIFICAÇÕES
// =========================
// Os avisos são criados pelo próprio banco (gatilhos e rotinas agendadas):
// visita agendada/reagendada/cancelada, lembrete do dia anterior, comunicado
// novo, termo aguardando aprovação e resumo semanal de documentação vencida.
// "Lida" é POR USUÁRIO (tabela notificacoes_lidas). O sino atualiza em tempo
// real (Supabase Realtime); a consulta periódica fica só como reserva.

let intervaloNotificacoes = null;
let canalNotificacoes = null;
let notificacoesAtivas = false;
let abaNotificacoes = 'naoLidas';
let tokenCarregamentoNotificacoes = 0;

const POLLING_RESERVA_MS = 5 * 60 * 1000;      // com o tempo real funcionando
const POLLING_SEM_REALTIME_MS = 60 * 1000;     // se o tempo real não conectar

const TIPOS_NOTIFICACAO = {
  agenda:     { icone: 'fa-calendar-alt',   titulo: 'Agenda' },
  comunicado: { icone: 'fa-bullhorn',       titulo: 'Comunicado' },
  termo:      { icone: 'fa-file-signature', titulo: 'Termo de compromisso' },
  documentos: { icone: 'fa-folder-open',    titulo: 'Documentação' },
  geral:      { icone: 'fa-bell',           titulo: 'Aviso' }
};

// Destinos do clique no aviso (coluna "link" da notificação)
const LINKS_NOTIFICACAO = ['agenda', 'termos', 'comunicados', 'alunos_vencidos'];

function formatarDataHoraNotificacao(valor) {
  const d = new Date(valor);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ---------- Janela de notificações ----------
function abrirNotificacoes() {
  document.getElementById('modalNotificacoes').style.display = 'flex';
  definirAbaNotificacoes('naoLidas');
  carregarNotificacoes();
}

function fecharNotificacoes() {
  document.getElementById('modalNotificacoes').style.display = 'none';
}

function definirAbaNotificacoes(aba) {
  abaNotificacoes = aba;
  const abaNao = document.getElementById('abaNotifNaoLidas');
  const abaTodas = document.getElementById('abaNotifTodas');
  if (abaNao) abaNao.classList.toggle('ativo', aba === 'naoLidas');
  if (abaTodas) abaTodas.classList.toggle('ativo', aba === 'todas');
}

function mudarAbaNotificacoes(aba) {
  definirAbaNotificacoes(aba);
  carregarNotificacoes();
}

async function carregarNotificacoes() {
  const container = document.getElementById('listaNotificacoes');
  if (!container) return;
  const token = ++tokenCarregamentoNotificacoes;   // descarta respostas antigas (troca rápida de aba)

  const carregando = document.createElement('p');
  carregando.className = 'notif-vazio';
  carregando.textContent = 'Carregando...';
  container.replaceChildren(carregando);

  try {
    let consulta = sb.from('notificacoes_v').select('*').order('data', { ascending: false }).limit(100);
    if (abaNotificacoes === 'naoLidas') consulta = consulta.eq('lida', false);
    const { data, error } = await consulta;
    if (error) throw error;
    if (token !== tokenCarregamentoNotificacoes) return;
    renderizarNotificacoes(data || []);
  } catch (e) {
    console.error('Notificações: erro ao carregar', e);
    if (token !== tokenCarregamentoNotificacoes) return;
    const erro = document.createElement('p');
    erro.className = 'notif-vazio';
    erro.textContent = 'Não foi possível carregar as notificações. Tente novamente.';
    container.replaceChildren(erro);
  }
  atualizarBadgeNotificacoes();
}

function renderizarNotificacoes(lista) {
  const container = document.getElementById('listaNotificacoes');
  const btnTodas = document.getElementById('btnMarcarTodasLidas');
  if (btnTodas) btnTodas.style.display = lista.some(function (n) { return !n.lida; }) ? '' : 'none';

  if (lista.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'notif-vazio';
    vazio.textContent = abaNotificacoes === 'naoLidas' ? 'Nenhuma notificação pendente.' : 'Nenhuma notificação.';
    container.replaceChildren(vazio);
    return;
  }
  container.replaceChildren.apply(container, lista.map(criarCardNotificacao));
}

// Todo texto vem do banco e entra na tela como TEXTO (nunca como HTML)
function criarCardNotificacao(n) {
  const cfg = TIPOS_NOTIFICACAO[n.tipo] || TIPOS_NOTIFICACAO.geral;

  const card = document.createElement('div');
  card.className = 'usuario-card notif-card' + (n.lida ? ' notif-lida' : '');

  const avatar = document.createElement('div');
  avatar.className = 'usuario-avatar';
  const icone = document.createElement('i');
  icone.className = 'fas ' + cfg.icone;
  avatar.appendChild(icone);

  const info = document.createElement('div');
  info.className = 'usuario-info';

  const titulo = document.createElement('strong');
  titulo.textContent = cfg.titulo;
  if (!n.lida) {
    const novo = document.createElement('span');
    novo.className = 'badge-novo';
    novo.textContent = 'NOVO';
    titulo.appendChild(novo);
  }

  const msg = document.createElement('p');
  msg.className = 'notif-msg';
  msg.textContent = n.mensagem || '';

  const quando = document.createElement('small');
  let textoQuando = 'Recebida em ' + formatarDataHoraNotificacao(n.data);
  if (n.ref_data) textoQuando += ' · Data do evento: ' + formatarDataHoraNotificacao(n.ref_data);
  quando.textContent = textoQuando;

  const acoes = document.createElement('div');
  acoes.className = 'notif-acoes';

  if (LINKS_NOTIFICACAO.indexOf(n.link) !== -1) {
    const abrir = document.createElement('button');
    abrir.className = 'btn-pequeno';
    abrir.textContent = 'Abrir';
    abrir.addEventListener('click', function () { abrirDestinoNotificacao(n); });
    acoes.appendChild(abrir);
  }
  if (!n.lida) {
    const marcar = document.createElement('button');
    marcar.className = 'btn-pequeno';
    marcar.textContent = 'Marcar como lida';
    marcar.addEventListener('click', function () { marcarLida(n.id); });
    acoes.appendChild(marcar);
  }

  info.append(titulo, msg, quando, acoes);
  card.append(avatar, info);
  return card;
}

// ---------- Marcar como lida (por usuário) ----------
async function marcarNotificacoesNoBanco(ids) {
  const { error } = await sb.rpc('marcar_notificacoes_lidas', ids ? { p_ids: ids } : {});
  if (error) throw error;
}

async function marcarLida(id) {
  try {
    await marcarNotificacoesNoBanco([id]);
  } catch (e) {
    console.error('Notificações: erro ao marcar como lida', e);
    mostrarToast('Não foi possível marcar como lida. Tente novamente.', 'error');
    return;
  }
  carregarNotificacoes();
}

async function marcarTodasLidas() {
  try {
    await marcarNotificacoesNoBanco(null);
    mostrarToast('Todas as notificações foram marcadas como lidas.', 'success');
  } catch (e) {
    console.error('Notificações: erro ao marcar todas como lidas', e);
    mostrarToast('Não foi possível marcar todas como lidas. Tente novamente.', 'error');
    return;
  }
  carregarNotificacoes();
}

// ---------- Clique no aviso: leva direto ao assunto ----------
async function abrirDestinoNotificacao(n) {
  if (!n.lida) {
    try { await marcarNotificacoesNoBanco([n.id]); } catch (e) { console.warn('Notificações: não marcou como lida', e); }
  }
  fecharNotificacoes();

  switch (n.link) {
    case 'agenda':
      if (typeof abrirModalAgenda === 'function') abrirModalAgenda();
      break;
    case 'termos':
      if (typeof abrirModalAprovacaoTermos === 'function') abrirModalAprovacaoTermos();
      break;
    case 'comunicados': {
      const mural = document.getElementById('muralComunicados');
      if (mural) mural.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'alunos_vencidos': {
      if (typeof filtrarPorStatus === 'function') filtrarPorStatus('vencido');
      const lista = document.getElementById('lista');
      if (lista) lista.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
  }
  atualizarBadgeNotificacoes();
}

// ---------- Contador do sino (consulta leve: só conta, não baixa os avisos) ----------
async function atualizarBadgeNotificacoes() {
  if (!emailUsuario) return;
  try {
    const { count, error } = await sb.from('notificacoes_v')
      .select('id', { count: 'exact', head: true })
      .eq('lida', false);
    if (error) throw error;
    const badge = document.getElementById('badgeNotificacoes');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    console.warn('Notificações: não foi possível atualizar o contador', e);
  }
}

// ---------- Tempo real + consulta de reserva ----------
function definirPollingNotificacoes(ms) {
  if (intervaloNotificacoes) clearInterval(intervaloNotificacoes);
  intervaloNotificacoes = setInterval(function () {
    if (!document.hidden) atualizarBadgeNotificacoes();
  }, ms);
}

function iniciarRealtimeNotificacoes() {
  if (canalNotificacoes) { sb.removeChannel(canalNotificacoes); canalNotificacoes = null; }

  canalNotificacoes = sb.channel('notificacoes-sino')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes' }, function (payload) {
      if (!notificacoesAtivas) return;
      const n = (payload && payload.new) || {};
      atualizarBadgeNotificacoes();
      const modal = document.getElementById('modalNotificacoes');
      if (modal && modal.style.display !== 'none') carregarNotificacoes();
      let texto = String(n.mensagem || 'Você tem uma nova notificação.');
      if (texto.length > 140) texto = texto.slice(0, 137) + '...';
      mostrarToast('<i class="fas fa-bell"></i> ' + escHtmlSb(texto), 'info', 7000);
    })
    .subscribe(function (status) {
      if (!notificacoesAtivas) return;
      if (status === 'SUBSCRIBED') {
        definirPollingNotificacoes(POLLING_RESERVA_MS);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        definirPollingNotificacoes(POLLING_SEM_REALTIME_MS);
      }
    });
}

function iniciarPollingNotificacoes() {
  notificacoesAtivas = true;
  atualizarBadgeNotificacoes();
  definirPollingNotificacoes(POLLING_SEM_REALTIME_MS);   // até o tempo real confirmar a conexão
  iniciarRealtimeNotificacoes();

  if (!window._notifVisibilidadeOuvinte) {
    window._notifVisibilidadeOuvinte = true;
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && notificacoesAtivas) atualizarBadgeNotificacoes();
    });
  }
}

function pararPollingNotificacoes() {
  notificacoesAtivas = false;
  if (intervaloNotificacoes) {
    clearInterval(intervaloNotificacoes);
    intervaloNotificacoes = null;
  }
  if (canalNotificacoes) {
    sb.removeChannel(canalNotificacoes);
    canalNotificacoes = null;
  }
}
