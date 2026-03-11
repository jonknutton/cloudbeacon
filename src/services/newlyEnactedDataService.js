/**
 * Newly Enacted Laws Data Service
 * Fetches recently passed legislation from legislation.gov.uk Atom feeds
 * Updates via daily polling or on-demand refresh
 */

/**
 * Fetch newly enacted laws from legislation.gov.uk Atom feed
 * @returns {Promise<Array>} Array of recently enacted legislation
 */
async function fetchNewlyEnactedLaws() {
    try {
        console.log('[Newly Enacted Service] Fetching from legislation.gov.uk Atom feed...');
        
        // Atom feed for all newly enacted legislation
        const feedUrl = 'https://www.legislation.gov.uk/new/data.feed';
        
        const response = await fetch(feedUrl);
        if (!response.ok) {
            throw new Error(`Feed request failed: ${response.status}`);
        }
        
        const feedText = await response.text();
        
        // Parse Atom XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(feedText, 'text/xml');
        
        // Check for parsing errors
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Failed to parse Atom feed XML');
        }
        
        // Extract entries from feed
        const entries = xmlDoc.querySelectorAll('entry');
        const legislation = [];
        
        entries.forEach(entry => {
            try {
                const id = entry.querySelector('id')?.textContent || '';
                const title = entry.querySelector('title')?.textContent || 'Untitled';
                const summary = entry.querySelector('summary')?.textContent || '';
                const updated = entry.querySelector('updated')?.textContent || '';
                const links = entry.querySelectorAll('link');
                
                // Get the main legislation link
                let legislationLink = '';
                links.forEach(link => {
                    if (link.getAttribute('rel') === 'alternate') {
                        legislationLink = link.getAttribute('href') || '';
                    }
                });
                
                // Extract year from ID (legislation.gov.uk format: .../<type>/<year>/<number>)
                const idParts = id.split('/');
                const year = idParts[idParts.length - 2];
                
                legislation.push({
                    id: id,
                    name: title,
                    description: summary,
                    dateEnacted: updated.split('T')[0], // Extract date: YYYY-MM-DD
                    year: year,
                    status: 'enacted',
                    votes: { support: 0, oppose: 0, abstain: 0 },
                    category: determineLegislationCategory(title),
                    source: 'legislation.gov.uk',
                    url: legislationLink,
                    lastUpdated: new Date().toISOString()
                });
            } catch (entryError) {
                console.warn('[Newly Enacted Service] Error parsing entry:', entryError);
            }
        });
        
        console.log(`[Newly Enacted Service] Fetched ${legislation.length} recently enacted laws`);
        
        // Cache in localStorage for offline use
        try {
            localStorage.setItem('newly_enacted_cache', JSON.stringify({
                timestamp: new Date().toISOString(),
                data: legislation
            }));
        } catch (e) {
            console.warn('[Newly Enacted Service] Could not cache to localStorage:', e);
        }
        
        return legislation;
        
    } catch (error) {
        console.error('[Newly Enacted Service] Error fetching Atom feed:', error);
        
        // Try to return cached data if available
        try {
            const cached = localStorage.getItem('newly_enacted_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                console.log('[Newly Enacted Service] Using cached data from:', parsed.timestamp);
                return parsed.data || [];
            }
        } catch (e) {
            console.warn('[Newly Enacted Service] Could not retrieve cache:', e);
        }
        
        return [];
    }
}

/**
 * Determine legislation category based on title keywords
 * @param {string} title - Legislation title
 * @returns {string} Category name
 */
