# CouchDB replication graph experiments

The application consists of two parts: a server, mostly to avoid CORS onfiguration and a client rendering the actual UI.

## Configuration

Use the `Add CouchDB` button to add a server. They will be persisted
in `server.json` for reuse.

## Running it

```bash
git clone git@github.com:Stwissel/couchdb-replication-graph.git
cd couchdb-replication-graph
npm install
npm run build
npm run server
```

Open [localhost:3000](http://localhost:3000) in your browser

## Feedback

Use [GitHub Issues](https://github.com/Stwissel/couchdb-replication-graph/issues)
