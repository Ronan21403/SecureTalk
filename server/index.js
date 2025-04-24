const redis = require('redis');
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*', // Allows all origins (restrict this in production)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Create a simple Message schema if not already defined
const messageSchema = new mongoose.Schema({
    user: { type: String, required: true },
    encryptedMessage: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Create Message model if not already imported
const Message = mongoose.model('Message', messageSchema);

const server = http.createServer(app);
// Initialize socket.io with CORS settings
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Set up the Redis clients with proper connection
const redisClient = redis.createClient();
const redisPublisher = redis.createClient();

// Connect Redis clients
async function connectRedis() {
    try {
        await redisClient.connect();
        await redisPublisher.connect();
        console.log('Redis clients connected');

        // Subscribe to the messages channel after connecting
        await redisClient.subscribe('messages', (message) => {
            // Send the new message to all connected clients via Socket.io
            io.emit('new_message', JSON.parse(message));
        });
    } catch (err) {
        console.error('Redis connection error:', err);
    }
}

// Start Redis connection
connectRedis();

// Handle Redis connection errors
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/securetalk').catch(err =>
    console.error('MongoDB connection error:', err)
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('MongoDB connected!');
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
    const { user, encryptedMessage } = req.body;

    if (!user || !encryptedMessage) {
        return res.status(400).send('Invalid data');
    }

    const message = new Message({ user, encryptedMessage });

    try {
        await message.save();

        // Only publish to Redis, which will then trigger the Socket.IO emission
        // through the Redis subscription callback
        await redisPublisher.publish('messages', JSON.stringify(message));

        res.status(201).send('Message saved');
    } catch (err) {
        console.error('Error saving message:', err);
        res.status(500).send('Server error');
    }
});

// Set up Socket.IO connection event
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
server.listen(4000, () => {
    console.log('Server running on port 4000');
});