import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlayCircle, 
  PlusCircle, 
  ShoppingCart, 
  LogOut, 
  Settings,
  History,
  TrendingUp,
  TrendingDown,
  Share2
} from 'lucide-react';
import { db } from '../services/storage';
import { UserRole } from '../types';

interface SidebarProps {
  userRole: UserRole;
  userCoins: number;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, userCoins }) => {
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState<'gain' | 'loss' | null>(null);
  const prevCoinsRef = useRef(userCoins);

  useEffect(() => {
    // Check if coins changed
    if (userCoins !== prevCoinsRef.current) {
      if (userCoins > prevCoinsRef.current) {
        setHighlight('gain');
      } else if (userCoins < prevCoinsRef.current) {
        setHighlight('loss');
      }
      
      // Update ref
      prevCoinsRef.current = userCoins;

      // Reset animation after 500ms
      const timer = setTimeout(() => {
        setHighlight(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [userCoins]);

  const handleLogout = () => {
    db.setCurrentUser(null);
    navigate('/login');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'SocialBoost Pro',
      text: 'Venha ganhar seguidores e visualizações grátis no SocialBoost!',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('User cancelled share', err);
      }
    } else {
      // Fallback para Desktop
      navigator.clipboard.writeText(shareData.url);
      alert('Link do App copiado para a área de transferência!');
    }
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;

  // Dynamic classes for coin container
  const getCoinContainerClass = () => {
    const baseClass = "mt-4 rounded-full px-3 py-2 text-sm flex items-center justify-center gap-2 border transition-all duration-300 transform";
    
    if (highlight === 'gain') {
      return `${baseClass} bg-green-900/40 border-green-500 text-green-300 scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)]`;
    }
    
    if (highlight === 'loss') {
      return `${baseClass} bg-red-900/40 border-red-500 text-red-300 scale-95`;
    }

    return `${baseClass} bg-gray-800 border-gray-700 text-yellow-400`;
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen fixed left-0 top-0 flex flex-col z-20">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          SocialBoost
        </h1>
        
        <div className={getCoinContainerClass()}>
          {highlight === 'gain' && <TrendingUp size={16} className="animate-bounce" />}
          {highlight === 'loss' && <TrendingDown size={16} />}
          {!highlight && <span className="text-lg">🪙</span>}
          
          <span className="font-bold">{userCoins}</span> Moedas
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink to="/" className={navClass}>
          <LayoutDashboard size={20} />
          Painel
        </NavLink>
        <NavLink to="/earn" className={navClass}>
          <PlayCircle size={20} />
          Ganhar Moedas
        </NavLink>
        <NavLink to="/campaigns" className={navClass}>
          <PlusCircle size={20} />
          Minhas Campanhas
        </NavLink>
        <NavLink to="/store" className={navClass}>
          <ShoppingCart size={20} />
          Loja de Moedas
        </NavLink>
        <NavLink to="/history" className={navClass}>
          <History size={20} />
          Histórico
        </NavLink>

        {userRole === UserRole.ADMIN && (
          <div className="mt-8 pt-4 border-t border-gray-800">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Administração
            </p>
            <NavLink to="/admin" className={navClass}>
              <Settings size={20} />
              Painel Admin
            </NavLink>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <button 
          onClick={handleShare}
          className="flex items-center gap-3 px-4 py-3 w-full text-blue-400 bg-blue-900/10 hover:bg-blue-900/30 border border-blue-900/30 rounded-lg transition-colors font-medium"
        >
          <Share2 size={20} />
          Compartilhar App
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;