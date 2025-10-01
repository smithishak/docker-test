const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/docker-test';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username }, 'secret', { expiresIn: '1h' });
  res.json({ token });
});

function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, 'secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) return res.status(500).send('Error loading page');
    res.setHeader('Content-Type', 'text/html');
    res.send(data);
  });
});

app.get('/auth.html', (req, res) => {
  fs.readFile(path.join(__dirname, 'auth.html'), (err, data) => {
    if (err) return res.status(500).send('Error loading page');
    res.setHeader('Content-Type', 'text/html');
    res.send(data);
  });
});

app.get('/profile.html', (req, res) => {
  fs.readFile(path.join(__dirname, 'profile.html'), (err, data) => {
    if (err) return res.status(500).send('Error loading page');
    res.setHeader('Content-Type', 'text/html');
    res.send(data);
  });
});

app.get('/style.css', (req, res) => {
  fs.readFile(path.join(__dirname, 'style.css'), (err, data) => {
    if (err) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/css');
    res.send(data);
  });
});

// Пример защищенного маршрута
app.get('/profile', auth, (req, res) => {
  res.json({ message: `Hello, ${req.user.username}` });
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
