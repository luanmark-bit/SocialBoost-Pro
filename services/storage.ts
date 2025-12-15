import { User, Campaign, CoinPackage, SystemConfig, UserRole, Platform, Transaction, CampaignActionType } from '../types';

// Initial Mock Data
const INITIAL_PACKAGES: CoinPackage[] = [
  { id: 'pkg1', name: 'Pacote Inicial', coins: 500, price: 4.99 },
  { id: 'pkg2', name: 'Impulso Pro', coins: 1200, price: 9.99, featured: true },
  { id: 'pkg3', name: 'Influenciador', coins: 5000, price: 39.99 },
];

const INITIAL_CONFIG: SystemConfig = {
  coinPriceMultiplier: 1.0,
  minRewardPerTask: 5,
  taskFeePercent: 10,
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    userId: 'demo_user',
    platform: Platform.YOUTUBE,
    actionType: CampaignActionType.VIEW,
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Assista meu novo clipe!',
    rewardPerAction: 10,
    totalActions: 100,
    completedActions: 45,
    active: true
  },
  {
    id: 'c2',
    userId: 'demo_user_2',
    platform: Platform.INSTAGRAM,
    actionType: CampaignActionType.FOLLOW,
    url: 'https://instagram.com/instagram',
    description: 'Siga meu perfil oficial',
    rewardPerAction: 15,
    totalActions: 50,
    completedActions: 12,
    active: true
  },
  {
    id: 'c3',
    userId: 'demo_user_3',
    platform: Platform.TIKTOK,
    actionType: CampaignActionType.VIEW,
    url: 'https://tiktok.com/@user/video/123',
    description: 'Dueto com essa trend!',
    rewardPerAction: 8,
    totalActions: 200,
    completedActions: 150,
    active: true
  },
  {
    id: 'c4',
    userId: 'demo_user_4',
    platform: Platform.KWAI,
    actionType: CampaignActionType.FOLLOW,
    url: 'https://kwai.com/@influencer',
    description: 'Me ajude a bater 10k no Kwai',
    rewardPerAction: 12,
    totalActions: 80,
    completedActions: 20,
    active: true
  }
];

// Helper to manage local storage
class StorageService {
  private getUserKey = () => 'sb_user'; // Current session user
  private getUsersDbKey = () => 'sb_users_db'; // All users database
  private getCampaignsKey = () => 'sb_campaigns';
  private getPackagesKey = () => 'sb_packages';
  private getConfigKey = () => 'sb_config';
  private getTransactionsKey = () => 'sb_transactions';

  // --- Auth & Users DB ---
  
  // Get all users from DB
  getAllUsers(): User[] {
    const data = localStorage.getItem(this.getUsersDbKey());
    return data ? JSON.parse(data) : [];
  }

  // Save/Update a user in DB
  saveUser(user: User) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(this.getUsersDbKey(), JSON.stringify(users));

    // If we are updating the currently logged in user, update session too
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  getUserByUsername(username: string): User | undefined {
    return this.getAllUsers().find(u => u.username === username);
  }

  // Current Session Management
  getCurrentUser(): User | null {
    const data = localStorage.getItem(this.getUserKey());
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(this.getUserKey(), JSON.stringify(user));
    } else {
      localStorage.removeItem(this.getUserKey());
    }
  }

  // Updated to support Admin editing ANY user
  updateUserBalance(userId: string, amount: number) {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
      user.coins += amount;
      this.saveUser(user); // Handles DB and Session sync
      return user;
    }
    return null;
  }

  // Admin: Set exact coin amount
  setUserCoins(userId: string, coins: number) {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
      user.coins = coins;
      this.saveUser(user);
      return user;
    }
    return null;
  }

  // --- Campaigns ---
  getCampaigns(): Campaign[] {
    const data = localStorage.getItem(this.getCampaignsKey());
    // Migration helper: if old data exists without actionType, add default
    let campaigns = data ? JSON.parse(data) : INITIAL_CAMPAIGNS;
    campaigns = campaigns.map((c: any) => ({
      ...c,
      actionType: c.actionType || CampaignActionType.VIEW
    }));
    return campaigns;
  }

  saveCampaign(campaign: Campaign) {
    const campaigns = this.getCampaigns();
    const existingIndex = campaigns.findIndex(c => c.id === campaign.id);
    
    if (existingIndex >= 0) {
      campaigns[existingIndex] = campaign;
    } else {
      campaigns.push(campaign);
    }
    
    localStorage.setItem(this.getCampaignsKey(), JSON.stringify(campaigns));
  }

  deleteCampaign(id: string) {
    const campaigns = this.getCampaigns().filter(c => c.id !== id);
    localStorage.setItem(this.getCampaignsKey(), JSON.stringify(campaigns));
  }

  // --- Config (Admin) ---
  getConfig(): SystemConfig {
    const data = localStorage.getItem(this.getConfigKey());
    return data ? JSON.parse(data) : INITIAL_CONFIG;
  }

  saveConfig(config: SystemConfig) {
    localStorage.setItem(this.getConfigKey(), JSON.stringify(config));
  }

  // --- Packages (Admin) ---
  getPackages(): CoinPackage[] {
    const data = localStorage.getItem(this.getPackagesKey());
    return data ? JSON.parse(data) : INITIAL_PACKAGES;
  }

  savePackage(pkg: CoinPackage) {
    const packages = this.getPackages();
    const index = packages.findIndex(p => p.id === pkg.id);
    if (index >= 0) {
      packages[index] = pkg;
    } else {
      packages.push(pkg);
    }
    localStorage.setItem(this.getPackagesKey(), JSON.stringify(packages));
  }

  // --- Transactions ---
  getTransactions(userId: string): Transaction[] {
    const data = localStorage.getItem(this.getTransactionsKey());
    const allTransactions: Transaction[] = data ? JSON.parse(data) : [];
    // Return sorted by newest first
    return allTransactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  addTransaction(transaction: Transaction) {
    const data = localStorage.getItem(this.getTransactionsKey());
    const allTransactions: Transaction[] = data ? JSON.parse(data) : [];
    allTransactions.push(transaction);
    localStorage.setItem(this.getTransactionsKey(), JSON.stringify(allTransactions));
  }
}

export const db = new StorageService();