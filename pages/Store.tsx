import React, { useEffect, useState } from 'react';
import { CoinPackage, User, Transaction, PaymentMethod } from '../types';
import { db } from '../services/storage';
import { ShoppingBag, Star, X, QrCode, CreditCard, Copy, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';

interface StoreProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

type CheckoutStep = 'SELECT_METHOD' | 'PAYMENT_DETAILS' | 'PROCESSING' | 'SUCCESS';

const Store: React.FC<StoreProps> = ({ user, onUpdateUser }) => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  
  // Checkout State
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('SELECT_METHOD');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  
  // Fake Pix Data
  const [pixCode, setPixCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Form Data
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    setPackages(db.getPackages());
  }, []);

  const openCheckout = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setStep('SELECT_METHOD');
    setMethod(PaymentMethod.PIX);
    setIsModalOpen(true);
    // Generate a fake random Pix Copy Paste code
    setPixCode(`00020126580014br.gov.bcb.pix0136${Date.now()}-socialboost-uuid-520400005303986540${pkg.price.toFixed(2).replace('.', '')}5802BR5913SocialBoostPro6009SaoPaulo62070503***6304`);
  };

  const closeCheckout = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setCopied(false);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processPayment = () => {
    setStep('PROCESSING');

    // Simulate API delay with PagSeguro
    setTimeout(() => {
      if (selectedPackage) {
        // 1. Update Balance
        const updatedUser = db.updateUserBalance(user.id, selectedPackage.coins);
        if (updatedUser) {
          onUpdateUser(updatedUser);

          // 2. Log Transaction
          const transaction: Transaction = {
            id: Date.now().toString(),
            userId: user.id,
            amount: selectedPackage.coins,
            type: 'PURCHASE',
            description: `Compra: ${selectedPackage.name} via ${method === PaymentMethod.PIX ? 'Pix' : 'Cartão'}`,
            timestamp: Date.now()
          };
          db.addTransaction(transaction);
          
          setStep('SUCCESS');
        }
      }
    }, 3000);
  };

  return (
    <div className="p-8 relative">
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Loja de Moedas</h2>
        <p className="text-gray-400">Impulsione suas campanhas comprando mais moedas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {packages.map((pkg) => (
          <div 
            key={pkg.id} 
            className={`relative bg-gray-800 rounded-2xl p-8 border ${pkg.featured ? 'border-yellow-500/50 shadow-yellow-500/10 shadow-2xl scale-105' : 'border-gray-700'} flex flex-col items-center transition-transform hover:-translate-y-2`}
          >
            {pkg.featured && (
              <div className="absolute -top-4 bg-yellow-500 text-black text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Star size={12} fill="black" /> MELHOR VALOR
              </div>
            )}
            
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <span className="text-2xl font-bold text-black">$</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-6">
              {pkg.coins.toLocaleString()} <span className="text-lg font-medium text-gray-500">Moedas</span>
            </div>

            <ul className="text-gray-400 text-sm space-y-3 mb-8 w-full text-center">
              <li>Entrega Imediata</li>
              <li>Pagamento Seguro</li>
              <li>Suporte 24/7</li>
            </ul>

            <button 
              onClick={() => openCheckout(pkg)}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                pkg.featured 
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <ShoppingBag size={18} />
              Comprar por R$ {pkg.price.toFixed(2).replace('.', ',')}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {isModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-gray-800 relative">
            
            {/* Header */}
            <div className="bg-[#96c12e] p-4 flex justify-between items-center text-white shadow-md">
              <div className="flex items-center gap-2">
                 <ShieldCheck size={20} />
                 <span className="font-bold">Checkout Seguro PagBank</span>
              </div>
              <button onClick={closeCheckout} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              
              {/* Summary */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Item</p>
                  <p className="font-bold text-lg">{selectedPackage.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-xl text-[#00a3e0]">R$ {selectedPackage.price.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              {step === 'SELECT_METHOD' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Escolha a forma de pagamento:</h3>
                  
                  <button 
                    onClick={() => { setMethod(PaymentMethod.PIX); setStep('PAYMENT_DETAILS'); }}
                    className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-[#32bcad] hover:bg-[#32bcad]/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#32bcad]/20 p-2 rounded-lg text-[#32bcad]">
                        <QrCode size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800">Pix</p>
                        <p className="text-xs text-green-600 font-semibold">Aprovação Imediata</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-[#32bcad]" />
                  </button>

                  <button 
                    onClick={() => { setMethod(PaymentMethod.CREDIT_CARD); setStep('PAYMENT_DETAILS'); }}
                    className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-[#1a4176] hover:bg-[#1a4176]/5 transition-all group"
                  >
                     <div className="flex items-center gap-4">
                      <div className="bg-[#1a4176]/20 p-2 rounded-lg text-[#1a4176]">
                        <CreditCard size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800">Cartão de Crédito</p>
                        <p className="text-xs text-gray-500">Em até 3x sem juros</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-[#1a4176]" />
                  </button>
                  
                  <div className="mt-4 flex justify-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/PagSeguro_logo.svg/1200px-PagSeguro_logo.svg.png" alt="PagSeguro" className="h-6 opacity-60" />
                  </div>
                </div>
              )}

              {step === 'PAYMENT_DETAILS' && method === PaymentMethod.PIX && (
                <div className="animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">Pague com Pix</h3>
                    <p className="text-sm text-gray-500">Escaneie o QR Code ou use o Copia e Cola</p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="border-4 border-[#32bcad] p-2 rounded-xl">
                      {/* Placeholder for QR Code generation */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pixCode}`} 
                        alt="QR Pix" 
                        className="w-40 h-40"
                      />
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Pix Copia e Cola</label>
                    <div className="flex">
                      <input 
                        readOnly 
                        value={pixCode} 
                        className="w-full bg-gray-100 border border-gray-300 text-gray-500 text-xs p-3 rounded-l-lg outline-none font-mono"
                      />
                      <button 
                        onClick={handleCopyPix}
                        className="bg-[#32bcad] hover:bg-[#28998d] text-white px-4 rounded-r-lg transition-colors flex items-center"
                      >
                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={processPayment}
                    className="w-full bg-[#32bcad] hover:bg-[#28998d] text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    Já realizei o pagamento
                  </button>
                  
                  <button onClick={() => setStep('SELECT_METHOD')} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-800">
                    Voltar
                  </button>
                </div>
              )}

              {step === 'PAYMENT_DETAILS' && method === PaymentMethod.CREDIT_CARD && (
                <div className="animate-fade-in space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg mb-4">Dados do Cartão</h3>
                  
                  <div>
                    <input 
                      type="text" 
                      placeholder="Número do Cartão"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#1a4176] focus:outline-none transition-colors"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val.substring(0, 19));
                      }}
                    />
                  </div>

                  <div>
                     <input 
                      type="text" 
                      placeholder="Nome impresso no cartão"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#1a4176] focus:outline-none transition-colors uppercase"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="MM/AA"
                      className="w-1/2 p-3 border border-gray-300 rounded-lg focus:border-[#1a4176] focus:outline-none transition-colors"
                      value={cardExpiry}
                      onChange={(e) => {
                         let val = e.target.value.replace(/\D/g, '');
                         if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                         setCardExpiry(val);
                      }}
                    />
                     <input 
                      type="text" 
                      placeholder="CVV"
                      maxLength={3}
                      className="w-1/2 p-3 border border-gray-300 rounded-lg focus:border-[#1a4176] focus:outline-none transition-colors"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={processPayment}
                      disabled={cardNumber.length < 15 || cardCvv.length < 3 || !cardName}
                      className="w-full bg-[#1a4176] hover:bg-[#14325a] disabled:bg-gray-400 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                    >
                      Pagar R$ {selectedPackage.price.toFixed(2).replace('.', ',')}
                    </button>
                    <button onClick={() => setStep('SELECT_METHOD')} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-800">
                      Voltar
                    </button>
                  </div>
                </div>
              )}

              {step === 'PROCESSING' && (
                <div className="text-center py-8 animate-fade-in">
                  <div className="flex justify-center mb-6">
                    <Loader2 size={64} className="text-[#00a3e0] animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Processando Pagamento...</h3>
                  <p className="text-gray-500">Aguardando confirmação do PagSeguro</p>
                </div>
              )}

              {step === 'SUCCESS' && (
                <div className="text-center py-8 animate-fade-in">
                   <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full">
                       <CheckCircle size={64} className="text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Pagamento Aprovado!</h3>
                  <p className="text-gray-600 mb-6">Suas {selectedPackage.coins.toLocaleString()} moedas foram adicionadas.</p>
                  
                  <button 
                    onClick={closeCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>

            {/* Footer Brand */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Lock size={10} /> Ambiente seguro criptografado
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icon
const Lock = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default Store;