const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const socketHandler = require('./socket/socketHandler');
const voterRoutes = require('./routes/voters');
const candidateRoutes = require('./routes/candidates');

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || true;

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Routes
app.use('/api/voters', voterRoutes);
app.use('/api/candidates', candidateRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'EVM Backend Running' }));

// Socket
socketHandler(io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await initDB();
  } catch (err) {
    console.log('⚠️  PostgreSQL not connected, some features may not work');
    console.log('   Set DATABASE_URL in .env to enable full functionality');
  }

  await connectRedis();

  server.listen(PORT, () => {
    console.log(`🚀 EVM Backend running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
  });
};

start();
