// js/loader.js – Carrega todos os scripts com a versão atual
(function() {
  const scripts = [
    'config.js',
    'utils.js',
    'data.js',
    'ui.js',
    'modals.js',
    'filtros.js',
    'main.js',
    'notificacoes.js',
    'perfil.js',
    'agenda.js',
    'dashboard.js',
    'log.js',
    'termo.js',
    'planotatico.js',
    'gerador-documentos.js',
    'dados-escolas.js',
    'monitoramento.js',
    'orgs-curriculares.js',
    'importar-profissionais.js',
    'importador.js',
    'profissionais.js'
  ];

  scripts.forEach(function(script) {
    document.write('<script src="js/' + script + '?v=' + APP_VERSION + '"><\/script>');
  });
})();
