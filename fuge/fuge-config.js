module.exports = {
  runDocker: false,
  proxy: 'docker',
  exclude: ['**/node_modules', '**/data', '**/.git', '**/CURRENT', '**/LOG*', '**/MANIFEST*', '**/*.ldb', '**/*.log'],
  tail: true,
  restartOnError: true,
  overrides: {
    github: { build: 'sh build.sh' },
    info: { build: 'sh build.sh' },
    npmupdate: { build: 'npm install' },
    npm: { build: 'npm install' },
    search: { build: 'npm install' },
    web: { build: 'npm install && bower install' }
  }
};

