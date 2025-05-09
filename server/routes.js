const fs = require('fs');
const path = require('path');

const CAMINHO_PUBLICO = path.join(__dirname, '../public');
const CAMINHO_DB = path.join(__dirname, 'db.json');

let db = { perguntas: [], mensagens: [], orcamentos: [], metas: [], dicas: [] };
try {
  if (fs.existsSync(CAMINHO_DB)) {
    db = JSON.parse(fs.readFileSync(CAMINHO_DB));
  } else {
    db.perguntas = [
      { id: 1, pergunta: "o que é educação financeira?", resposta: "É o processo de aprender a gerir o dinheiro, incluindo poupança, investimentos e controlo de despesas." },
      { id: 2, pergunta: "como fazer um orçamento?", resposta: "Liste receitas e despesas, categorize-as e ajuste para gastar menos do que ganha." },
      { id: 3, pergunta: "o que é poupança?", resposta: "É guardar parte da renda para emergências ou objetivos futuros." },
      { id: 4, pergunta: "o que são investimentos?", resposta: "São aplicações de dinheiro em ativos, como ações, para gerar retorno financeiro." },
      { id: 5, pergunta: "como evitar dívidas?", resposta: "Gaste dentro do orçamento, use crédito com moderação e pague contas em dia." },
      { id: 6, pergunta: "o que é juro composto?", resposta: "É o juro calculado sobre o capital inicial e os juros acumulados, crescendo com o tempo." }
    ];
    db.dicas = [
      { id: 1, titulo: "Planeie seu orçamento", texto: "Defina metas claras e categorize suas despesas." },
      { id: 2, titulo: "Poupe regularmente", texto: "Guarde pelo menos 10% da sua renda mensal." }
    ];
    db.orcamentos = [];
    db.metas = [];
    db.mensagens = [];
    fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
  }
} catch (erro) {
  console.error('Erro ao carregar banco de dados:', erro);
}

function servirArquivo(req, res, caminho, tipoConteudo) {
  fs.readFile(caminho, (erro, dados) => {
    if (erro) {
      res.writeHead(500);
      res.end('Erro ao carregar o arquivo.');
    } else {
      res.writeHead(200, { 'Content-Type': tipoConteudo });
      res.end(dados);
    }
  });
}

function manipularAPI(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rota = url.pathname;

  if (rota === '/api/orcamentos' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.orcamentos));
  } else if (rota === '/api/orcamentos' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const orcamento = JSON.parse(body);
      const id = db.orcamentos.length ? db.orcamentos[db.orcamentos.length - 1].id + 1 : 1;
      orcamento.id = id;
      db.orcamentos.push(orcamento);
      fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
      res.writeHead(201);
      res.end();
    });
  } else if (rota.match(/\/api\/orcamentos\/\d+/) && req.method === 'PUT') {
    const id = parseInt(rota.split('/').pop());
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const orcamento = JSON.parse(body);
      const index = db.orcamentos.findIndex(o => o.id === id);
      if (index !== -1) {
        db.orcamentos[index] = { id, ...orcamento };
        fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
        res.writeHead(200);
      } else {
        res.writeHead(404);
      }
      res.end();
    });
  } else if (rota.match(/\/api\/orcamentos\/\d+/) && req.method === 'DELETE') {
    const id = parseInt(rota.split('/').pop());
    const index = db.orcamentos.findIndex(o => o.id === id);
    if (index !== -1) {
      db.orcamentos.splice(index, 1);
      fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
      res.writeHead(200);
    } else {
      res.writeHead(404);
    }
    res.end();
  } else if (rota === '/api/dicas' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.dicas));
  } else if (rota === '/api/metas' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const meta = JSON.parse(body);
      const id = db.metas.length ? db.metas[db.metas.length - 1].id + 1 : 1;
      meta.id = id;
      db.metas.push(meta);
      fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Meta salva com sucesso!' }));
    });
  } else {
    return false;
  }
  return true;
}

module.exports = (req, res) => {
  if (manipularAPI(req, res)) return;

  const url = req.url === '/' ? '/index.html' : req.url;
  const extensao = path.extname(url);
  const caminhoArquivo = path.join(CAMINHO_PUBLICO, url);

  if (extensao === '.html') {
    servirArquivo(req, res, caminhoArquivo, 'text/html');
  } else if (extensao === '.css') {
    servirArquivo(req, res, caminhoArquivo, 'text/css');
  } else {
    res.writeHead(404);
    res.end('Página não encontrada.');
  }
};