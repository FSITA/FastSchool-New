/**
 * Client Type Rotation for YouTube Innertube API
 * Different client types may have different success rates
 */

export interface ClientConfig {
  name: 'WEB' | 'ANDROID' | 'IOS';
  version: string;
  clientName: string;
  clientVersion: string;
  userAgent: string;
}

export const CLIENT_CONFIGS: ClientConfig[] = [
  {
    name: 'WEB',
    version: '2.0',
    clientName: 'WEB',
    clientVersion: '2.0',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    name: 'ANDROID',
    version: '20.10.38',
    clientName: 'ANDROID',
    clientVersion: '20.10.38',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },
  {
    name: 'IOS',
    version: '20.10.38',
    clientName: 'IOS',
    clientVersion: '20.10.38',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  },
];

/**
 * Get client config - try ANDROID first (most reliable), then WEB, then IOS
 */
let currentClientIndex = 1; // Start with ANDROID (index 1)

export function getClientConfig(): ClientConfig {
  return CLIENT_CONFIGS[currentClientIndex];
}

/**
 * Rotate to next client config
 */
export function rotateClientConfig(): ClientConfig {
  currentClientIndex = (currentClientIndex + 1) % CLIENT_CONFIGS.length;
  console.log(`🔄 [ClientTypes] Rotated to client: ${CLIENT_CONFIGS[currentClientIndex].name}`);
  return CLIENT_CONFIGS[currentClientIndex];
}

/**
 * Reset to default client (ANDROID)
 */
export function resetClientConfig(): void {
  currentClientIndex = 1; // ANDROID
  console.log(`🔄 [ClientTypes] Reset to default client: ANDROID`);
}

/**
 * Get client config by name
 */
export function getClientConfigByName(name: 'WEB' | 'ANDROID' | 'IOS'): ClientConfig {
  const config = CLIENT_CONFIGS.find(c => c.name === name);
  return config || CLIENT_CONFIGS[1]; // Default to ANDROID
}

