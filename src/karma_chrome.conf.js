// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// Configuration use for test

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: [
      'jasmine',
      '@angular-devkit/build-angular'
    ],
    plugins: [
      'karma-jasmine',
      'karma-jasmine-html-reporter',
      'karma-coverage-istanbul-reporter',
      'karma-chrome-launcher',
      '@angular-devkit/build-angular/plugins/karma'
    ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      reports: [ 'text-summary', 'text', 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true,
      thresholds: {
        statements: 80,
        lines: 80,
        branches: 80,
        functions: 80
      }
    },
    angularCli: {
      environment: 'prod'
    },
    reporters: ['progress', 'coverage-istanbul', 'kjhtml', ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    // browsers: ['ChromeCanary'],
    singleRun: false
  });
};
