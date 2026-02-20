/* eslint-env node */

const { configure } = require('quasar/wrappers');

module.exports = configure(function (/* ctx */) {
  return {
    eslint: {
      warnings: true,
      errors: true
    },
    boot: [
      'axios',
      'auth',
      'notify-defaults'
    ],
    css: [
      'app.scss',
      'dialogs.scss'
    ],
    extras: [
      'roboto-font',
      'material-icons',
    ],
    build: {
      target: {
        browser: [ 'es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1' ],
        node: 'node20'
      },
      vueRouterMode: 'history',
    },
    devServer: {
      port: 8080,
      open: false,
      host: '0.0.0.0', // Permite acesso externo (outros dispositivos na rede)
    },
    framework: {
      components: [],
      directives: [],
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage'
      ],
    },
    sourceFiles: {
      rootComponent: 'src/App.vue',
      router: 'src/router/index',
      store: 'src/stores/index',
      indexHtmlTemplate: 'src/index.template.html'
    },
  }
});
