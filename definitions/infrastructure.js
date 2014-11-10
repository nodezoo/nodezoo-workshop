exports.root = {
  type: 'container'
};

exports.redis = {
  type: 'process',
  specific: {
    name: 'redis:2.8',
    execute: {
      args: '-d -p 6379:6379'
    }
  }
};

exports.elasticsearch = {
  type: 'process',
  specific: {
    name: 'dockerfile/elasticsearch',
    execute: {
      args: '-d -p 9200:9200 -p 9300:9300 -v /mnt/elasticsearch:/data',
      exec: '/elasticsearch/bin/elasticsearch --network.bind_host=0.0.0.0 --network.publish_host=__TARGETIP__'
    }
  }
};

