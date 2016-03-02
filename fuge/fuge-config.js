module.exports = {
  runDocker: false,
  proxy: 'docker',
  exclude: ['**/node_modules', '**/data', '**/.git', '**/CURRENT', '**/LOG*', '**/MANIFEST*', '**/*.ldb', '**/*.log'],
  tail: true,
  restartOnError: true,
  overrides: {
    msgstats: { 
      run: 'node system/msgstats.js' 
    },
    base: { 
      run: 'node system/base-node.js' 
    },
    github: { 
      run: 'node srv/github-dev.js --seneca.options.tag=github --seneca.options.debug.short_logs=true --seneca.log=type:act --seneca.options.plugin.github.token=`cat srv/.ignore-token`',
      build: 'sh build.sh' 
    },
    info: { 
      run: 'node srv/info-dev.js --seneca.options.tag=info --seneca.options.debug.short_logs=true --seneca.log=type:act', 
      build: 'sh build.sh' 
    },
    npmupdate: { 
      run: 'node srv/update-dev.js --seneca.options.tag=update --seneca.options.debug.short_logs=true --seneca.log=type:act',
      build: 'npm install' 
    },
    npm: { 
      run: 'node srv/npm-dev.js --seneca.options.tag=npm --seneca.options.debug.short_logs=true --seneca.log=type:act',
      build: 'npm install' 
    },
    search: { 
      run: 'node srv/search-dev.js --seneca.options.tag=search --seneca.options.debug.short_logs=true --seneca.log=type:act', 
      build: 'npm install' 
    },
    web: { 
      run: 'node srv/app-dev.js --seneca.options.tag=web --seneca.log=type:act --seneca.options.debug.short_logs=true', 
      build: 'npm install && bower install' 
    },
    travis: { 
      run: 'node srv/travis-dev.js --seneca.options.tag=travis --seneca.options.debug.short_logs=true --seneca.log=type:act',
      build: 'npm install' 
    }
  }
};

