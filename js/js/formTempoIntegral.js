// js/formTempoIntegral.js

// Definição de todas as perguntas (44 principais + subperguntas condicionais)
const perguntasTI = [
  {
    id: 'Q1', texto: '1) Toda a comunidade escolar já passou pelo Acolhimento Inicial?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q1_1',
      texto: '1.1 Se parcialmente consolidado, qual(is) públicos(s) não foi(foram) acolhidos (pode assinalar mais de uma opção)?',
      tipo: 'checkbox',
      opcoes: ['Estudantes', 'Equipe escolar', 'Pais/Responsáveis']
    }
  },
  {
    id: 'Q2', texto: '2) O Acolhimento Diário é realizado por, ao menos, um membro da equipe gestora?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q3', texto: '3) A Equipe de Jovens Protagonistas é envolvida em momentos de acolhimento diário, quando necessário?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q4', texto: '4) Os profissionais ingressantes no Tempo Integral participaram ou estão participando da Formação Inicial do Modelo Pedagógico (FIMPETI)?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado', 'Não se aplica']
  },
  {
    id: 'Q5', texto: '5) O(A) CP está executando o Guia de Reuniões Formativas?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q6', texto: '6) A equipe escolar realizou momentos formativos para estudo e apropriação das Diretrizes Pedagógicas e Operacionais?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q7', texto: '7) Além das formações continuadas, acontecem momentos de orientações acerca das dúvidas dos docentes?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q8', texto: '8) As reuniões de fluxo estão acontecendo conforme previstas nas Diretrizes Operacionais?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q9', texto: '9) A agenda da escola foi construída com apoio das lideranças (Equipe de Jovens Protagonistas, Líderes de Turmas, etc.)?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q10', texto: '10) O instrumento de Observação de Aula do Tempo Integral foi construído pelo(a) CP, Pedagogo(a) e PCAs e validado pelos professores?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q10_1',
      texto: '10.1 Se parcialmente consolidado, o instrumento foi construído:',
      tipo: 'radio',
      opcoes: [
        'Pelos CP, Pedagogo e PCAs, mas não validado pelos professores',
        'Somente pelo CP e pedagogo, mas não validado pelos professores',
        'Somente pelo CP, mas não validado pelos professores',
        'Somente pelo Pedagogo, mas não validado pelos professores'
      ]
    }
  },
  {
    id: 'Q11', texto: '11) Os(As) PCAs acompanham e avaliam as aulas da BNCC, realizando registros e devolutivas?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q11_1',
      texto: '11.1 Em relação ao acompanhamento das aulas da BNCC, os(as) PCAs:',
      tipo: 'radio',
      opcoes: [
        'acompanham e avaliam eventualmente',
        'acompanham, mas não avaliam',
        'acompanham, avaliam, mas não realizam as devolutivas',
        'acompanham, avaliam, mas realizam eventualmente as devolutivas'
      ]
    }
  },
  {
    id: 'Q12', texto: '12) O(A) CP acompanha e avalia as aulas dos(as) PCAs, realizando registros e devolutivas?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q12_1',
      texto: '12.1 Em relação ao acompanhamento das aulas da BNCC, o(a) CP:',
      tipo: 'radio',
      opcoes: [
        'acompanha e avalia eventualmente',
        'acompanha, mas não avalia',
        'acompanha, avalia, mas não realiza as devolutivas',
        'acompanha, avalia, mas realiza as devolutivas eventualmente'
      ]
    }
  },
  {
    id: 'Q13', texto: '13) O(A) pedagogo(a) acompanha e avalia as aulas dos Componentes Integradores/Parte Diversificada?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q13_1',
      texto: '13.1 Em relação ao acompanhamento, o(a) pedagogo(a):',
      tipo: 'radio',
      opcoes: [
        'acompanha e avalia eventualmente',
        'acompanha, mas não avalia',
        'acompanha, avalia, mas não realiza as devolutivas',
        'acompanha, avalia, mas realiza as devolutivas eventualmente'
      ]
    }
  },
  {
    id: 'Q14', texto: '14) Os(as) estudantes avaliam, trimestralmente, as aulas de cada componente curricular?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q14_1',
      texto: '14.1 Se parcialmente consolidado, os estudantes:',
      tipo: 'radio',
      opcoes: [
        'Não avaliam as aulas',
        'Avaliam esporadicamente as aulas'
      ]
    }
  },
  {
    id: 'Q15', texto: '15) A escola realiza o compartilhamento de práticas exitosas das metodologias ativas nas reuniões gerais?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q16', texto: '16) A escola realiza o monitoramento de frequência dos(as) estudantes, análise dos motivos das faltas e pedidos de transferência?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q16_1',
      texto: '16.1 Se parcialmente consolidado, a escola:',
      tipo: 'radio',
      opcoes: [
        'esporadicamente o monitoramento da frequência e motivos',
        'realiza o monitoramento da frequência, mas não os motivos',
        'realiza o monitoramento da frequência e motivos, mas não pedidos de saída'
      ]
    }
  },
  {
    id: 'Q17', texto: '17) Os planos de ensino foram construídos pelos(as) professores(as) considerando a participação dos(as) estudantes?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q18', texto: '18) Os Planos de Ensino foram publicizados e os(as) professores/as e os(as) estudantes realizam o seu monitoramento?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q19', texto: '19) Existem contratos de convivência nos ambientes de aprendizagem?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q20', texto: '20) Os(as) estudantes criam os Clubes de Protagonismo no componente Práticas e Vivências em Protagonismo?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado', 'Não se aplica']
  },
  {
    id: 'Q21', texto: '21) Os(as) estudantes têm acesso a todos os ambientes de aprendizagem?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q22', texto: '22) É destinado momento para escolha de Eletivas, Clubes e tutores considerando o protagonismo estudantil?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado'],
    sub: {
      condicao: 'Parcialmente consolidado',
      id: 'Q22_1',
      texto: '22.1 Se parcialmente consolidado, o processo de escolha ocorre (pode assinalar mais de uma):',
      tipo: 'checkbox',
      opcoes: [
        'sem considerar o protagonismo estudantil nas Eletivas',
        'sem calendário pré-estabelecido nas Eletivas',
        'sem considerar o protagonismo estudantil na escolha de Tutores',
        'sem calendário pré-estabelecido na escolha de Tutores',
        'sem considerar o protagonismo estudantil na escolha dos Clubes',
        'sem calendário pré-estabelecido na escolha dos Clubes'
      ]
    }
  },
  {
    id: 'Q23', texto: '23) É destinado momento para instituir e recompor a Equipe de Jovens Protagonistas?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q24', texto: '24) A Equipe de Jovens Protagonistas atua em outras ações da escola, além do acolhimento?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q25', texto: '25) Há alinhamento entre a Formação Geral Básica e os Componentes Integradores?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q26', texto: '26) Os sonhos e o projeto de vida dos(as) estudantes são utilizados para estruturar as aulas de PV, Eletivas, Tutoria?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q27', texto: '27) Os(As) estudantes avaliam mensalmente as aulas de Projeto de Vida?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q28', texto: '28) A escola possui e executa o cronograma de Tutoria Coletiva?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q29', texto: '29) A tutoria coletiva possui pauta previamente planejada e alinhada pela equipe escolar?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q30', texto: '30) Os(As) tutores(as) atuam para a redução do abandono e da evasão escolar?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q31', texto: '31) Pensamento Científico e Práticas Experimentais empregam metodologias ativas e ambientes diversificados?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado', 'Não se aplica']
  },
  {
    id: 'Q32', texto: '32) As Eletivas ofertadas pela escola são propostas inovadoras e diversificadas?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q33', texto: '33) Em geral, as aulas de Estudo Orientado têm como objetivo desenvolver o autodidatismo dos(as) estudantes?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado', 'Não se aplica']
  },
  {
    id: 'Q34', texto: '34) (ESCOLAS DO CAMPO) A execução do modelo pedagógico está integrada às especificidades da Educação do Campo?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado', 'Não se aplica']
  },
  {
    id: 'Q35', texto: '35) (ESCOLAS DO CAMPO) O componente curricular Projeto de Vida (PV) está contextualizado com a realidade do campo?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado', 'Não se aplica']
  },
  {
    id: 'Q36', texto: '36) A escola tem proporcionado espaços para a participação dos pais/responsáveis e da comunidade?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q37', texto: '37) Nas reuniões de pais/responsáveis e no acolhimento, pelo menos 60% dos pais/responsáveis participam?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q38', texto: '38) A escola tem um plano de captação de matrículas e fidelização dos(as) estudantes no Tempo Integral?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q39', texto: '39) A escola realiza os momentos de entrada, saída e intervalo sem utilizar o sinal sonoro?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q40', texto: '40) A escola está organizada em salas temáticas por componente curricular ou por área de conhecimento?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q41', texto: '41) Os(as) professores(as) realizam as suas aulas considerando outros ambientes de aprendizagem?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q42', texto: '42) Há identificação visual nos espaços/ambientes escolares com os princípios do Tempo Integral?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q43', texto: '43) A organização das cadeiras nas salas de aula favorece a interação entre os(as) estudantes?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  },
  {
    id: 'Q44', texto: '44) A escola organiza o rodízio de turmas para permitir o deslocamento dos estudantes de um ambiente para o outro?',
    tipo: 'radio', opcoes: ['Consolidado', 'Parcialmente consolidado', 'Não consolidado']
  }
];

