import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, Platform, User, Transaction, CampaignActionType } from '../types';
import { db } from '../services/storage';
import { Youtube, Instagram, Music, Facebook, ExternalLink, Timer, Eye, UserPlus, CheckCircle, Filter, ArrowDownUp, Zap } from 'lucide-react';

interface EarnProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

type SortOrder = 'DEFAULT' | 'HIGH_REWARD' | 'LOW_REWARD';
type TypeFilter = 'ALL' | CampaignActionType;

const Earn: React.FC<EarnProps> = ({ user, onUpdateUser }) => {
  const [tasks, setTasks] = useState<Campaign[]>([]);
  
  // Filters State
  const [platformFilter, setPlatformFilter] = useState<Platform | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DEFAULT');
  
  // States to handle interactions
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isVerifyingFollow, setIsVerifyingFollow] = useState(false);

  useEffect(() => {
    // Load active campaigns that are NOT created by the current user
    const allCampaigns = db.getCampaigns();
    const available = allCampaigns.filter(c => 
      c.active && 
      c.userId !== user.id && 
      c.completedActions < c.totalActions
    );
    setTasks(available);
  }, [user.id]);

  useEffect(() => {
    let interval: number;
    // Only run timer for VIEW tasks, not FOLLOW tasks
    const currentTask = tasks.find(t => t.id === activeTask);
    
    if (activeTask && currentTask?.actionType === CampaignActionType.VIEW && timer > 0) {
      interval = window.setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (activeTask && currentTask?.actionType === CampaignActionType.VIEW && timer === 0) {
      completeTask(activeTask);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTask, timer, tasks]);

  const startTask = (campaign: Campaign) => {
    // Open link in new tab
    window.open(campaign.url, '_blank');
    setActiveTask(campaign.id);

    if (campaign.actionType === CampaignActionType.VIEW) {
      // Logic for views: Timer based
      setTimer(10); 
    } else {
      // Logic for follows: Manual Confirmation
      setIsVerifyingFollow(true);
    }
  };

  const handleManualVerify = (campaignId: string) => {
    // Simulate verification delay
    setTimer(2); // Use timer for visual feedback
    setTimeout(() => {
       completeTask(campaignId);
       setIsVerifyingFollow(false);
    }, 1500);
  };

  const completeTask = (campaignId: string) => {
    const campaign = tasks.find(c => c.id === campaignId);
    if (!campaign) return;

    // 1. Update User Coins
    const updatedUser = db.updateUserBalance(user.id, campaign.rewardPerAction);
    if (updatedUser) onUpdateUser(updatedUser);

    // 2. Log Transaction
    const actionLabel = campaign.actionType === CampaignActionType.FOLLOW ? 'Seguiu perfil' : 'Visualizou';
    const transaction: Transaction = {
      id: Date.now().toString(),
      userId: user.id,
      amount: campaign.rewardPerAction,
      type: 'EARN',
      description: `${actionLabel} em ${campaign.platform}`,
      timestamp: Date.now()
    };
    db.addTransaction(transaction);

    // 3. Update Campaign Progress
    campaign.completedActions += 1;
    if (campaign.completedActions >= campaign.totalActions) {
      campaign.active = false;
    }
    db.saveCampaign(campaign);

    // 4. Reset UI
    setActiveTask(null);
    setTasks(prev => prev.filter(c => c.id !== campaignId || c.completedActions < c.totalActions));
  };

  // --- Filtering & Sorting Logic ---
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Platform Filter
    if (platformFilter !== 'ALL') {
      result = result.filter(t => t.platform === platformFilter);
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.actionType === typeFilter);
    }

    // 3. Sorting
    if (sortOrder === 'HIGH_REWARD') {
      result.sort((a, b) => b.rewardPerAction - a.rewardPerAction);
    } else if (sortOrder === 'LOW_REWARD') {
      result.sort((a, b) => a.rewardPerAction - b.rewardPerAction);
    }
    // DEFAULT keeps original order (usually creation time or ID based on mock data)

    return result;
  }, [tasks, platformFilter, typeFilter, sortOrder]);


  // Custom SVG Icons
  const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-white w-6 h-6">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  const KwaiIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-white w-6 h-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5l4 2.5-4 2.5z" />
    </svg>
  );

  const getIcon = (p: Platform) => {
    switch (p) {
      case Platform.YOUTUBE: return <Youtube className="text-red-500" />;
      case Platform.SPOTIFY: return <Music className="text-green-500" />;
      case Platform.INSTAGRAM: return <Instagram className="text-pink-500" />;
      case Platform.FACEBOOK: return <Facebook className="text-blue-500" />;
      case Platform.TIKTOK: return <div className="text-black bg-white rounded-full p-0.5"><TikTokIcon /></div>;
      case Platform.KWAI: return <div className="text-orange-500"><KwaiIcon /></div>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Ganhar Moedas</h2>
            <p className="text-gray-400">Interaja com conteúdo para ganhar recompensas.</p>
          </div>
          
          {/* Platform Filters */}
          <div className="flex gap-2 mt-4 md:mt-0 bg-gray-800 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            {['ALL', ...Object.values(Platform)].map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  platformFilter === p 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {p === 'ALL' ? 'Todas' : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Toolbar: Type & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
           
           {/* Type Filter */}
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg text-gray-400 text-sm border border-gray-700">
               <Filter size={14} />
               <span className="hidden sm:inline">Filtrar:</span>
             </div>
             
             <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
               <button
                 onClick={() => setTypeFilter('ALL')}
                 className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${typeFilter === 'ALL' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Tudo
               </button>
               <button
                 onClick={() => setTypeFilter(CampaignActionType.VIEW)}
                 className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${typeFilter === CampaignActionType.VIEW ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 <Eye size={12} /> Visualizar
               </button>
               <button
                 onClick={() => setTypeFilter(CampaignActionType.FOLLOW)}
                 className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${typeFilter === CampaignActionType.FOLLOW ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 <UserPlus size={12} /> Seguir
               </button>
             </div>
           </div>

           {/* Sort */}
           <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg text-gray-400 text-sm border border-gray-700">
                <ArrowDownUp size={14} />
                <span className="hidden sm:inline">Ordenar:</span>
              </div>
              
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-700 focus:outline-none focus:border-blue-500 hover:bg-gray-700 cursor-pointer"
              >
                <option value="DEFAULT">Relevância</option>
                <option value="HIGH_REWARD">Maior Valor 💰</option>
                <option value="LOW_REWARD">Menor Valor</option>
              </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <p className="text-gray-400 text-lg">Nenhuma tarefa encontrada com estes filtros.</p>
            <button onClick={() => {setPlatformFilter('ALL'); setTypeFilter('ALL');}} className="mt-2 text-blue-400 hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <div key={task.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all flex flex-col justify-between group relative overflow-hidden">
              
              {/* Type Badge */}
              <div className="absolute top-0 right-0 p-4">
                 <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 ${
                   task.actionType === CampaignActionType.FOLLOW 
                     ? 'bg-purple-900/50 text-purple-300 border border-purple-800' 
                     : 'bg-blue-900/50 text-blue-300 border border-blue-800'
                 }`}>
                   {task.actionType === CampaignActionType.FOLLOW ? <UserPlus size={10} /> : <Eye size={10} />}
                   {task.actionType === CampaignActionType.FOLLOW ? 'Seguir' : 'View'}
                 </span>
              </div>

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-900 rounded-lg">
                    {getIcon(task.platform)}
                  </div>
                </div>
                
                <div className="mb-4">
                   <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{task.description}</h3>
                   <div className="flex items-center gap-2">
                     <span className="text-yellow-500 font-bold text-lg">+{task.rewardPerAction} Moedas</span>
                     {task.rewardPerAction >= 15 && (
                       <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30 flex items-center gap-0.5">
                         <Zap size={8} /> HOT
                       </span>
                     )}
                   </div>
                </div>
                
                <p className="text-gray-500 text-xs mb-4 truncate bg-gray-900/50 p-2 rounded">
                  {task.url}
                </p>
              </div>

              {activeTask === task.id ? (
                task.actionType === CampaignActionType.VIEW ? (
                  // VIEW Logic (Timer)
                  <button 
                    disabled 
                    className="w-full bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 cursor-wait"
                  >
                    <Timer className="animate-pulse" size={18} />
                    Verificando ({timer}s)...
                  </button>
                ) : (
                  // FOLLOW Logic (Manual Confirm)
                  <button 
                    onClick={() => handleManualVerify(task.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 animate-pulse"
                  >
                    <CheckCircle size={18} />
                    Confirmar "Seguir"
                  </button>
                )
              ) : (
                <button
                  disabled={activeTask !== null} // Disable other buttons while one task is active
                  onClick={() => startTask(task)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTask !== null 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : task.actionType === CampaignActionType.FOLLOW 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {task.actionType === CampaignActionType.FOLLOW ? (
                    <>Seguir e Ganhar <ExternalLink size={16} /></>
                  ) : (
                    <>Ver e Ganhar <ExternalLink size={16} /></>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Earn;