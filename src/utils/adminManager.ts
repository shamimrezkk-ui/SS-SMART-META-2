import { AdminLinks } from '../types';

const ADMIN_STORAGE_KEY = 'ss_smart_meta_2_admin_links';

export const DEFAULT_ADMIN_LINKS: AdminLinks = {
  siteName: 'SS SMART META 2',
  followPageUrl: 'https://facebook.com/thikanatech',
  tutorialUrl: 'https://youtube.com',
  contactEmail: 'shamimrezkk@gmail.com',
  contactUrl: 'https://t.me/thikanatech',
  upgradeUrl: 'https://thikanatech.com/upgrade',
  unlimitedUrl: 'https://thikanatech.com/unlimited',
  telegramUrl: 'https://t.me/thikanatech',
  fastGenerationSpeed: true,
};

export function loadAdminLinks(): AdminLinks {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_LINKS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADMIN_LINKS, ...parsed };
  } catch {
    return DEFAULT_ADMIN_LINKS;
  }
}

export function saveAdminLinks(links: AdminLinks): void {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(links));
  } catch (e) {
    console.error('Failed to save admin links:', e);
  }
}
