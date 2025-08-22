const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// === MongoDB Connection ===
mongoose.connect('mongodb://localhost:27017/LoginApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// === Middleware ===
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// === Mongoose Schema & Model (with explicit collection name) ===
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// 👇 Explicit collection name set to 'users'
const User = mongoose.model('User', userSchema, 'users');

// === Routes ===

// GET: Root -> Redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// POST: Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).send('Password must be at least 6 characters.');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(409).send('Username already exists.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.redirect('/login.html');
});

// POST: Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Login Details Are Mismatched');
    }

    req.session.user = { username: user.username };
    res.send(`
        <h2>Welcome, ${user.username}!</h2>
        <a href="/index.html">Logout</a>
    `);
});

// === Start Server ===
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});