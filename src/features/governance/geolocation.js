/**
 * Geolocation Utility
 * Handles IP-based country detection for voting eligibility
 */

/**
 * Detect user's country via IP geolocation
 * Uses ip-api.com for free IP-to-country lookup
 * Results cached in localStorage for 24 hours
 */
export async function detectIPCountry() {
    const cacheKey = 'cb_ip_country_cache';
    const cacheTimestampKey = 'cb_ip_country_timestamp';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    
    try {
        // Check cache first
        const cached = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimestampKey);
        
        if (cached && cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < CACHE_DURATION) {
                console.log('[Geolocation] Using cached IP country:', cached);
                return JSON.parse(cached);
            }
        }
        
        // Fetch from ip-api.com
        console.log('[Geolocation] Fetching IP country...');
        const response = await fetch('https://ip-api.com/json/?fields=status,country,countryCode,city,region');
        
        if (!response.ok) {
            throw new Error(`IP API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'success') {
            throw new Error(`IP API failed: ${data.message}`);
        }
        
        const result = {
            country: data.country,
            countryCode: data.countryCode,
            city: data.city,
            region: data.region,
            detected: true
        };
        
        // Cache result
        localStorage.setItem(cacheKey, JSON.stringify(result));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
        
        console.log('[Geolocation] ✅ IP country detected:', result.country, `(${result.countryCode})`);
        return result;
        
    } catch (error) {
        console.error('[Geolocation] ❌ Failed to detect IP country:', error);
        return {
            country: null,
            countryCode: null,
            detected: false,
            error: error.message
        };
    }
}

/**
 * Check if user's IP country matches their account country
 */
export async function checkCountryMismatch(accountCountry) {
    if (!accountCountry) {
        console.log('[Geolocation] No account country set yet');
        return null;
    }
    
    const ipData = await detectIPCountry();
    
    if (!ipData.detected) {
        console.log('[Geolocation] Could not verify IP country');
        return null;
    }
    
    // Normalize for comparison (account likely stores full name, IP gives both)
    const accountCountryLower = accountCountry.toLowerCase();
    const ipCountryLower = ipData.country.toLowerCase();
    
    const matches = accountCountryLower === ipCountryLower || 
                   accountCountryLower === ipData.countryCode.toLowerCase();
    
    return {
        matches,
        accountCountry,
        ipCountry: ipData.country,
        ipCountryCode: ipData.countryCode,
        ipCity: ipData.city,
        ipRegion: ipData.region
    };
}

/**
 * Get cached IP data without re-fetching
 */
export function getCachedIPCountry() {
    const cached = localStorage.getItem('cb_ip_country_cache');
    if (cached) {
        return JSON.parse(cached);
    }
    return null;
}

/**
 * Clear IP geolocation cache (for testing)
 */
export function clearIPCache() {
    localStorage.removeItem('cb_ip_country_cache');
    localStorage.removeItem('cb_ip_country_timestamp');
    console.log('[Geolocation] Cache cleared');
}
