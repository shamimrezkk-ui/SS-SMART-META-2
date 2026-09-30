export type PlatformType =
  | 'General'
  | 'AdobeStock'
  | 'Magnific'
  | 'Shutterstock'
  | 'Vecteezy'
  | 'Depositphotos'
  | '123RF'
  | 'Dreamstime'
  | 'Freepik'
  | 'iStock';

export type ItemStatus = 'WAITING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface ImageItem {
  id: string;
  name: string;
  size: number; // in bytes
  format: string; // e.g. "JPG", "PNG"
  previewUrl: string;
  base64?: string;
  mimeType?: string;
  status: ItemStatus;
  retryCount: number;
  error?: string;
  title: string;
  description: string;
  keywords: string[];
  category?: string;
  selected: boolean;
  fileHandle?: any; // FileSystemFileHandle for in-place direct writing without duplicates
  originalFile?: File;
  originalName?: string;
  source?: 'gemini' | 'instant_engine';
}

export interface PromptItem {
  id: string;
  name: string;
  size: number;
  format: string;
  previewUrl: string;
  base64?: string;
  status: ItemStatus;
  prompt: string;
  shortPrompt?: string;
  negativePrompt?: string;
  styleTags?: string[];
  error?: string;
  selected?: boolean;
}

export interface AdminLinks {
  siteName: string;
  followPageUrl: string;
  tutorialUrl: string;
  contactEmail: string;
  contactUrl: string;
  upgradeUrl: string;
  unlimitedUrl: string;
  telegramUrl: string;
  fastGenerationSpeed: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  isLoggedIn: boolean;
  plan: 'Free' | 'Pro' | 'Ultra';
}

export interface GeminiKey {
  id: string;
  masked: string;
  fullKey: string;
  addedAt: number;
  status: 'active' | 'rate_limited' | 'invalid';
  rateLimitedUntil?: number;
}

export interface AppSettings {
  settingsActive: boolean;
  titleWordsMin: number;
  titleWordsMax: number;
  keywordsMin: number;
  keywordsMax: number;
  descriptionMin: number;
  descriptionMax: number;
  customPrompt: string;
  transparentBackground: boolean;
  silhouette: boolean;
  singleWordKeywords: boolean;
}

export type MediaType = 'Images' | 'Vectors' | 'Videos';
