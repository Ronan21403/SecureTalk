import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        // Assurer que le nom d'utilisateur et le mot de passe sont remplis
        if (!username || !password) {
            setError('Username and password are required');
            return;
        }

        try {
            const response = await axios.post('http://localhost:4000/register', { username, password });
            if (response.status === 201) {
                // Rediriger vers la page de connexion après une inscription réussie
                navigate('/login');
            }
        } catch (error) {
            setError(error.response?.data || 'Registration failed');
            console.error('Registration error:', error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="p-6 border border-gray-300 rounded-lg shadow-lg w-96">
                <h2 className="text-center text-2xl font-semibold mb-4">🔐 Inscription à SecureTalk</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    className="block w-full mb-3 p-2 border border-gray-300 rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    className="block w-full mb-3 p-2 border border-gray-300 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={handleRegister}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                    S'inscrire
                </button>
            </div>
        </div>
    );
}

export default Register;
