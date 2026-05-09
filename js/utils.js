// =========================
// FUNÇÕES UTILITÁRIAS
// =========================

// ------ JSONP (requisições GET contornando CORS) ------
function jsonp(url, callback) {
  const callbackName = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  window[callbackName] = function(data) {
    callback(data);
    document.body.removeChild(script);
    delete window[callbackName];
  };
  const script = document.createElement('script');
  script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
  script.onerror = function() {
    callback({ erro: 'Falha na requisição JSONP' });
    document.body.removeChild(script);
    delete window[callbackName];
  };
  document.body.appendChild(script);
}

// ------ POST sem esperar resposta (evita CORS) ------
function postSemResposta(dados, msgSucesso, callback) {
  fetch(API_URL, {
    method: "POST",
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dados)
  })
  .then(() => {
    if (msgSucesso) mostrarToast(msgSucesso, 'success');
    if (callback) callback();
  })
  .catch(() => {
    mostrarToast("Erro de conexão.", "error");
  });
}

// ------ CACHE LOCAL (localStorage) ------
function salvarCache(chave, dados) {
  try {
    const item = {
      dados: dados,
      timestamp: Date.now()
    };
    localStorage.setItem(chave, JSON.stringify(item));
    return true;
  } catch (e) {
    console.warn('Erro ao salvar cache:', e);
    return false;
  }
}

function lerCache(chave) {
  const raw = localStorage.getItem(chave);
  if (!raw) return null;
  try {
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp > CACHE_TTL) {
      localStorage.removeItem(chave);
      return null;
    }
    return item.dados;
  } catch (e) {
    return null;
  }
}

function limparCacheTurmas(escola = null) {
  if (escola) {
    const chave = `cache_turmas_${escola}`;
    localStorage.removeItem(chave);
  } else {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_turmas_')) localStorage.removeItem(key);
    });
  }
}

function getChaveTurmasCache(escola) {
  return `cache_turmas_${escola || 'todas'}`;
}

// ------ TOAST NOTIFICATIONS ------
function mostrarToast(mensagem, tipo = 'info', duracao = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  let icone = '';
  switch (tipo) {
    case 'success': icone = '<i class="fas fa-check-circle"></i>'; break;
    case 'error': icone = '<i class="fas fa-exclamation-circle"></i>'; break;
    case 'warning': icone = '<i class="fas fa-exclamation-triangle"></i>'; break;
    default: icone = '<i class="fas fa-info-circle"></i>';
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    ${icone}
    <div class="toast-content">${mensagem}</div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  });

  const duracaoReal = (duracao !== undefined) ? duracao : 4000;

  if (duracaoReal > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, duracaoReal);
  }
}
// ------ LOADING SCREEN ------
function mostrarLoading() {
  document.getElementById("loading").style.display = "flex";
}

function esconderLoading() {
  document.getElementById("loading").style.display = "none";
}

// ------ LOADING NOS BOTÕES ------
function showButtonLoading(btn) {
  if (!btn) return;
  if (!btn.hasAttribute('data-original-html')) {
    btn.setAttribute('data-original-html', btn.innerHTML);
  }
  btn.disabled = true;
  const textSpan = btn.querySelector('.btn-text');
  const iconElement = btn.querySelector('i');
  const iconClass = iconElement ? iconElement.className : '';
  const spinner = document.createElement('span');
  spinner.className = 'spinner-btn';
  spinner.style.display = 'inline-block';
  if (textSpan) {
    textSpan.style.display = 'none';
    btn.appendChild(spinner);
  } else {
    btn.innerHTML = '';
    if (iconElement) {
      const newIcon = document.createElement('i');
      newIcon.className = iconClass;
      btn.appendChild(newIcon);
    }
    btn.appendChild(spinner);
  }
}

function hideButtonLoading(btn) {
  if (!btn) return;
  const originalHTML = btn.getAttribute('data-original-html');
  if (originalHTML) {
    btn.innerHTML = originalHTML;
    btn.removeAttribute('data-original-html');
  }
  btn.disabled = false;
}

// ------ DEBOUNCE (para campos de busca) ------
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ------ NORMALIZAR TEXTO ------
function normalizarTexto(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

// ------ MÁSCARAS ------
function aplicarMascaraCPF(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 11) valor = valor.slice(0, 11);
  if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else if (valor.length > 3) {
    valor = valor.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
  }
  input.value = valor;
}

function aplicarMascaraTelefone(event) {
  let valor = event.target.value.replace(/\D/g, '');
  if (valor.length > 11) valor = valor.slice(0, 11);
  if (valor.length > 10) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d*)/, '($1');
  }
  event.target.value = valor;
}

function extrairPrimeiroTelefone(telefones) {
  if (!telefones) return '';
  const match = telefones.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
  return match ? match[0] : telefones.split(/[e\s]+/)[0];
}

// ------ STATUS DE ÍCONES DE DOCUMENTOS ------
function getDocIconStatus(entregue, prazoFinal, nomeDoc) {
  let statusTexto;
  if (entregue) {
    statusTexto = '✓ Entregue';
  } else {
    if (prazoFinal) {
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      const prazo = new Date(prazoFinal);
      prazo.setHours(0,0,0,0);
      if (prazo < hoje) {
        statusTexto = '✗ Vencido';
      } else {
        statusTexto = '⏳ Pendente';
      }
    } else {
      statusTexto = '⏳ Pendente';
    }
  }
  return {
    classe: entregue ? 'entregue' : (statusTexto.includes('Vencido') ? 'vencido' : 'pendente'),
    tooltip: `${nomeDoc}\n${statusTexto}`
  };
}

// ------ ESCOLAS PERMITIDAS (baseado no perfil logado) ------
function getEscolasPermitidas() {
  // perfilUsuario e emailUsuario são globais definidos após login
  if (typeof perfilUsuario !== 'undefined' && perfilUsuario === 'SUPERVISOR' && emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') {
    return window.escolasSupervisionadas || [];
  }
  return LISTA_ESCOLAS;
}

function aplicarMascaraData(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 8) valor = valor.slice(0, 8); // DDMMAAAA
  let resultado = '';
  if (valor.length > 0) resultado = valor.substring(0, 2);
  if (valor.length > 2) resultado += '/' + valor.substring(2, 4);
  if (valor.length > 4) resultado += '/' + valor.substring(4, 8);
  input.value = resultado;
}

function aplicarMascaraHora(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 4) valor = valor.slice(0, 4); // HHMM
  let resultado = '';
  if (valor.length > 0) resultado = valor.substring(0, 2);
  if (valor.length > 2) resultado += ':' + valor.substring(2, 4);
  input.value = resultado;
}
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, ''); // remove caracteres não numéricos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}
