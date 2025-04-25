[1mdiff --git a/server.js b/server.js[m
[1mindex c2798f5..434273a 100644[m
[1m--- a/server.js[m
[1m+++ b/server.js[m
[36m@@ -6,6 +6,7 @@[m [mconst crypto = require('crypto');[m
 const jwt = require('jsonwebtoken');[m
 const bcrypt = require('bcryptjs');[m
 const cookieParser = require('cookie-parser');[m
[32m+[m[32mconst fs = require('fs');[m
 [m
 const app = express();[m
 const server = http.createServer(app);[m
[36m@@ -16,18 +17,20 @@[m [mapp.use(express.json());[m
 app.use(cookieParser());[m
 [m
 // Configuration[m
[31m-const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_here'; // Use env var in production[m
[32m+[m[32mconst JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_here';[m
 const PORT = process.env.PORT || 3000;[m
 [m
[31m-// Check if public directory exists and serve static files if it does[m
[32m+[m[32m// Static files[m
 const publicPath = path.join(__dirname, 'public');[m
[31m-app.use(express.static(publicPath));  // Serve static files from the 'public' folder[m
[31m- HEAD[m
[31m-app.use(express.static(path.join(__dirname, 'public')));[m
[32m+[m[32mapp.use(express.static(publicPath));[m
 [m
[31m- e76153c5bdf93bf533d763a428ac03796a240ed0[m
[32m+[m[32m// Debugging - log the public directory status[m
[32m+[m[32mconsole.log('Public directory exists:', fs.existsSync(publicPath));[m
[32m+[m[32mif (fs.existsSync(publicPath)) {[m
[32m+[m[32m  console.log('Contents:', fs.readdirSync(publicPath));[m
[32m+[m[32m}[m
 [m
[31m-// Mock database (replace with MongoDB/PostgreSQL later)[m
[32m+[m[32m// Mock database[m
 const users = [];[m
 const publicRooms = new Map();[m
 const privateRooms = new Map();[m
[36m@@ -77,143 +80,16 @@[m [mapp.post('/api/auth/register', async (req, res) => {[m
   res.json({ user: { username, isHost: newUser.isHost } });[m
 });[m
 [m
[31m-app.post('/api/auth/login', async (req, res) => {[m
[31m-  const { username, password } = req.body;[m
[31m-  const user = users.find(user => user.username === username);[m
[32m+[m[32m// ... [Keep all your other existing routes and socket.io logic][m
 [m
[31m-  if (!user || !(await comparePassword(password, user.password))) {[m
[31m-    return res.status(400).json({ error: 'Invalid credentials' });[m
[31m-  }[m
[31m-[m
[31m-  const token = jwt.sign([m
[31m-    { id: user.id, username, isHost: user.isHost },[m
[31m-    JWT_SECRET,[m
[31m-    { expiresIn: '1h' }[m
[31m-  );[m
[31m-[m
[31m-  res.cookie('token', token, { httpOnly: true });[m
[31m-  res.json({ user: { username, isHost: user.isHost } });[m
[31m-});[m
[31m-[m
[31m-app.post('/api/auth/logout', (req, res) => {[m
[31m-  res.clearCookie('token');[m
[31m-  res.json({ message: 'Logged out successfully' });[m
[31m-});[m
[31m-[m
[31m-app.get('/api/auth/me', authenticateUser, (req, res) => {[m
[31m-  res.json({ user: req.user });[m
[31m-});[m
[31m-[m
[31m-// Protected Routes - Modified to handle missing files[m
[31m-app.get('/host', authenticateUser, (req, res) => {[m
[31m-  if (!req.user.isHost) return res.redirect('/guest');[m
[31m-  try {[m
[31m-    res.sendFile(path.join(publicPath, 'host.html'));[m
[31m-  } catch (err) {[m
[31m-    res.status(404).json({ error: 'Host interface not available' });[m
[31m-  }[m
[31m-});[m
[31m-[m
[31m-app.get('/guest', authenticateUser, (req, res) => {[m
[31m-  try {[m
[31m-    res.sendFile(path.join(publicPath, 'guest.html'));[m
[31m-  } catch (err) {[m
[31m-    res.status(404).json({ error: 'Guest interface not available' });[m
[31m-  }[m
[31m-});[m
[31m-[m
[31m-// Public Routes - Modified to handle missing files[m
[31m-app.get('/', (req, res) => {[m
[31m-  try {[m
[31m-    res.sendFile(path.join(publicPath, 'index.html'));[m
[31m-  } catch (err) {[m
[31m-    res.status(404).send('Welcome to the application. The main interface is currently unavailable.');[m
[31m-  }[m
[31m-});[m
[31m-[m
[31m-app.get('/discover', (req, res) => {[m
[31m-  try {[m
[31m-    res.sendFile(path.join(publicPath, 'discover.html'));[m
[31m-  } catch (err) {[m
[31m-    res.status(404).json({ error: 'Discover page not available' });[m
[31m-  }[m
[31m-});[m
[31m-[m
[31m-// Socket.IO Logic (unchanged)[m
[31m-io.on('connection', (socket) => {[m
[31m-  console.log('New connection:', socket.id);[m
[31m-[m
[31m-  // Auth guard for sockets[m
[31m-  const token = socket.handshake.headers.cookie?.split('=')[1];[m
[31m-  if (!token) return socket.disconnect(true);[m
[31m-[m
[31m-  try {[m
[31m-    const user = jwt.verify(token, JWT_SECRET);[m
[31m-    socket.user = user;[m
[31m-[m
[31m-    // Host creates a room[m
[31m-    socket.on('host-create-room', () => {[m
[31m-      if (!user.isHost) return;[m
[31m-[m
[31m-      const roomId = generateRoomId();[m
[31m-      publicRooms.set(roomId, {[m
[31m-        hostSocketId: socket.id,[m
[31m-        hostUsername: user.username,[m
[31m-        guests: [][m
[31m-      });[m
[31m-[m
[31m-      socket.join(roomId);[m
[31m-      socket.emit('room-created', { roomId });[m
[31m-    });[m
[31m-[m
[31m-    // Guest joins a room[m
[31m-    socket.on('guest-join-room', ({ roomId }) => {[m
[31m-      const room = publicRooms.get(roomId);[m
[31m-      if (!room) return socket.emit('room-not-found');[m
[31m-[m
[31m-      socket.join(roomId);[m
[31m-      room.guests.push({[m
[31m-        socketId: socket.id,[m
[31m-        username: user.username[m
[31m-      });[m
[31m-[m
[31m-      io.to(room.hostSocketId).emit('guest-joined', {[m
[31m-        username: user.username,[m
[31m-        socketId: socket.id[m
[31m-      });[m
[31m-[m
[31m-      socket.emit('room-joined', {[m
[31m-        hostUsername: room.hostUsername[m
[31m-      });[m
[31m-    });[m
[31m-[m
[31m-    // Chat messages[m
[31m-    socket.on('send-chat-message', ({ roomId, message }) => {[m
[31m-      io.to(roomId).emit('new-chat-message', {[m
[31m-        username: user.username,[m
[31m-        message[m
[31m-      });[m
[31m-    });[m
[31m-[m
[31m-    // Disconnect[m
[31m-    socket.on('disconnect', () => {[m
[31m-      publicRooms.forEach((room, roomId) => {[m
[31m-        if (room.hostSocketId === socket.id) {[m
[31m-          io.to(roomId).emit('host-disconnected');[m
[31m-          publicRooms.delete(roomId);[m
[31m-        } else {[m
[31m-          room.guests = room.guests.filter(guest => guest.socketId !== socket.id);[m
[31m-          io.to(room.hostSocketId).emit('guest-left', socket.id);[m
[31m-        }[m
[31m-      });[m
[31m-    });[m
[31m-[m
[31m-  } catch (err) {[m
[31m-    socket.disconnect(true);[m
[31m-  }[m
[32m+[m[32m// Error handling middleware[m
[32m+[m[32mapp.use((err, req, res, next) => {[m
[32m+[m[32m  console.error(err.stack);[m
[32m+[m[32m  res.status(500).send('Something broke!');[m
 });[m
 [m
 // Start Server[m
 server.listen(PORT, () => {[m
   console.log(`Server running on http://localhost:${PORT}`);[m
[31m-});[m
[32m+[m[32m  console.log('Public directory path:', publicPath);[m
[32m+[m[32m});[m
\ No newline at end of file[m
