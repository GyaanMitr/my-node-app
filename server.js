const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_here'; // Use env var in production
const PORT = process.env.PORT || 3000;

// Check if public directory exists and serve static files if it does
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));  // Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Mock database (replace with MongoDB/PostgreSQL later)
const users = [];
const publicRooms = new Map();
const privateRooms = new Map();

// Utility Functions
const generateRoomId = () => crypto.randomBytes(4).toString('hex');
const hashPassword = async (password) => await bcrypt.hash(password, 10);
const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);

// Auth Middleware
const authenticateUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password, isHost } = req.body;

  if (users.some(user => user.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = { 
    id: Date.now().toString(),
    username,
    password: hashedPassword,
    isHost: Boolean(isHost)
  };
  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, username, isHost: newUser.isHost },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.cookie('token', token, { httpOnly: true });
  res.json({ user: { username, isHost: newUser.isHost } });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);

  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username, isHost: user.isHost },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.cookie('token', token, { httpOnly: true });
  res.json({ user: { username, isHost: user.isHost } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// Protected Routes - Modified to handle missing files
app.get('/host', authenticateUser, (req, res) => {
  if (!req.user.isHost) return res.redirect('/guest');
  try {
    res.sendFile(path.join(publicPath, 'host.html'));
  } catch (err) {
    res.status(404).json({ error: 'Host interface not available' });
  }
});

app.get('/guest', authenticateUser, (req, res) => {
  try {
    res.sendFile(path.join(publicPath, 'guest.html'));
  } catch (err) {
    res.status(404).json({ error: 'Guest interface not available' });
  }
});

// Public Routes - Modified to handle missing files
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(publicPath, 'index.html'));
  } catch (err) {
    res.status(404).send('Welcome to the application. The main interface is currently unavailable.');
  }
});

app.get('/discover', (req, res) => {
  try {
    res.sendFile(path.join(publicPath, 'discover.html'));
  } catch (err) {
    res.status(404).json({ error: 'Discover page not available' });
  }
});

// Socket.IO Logic (unchanged)
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Auth guard for sockets
  const token = socket.handshake.headers.cookie?.split('=')[1];
  if (!token) return socket.disconnect(true);

  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;

    // Host creates a room
    socket.on('host-create-room', () => {
      if (!user.isHost) return;

      const roomId = generateRoomId();
      publicRooms.set(roomId, {
        hostSocketId: socket.id,
        hostUsername: user.username,
        guests: []
      });

      socket.join(roomId);
      socket.emit('room-created', { roomId });
    });

    // Guest joins a room
    socket.on('guest-join-room', ({ roomId }) => {
      const room = publicRooms.get(roomId);
      if (!room) return socket.emit('room-not-found');

      socket.join(roomId);
      room.guests.push({
        socketId: socket.id,
        username: user.username
      });

      io.to(room.hostSocketId).emit('guest-joined', {
        username: user.username,
        socketId: socket.id
      });

      socket.emit('room-joined', {
        hostUsername: room.hostUsername
      });
    });

    // Chat messages
    socket.on('send-chat-message', ({ roomId, message }) => {
      io.to(roomId).emit('new-chat-message', {
        username: user.username,
        message
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      publicRooms.forEach((room, roomId) => {
        if (room.hostSocketId === socket.id) {
          io.to(roomId).emit('host-disconnected');
          publicRooms.delete(roomId);
        } else {
          room.guests = room.guests.filter(guest => guest.socketId !== socket.id);
          io.to(room.hostSocketId).emit('guest-left', socket.id);
        }
      });
    });

  } catch (err) {
    socket.disconnect(true);
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});