function determineLegislationCategory(title) {
    const lowerTitle = title.toLowerCase();
    
    const categories = {
        'health': ['health', 'medical', 'nhs', 'healthcare', 'hospital', 'doctor', 'patient'],
        'environment': ['environment', 'climate', 'green', 'carbon', 'emission', 'pollution', 'water', 'wildlife'],
        'economy': ['economy', 'finance', 'bank', 'tax', 'trade', 'commerce', 'business', 'economic'],
        'education': ['education', 'school', 'university', 'student', 'learning', 'college', 'training'],
        'housing': ['housing', 'property', 'rent', 'landlord', 'tenant', 'building'],
        'transport': ['transport', 'road', 'railway', 'vehicle', 'driving', 'car', 'traffic'],
        'justice': ['justice', 'crime', 'court', 'law', 'police', 'prison', 'legal'],
        'defence': ['defence', 'military', 'armed', 'security', 'defense'],
        'social': ['social', 'welfare', 'benefits', 'pension', 'family', 'child', 'care']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
            return category;
        }
    }
    
    return 'general';
}

/**
 * Get legislation type from title
 * @param {string} title - Legislation title
 * @returns {string} Type (Act, Order, Instrument, Regulation, etc.)
 */
function getLegislationType(title) {
    if (title.includes('Act')) return 'Act';
    if (title.includes('Order')) return 'Order';
    if (title.includes('Instrument')) return 'Instrument';
    if (title.includes('Regulation')) return 'Regulation';
    if (title.includes('Rule')) return 'Rule';
    if (title.includes('Direction')) return 'Direction';
    return 'Legislation';
}

/**
 * Poll for newly enacted laws periodically
 * @param {number} intervalMinutes - Polling interval in minutes (default: 60)
 * @param {Function} callback - Callback when new laws are fetched
 * @returns {number} Interval ID for clearInterval
 */
function pollNewlyEnactedLaws(intervalMinutes = 60, callback = null) {
    console.log(`[Newly Enacted Service] Starting polling every ${intervalMinutes} minute(s)`);
    
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Fetch immediately
    fetchNewlyEnactedLaws().then(legislation => {
        if (callback) callback(legislation);
    }).catch(err => {
        console.error('[Newly Enacted Service] Initial poll failed:', err);
    });
    
    // Then poll at interval
    const intervalId = setInterval(() => {
        fetchNewlyEnactedLaws().then(legislation => {
            console.log(`[Newly Enacted Service] Polling complete, fetched ${legislation.length} laws`);
            if (callback) callback(legislation);
        }).catch(err => {
            console.error('[Newly Enacted Service] Polling failed:', err);
        });
    }, intervalMs);
    
    return intervalId;
}

/**
 * Filter newly enacted laws by date range
 * @param {Array} laws - Array of legislation
 * @param {number} daysBack - Number of days back from today
 * @returns {Array} Filtered legislation
 */
function filterByRecency(laws, daysBack = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    return laws.filter(law => {
        const lawDate = new Date(law.dateEnacted);
        return lawDate >= cutoffDate;
    });
}

/**
 * Filter laws by type
 * @param {Array} laws - Array of legislation
 * @param {string} type - Type to filter by (Act, Order, Instrument, etc.)
 * @returns {Array} Filtered legislation
 */
function filterByType(laws, type) {
    return laws.filter(law => {
        const lawType = getLegislationType(law.name);
        return lawType === type;
    });
}

/**
 * Format legislation for display
 * @param {Object} law - Legislation object
 * @returns {Object} Formatted legislation
 */
function formatLegislationForDisplay(law) {
    return {
        ...law,
        typeLabel: getLegislationType(law.name),
        recencyLabel: getRecencyLabel(law.dateEnacted),
        categoryLabel: law.category.charAt(0).toUpperCase() + law.category.slice(1)
    };
}

/**
 * Get human-readable recency label
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Recency label
 */
function getRecencyLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.fetchNewlyEnactedLaws = fetchNewlyEnactedLaws;
    window.pollNewlyEnactedLaws = pollNewlyEnactedLaws;
    window.filterByRecency = filterByRecency;
    window.filterByType = filterByType;
    window.formatLegislationForDisplay = formatLegislationForDisplay;
    window.getRecencyLabel = getRecencyLabel;
}
