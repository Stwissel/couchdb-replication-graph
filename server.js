import express from 'express';
import ViteExpress from 'vite-express';
import bodyParser from 'body-parser';
import fs from 'fs';

const saveServers = (srv) => {
  fs.writeFileSync('servers.json', JSON.stringify(srv, null, 2));
};

const loadServers = () => {
  if (fs.existsSync('servers.json')) {
    return JSON.parse(fs.readFileSync('servers.json', 'utf8'));
  }
  return {};
};

const fetchAllReplicators = (knownServers) =>
  new Promise((resolve, reject) => {
    const suffix = '/_replicator/_all_docs?include_docs=true';
    const allServerPromises = [];

    // Go and fetch replication from all servers
    for (const key of Object.keys(servers)) {
      const srv = servers[key];
      const options = {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'error',
        headers: {
          Authorization: getAuthorization(srv)
        }
      };
      const target = srv.url + suffix;
      const p = fetch(target, options).then((response) => response.json());
      allServerPromises.push(p);
    }
    processReplicatorResults(allServerPromises, resolve, reject);
  });

const processReplicatorResults = (allServerPromises, resolve, reject) => {
  // Process the results
  let result = [];
  Promise.allSettled(allServerPromises)
    .then((results) => {
      results.forEach((p) => {
        if (p.status === 'fulfilled') {
          // We got data
          const rows = p.value.rows;
          if (rows) {
            for (const row of rows) {
              if (row.doc.source) {
                let resultRow = {
                  source: row.doc.source.url,
                  target: row.doc.target.url
                };
                result.push(resultRow);
              }
            }
          }
        } else {
          // Something didn't add up
          console.error(p);
        }
      });
      resolve(result);
    })
    .catch((e) => reject(e));
};

// Basic or Bearer Auth
const getAuthorization = (srv) => {
  if (srv.auth) {
    return `Bearer ${srv.auth}`;
  }
  let basic = Buffer.from(`${srv.user}:${srv.pwd}`);
  return `Basic ${basic.toString('base64')}`;
};

const servers = loadServers();
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/api/data', (_req, res) => {
  fetchAllReplicators(servers)
    .then((json) => res.json(json))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
});

app.post('/api/server', (req, res) => {
  let body = req.body;
  if (body.url) {
    servers[body.url] = body;
    saveServers(servers);
  }
  res.json(servers);
});

app.get('/api/server', (_req, res) => {
  res.json(servers);
});

// Run the server
ViteExpress.listen(app, 3000, () => {
  console.log('Server up and running on 3000');
});
