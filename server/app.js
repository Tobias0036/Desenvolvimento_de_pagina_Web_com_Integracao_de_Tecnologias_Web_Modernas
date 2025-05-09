require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const routes = require('./routes');

const PORTA = process.env.PORT || 3000;
const clientes = [];

const servidor = http.createServer((req, res) => {
  routes(req, res, clientes); // Passa clientes para routes
});

const wss = new WebSocket.Server({ server: servidor });

function salvarMensagem(nome, mensagem) {
  const fs = require('fs');
  const path = require('path');
  const CAMINHO_DB = path.join(__dirname, 'db.json');
  let db = JSON.parse(fs.readFileSync(CAMINHO_DB));
  db.mensagens.push({ nome, mensagem, data: new Date().toISOString() });
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
    return 'Olá! Bem-vindo ao chat de educação financeira. Faça uma pergunta ou conecte-se com outros utilizadores!';
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
      cliente.send(JSON.stringify({ tipo: 'outro', mensagem: `${remetente.nome}: ${mensagem}` }));
    }
  });
}

wss.on('connection', ws => {
  if (clientes.length >= 20) {
    ws.send(JSON.stringify({ tipo: 'sistema', mensagem: 'O chat atingiu o limite de 20 utilizadores.' }));
    ws.close();
    return;
  }

  const estadoCliente = { contadorPerguntas: 0 };
  ws.nome = 'Anónimo'; // Nome padrão até ser definido
  clientes.push(ws);

  ws.on('message', data => {
    let mensagem;
    try {
      mensagem = JSON.parse(data);
    } catch (e) {
      console.error('Erro ao parsear mensagem:', e);
      return;
    }

    if (mensagem.type === 'setName') {
      ws.nome = mensagem.name;
      ws.send(JSON.stringify({ tipo: 'sistema', mensagem: `Bem-vindo, ${ws.nome}! Ligado ao servidor de chat.` }));
      salvarMensagem(ws.nome, 'Entrou no chat');
    } else if (mensagem.type === 'message') {
      const msg = mensagem.mensagem;
      console.log(`Mensagem recebida de ${ws.nome}: ${msg}`);
      salvarMensagem(ws.nome, msg);

      const respostaBot = obterRespostaBot(msg, estadoCliente);
      if (respostaBot && estadoCliente.contadorPerguntas <= 6) {
        ws.send(JSON.stringify({ tipo: 'bot', mensagem: `Bot: ${respostaBot}` }));
      } else {
        transmitirMensagem(ws, msg);
      }
    }
  });

  ws.on('close', () => {
    const indice = clientes.indexOf(ws);
    if (indice !== -1) {
      salvarMensagem(ws.nome, 'Saiu do chat');
      clientes.splice(indice, 1);
      console.log(`${ws.nome} saiu do chat.`);
    }
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

servidor.listen(PORTA, () => {
  console.log(`Servidor a correr na porta ${PORTA}`);
});