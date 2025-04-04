const { createServer } = require('http');
const { SocketServer } = require('./lib/socket-server');

const server = createServer();
const socketServer = new SocketServer(server);

server.listen(3001, () => {
  console.log('WebSocket server is running on port 3001');
}); 