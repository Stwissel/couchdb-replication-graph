/**
 * Functions not in use, later maybe
 */

const extractServerNode = (list, source) => {
  const key = source.hostname;
  const node = list[key] ?? {};
  node.type = 'server';
  node.id = source.hostname;
  node.name = source.hostname;
  list[key] = node;
};

const extractDbNode = (list, source) => {
  const key = source;
  const node = list[key] ?? {};
  node.id = 'db' + source;
  node.type = 'db';
  node.name = source.hostname + '\n' + source.pathname;
  list[key] = node;
};

const extractServer2ServerLink = (list, source, target) => {
  extractLink(list, source.hostname, target.hostname, 'serverserver');
};

const extractDb2ServerLink = (list, source, target) => {
  extractLink(list, source.hostname, 'db' + source, 'dbserver');
  if (target) {
    extractLink(list, 'db' + source, target.hostname + '(t)', 'dbserver');
  }
};

const extractDb2DbLink = (list, source, target) => {
  extractLink(list, 'db' + source, 'db' + target, 'dbdb');
};
