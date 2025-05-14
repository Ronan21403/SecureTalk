const redis = require('redis');
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Message = require('./models/Message')
const dotenv = require('dotenv');

// Dynamically load the appropriate .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: envFile });
const app = express();

app.use(cors({
    origin: '*', // Allows all origins (restrict this in production)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());


const server = http.createServer(app);
// Initialize socket.io with CORS settings
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Connect to MongoDB
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/securetalk';
mongoose.connect(mongoURI).catch(err =>
    console.error('MongoDB connection error:', err)
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('MongoDB connected!');
});


// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check MongoDB connection state
        const mongoState = mongoose.connection.readyState;
        const mongoStatus = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };

        if (mongoState === 1) {
            return res.status(200).json({ status: 'healthy', mongo: mongoStatus[mongoState] });
        } else {
            return res.status(500).json({ status: 'unhealthy', mongo: mongoStatus[mongoState] });
        }
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});


// GET endpoint to retrieve existing messages
app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error('Error retrieving messages:', err);
        res.status(500).send('Server error');
    }
});

// POST endpoint to save new messages
app.post('/messages', async (req, res) => {
    const { user, to, encryptedMessage } = req.body;
    console.log('Received message:', { user, to, encryptedMessage });
    if (!user || !encryptedMessage) {
        return res.status(400).send('Invalid data');
    }

    const message = new Message({ user, to, encryptedMessage });

    try {
        await message.save();

        // Only publish to Redis, which will then trigger the Socket.IO emission
        // through the Redis subscription callback
        // await redisPublisher.publish('messages', JSON.stringify(message));
        await io.emit('new_message', message);
        res.status(201).send('Message saved');
    } catch (err) {
        console.error('Error saving message:', err);
        res.status(500).send('Server error');
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    console.log('Register attempt with username:', username, password);
    if (!username || !password) {
        return res.status(400).send('Invalid data');
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(409).send('Username already exists');
    }
    const user = new User({ username, password });
    await user.save();
    // redisPublisher.publish("register", JSON.parse(user))
    res.status(201).send('User registered successfully');

})
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt with username:', username, password);
    if (!username || !password) {
        return res.status(400).send('Invalid data');
    }
    const user = await User.findOne({ username, password });
    console.log(user);
    if (!user) {
        return res.status(401).send('Invalid username or password');
    }
    res.status(200).send('Login successful');
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username');
        res.json(users.map(u => u.username));
    } catch (err) {
        res.status(500).send('Error fetching users');
    }
});


// Set up Socket.IO connection event
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


server.listen(4000, '0.0.0.0', () => {
    console.log('Server running on port 4000');
});