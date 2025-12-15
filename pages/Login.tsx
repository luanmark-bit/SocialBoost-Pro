import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/storage';
import { UserRole, User } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin Backdoor
    if (username === 'Admin1' && password === 'Admin1') {
      const adminUser: User = {
        id: 'admin_master',
        username: 'Admin1',
        role: UserRole.ADMIN,
        coins: 999999
      };
      // Ensure admin is saved to DB so they appear in lists
      db.saveUser(adminUser);
      db.setCurrentUser(adminUser);
      onLogin(adminUser);
      navigate('/');
      return;
    }

    // Normal User Logic - Look up in DB
    const existingUser = db.getUserByUsername(username);
    
    if (existingUser) {
      // In a real app, verify password here.
      db.setCurrentUser(existingUser);
      onLogin(existingUser);
      navigate('/');
    } else {
      setError('Usuário não encontrado. Verifique o nome ou cadastre-se.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            SocialBoost Pro
          </h1>
          <p className="text-gray-400 mt-2">Faça login na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Nome de Usuário"
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="password"
              placeholder="Senha"
              className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02]"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500 text-sm">
          Não tem uma conta? <Link to="/register" className="text-blue-400 hover:underline">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;