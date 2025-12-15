export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum Platform {
  YOUTUBE = 'YOUTUBE',
  SPOTIFY = 'SPOTIFY',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
  KWAI = 'KWAI'
}

export enum CampaignActionType {
  VIEW = 'VIEW',     // Watch, Like, Visit
  FOLLOW = 'FOLLOW'  // Subscribe, Follow
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  coins: number;
}

export interface Campaign {
  id: string;
  userId: string;
  platform: Platform;
  actionType: CampaignActionType; // New field
  url: string;
  description: string;
  rewardPerAction: number; // Cost to owner, reward to viewer
  totalActions: number;
  completedActions: number;
  active: boolean;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  featured?: boolean;
}

export interface SystemConfig {
  coinPriceMultiplier: number; // For store
  minRewardPerTask: number;
  taskFeePercent: number; // Admin fee taken from reward
}

export type TransactionType = 'EARN' | 'SPEND' | 'PURCHASE' | 'BONUS';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: number;
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD'
}