exports.name = 'nodezoo';
exports.namespace = 'nodezoo';
exports.id = '3c1703f1-35bf-446c-875f-9bb50fc9302c';

exports.topology = {
  local: {
    root: ['elasticsearch', 'redis', 'nzinfo', 'nzindex', 'nzgithub', 'nznpm', 'nzweb']
    //root: ['es', 'redis', 'nzinfo', 'nzindex', 'nznpm', 'nzweb']
  }
};

