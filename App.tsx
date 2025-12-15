import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Earn from './pages/Earn';
import Campaigns from './pages/Campaigns';
import Store from './pages/Store';
import HistoryPage from './pages/History';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import { db } from './services/storage';
import { botService } from './services/botService'; // Import Bot Service
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = db.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);

    // Iniciar os robôs de visualização
    botService.start();

    // Limpar robôs ao fechar/desmontar
    return () => {
      botService.stop();
    };
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <Router>
      <div className="flex bg-gray-900 min-h-screen">
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onLogin={setUser} />} />
          
          <Route
            path="*"
            element={
              user ? (
                <>
                  <Sidebar userRole={user.role} userCoins={user.coins} />
                  <main className="ml-64 flex-1">
                    <Routes>
                      <Route path="/" element={<Dashboard user={user} />} />
                      <Route path="/earn" element={<Earn user={user} onUpdateUser={handleUpdateUser} />} />
                      <Route path="/campaigns" element={<Campaigns user={user} onUpdateUser={handleUpdateUser} />} />
                      <Route path="/store" element={<Store user={user} onUpdateUser={handleUpdateUser} />} />
                      <Route path="/history" element={<HistoryPage user={user} />} />
                      <Route 
                        path="/admin" 
                        element={
                          user.role === UserRole.ADMIN 
                            ? <Admin user={user} /> 
                            : <Navigate to="/" replace />
                        } 
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;