exports.root = {
  type: 'blank-container'
};

exports.redis = {
  type: 'docker',
  specific: {
    name: 'redis:2.8',
    execute: {
      args: '-d -p 6379:6379'
    }
  }
};

exports.elasticsearch = {
  type: 'docker',
  specific: {
    name: 'dockerfile/elasticsearch',
    execute: {
      args: '-d -p 9200:9200 -p 9300:9300 -v /mnt/elasticsearch:/data',
      exec: '/elasticsearch/bin/elasticsearch --network.bind_host=0.0.0.0 --network.publish_host=__TARGETIP__'
    }
  }
};

exports.beanstalk = {
  type: 'docker',
  specific: {
    name: 'kdihalas/beanstalkd',
    execute: {
      args: '-d -p 1130:1130',
      exec: 'beanstalkd -p 1130'
    }
  }
};

