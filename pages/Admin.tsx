import React, { useState, useEffect } from 'react';
import { User, SystemConfig, Campaign, CoinPackage, UserRole } from '../types';
import { db } from '../services/storage';
import { Save, RefreshCw, Search, Edit2, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminProps {
  user: User;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [config, setConfig] = useState<SystemConfig>(db.getConfig());
  const [packages, setPackages] = useState<CoinPackage[]>(db.getPackages());
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  
  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCoinsValue, setEditCoinsValue] = useState<number>(0);

  useEffect(() => {
    // Calculate stats
    const campaigns = db.getCampaigns();
    const stats = [
      { name: 'YouTube', count: campaigns.filter(c => c.platform === 'YOUTUBE').length },
      { name: 'Instagram', count: campaigns.filter(c => c.platform === 'INSTAGRAM').length },
      { name: 'Spotify', count: campaigns.filter(c => c.platform === 'SPOTIFY').length },
      { name: 'Facebook', count: campaigns.filter(c => c.platform === 'FACEBOOK').length },
    ];
    setCampaignStats(stats);
    
    // Load Users
    setUsers(db.getAllUsers());
  }, []);

  const handleConfigSave = () => {
    db.saveConfig(config);
    alert('Configuração do sistema atualizada.');
  };

  const handlePriceUpdate = (id: string, newPrice: number) => {
    const updated = packages.map(p => p.id === id ? { ...p, price: newPrice } : p);
    setPackages(updated);
    updated.forEach(p => db.savePackage(p));
  };

  const startEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditCoinsValue(u.coins);
  };

  const saveUserCoins = (userId: string) => {
    const updatedUser = db.setUserCoins(userId, editCoinsValue);
    if (updatedUser) {
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      setEditingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 pb-20">
      <h2 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Painel de Administração</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* System Config - Valores de Tarefas */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Configurações de Valores</h3>
              <p className="text-xs text-gray-400">Defina os valores base das tarefas.</p>
            </div>
            <button onClick={handleConfigSave} className="text-blue-400 hover:text-blue-300 flex items-center gap-2 bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-900/50">
              <Save size={18} /> Salvar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Recompensa Mínima por Tarefa (Moedas)</label>
              <input 
                type="number"
                className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                value={config.minRewardPerTask}
                onChange={(e) => setConfig({ ...config, minRewardPerTask: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">Este é o valor mínimo que os usuários podem oferecer em suas campanhas.</p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Taxa Administrativa (%)</label>
              <input 
                type="number"
                className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                value={config.taskFeePercent}
                onChange={(e) => setConfig({ ...config, taskFeePercent: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-80">
          <h3 className="text-xl font-bold text-white mb-4">Atividade da Plataforma</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={campaignStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563', color: '#fff' }}
                cursor={{ fill: '#374151' }}
              />
              <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Management */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Gerenciamento de Usuários</h3>
              <p className="text-sm text-gray-400">Setar moedas e visualizar usuários.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar usuário..." 
                className="bg-gray-900 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-gray-300">
              <thead className="text-gray-500 uppercase text-xs bg-gray-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Saldo de Moedas</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${u.role === UserRole.ADMIN ? 'bg-purple-900 text-purple-200' : 'bg-gray-700 text-gray-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="bg-gray-900 border border-blue-500 rounded px-2 py-1 w-24 text-white"
                              value={editCoinsValue}
                              onChange={(e) => setEditCoinsValue(Number(e.target.value))}
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-yellow-500">{u.coins.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId === u.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => saveUserCoins(u.id)} className="p-1 bg-green-900/50 text-green-400 rounded hover:bg-green-900">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingUserId(null)} className="p-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEditUser(u)} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                            <Edit2 size={14} /> Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Store Management - Valores de Vendas */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-6">Gerenciamento de Preços da Loja</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-300">
              <thead className="text-gray-500 uppercase text-xs bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3">Nome do Pacote</th>
                  <th className="px-4 py-3">Quantidade de Moedas</th>
                  <th className="px-4 py-3">Preço de Venda ($)</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-white">{pkg.name}</td>
                    <td className="px-4 py-3">{pkg.coins.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        step="0.01"
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-24 text-white focus:border-blue-500 focus:outline-none"
                        value={pkg.price}
                        onChange={(e) => handlePriceUpdate(pkg.id, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                       <span className="flex items-center gap-1 text-green-500/50"><RefreshCw size={14}/> Salvo auto</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Admin;