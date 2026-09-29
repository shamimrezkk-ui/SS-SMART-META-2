import { GeminiKey } from '../types';

const STORAGE_KEY = 'thikana_gemini_api_keys';

export function maskKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

export function loadStoredKeys(): GeminiKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load stored API keys from localStorage', err);
  }
  return [];
}

export function saveStoredKeys(keys: GeminiKey[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to save API keys to localStorage', err);
  }
}

export function validateApiKey(key: string, existingKeys: GeminiKey[]): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, error: 'API key cannot be empty' };
  }
  if (trimmed.length < 15) {
    return { valid: false, error: 'Key appears too short to be a valid Gemini API key' };
  }
  const isDuplicate = existingKeys.some((k) => k.fullKey === trimmed);
  if (isDuplicate) {
    return { valid: false, error: 'This API key has already been added' };
  }
  return { valid: true };
}

// Rotation state kept in memory
let rotationIndex = 0;

export function getNextAvailableKey(keys: GeminiKey[]): { key: string | null; keyId?: string } {
  if (!keys || keys.length === 0) {
    return { key: null };
  }

  const now = Date.now();
  // Filter keys not currently rate limited
  const validKeys = keys.filter((k) => {
    if (k.status === 'invalid') return false;
    if (k.rateLimitedUntil && k.rateLimitedUntil > now) return false;
    return true;
  });

  if (validKeys.length === 0) {
    // All stored keys might be temporarily rate limited; fall back to the first stored key or null
    const firstKey = keys[0];
    return { key: firstKey.fullKey, keyId: firstKey.id };
  }

  rotationIndex = rotationIndex % validKeys.length;
  const selected = validKeys[rotationIndex];
  rotationIndex = (rotationIndex + 1) % validKeys.length;

  return { key: selected.fullKey, keyId: selected.id };
}

export function markKeyRateLimited(keyId: string, keys: GeminiKey[], durationMs: number = 30000): GeminiKey[] {
  const updated = keys.map((k) => {
    if (k.id === keyId) {
      return {
        ...k,
        status: 'rate_limited' as const,
        rateLimitedUntil: Date.now() + durationMs,
      };
    }
    return k;
  });
  saveStoredKeys(updated);
  return updated;
}

export async function testGeminiApiKey(apiKey?: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey?.trim() }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: 'CONNECTED' };
    }
    return {
      success: false,
      message: 'NOT CONNECTED',
      error: data.error || 'Connection failed',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'NOT CONNECTED',
      error: error?.message || 'Network error',
    };
  }
}
