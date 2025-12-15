import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/storage';
import { UserRole, User, Transaction } from '../types';
import { Lock, User as UserIcon, Mail } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if user already exists
    if (db.getUserByUsername(username)) {
      setError('Nome de usuário já existe. Tente outro.');
      return;
    }

    const initialCoins = 200;
    const newUser: User = {
      id: username.toLowerCase().replace(/\s/g, '_'),
      username,
      role: UserRole.USER,
      coins: initialCoins // Signup bonus
    };

    // Save to DB and Set as Current
    db.saveUser(newUser);
    db.setCurrentUser(newUser);

    // Log Bonus Transaction
    const transaction: Transaction = {
      id: Date.now().toString(),
      userId: newUser.id,
      amount: initialCoins,
      type: 'BONUS',
      description: 'Bônus de Boas-vindas',
      timestamp: Date.now()
    };
    db.addTransaction(transaction);

    onLogin(newUser);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Criar Conta</h1>
          <p className="text-gray-400 mt-2">Junte-se ao SocialBoost Pro hoje</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="text"
              required
              placeholder="Nome de Usuário"
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

           <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="email"
              required
              placeholder="Endereço de Email"
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="password"
              required
              placeholder="Senha"
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Cadastrar & Ganhar 200 Moedas
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500 text-sm">
          Já tem uma conta? <Link to="/login" className="text-blue-400 hover:underline">Entrar</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;