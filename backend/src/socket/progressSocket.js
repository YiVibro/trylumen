const { Server } = require('socket.io');

let io;

const initSocket = (server) => {

  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? true 
    : 'http://localhost:5173';

  io = new Server(server, {
    cors: {
      origin: allowedOrigin, 
      methods: ['GET', 'POST'],
      credentials: true, 
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const emitProgress = (documentId, progress) => {
  if (io) {
    io.emit('embedding_progress', { documentId, progress });
  }
};

module.exports = { initSocket, emitProgress };