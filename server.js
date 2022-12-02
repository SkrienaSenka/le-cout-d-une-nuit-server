const {WebSocketServer} = require('ws');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json())

const PORT = parseInt(process.argv[process.argv.length - 1], 10);
const freePorts = [];
const games = {};
for (let i = PORT + 1; i < PORT + 1001; i++) {
    freePorts.push(i);
}

function onJoiningGame(port, websocket) {
    const game = games[port];
    game.members++;
    if (game.members > 1) {
        game.socket.clients.forEach(function (client) {
            client.send(JSON.stringify({
                type: 'message',
                payload: {
                    sender: 'Serveur',
                    message: 'Un nouvel enquêteur rejoint le groupe'
                }
            }));
        });
    }
    const copiedGame = JSON.parse(JSON.stringify(game));
    delete copiedGame.socket;
    websocket.send(JSON.stringify({ type: 'state', payload: copiedGame }));
}

app.get('/server-port', (req, res) => {
    res.send({ port: PORT });
})

app.post('/create-game', (req, res) => {
    const port = freePorts[0];
    freePorts.splice(0, 1);
    console.log(`Creating websocket ${port}`);
    const socketServer = new WebSocketServer({ port }, () => {
        console.log('WebSocket created');
    });
    games[port] = {
        socket: socketServer,
        phase: 1,
        clues: 0,
        members: 0
    };
    socketServer.on('connection', (webSocket) => onJoiningGame(port, webSocket));
    res.send({ port });
})

app.listen(PORT);

console.log("Listening on port " + PORT);
