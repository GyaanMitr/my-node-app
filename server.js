const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_here';
const PORT = process.env.PORT || 3000;

// Static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Debugging - log the public directory status
console.log('Public directory exists:', fs.existsSync(publicPath));
if (fs.existsSync(publicPath)) {
  console.log('Contents:', fs.readdirSync(publicPath));
}

// Mock database
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

// ... [Keep all your other existing routes and socket.io logic]

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Public directory path:', publicPath);
});