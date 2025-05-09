const fs = require('fs');
const path = require('path');
const CAMINHO_DB = path.join(__dirname, 'db.json');

function routes(req, res, clientes) {
  let db = JSON.parse(fs.readFileSync(CAMINHO_DB));
  const { url, method } = req;
  let body = '';

  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (url === '/api/dicas' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.dicas));
    } else if (url === '/api/metas' && method === 'POST') {
      const meta = JSON.parse(body);
      meta.id = db.metas.length ? db.metas[db.metas.length - 1].id + 1 : 1;
      db.metas.push(meta);
      fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Meta adicionada com sucesso!' }));
    } else if (url === '/api/orcamentos' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.orcamentos));
    } else if (url === '/api/orcamentos' && method === 'POST') {
      const orcamento = JSON.parse(body);
      orcamento.id = db.orcamentos.length ? db.orcamentos[db.orcamentos.length - 1].id + 1 : 1;
      db.orcamentos.push(orcamento);
      fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
      // Notificar clientes via WebSocket
      clientes.forEach(cliente => {
        if (cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify({
            tipo: 'orcamento',
            orcamento: { id: orcamento.id, categoria: orcamento.categoria, valor: orcamento.valor }
          }));
        }
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Orçamento adicionado com sucesso!' }));
    } else if (url.match(/\/api\/orcamentos\/\d+/) && method === 'PUT') {
      const id = parseInt(url.split('/')[3]);
      const orcamento = JSON.parse(body);
      const index = db.orcamentos.findIndex(o => o.id === id);
      if (index !== -1) {
        db.orcamentos[index] = { id, ...orcamento };
        fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Orçamento atualizado com sucesso!' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Orçamento não encontrado!' }));
      }
    } else if (url.match(/\/api\/orcamentos\/\d+/) && method === 'DELETE') {
      const id = parseInt(url.split('/')[3]);
      const index = db.orcamentos.findIndex(o => o.id === id);
      if (index !== -1) {
        db.orcamentos.splice(index, 1);
        fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Orçamento deletado com sucesso!' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Orçamento não encontrado!' }));
      }
    } else if (url === '/' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(path.join(__dirname, '../public/index.html')));
    } else if (url.match(/\.html$/) && method === 'GET') {
      const filePath = path.join(__dirname, '../public', url);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(filePath));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Página não encontrada!');
      }
    } else if (url.match(/\.css$/) && method === 'GET') {
      const filePath = path.join(__dirname, '../public', url);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(fs.readFileSync(filePath));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Arquivo não encontrado!');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Rota não encontrada!');
    }
  });
}

module.exports = routes;