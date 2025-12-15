import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/storage';
import { getSocialMediaAdvice } from '../services/geminiService';
import { Sparkles, TrendingUp, Users, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const campaigns = db.getCampaigns().filter(c => c.userId === user.id);
  
  // Stats
  const activeCampaigns = campaigns.filter(c => c.active).length;
  const totalCompleted = campaigns.reduce((acc, c) => acc + c.completedActions, 0);
  const totalTarget = campaigns.reduce((acc, c) => acc + c.totalActions, 0);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram');

  const handleAskAI = async () => {
    if (!aiPrompt) return;
    setLoadingAi(true);
    setAiResponse('');
    
    const advice = await getSocialMediaAdvice(selectedPlatform, aiPrompt, 'Increase Engagement');
    setAiResponse(advice);
    setLoadingAi(false);
  };

  const chartData = [
    { name: 'Concluído', value: totalCompleted },
    { name: 'Restante', value: totalTarget - totalCompleted < 0 ? 0 : totalTarget - totalCompleted },
  ];
  const COLORS = ['#3b82f6', '#374151'];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-bold text-white">Bem-vindo(a), {user.username}</h2>
        <p className="text-gray-400 mt-1">Aqui está o resumo do seu crescimento.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Campanhas Ativas</p>
              <h3 className="text-2xl font-bold text-white">{activeCampaigns}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Engajamentos Totais</p>
              <h3 className="text-2xl font-bold text-white">{totalCompleted}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Saldo Atual</p>
              <h3 className="text-2xl font-bold text-white">{user.coins}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Progress Chart */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4">Progresso de Engajamento</h3>
          {totalTarget === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Nenhuma campanha ativa no momento.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* AI Assistant */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Consultor de Crescimento IA</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
             {!aiResponse && !loadingAi && (
               <p className="text-gray-500 text-sm text-center mt-10">
                 Peça dicas sobre sua próxima postagem, ideias de legendas ou como aumentar seu público.
               </p>
             )}
             {loadingAi && (
               <div className="flex justify-center items-center h-full">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
               </div>
             )}
             {aiResponse && (
               <div className="prose prose-invert text-sm">
                 <p className="whitespace-pre-line text-gray-200">{aiResponse}</p>
               </div>
             )}
          </div>

          <div className="flex flex-col gap-3">
            <select 
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-gray-700 text-white text-sm rounded-lg p-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="Spotify">Spotify</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="Kwai">Kwai</option>
            </select>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: Foto do meu gato tocando piano..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <button 
                onClick={handleAskAI}
                disabled={loadingAi || !aiPrompt}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Perguntar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;