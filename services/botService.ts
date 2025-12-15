import { db } from './storage';
import { Campaign, CampaignActionType } from '../types';

class BotService {
  private intervalId: number | null = null;
  // Aumentei a velocidade: Robôs verificam a cada 2 segundos (era 5s)
  private readonly TICK_RATE = 2000; 
  
  // Aumentei significativamente as probabilidades
  // 65% de chance de view por ciclo (era 30%)
  // 25% de chance de follow por ciclo (era 10%)
  private readonly CHANCE_VIEW = 0.65;   
  private readonly CHANCE_FOLLOW = 0.25; 

  start() {
    if (this.intervalId) return;
    console.log('🤖 Bot Service Iniciado: Simulando alto tráfego...');
    
    this.intervalId = window.setInterval(() => {
      this.runBotCycle();
    }, this.TICK_RATE);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private runBotCycle() {
    const campaigns = db.getCampaigns();
    let hasUpdates = false;

    const updatedCampaigns = campaigns.map((camp: Campaign) => {
      // Ignorar campanhas inativas ou completas
      if (!camp.active || camp.completedActions >= camp.totalActions) {
        return camp;
      }

      // Determinar a probabilidade baseada no tipo de ação
      const actionChance = camp.actionType === CampaignActionType.FOLLOW 
        ? this.CHANCE_FOLLOW 
        : this.CHANCE_VIEW;

      // Sorteio para ver se o bot age nesta campanha agora
      if (Math.random() < actionChance) {
        hasUpdates = true;
        
        const newCompleted = camp.completedActions + 1;
        const isActive = newCompleted < camp.totalActions;
        
        return {
          ...camp,
          completedActions: newCompleted,
          active: isActive
        };
      }

      return camp;
    });

    if (hasUpdates) {
      // Salvar todas as campanhas de uma vez para eficiência
      localStorage.setItem('sb_campaigns', JSON.stringify(updatedCampaigns));
      
      // Disparar um evento customizado para que a UI saiba que deve atualizar
      window.dispatchEvent(new Event('campaigns-updated'));
    }
  }
}

export const botService = new BotService();