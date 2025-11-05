/**
 * Request Utilities for YouTube transcript fetching
 * Includes retry logic, delays, and header generation
 */

import { getRandomUserAgent, getUserAgentForClient } from './user-agents';
import type { ClientConfig } from './client-types';
import { cookieManager } from './cookie-manager';

/**
 * Random delay between min and max seconds
 */
export function randomDelay(minSeconds: number, maxSeconds: number): Promise<void> {
  const delayMs = (Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds) * 1000;
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Delay for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  context: string = 'request'
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 [${context}] Attempt ${attempt + 1}/${maxRetries}`);
      
      const response = await fetch(url, options);
      
      // Success - return immediately
      if (response.ok) {
        console.log(`✅ [${context}] Success on attempt ${attempt + 1}`);
        return response;
      }
      
      // Rate limiting or server error - retry with backoff
      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        const backoffMs = 2000 * Math.pow(2, attempt); // Exponential: 2s, 4s, 8s
        console.log(`⏳ [${context}] Rate limited (${response.status}), retrying in ${backoffMs}ms...`);
        
        if (attempt < maxRetries - 1) {
          await delay(backoffMs);
          continue;
        }
      }
      
      // Other errors - don't retry
      return response;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [${context}] Attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt < maxRetries - 1) {
        const backoffMs = 2000 * Math.pow(2, attempt);
        console.log(`⏳ [${context}] Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} attempts`);
}

/**
 * Generate headers for YouTube requests
 */
export function generateHeaders(
  userAgent: string,
  cookies: string,
  referer: string,
  clientConfig: ClientConfig,
  isApiRequest: boolean = false
): HeadersInit {
  const headers: HeadersInit = {
    'User-Agent': userAgent,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'Cookie': cookies,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'DNT': '1',
  };

  if (isApiRequest) {
    // API request headers
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json, text/plain, */*';
    headers['Origin'] = 'https://www.youtube.com';
    
    // Client-specific headers
    if (clientConfig.name === 'WEB') {
      headers['x-youtube-client-name'] = '1';
      headers['x-youtube-client-version'] = clientConfig.version;
    }
  } else {
    // Page request headers
    headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = referer.includes('youtube.com') ? 'same-origin' : 'cross-site';
    headers['Sec-Fetch-User'] = '?1';
    headers['Upgrade-Insecure-Requests'] = '1';
    
    // Browser-specific headers
    if (userAgent.includes('Chrome')) {
      headers['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
      headers['Sec-Ch-Ua-Mobile'] = '?0';
      headers['Sec-Ch-Ua-Platform'] = userAgent.includes('Windows') ? '"Windows"' : userAgent.includes('Mac') ? '"macOS"' : '"Linux"';
    }
  }

  return headers;
}

/**
 * Check if response indicates blocking
 * IMPORTANT: Check for INNERTUBE_API_KEY FIRST - if it exists, we can proceed
 */
export function isBlockedResponse(html: string): { blocked: boolean; reason?: string } {
  // FIRST: Check if we have the API key - if yes, we can proceed even with warnings
  const hasApiKey = html.includes('INNERTUBE_API_KEY') || html.includes('"INNERTUBE_API_KEY"');
  
  if (hasApiKey) {
    // Even if there are blocking indicators, if we have the API key, proceed
    console.log('✅ [isBlockedResponse] INNERTUBE_API_KEY found - proceeding despite any warnings');
    return { blocked: false };
  }
  
  // If no API key, check for blocking indicators
  const lowerHtml = html.toLowerCase();
  
  // Consent pages - check for actual consent page structure
  if (lowerHtml.includes('consent.google.com') || lowerHtml.includes('consent.youtube.com')) {
    return { blocked: true, reason: 'consent_page' };
  }
  
  // Bot detection - check for actual bot detection messages
  if (lowerHtml.includes('unusual traffic') || (lowerHtml.includes('bot') && lowerHtml.includes('detection'))) {
    return { blocked: true, reason: 'bot_detection' };
  }
  
  // Age verification - check for actual age verification
  if (lowerHtml.includes('age verification') || lowerHtml.includes('age-restricted')) {
    return { blocked: true, reason: 'age_verification' };
  }
  
  // Captcha - be very specific, only block if it's a REAL captcha page
  // YouTube HTML might contain "captcha" in comments or scripts, but not be a captcha page
  const isRealCaptcha = lowerHtml.includes('recaptcha') || 
                        lowerHtml.includes('google.com/recaptcha') ||
                        lowerHtml.includes('challenge-platform') ||
                        (lowerHtml.includes('captcha') && lowerHtml.includes('iframe') && !hasApiKey);
  
  if (isRealCaptcha) {
    return { blocked: true, reason: 'captcha' };
  }
  
  // Suspiciously short response - only block if REALLY short and no API key
  if (html.length < 5000 && !hasApiKey) {
    return { blocked: true, reason: 'suspiciously_short' };
  }
  
  return { blocked: false };
}

/**
 * Two-step request flow: homepage → video page
 */
export async function twoStepRequestFlow(
  videoId: string,
  clientConfig: ClientConfig,
  cookies: string
): Promise<{ html: string; cookies: string }> {
  const userAgent = getUserAgentForClient(clientConfig.name);
  
  // Step 1: Visit YouTube homepage to establish session
  console.log(`📋 [TwoStepFlow] Step 1: Visiting YouTube homepage...`);
  await randomDelay(1, 3); // 1-3 second delay
  
  const homeResponse = await fetchWithRetry(
    'https://www.youtube.com/',
    {
      method: 'GET',
      headers: generateHeaders(userAgent, cookies, 'https://www.google.com/', clientConfig, false),
    },
    2,
    'homepage'
  );
  
  // Extract cookies from homepage response
  const homeCookies = cookieManager.extractCookiesFromResponse(homeResponse);
  const finalCookies = homeCookies.length > 0 ? homeCookies.join('; ') : cookies;
  
  if (homeCookies.length > 0) {
    cookieManager.updateCookies(homeCookies);
    console.log(`🍪 [TwoStepFlow] Extracted ${homeCookies.length} cookies from homepage`);
  }
  
  // Step 2: Visit video page with cookies
  console.log(`📋 [TwoStepFlow] Step 2: Visiting video page...`);
  await randomDelay(2, 4); // 2-4 second delay
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const videoResponse = await fetchWithRetry(
    videoUrl,
    {
      method: 'GET',
      headers: generateHeaders(userAgent, finalCookies, 'https://www.youtube.com/', clientConfig, false),
    },
    2,
    'video_page'
  );
  
  const html = await videoResponse.text();
  
  // Check for blocking - but don't throw if we can extract API key
  const blockCheck = isBlockedResponse(html);
  if (blockCheck.blocked) {
    // Double-check: maybe the API key is there but in a different format
    const hasApiKey = html.includes('INNERTUBE_API_KEY') || 
                      html.includes('"INNERTUBE_API_KEY"') ||
                      html.match(/INNERTUBE_API_KEY['"]\s*:\s*['"]/);
    
    if (!hasApiKey) {
      console.log(`⚠️ [TwoStepFlow] Request blocked: ${blockCheck.reason} (no API key found)`);
      throw new Error(`Request blocked: ${blockCheck.reason}`);
    } else {
      console.log(`⚠️ [TwoStepFlow] Block detected (${blockCheck.reason}) but API key found - proceeding`);
    }
  }
  
  return { html, cookies: finalCookies };
}

