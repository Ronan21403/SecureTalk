// src/Login.js
import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        // get the user in username in backend
        console.log('Login attempt with username:', username, password);
        axios.post('http://localhost:4000/login', { username, password })
            .then(response => {
                if (response.status === 200) {
                    localStorage.setItem('securetalkUser', username);
                    navigate('/chat');
                }
            })
            .catch(error => {
                setError(error.response?.data || 'Login failed');
                console.error('Login error:', error);
            });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-lg w-96">
                <h2 className="text-2xl font-semibold mb-6 text-center">🔐 SecureTalk</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <input
                    className="mb-4 p-2 w-full border border-gray-300 rounded"
                    placeholder="Entrez votre nom"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <input
                    className="mb-4 p-2 w-full border border-gray-300 rounded"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    onChange={e => setPassword(e.target.value)}
                />
                <button
                    className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95 transition duration-150"
                    onClick={handleLogin}
                >
                    Se connecter
                </button>


                <div className="mt-4 text-center">
                    <span className="text-gray-600">Pas encore de compte ? </span>
                    <a href="/register" className="text-blue-500 hover:underline">
                        S'inscrire
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Login;
