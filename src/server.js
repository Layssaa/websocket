const express = require("express");
const https = require("https");
const path = require("path");
const ws = require("ws");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const PORT = 3030;

const app = express();

// -----------------------------------------------------------------------
app.use(express.json());

const server = https.createServer({
  key: fs.readFileSync(path.join(__dirname, "certs", "selfkey.key")),
  cert: fs.readFileSync(path.join(__dirname, "certs", "selfCerts.crt")),
});

const wss = new ws.Server({ port: 5050 });

let chats = {
  games: [],
  movies: [],
};

let users = {
  0: "adm",
};

wss.on("open", function open() {
  ws.send(JSON.stringify({ users }));
});

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    const hour = new Date().toLocaleTimeString();

    const msg = {
      ...JSON.parse(data),
      hour,
    };

    if (!msg.id) {
      const id = uuidv4();
      msg.id = id;
      ws.id = id;
    }

    if (!users[msg.id]) {
      // id : nome
      users[msg.id] = msg.name;
    }

    if (!chats[msg.id]) {
      chats[msg.id] = [ws];
    }

    if (!chats[msg.roomHash]) {
      return ws.send(
        JSON.stringify({
          name: "server",
          msg: `Canal inválido.`,
          hour,
          users,
        })
      );
    }

    if (
      !chats[msg.roomHash].find((elem) => elem.id === msg.id) &&
      msg.event !== "private"
    ) {
      chats[msg.roomHash].push(ws);
    }

    chats[msg.roomHash].forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        if (msg.event == "connect") {
          return client.send(
            JSON.stringify({
              name: "server",
              msg: `${msg.name} acabou de entrar no canal`,
              hour,
              users,
              id: msg.id,
            })
          );
        }

        if (msg.event == "disconnect") {
          return client.send(
            JSON.stringify({
              name: "server",
              msg: `${users[msg.id]} saiu do canal`,
              hour,
            })
          );
        }

        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on("close", function close(data) {
    console.log("close");
    ws.on("message", function message(data) {
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === ws.OPEN) {
          const hour = new Date().toLocaleTimeString();

          client.send(
            JSON.stringify({
              name: "server",
              msg: `${users[ws.id]} acabou de sair da sala.`,
              hour,
            })
          );
        }
      });
    });
  });

  const hour = new Date().toLocaleTimeString();

  ws.send(
    JSON.stringify({
      name: "server",
      msg: `Você entrou no canal.`,
      hour,
      users,
    })
  );
});

wss.on("error", (error) => console.log((ws, error)));

// -----------------------------------------------------------------------
server.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
