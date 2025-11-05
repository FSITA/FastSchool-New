/**
 * Cookie Manager for YouTube transcript fetching
 * Handles cookie extraction, storage, and reuse to avoid consent/age gate blocks
 */

interface CookieJar {
  cookies: string[];
  expiresAt: number;
}

class CookieManager {
  private jar: CookieJar | null = null;
  private readonly COOKIE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Extract cookies from Set-Cookie headers
   */
  extractCookies(setCookieHeaders: string[]): string[] {
    const cookies: string[] = [];
    
    for (const cookieHeader of setCookieHeaders) {
      // Extract name=value part (before first semicolon)
      const nameValue = cookieHeader.split(';')[0].trim();
      if (nameValue) {
        cookies.push(nameValue);
      }
    }
    
    // Always include default consent cookies if not present
    const cookieString = cookies.join('; ');
    if (!cookieString.includes('CONSENT=')) {
      cookies.push('CONSENT=YES+cb.20210328-17-p0.en+FX+667');
    }
    
    return cookies;
  }

  /**
   * Get cookies from jar or return default
   */
  getCookies(): string {
    if (this.jar && this.jar.expiresAt > Date.now()) {
      return this.jar.cookies.join('; ');
    }
    
    // Return default cookies
    return 'CONSENT=YES+cb.20210328-17-p0.en+FX+667; YSC=dQw4w9WgXcQ; VISITOR_INFO1_LIVE=f0wojS1_1Zo; PREF=f4=4000000&tz=UTC';
  }

  /**
   * Update cookie jar with new cookies
   */
  updateCookies(newCookies: string[]): void {
    this.jar = {
      cookies: newCookies,
      expiresAt: Date.now() + this.COOKIE_TTL,
    };
    console.log(`🍪 [CookieManager] Updated cookie jar with ${newCookies.length} cookies`);
  }

  /**
   * Extract cookies from Response headers
   */
  extractCookiesFromResponse(response: Response): string[] {
    const setCookieHeaders: string[] = [];
    
    // Try getSetCookie if available (Node.js 18+)
    if (typeof response.headers.getSetCookie === 'function') {
      const setCookies = response.headers.getSetCookie();
      if (setCookies.length > 0) {
        console.log(`🍪 [CookieManager] Found ${setCookies.length} cookies via getSetCookie()`);
        return this.extractCookies(setCookies);
      }
    }
    
    // Fallback: Try to get Set-Cookie headers manually
    // Note: In Node.js fetch, Set-Cookie headers might be in headers array
    const headerEntries = Array.from(response.headers.entries());
    for (const [key, value] of headerEntries) {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    }
    
    // Also check for multiple set-cookie headers (some implementations return arrays)
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // If it's a string, split by comma (some servers send multiple)
      if (typeof setCookieHeader === 'string') {
        setCookieHeaders.push(setCookieHeader);
      } else if (Array.isArray(setCookieHeader)) {
        setCookieHeaders.push(...setCookieHeader);
      }
    }
    
    if (setCookieHeaders.length > 0) {
      console.log(`🍪 [CookieManager] Found ${setCookieHeaders.length} cookies via header inspection`);
      return this.extractCookies(setCookieHeaders);
    }
    
    // If no cookies found, return current cookies (don't lose existing ones)
    console.log(`🍪 [CookieManager] No new cookies found, keeping existing cookies`);
    return this.getCookies().split('; ');
  }

  /**
   * Clear cookie jar
   */
  clear(): void {
    this.jar = null;
    console.log(`🍪 [CookieManager] Cookie jar cleared`);
  }

  /**
   * Check if cookie jar is valid
   */
  isValid(): boolean {
    return this.jar !== null && this.jar.expiresAt > Date.now();
  }
}

// Export singleton instance
export const cookieManager = new CookieManager();

