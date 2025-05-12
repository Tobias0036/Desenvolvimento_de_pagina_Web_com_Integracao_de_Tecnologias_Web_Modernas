require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const routes = require('./routes');
const { v4: uuidv4 } = require('uuid');

const PORTA = process.env.PORT || 3000;
const clientes = [];
let responsavelWs = null;
const ADMIN_PASSWORD = 'admin123'; // Senha fixa para o Responsável

const servidor = http.createServer((req, res) => {
<<<<<<< HEAD
  routes(req, res, clientes);
=======
  routes(req, res, clientes); // Passa clientes para routes
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b
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

function atualizarResponsavel() {
  if (responsavelWs && responsavelWs.readyState === WebSocket.OPEN) {
    const usuarios = clientes.map(c => ({
      id: c.id,
      nome: c.nome,
      status: c.estadoCliente.comResponsavel ? 'Aguardando Responsável' : 'Online'
    }));
    responsavelWs.send(JSON.stringify({ tipo: 'usuarios_online', usuarios }));
  }
}

function transmitirMensagem(remetente, mensagem) {
  clientes.forEach(cliente => {
<<<<<<< HEAD
    if (cliente !== remetente && !cliente.estadoCliente.comResponsavel && cliente.readyState === WebSocket.OPEN) {
=======
    if (cliente !== remetente && cliente.readyState === WebSocket.OPEN) {
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b
      cliente.send(JSON.stringify({ tipo: 'outro', mensagem: `${remetente.nome}: ${mensagem}` }));
    }
  });
}

wss.on('connection', ws => {
<<<<<<< HEAD
  if (clientes.length >= 20 && !ws.isAdmin) {
=======
  if (clientes.length >= 20) {
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b
    ws.send(JSON.stringify({ tipo: 'sistema', mensagem: 'O chat atingiu o limite de 20 utilizadores.' }));
    ws.close();
    return;
  }

<<<<<<< HEAD
  const estadoCliente = { contadorPerguntas: 0, comResponsavel: false };
  ws.id = uuidv4();
  ws.nome = 'Anónimo';
  ws.estadoCliente = estadoCliente;
=======
  const estadoCliente = { contadorPerguntas: 0 };
  ws.nome = 'Anónimo'; // Nome padrão até ser definido
  clientes.push(ws);
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b

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
<<<<<<< HEAD
      clientes.push(ws);
      ws.send(JSON.stringify({ tipo: 'sistema', mensagem: `Bem-vindo, ${ws.nome}! Ligado ao servidor de chat.` }));
      salvarMensagem(ws.nome, 'Entrou no chat');
      if (responsavelWs && responsavelWs.readyState === WebSocket.OPEN) {
        responsavelWs.send(JSON.stringify({ tipo: 'historico', mensagem: `${ws.nome} entrou` }));
      }
      atualizarResponsavel();
    } else if (mensagem.type === 'setAdmin') {
      if (mensagem.name === 'Responsavel' && mensagem.password === ADMIN_PASSWORD) {
        ws.isAdmin = true;
        responsavelWs = ws;
        ws.nome = 'Responsável';
        ws.send(JSON.stringify({ tipo: 'admin_login_success', mensagem: 'Login bem-sucedido.' }));
        atualizarResponsavel();
        salvarMensagem(ws.nome, 'Entrou como Responsável');
      } else {
        ws.send(JSON.stringify({ tipo: 'admin_login_error', mensagem: 'Nome ou senha inválidos.' }));
        ws.close();
      }
=======
      ws.send(JSON.stringify({ tipo: 'sistema', mensagem: `Bem-vindo, ${ws.nome}! Ligado ao servidor de chat.` }));
      salvarMensagem(ws.nome, 'Entrou no chat');
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b
    } else if (mensagem.type === 'message') {
      const msg = mensagem.mensagem;
      console.log(`Mensagem recebida de ${ws.nome}: ${msg}`);
      salvarMensagem(ws.nome, msg);

<<<<<<< HEAD
      if (estadoCliente.comResponsavel && responsavelWs && responsavelWs.readyState === WebSocket.OPEN) {
        responsavelWs.send(JSON.stringify({ tipo: 'mensagem_usuario', nome: ws.nome, mensagem: msg, userId: ws.id }));
      } else {
        const respostaBot = obterRespostaBot(msg, estadoCliente);
        if (respostaBot && estadoCliente.contadorPerguntas <= 6) {
          ws.send(JSON.stringify({ tipo: 'bot', mensagem: `Bot: ${respostaBot}` }));
          if (estadoCliente.contadorPerguntas === 6) {
            ws.send(JSON.stringify({ tipo: 'sistema', mensagem: 'Conversa com bot esgotada, agora fale com o responsável' }));
            estadoCliente.comResponsavel = true;
            atualizarResponsavel();
            if (responsavelWs && responsavelWs.readyState === WebSocket.OPEN) {
              responsavelWs.send(JSON.stringify({ tipo: 'mensagem_usuario', nome: ws.nome, mensagem: 'Aguardando sua resposta', userId: ws.id }));
            } else {
              ws.send(JSON.stringify({ tipo: 'sistema', mensagem: 'Responsável não está disponível no momento.' }));
            }
          }
        } else {
          transmitirMensagem(ws, msg);
        }
      }
    } else if (mensagem.type === 'mensagem_responsavel' && ws.isAdmin) {
      const userId = mensagem.userId;
      const cliente = clientes.find(c => c.id === userId);
      if (cliente && cliente.readyState === WebSocket.OPEN) {
        cliente.send(JSON.stringify({ tipo: 'responsavel', mensagem: `Responsável: ${mensagem.mensagem}` }));
        salvarMensagem('Responsável', mensagem.mensagem);
=======
      const respostaBot = obterRespostaBot(msg, estadoCliente);
      if (respostaBot && estadoCliente.contadorPerguntas <= 6) {
        ws.send(JSON.stringify({ tipo: 'bot', mensagem: `Bot: ${respostaBot}` }));
      } else {
        transmitirMensagem(ws, msg);
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b
      }
    }
  });

  ws.on('close', () => {
<<<<<<< HEAD
    if (ws.isAdmin) {
      responsavelWs = null;
    } else {
      const indice = clientes.indexOf(ws);
      if (indice !== -1) {
        salvarMensagem(ws.nome, 'Saiu do chat');
        clientes.splice(indice, 1);
        if (responsavelWs && responsavelWs.readyState === WebSocket.OPEN) {
          responsavelWs.send(JSON.stringify({ tipo: 'historico', mensagem: `${ws.nome} saiu` }));
        }
        atualizarResponsavel();
      }
=======
    const indice = clientes.indexOf(ws);
    if (indice !== -1) {
      salvarMensagem(ws.nome, 'Saiu do chat');
      clientes.splice(indice, 1);
      console.log(`${ws.nome} saiu do chat.`);
>>>>>>> 5330c34ff4694caac77590f5ad53763c4f07140b
    }
  });

  ws.on('error', (error) => {
    console.error('Erro no WebSocket:', error);
  });
});

servidor.listen(PORTA, () => {
  console.log(`Servidor a correr na porta ${PORTA}`);
});