// =========================
// GERAÇÃO DO FORMULÁRIO
// =========================

function abrirModalFormTI() {
  if (perfilUsuario !== 'SECRETARIA' && perfilUsuario !== 'SUPERVISOR') {
    mostrarToast('Acesso restrito a secretários e supervisores.', 'error');
    return;
  }
  document.getElementById('modalFormTI').style.display = 'flex';
  gerarFormularioTI();
}

function fecharModalFormTI() {
  document.getElementById('modalFormTI').style.display = 'none';
}

function gerarFormularioTI() {
  const container = document.getElementById('formTIBody');
  let html = '<div style="display:flex; flex-direction:column; gap:20px;">';
  
  perguntasTI.forEach(p => {
    html += `<div class="pergunta-ti" id="pergunta_${p.id}">
      <p style="font-weight:600; margin:0 0 8px;">${p.texto}</p>`;
    
    if (p.tipo === 'radio') {
      p.opcoes.forEach(op => {
        html += `<label style="display:block; margin-bottom:4px;">
          <input type="radio" name="${p.id}" value="${op}" onchange="verificarSub(${p.id})"> ${op}
        </label>`;
      });
    } else if (p.tipo === 'checkbox') {
      p.opcoes.forEach(op => {
        html += `<label style="display:block; margin-bottom:4px;">
          <input type="checkbox" name="${p.id}" value="${op}"> ${op}
        </label>`;
      });
    }
    
    html += `</div>`;
    
    // Subpergunta (inicialmente oculta)
    if (p.sub) {
      html += `<div id="sub_${p.id}" style="display:none; margin-left:20px; padding-left:10px; border-left:2px solid #ccc;">
        <p style="font-weight:500;">${p.sub.texto}</p>`;
      if (p.sub.tipo === 'radio') {
        p.sub.opcoes.forEach(op => {
          html += `<label style="display:block; margin-bottom:4px;">
            <input type="radio" name="${p.sub.id}" value="${op}"> ${op}
          </label>`;
        });
      } else if (p.sub.tipo === 'checkbox') {
        p.sub.opcoes.forEach(op => {
          html += `<label style="display:block; margin-bottom:4px;">
            <input type="checkbox" name="${p.sub.id}" value="${op}"> ${op}
          </label>`;
        });
      }
      html += `</div>`;
    }
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function verificarSub(idPai) {
  const pergunta = perguntasTI.find(p => p.id === `Q${idPai}`);
  if (!pergunta || !pergunta.sub) return;
  
  const valorSelecionado = document.querySelector(`input[name="Q${idPai}"]:checked`)?.value;
  const subDiv = document.getElementById(`sub_Q${idPai}`);
  if (subDiv) {
    subDiv.style.display = (valorSelecionado === pergunta.sub.condicao) ? 'block' : 'none';
  }
}

// =========================
// SALVAR
// =========================

function salvarFormTI() {
  const respostas = {};
  
  perguntasTI.forEach(p => {
    if (p.tipo === 'radio') {
      const selecionado = document.querySelector(`input[name="${p.id}"]:checked`);
      if (selecionado) respostas[p.id] = selecionado.value;
    } else if (p.tipo === 'checkbox') {
      const selecionados = document.querySelectorAll(`input[name="${p.id}"]:checked`);
      if (selecionados.length > 0) {
        respostas[p.id] = Array.from(selecionados).map(el => el.value);
      }
    }
    
    // Subpergunta
    if (p.sub) {
      if (p.sub.tipo === 'radio') {
        const selecionado = document.querySelector(`input[name="${p.sub.id}"]:checked`);
        if (selecionado) respostas[p.sub.id] = selecionado.value;
      } else if (p.sub.tipo === 'checkbox') {
        const selecionados = document.querySelectorAll(`input[name="${p.sub.id}"]:checked`);
        if (selecionados.length > 0) {
          respostas[p.sub.id] = Array.from(selecionados).map(el => el.value);
        }
      }
    }
  });

  if (Object.keys(respostas).length === 0) {
    mostrarToast('Responda pelo menos uma pergunta.', 'warning');
    return;
  }

  const btn = document.querySelector('#modalFormTI .btn-salvar');
  showButtonLoading(btn);

  postSemResposta({
    acao: 'salvarRespostasTI',
    email: emailUsuario,
    respostas: respostas
  }, 'Respostas salvas com sucesso!', () => {
    hideButtonLoading(btn);
    fecharModalFormTI();
  });
}

// =========================
// VISUALIZAÇÃO SUPERVISOR
// =========================

function abrirModalRespostasTI() {
  if (perfilUsuario !== 'SUPERVISOR') {
    mostrarToast('Apenas supervisores podem visualizar.', 'error');
    return;
  }
  document.getElementById('modalRespostasTI').style.display = 'flex';
  carregarEscolasNoFiltroTI();
  carregarRespostasTI();
}

function fecharModalRespostasTI() {
  document.getElementById('modalRespostasTI').style.display = 'none';
}

function carregarEscolasNoFiltroTI() {
  const select = document.getElementById('filtroEscolaTI');
  select.innerHTML = '<option value="">Todas as escolas</option>';
  const escolas = getEscolasPermitidas();
  escolas.forEach(e => select.appendChild(new Option(e, e)));
}

function carregarRespostasTI() {
  const escola = document.getElementById('filtroEscolaTI')?.value || '';
  mostrarLoading();
  jsonp(`${API_URL}?tipo=respostasTI&email=${encodeURIComponent(emailUsuario)}`, function(respostas) {
    esconderLoading();
    if (escola) {
      respostas = respostas.filter(r => normalizar(r.ESCOLA) === normalizar(escola));
    }
    renderizarRespostasTI(respostas);
  });
}

function renderizarRespostasTI(respostas) {
  const container = document.getElementById('listaRespostasTI');
  if (!respostas || respostas.length === 0) {
    container.innerHTML = '<p>Nenhuma resposta encontrada.</p>';
    return;
  }

  const coresStatus = {
    'Consolidado': '#10b981',
    'Parcialmente consolidado': '#f59e0b',
    'Não consolidado': '#ef4444',
    'Não se aplica': '#6b7280'
  };

  let html = '';
  respostas.forEach(r => {
    html += `<div style="border:1px solid var(--card-border); border-radius:12px; padding:16px; margin-bottom:12px; background:var(--card-bg);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <strong>${r.ESCOLA}</strong>
        <span style="font-size:12px; color:var(--text-muted);">${r.DATA_RESPOSTA ? new Date(r.DATA_RESPOSTA).toLocaleDateString('pt-BR') : ''}</span>
      </div>`;
    
    perguntasTI.forEach(p => {
      const valor = r[p.id];
      if (valor) {
        const cor = coresStatus[valor] || '#333';
        html += `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #eee;">
          <span style="font-size:13px;">${p.texto}</span>
          <span style="font-weight:500; color:${cor}; font-size:13px;">${valor}</span>
        </div>`;
      }
      if (p.sub && r[p.sub.id]) {
        html += `<div style="margin-left:16px; font-size:12px; color:#555;">↳ ${p.sub.texto}: <strong>${r[p.sub.id]}</strong></div>`;
      }
    });
    
    html += `</div>`;
  });
  
  container.innerHTML = html;
}
