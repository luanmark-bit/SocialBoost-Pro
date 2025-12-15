import React, { useEffect, useState } from 'react';
import { User, Transaction } from '../types';
import { db } from '../services/storage';
import { ArrowDownLeft, ArrowUpRight, ShoppingCart, Gift } from 'lucide-react';

interface HistoryProps {
  user: User;
}

const HistoryPage: React.FC<HistoryProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(db.getTransactions(user.id));
  }, [user.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'EARN':
        return <ArrowDownLeft className="text-green-400" size={20} />;
      case 'SPEND':
        return <ArrowUpRight className="text-red-400" size={20} />;
      case 'PURCHASE':
        return <ShoppingCart className="text-yellow-400" size={20} />;
      case 'BONUS':
        return <Gift className="text-purple-400" size={20} />;
      default:
        return <ArrowUpRight className="text-gray-400" size={20} />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'EARN':
      case 'PURCHASE':
      case 'BONUS':
        return 'text-green-400';
      case 'SPEND':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-2">Histórico de Transações</h2>
      <p className="text-gray-400 mb-8">Acompanhe todas as suas entradas e saídas de moedas.</p>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="text-gray-500 uppercase text-xs bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-900 p-2 rounded-lg border border-gray-700">
                          {getIcon(tx.type)}
                        </div>
                        <span className="text-sm font-medium">
                          {tx.type === 'EARN' && 'Ganho'}
                          {tx.type === 'SPEND' && 'Gasto'}
                          {tx.type === 'PURCHASE' && 'Compra'}
                          {tx.type === 'BONUS' && 'Bônus'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString('pt-BR')} {' '}
                      <span className="text-xs">{new Date(tx.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${getAmountColor(tx.type)}`}>
                      {tx.type === 'SPEND' ? '-' : '+'}{tx.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;