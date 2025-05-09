require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const routes = require('./routes');

const PORTA = process.env.PORT || 3000;
const clientes = [];

const servidor = http.createServer((req, res) => {
  routes(req, res);
});

const wss = new WebSocket.Server({ server: servidor });

function salvarMensagem(mensagem) {
  const fs = require('fs');
  const path = require('path');
  const CAMINHO_DB = path.join(__dirname, 'db.json');
  let db = JSON.parse(fs.readFileSync(CAMINHO_DB));
  db.mensagens.push(mensagem);
  fs.writeFileSync(CAMINHO_DB, JSON.stringify(db, null, 2));
}

function ehCumprimento(mensagem) {
  const cumprimentos = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'];
  return cumprimentos.some(c => mensagem.toLowerCase().includes(c));
}

function obterRespostaBot(mensagem, estadoCliente) {
  const fs = require('fs');
  const path = require('path');
  const CAMINHO_DB = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(CAMINHO_DB));

  if (ehCumprimento(mensagem)) {
    return 'Olá! Bem-vindo ao chat de educação financeira. Faça uma pergunta ou conecte-se com outro utilizador!';
  }
  if (estadoCliente.contadorPerguntas < 6) {
    const pergunta = db.perguntas.find(p => mensagem.toLowerCase().includes(p.pergunta.toLowerCase()));
    if (pergunta) {
      estadoCliente.contadorPerguntas++;
      return pergunta.resposta;
    }
  }
  return null;
}

function transmitirMensagem(remetente, mensagem) {
  clientes.forEach(cliente => {
    if (cliente !== remetente && cliente.readyState === WebSocket.OPEN) {
      cliente.send(`Outro utilizador: ${mensagem}`);
    }
  });
}

wss.on('connection', ws => {
  if (clientes.length >= 2) {
    ws.send('O chat já tem dois utilizadores conectados.');
    ws.close();
    return;
  }

  const estadoCliente = { contadorPerguntas: 0 };
  clientes.push(ws);
  ws.send('Ligado ao servidor de chat.');

  ws.on('message', mensagem => {
    const msg = mensagem.toString();
    console.log('Mensagem recebida:', msg);
    salvarMensagem({ utilizador: 'desconhecido', mensagem: msg, data: new Date().toISOString() });

    const respostaBot = obterRespostaBot(msg, estadoCliente);
    if (respostaBot && estadoCliente.contadorPerguntas <= 6) {
      ws.send(`Bot: ${respostaBot}`);
    } else {
      transmitirMensagem(ws, msg);
    }
  });

  ws.on('close', () => {
    const indice = clientes.indexOf(ws);
    if (indice !== -1) {
      clientes.splice(indice, 1);
      console.log('Um cliente saiu do chat.');
    }
  });
});

servidor.listen(PORTA, () => {
  console.log(`Servidor a correr na porta ${PORTA}`);
});