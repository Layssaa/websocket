const express = require("express");
const https = require("https");
const path = require("path");
const ws = require("ws");
const fs = require("fs");

const PORT = 3030;

const app = express();

// -----------------------------------------------------------------------
app.use(express.json());

const server = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "certs", "selfkey.key")),
    cert: fs.readFileSync(path.join(__dirname, "certs", "selfCerts.crt")),
  },
);

const wss = new ws.Server({ noServer: true });
const wss2 = new ws.Server({ noServer: true });

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data, isBinary) {
    const hour = new Date().toLocaleTimeString();
    const msg = {
      ...JSON.parse(data),
      hour,
    };

    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        if (msg.msg == "connect") {
          return client.send(
            JSON.stringify({
              name: "server",
              msg: `${msg.name} acabou de entrar no canal`,
              hour,
            })
          );
        }

        if (msg.msg == "disconnect") {
          return client.send(
            JSON.stringify({
              name: "server",
              msg: `${msg.name} saiu do canal`,
              hour,
            })
          );
        }

        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on("close", function close(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        const hour = new Date().toLocaleTimeString();

        client.send(
          JSON.stringify({
            name: "server",
            msg: `Alguém acabou de sair da sala.`,
            hour,
          })
        );
      }
    });
  });

  const hour = new Date().toLocaleTimeString();
  ws.send(
    JSON.stringify({ name: "server", msg: "Você entrou no canal 1.", hour })
  );
});

wss2.on("connection", function connection(ws) {
  ws.on("message", function message(data, isBinary) {
    const hour = new Date().toLocaleTimeString();
    const msg = {
      ...JSON.parse(data),
      hour,
    };

    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        if (msg.msg == "connect") {
          return client.send(
            JSON.stringify({
              name: "server",
              msg: `${msg.name} acabou de entrar no canal 2`,
              hour,
            })
          );
        }

        if (msg.msg == "disconnect") {
          return client.send(
            JSON.stringify({
              name: "server",
              msg: `${msg.name} saiu do canal 2`,
              hour,
            })
          );
        }

        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on("close", function close(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        const hour = new Date().toLocaleTimeString();

        client.send(
          JSON.stringify({
            name: "server",
            msg: `Alguém acabou de sair da sala.`,
            hour,
          })
        );
      }
    });
  });

  const hour = new Date().toLocaleTimeString();
  ws.send(
    JSON.stringify({ name: "server", msg: "Você entrou no canal 2.", hour })
  );
});

server.on("upgrade", function upgrade(request, socket, head) {
  const URL = request.url;
  const ip = request.socket.remoteAddress;
console.log("-------------- IP ---------------");
console.log(ip);

  if (URL === "/channel1") {
    console.log("switch channel 1");
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else if (URL === "/channel2") {
    console.log("switch channel 2");
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit("connection", ws, request);
    });
  } else {
    console.log("sem canal");
  }
});

// -----------------------------------------------------------------------
server.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
