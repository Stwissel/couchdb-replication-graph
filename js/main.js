import * as echarts from 'echarts';

let dialog;

const renderScope = {
  serverserver: false,
  dbserver: false,
  dbdb: false,
  server: false,
  db: false,
  sankey: true,
  sankeylink: true
};

// Render list of servers names
const renderServers = (servers) => {
  const serverList = document.getElementById('serverList');
  serverList.innerHTML = '';
  for (const key of Object.keys(servers)) {
    const url = new URL(servers[key].url);
    const li = document.createElement('li');
    li.textContent = url.hostname;
    serverList.appendChild(li);
  }
};

// Definition of node shapes
// For network diagram
const nodeTemplate = {
  server: {
    symbol: 'diamond',
    itemStyle: {
      color: '#FFCCCC'
    }
  },
  db: {
    symbol: 'circle',
    itemStyle: {
      color: '#CCCCFF'
    }
  }
};

// Style for edge for network diagram
const edgeTemplate = {
  serverserver: {
    label: {
      show: true
    },
    lineStyle: {
      color: 'green',
      width: 2
    }
  },
  dbdb: {
    label: {
      show: false
    },
    lineStyle: {
      color: 'red',
      with: 2
    }
  },
  dbserver: {
    label: {
      show: false
    },
    lineStyle: {
      color: 'gray',
      type: 'dashed'
    }
  }
};

// Show database addition dialogue
const dbDialogue = () => {
  dialog.showModal();
};

// Setup dialog with buttons
const prepareDialogue = () => {
  dialog = document.getElementById('dbDialog');
  const okBtn = document.getElementById('btnAdd');
  const cancelbtn = document.getElementById('btnCancel');

  cancelbtn.addEventListener('click', (event) => {
    event.preventDefault();
    dialog.close();
  });

  okBtn.addEventListener('click', (event) => {
    event.preventDefault();
    // Upadate server list on server
    let srv = {
      url: document.getElementById('url').value,
      user: document.getElementById('user').value,
      pwd: document.getElementById('pwd').value,
      auth: document.getElementById('auth').value
    };
    if (srv.url) {
      fetch('/api/server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(srv)
      })
        .then((resp) => resp.json())
        .then((resp) => renderServers(resp))
        .catch((err) => console.error(err));
    }
    dialog.close();
  });
};

const extractLink = (list, source, target, type) => {
  let key = source + '->' + target;
  let link = list[key] || {};
  link.count = link.count ? link.count + 1 : 1;
  link.type = type;
  link.source = source;
  link.target = target;
  link.id = key;
  list[key] = link;
};

const extractNode = (list, id, name) => {
  const key = id;
  const node = list[key] ?? {};
  node.id = id;
  node.type = 'sankey';
  node.name = name;
  list[key] = node;
};

const prepareData = (rawData) => {
  const knownServers = {};
  const knownLinks = {};
  const sourceData = [];
  const sourceLinks = [];

  for (let entry of rawData) {
    const source = new URL(entry.source);
    const target = new URL(entry.target);

    /*
    source host -> sourcedb -> targetdb -> target host
    */
    extractNode(
      knownServers,
      source.hostname + ' (s)',
      'Server ' + source.hostname
    );
    extractNode(
      knownServers,
      target.hostname + ' (t)',
      'Server ' + target.hostname
    );
    extractNode(
      knownServers,
      source.hostname + source.pathname + ' (sdb)',
      'DB ' + target.pathname
    );
    extractNode(
      knownServers,
      target.hostname + target.pathname + ' (tdb)',
      'DB ' + target.pathname
    );

    extractLink(
      knownLinks,
      source.hostname + ' (s)',
      source.hostname + source.pathname + ' (sdb)',
      'sankeylink'
    );

    extractLink(
      knownLinks,
      source.hostname + source.pathname + ' (sdb)',
      target.hostname + target.pathname + ' (tdb)',
      'sankeylink'
    );

    extractLink(
      knownLinks,
      target.hostname + target.pathname + ' (tdb)',
      target.hostname + ' (t)',
      'sankeylink'
    );
  }

  // Nodes
  for (let key of Object.keys(knownServers)) {
    let source = knownServers[key];
    let item = { ...nodeTemplate[source.type] };
    item.name = source.name;
    item.id = source.id;
    item.value = 10;
    item.label = {
      show: true,
      formatter: source.name
    };
    if (renderScope[source.type]) {
      sourceData.push(item);
    }
  }

  // Edges
  for (let key of Object.keys(knownLinks)) {
    let source = knownLinks[key];
    let item = { ...edgeTemplate[source.type] };
    let count = source.count;
    item.source = source.source;
    item.target = source.target;
    item.lineStyle = { ...item.lineStyle, width: Math.min(count, 10) };
    item.value = 10;
    if (item.lineStyle.width) {
      item.label = { ...item.label, formatter: `(${count})` };
    }
    if (renderScope[source.type]) {
      sourceLinks.push(item);
    }
  }
  return {
    type: 'sankey',
    data: sourceData,
    links: sourceLinks,
    emphasis: {
      focus: 'adjacency'
    },
    lineStyle: {
      color: 'gradient',
      curveness: 0.2
    }
  };
};

// Create the echarts instance
const createOption = (series) => {
  return {
    title: {
      text: 'CouchDB replications'
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mouseover'
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [series]
  };
};

const makeChart = (option) => {
  const doc = document.getElementById('main');
  doc.innerHTML = '';
  const couchChart = echarts.init(doc);
  couchChart.setOption(option);
};

const updateRawData = () => {
  return fetch('/api/data').then((resp) => resp.json());
};

const serverlist = () =>
  fetch('/api/server')
    .then((res) => res.json())
    .then((json) => renderServers(json))
    .catch((err) => console.error(err));

const bootstrap = () => {
  const btnRender = document.getElementById('renderBtn');
  btnRender.addEventListener('click', (event) => {
    event.preventDefault();
    btnRender.style.display = 'none';
    updateRawData()
      .then((json) => prepareData(json))
      .then((data) => createOption(data))
      .then((opt) => makeChart(opt))
      .catch((err) => console.error(err));
  });

  const btnDb = document.getElementById('dbBtn');
  btnDb.addEventListener('click', (event) => {
    event.preventDefault();
    dbDialogue();
  });

  const btnReset = document.getElementById('resetBtn');
  btnReset.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.reload();
  });
  serverlist();
  prepareDialogue();
  console.log('Ready to rumble');
};

if (document.readyState != 'loading') {
  bootstrap();
} else {
  document.addEventListener('load', bootstrap);
}
