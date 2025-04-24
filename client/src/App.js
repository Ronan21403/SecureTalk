import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// Connect to the server's WebSocket
const socket = io("http://localhost:4000");

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('');

  const SECRET_KEY = 'securetalk123';

  const encrypt = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  const decrypt = (ciphertext) => CryptoJS.AES.decrypt(ciphertext, SECRET_KEY).toString(CryptoJS.enc.Utf8);

  useEffect(() => {
    // Confirm connection to socket
    console.log('Connecting to socket...');

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Listen for the 'new_message' event from the backend
    socket.on('new_message', (newMessage) => {
      console.log('Received new message:', newMessage);
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
    });

    // Fetch existing messages on load
    const fetchMessages = async () => {
      try {
        const response = await axios.get('http://localhost:4000/messages');
        setMessages(response.data.reverse());
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Clean up the socket listener when the component is unmounted
    return () => {
      socket.off('new_message');
      socket.off('connect');
    };
  }, []); // Added connected as a dependency

  const sendMessage = async () => {
    if (!user || !message) return;

    try {
      const encryptedMessage = encrypt(message);
      const response = await axios.post('http://localhost:4000/messages', {
        user,
        encryptedMessage
      });

      if (response.status === 201) {
        console.log('Message sent successfully');
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>🔐 SecureTalk</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Nom"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ marginRight: 10, padding: 8 }}
        />
        <input
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ marginRight: 10, padding: 8 }}
        />
        <button onClick={sendMessage} style={{ padding: '8px 16px' }}>Envoyer</button>
      </div>

      <hr />

      <h3>Messages :</h3>
      <div style={{ width: '100%' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <strong>{m.user} :</strong> {
              // Only try to decrypt if there's a message
              m.encryptedMessage ? decrypt(m.encryptedMessage) : ''
            }
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;