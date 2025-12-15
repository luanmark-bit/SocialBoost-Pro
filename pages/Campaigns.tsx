import React, { useState, useEffect, useCallback } from 'react';
import { User, Campaign, Platform, Transaction, CampaignActionType } from '../types';
import { db } from '../services/storage';
import { Trash2, Plus, AlertCircle, Eye, UserPlus, Youtube, Instagram, Music, Facebook, Edit2, Save, X, RefreshCw, Zap, CheckCircle } from 'lucide-react';

interface CampaignsProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

const Campaigns: React.FC<CampaignsProps> = ({ user, onUpdateUser }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<string | null>(null);

  // Form State (Create)
  const [platform, setPlatform] = useState<Platform>(Platform.YOUTUBE);
  const [actionType, setActionType] = useState<CampaignActionType>(CampaignActionType.VIEW);
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [reward, setReward] = useState(10);
  const [count, setCount] = useState(10);
  const [error, setError] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editReward, setEditReward] = useState(0);
  const [editError, setEditError] = useState('');

  const loadCampaigns = useCallback(() => {
    const all = db.getCampaigns();
    setCampaigns(all.filter(c => c.userId === user.id));
  }, [user.id]);

  useEffect(() => {
    loadCampaigns();

    // Ouvir atualizações dos bots (definido no botService)
    const handleBotUpdate = () => {
      loadCampaigns();
    };

    window.addEventListener('campaigns-updated', handleBotUpdate);
    
    // Fallback polling a cada 3 segundos caso o evento falhe ou para updates manuais
    const interval = setInterval(loadCampaigns, 3000);

    return () => {
      window.removeEventListener('campaigns-updated', handleBotUpdate);
      clearInterval(interval);
    };
  }, [loadCampaigns]);

  const config = db.getConfig();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const totalCost = reward * count;
    if (user.coins < totalCost) {
      setError(`Moedas insuficientes. Você precisa de ${totalCost} moedas.`);
      return;
    }

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      userId: user.id,
      platform,
      actionType,
      url,
      description: desc,
      rewardPerAction: reward,
      totalActions: count,
      completedActions: 0,
      active: true
    };

    // Deduct coins
    const updatedUser = db.updateUserBalance(user.id, -totalCost);
    if (updatedUser) onUpdateUser(updatedUser);

    // Log Transaction
    const typeLabel = actionType === CampaignActionType.FOLLOW ? 'Seguidores' : 'Visualizações';
    const transaction: Transaction = {
      id: Date.now().toString() + '_spend',
      userId: user.id,
      amount: totalCost,
      type: 'SPEND',
      description: `Campanha: ${platform} - ${typeLabel} (${count} ações)`,
      timestamp: Date.now()
    };
    db.addTransaction(transaction);

    // Save campaign
    db.saveCampaign(newCampaign);
    setCampaigns(prev => [...prev, newCampaign]);
    setIsCreating(false);
    
    // Show Notification
    setNotification(`Campanha criada com sucesso! -${totalCost} Moedas`);
    setTimeout(() => setNotification(null), 4000);

    // Reset form
    setUrl('');
    setDesc('');
    setReward(10);
    setCount(10);
    setActionType(CampaignActionType.VIEW);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Moedas não utilizadas não serão reembolsadas nesta demonstração.')) {
      db.deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  // --- Edit Logic ---

  const handleStartEdit = (camp: Campaign) => {
    setEditingId(camp.id);
    setEditDesc(camp.description);
    setEditReward(camp.rewardPerAction);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDesc('');
    setEditReward(0);
    setEditError('');
  };

  const handleSaveEdit = (campId: string) => {
    setEditError('');
    const originalCamp = campaigns.find(c => c.id === campId);
    if (!originalCamp) return;

    if (editReward < config.minRewardPerTask) {
      setEditError(`Recompensa mínima é ${config.minRewardPerTask}`);
      return;
    }

    if (!editDesc.trim()) {
      setEditError('Descrição é obrigatória');
      return;
    }

    // Calculate Coin Adjustment
    // We only adjust cost for remaining actions
    const remainingActions = originalCamp.totalActions - originalCamp.completedActions;
    const oldCostRemaining = originalCamp.rewardPerAction * remainingActions;
    const newCostRemaining = editReward * remainingActions;
    const costDifference = newCostRemaining - oldCostRemaining;

    if (costDifference > 0 && user.coins < costDifference) {
      setEditError(`Saldo insuficiente. Necessário: ${costDifference} moedas.`);
      return;
    }

    // Update Balance if needed
    if (costDifference !== 0) {
      const updatedUser = db.updateUserBalance(user.id, -costDifference);
      if (updatedUser) onUpdateUser(updatedUser);

      // Log Transaction
      const transaction: Transaction = {
        id: Date.now().toString() + '_edit',
        userId: user.id,
        amount: Math.abs(costDifference),
        type: costDifference > 0 ? 'SPEND' : 'EARN', // SPEND if upgrade, EARN if refund
        description: `Ajuste Campanha: ${costDifference > 0 ? 'Upgrade' : 'Reembolso'} de valor`,
        timestamp: Date.now()
      };
      db.addTransaction(transaction);
    }

    // Update Campaign
    const updatedCamp: Campaign = {
      ...originalCamp,
      description: editDesc,
      rewardPerAction: editReward
    };

    db.saveCampaign(updatedCamp);
    // Refresh list locally
    setCampaigns(prev => prev.map(c => c.id === campId ? updatedCamp : c));
    handleCancelEdit();
  };

  // --- UI Helpers ---

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'; // Golden + Glow
    if (percent >= 50) return 'bg-green-500'; // Success Green
    return 'bg-blue-600'; // Standard Blue
  };

  // Helper icons
  const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-white w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  const KwaiIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-white w-4 h-4">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5l4 2.5-4 2.5z" /> 
    </svg>
  );

  const getPlatformBadge = (p: Platform) => {
    let colorClass = 'bg-gray-700 text-gray-300';
    let icon = null;

    switch(p) {
      case Platform.YOUTUBE:
        colorClass = 'bg-red-900/50 text-red-300 border border-red-800';
        icon = <Youtube size={12} />;
        break;
      case Platform.FACEBOOK:
        colorClass = 'bg-blue-900/50 text-blue-300 border border-blue-800';
        icon = <Facebook size={12} />;
        break;
      case Platform.INSTAGRAM:
        colorClass = 'bg-pink-900/50 text-pink-300 border border-pink-800';
        icon = <Instagram size={12} />;
        break;
      case Platform.SPOTIFY:
        colorClass = 'bg-green-900/50 text-green-300 border border-green-800';
        icon = <Music size={12} />;
        break;
      case Platform.TIKTOK:
        colorClass = 'bg-gray-700 text-gray-200 border border-gray-600';
        icon = <TikTokIcon />;
        break;
      case Platform.KWAI:
        colorClass = 'bg-orange-900/50 text-orange-300 border border-orange-800';
        icon = <KwaiIcon />;
        break;
    }

    return (
      <span className={`text-xs px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1 ${colorClass}`}>
        {icon}
        {p}
      </span>
    );
  };

  return (
    <div className="p-8 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(22,163,74,0.5)] flex items-center gap-3 animate-fade-in-down transition-all">
          <CheckCircle size={20} className="text-white" />
          <span className="font-bold text-sm md:text-base">{notification}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            Minhas Campanhas
            <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-900 px-2 py-1 rounded-full flex items-center gap-1 font-normal">
              <Zap size={10} /> Rede Automática Ativa
            </span>
          </h2>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Nova Campanha
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700 animate-fade-in-down">
          <h3 className="text-xl font-bold text-white mb-4">Criar Nova Campanha</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            
            {/* Platform & Action Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Plataforma</label>
                <select 
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                >
                  {Object.values(Platform).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Tipo de Objetivo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType(CampaignActionType.VIEW)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                      actionType === CampaignActionType.VIEW 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    <Eye size={16} /> Visualizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType(CampaignActionType.FOLLOW)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                      actionType === CampaignActionType.FOLLOW 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    <UserPlus size={16} /> Seguir
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">
                {actionType === CampaignActionType.VIEW ? 'URL do Conteúdo (Vídeo/Post)' : 'URL do Perfil / Canal'}
              </label>
              <input 
                type="url" 
                required
                placeholder="https://..."
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Descrição / Instruções</label>
              <input 
                type="text" 
                required
                placeholder={actionType === CampaignActionType.VIEW ? "Ex: Assista 30s e curta" : "Ex: Siga nosso perfil oficial"}
                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Recompensa por {actionType === CampaignActionType.VIEW ? 'View' : 'Follow'}</label>
                <input 
                  type="number" 
                  min={config.minRewardPerTask}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
                  value={reward}
                  onChange={(e) => setReward(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo: {config.minRewardPerTask}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Quantidade Total</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg flex justify-between items-center border border-gray-700">
              <span className="text-gray-400">Custo Total:</span>
              <span className={`text-xl font-bold ${user.coins < reward * count ? 'text-red-500' : 'text-green-500'}`}>
                {reward * count} Moedas
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Lançar Campanha
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Você ainda não criou nenhuma campanha.</p>
        ) : (
          campaigns.map((camp) => {
            const percent = Math.min(100, (camp.completedActions / camp.totalActions) * 100);
            return (
              <div key={camp.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
                
                {/* Left Side: Info & Edit Inputs */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {getPlatformBadge(camp.platform)}
                    <span className={`text-xs px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1 ${
                      camp.actionType === CampaignActionType.FOLLOW 
                        ? 'bg-purple-900 text-purple-200' 
                        : 'bg-blue-900 text-blue-200'
                    }`}>
                      {camp.actionType === CampaignActionType.FOLLOW ? <UserPlus size={10} /> : <Eye size={10} />}
                      {camp.actionType === CampaignActionType.FOLLOW ? 'Seguir' : 'View'}
                    </span>
                    
                    {editingId === camp.id ? (
                      <input 
                        type="text"
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 w-full max-w-xs"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Nova descrição..."
                      />
                    ) : (
                      <h4 className="font-semibold text-white">{camp.description}</h4>
                    )}
                  </div>
                  
                  {editingId === camp.id && editError && (
                    <div className="text-red-400 text-xs mt-1 mb-1">{editError}</div>
                  )}

                  <a href={camp.url} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline truncate block max-w-md">
                    {camp.url}
                  </a>
                </div>

                {/* Right Side: Stats & Actions */}
                <div className="flex items-center gap-8 min-w-[300px]">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Progresso</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-bold">{camp.completedActions}</span>
                      <span className="text-gray-500">{camp.totalActions}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ease-out ${getProgressColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Valor</p>
                    {editingId === camp.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-16 text-center focus:outline-none focus:border-blue-500"
                          value={editReward}
                          onChange={(e) => setEditReward(Number(e.target.value))}
                        />
                      </div>
                    ) : (
                      <p className="font-bold text-yellow-500">{camp.rewardPerAction}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {editingId === camp.id ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(camp.id)}
                          className="p-2 bg-green-900/50 text-green-400 rounded-lg hover:bg-green-900 hover:text-green-300 transition-colors"
                          title="Salvar"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        {camp.active && camp.completedActions < camp.totalActions && (
                          <button 
                            onClick={() => handleStartEdit(camp)}
                            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar Campanha"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(camp.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Excluir Campanha"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Campaigns;