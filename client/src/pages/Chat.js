import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import axios from 'axios';

const socket = io('http://localhost:4000');
const SECRET_KEY = 'securetalk123';

function Chat() {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState('');
    const [to, setTo] = useState('public');
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('securetalkUser');
        if (!storedUser) return navigate('/login');
        setUser(storedUser);

        socket.on('new_message', (newMessage) => {
            const decrypted = {
                ...newMessage,
                encryptedMessage: decrypt(newMessage.encryptedMessage),
            };
            setMessages(prev => [decrypted, ...prev]);
        });

        socket.on("register", (user) =>
            {
                console.log("new user registering")
                setUsers(users => [...users, user])
            })


        axios.get('http://localhost:4000/messages').then(res => {
            const decryptedMessages = res.data.map(m => ({
                ...m,
                encryptedMessage: decrypt(m.encryptedMessage),
            }));
            setMessages(decryptedMessages.reverse());
        });

        axios.get('http://localhost:4000/users').then(res => {
            setUsers(res.data.filter(u => u !== storedUser));
        });

        return () => socket.off('new_message');
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, to]);

    const encrypt = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    const decrypt = (ciphertext) => CryptoJS.AES.decrypt(ciphertext, SECRET_KEY).toString(CryptoJS.enc.Utf8);

    const sendMessage = async () => {
        if (!message.trim()) return;
        const encryptedMessage = encrypt(message);
        setMessage('');
        console.log('Sending message:', user, to, encryptedMessage );
        await axios.post('http://localhost:4000/messages', { user, to, encryptedMessage });
    };

    const filteredUsers = users.filter(u => u.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r p-4 flex flex-col">
                <h2 className="text-2xl font-semibold text-center mb-4">Welcome on SecureTalk, {user}</h2>
                <h3 className="text-lg font-bold mb-2">📇 Utilisateurs</h3>
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="p-2 mb-2 border rounded-md"
                />
                <ul className="flex-1 overflow-y-auto">
                    <li
                        onClick={() => setTo('public')}
                        className={`cursor-pointer p-2 rounded-md ${to === 'public' ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                    >
                        🌍 Chat public
                    </li>
                    {filteredUsers.map((u, i) => (
                        <li
                            key={i}
                            onClick={() => setTo(u)}
                            className={`cursor-pointer p-2 rounded-md ${to === u ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                        >
                            👤 {u}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chat */}
            <div className="flex-1 p-4 flex flex-col h-full">
                <h2 className="text-2xl font-semibold text-center mb-4">
                    🔐 SecureTalk {to != "public" && `(Privé avec ${to})`}
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4 flex flex-col-reverse">
                    <div ref={messagesEndRef} />

                    {messages
                        .filter(m => {
                            // Private messages: between current user and selected user
                            return (
                                // CASE PUBLIC
                                (to === 'public' && m.to === "public") ||
                                // CASE PRIVATE
                                ( to !== 'public' &&
                                (m.user === user && m.to === to) ||
                                (m.user === to && m.to === user))
                            );
                        })
                        .map((m, i) => (
                            <div
                                key={i}
                                className={`p-2 m-1 rounded-md max-w-[80%] ${m.user === user
                                    ? 'bg-blue-100 self-end text-right'
                                    : 'bg-gray-200 self-start'
                                    }`}
                            >
                                <p className="text-sm font-bold">{m.user}</p>
                                <p className="text-base">{m.encryptedMessage}</p>
                            </div>
                        ))}

                </div>
                <div className="flex gap-2">
                    <input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Message"
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chat;
