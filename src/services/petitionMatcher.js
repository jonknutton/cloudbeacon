/**
 * Parliament Petition Matcher
 * Fetches real UK Parliament petitions and matches them to bills by title keywords
 */

// Cache for Parliament petitions to avoid excessive API calls
let parliamentPetitionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

// ---- Utility: Fetch real petitions from UK Parliament API ----
async function fetchParliamentPetitions() {
    // Return cached data if fresh
    if (parliamentPetitionsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
        console.log('[PetitionMatcher] Using cached Parliament petitions');
        return parliamentPetitionsCache;
    }
    
    try {
        console.log('[PetitionMatcher] Fetching petitions from Parliament API...');
        const allPetitions = [];
        let page = 1;
        let hasMorePages = true;
        
        // Fetch first 3 pages (should be ~75+ petitions, enough for demo)
        while (hasMorePages && page <= 3) {
            try {
                const response = await fetch(
                    `https://petition.parliament.uk/petitions.json?state=open&page=${page}`
                );
                
                if (!response.ok) {
                    console.error(`[PetitionMatcher] API error on page ${page}:`, response.status);
                    hasMorePages = false;
                    break;
                }
                
                const data = await response.json();
                if (!data.data || data.data.length === 0) {
                    hasMorePages = false;
                    break;
                }
                
                // Transform API format to internal format
                data.data.forEach(item => {
                    if (item.attributes) {
                        allPetitions.push({
                            id: item.id,
                            title: item.attributes.action || '',
                            background: item.attributes.background || '',
                            votes: item.attributes.signature_count || 0,
                            createdAt: item.attributes.created_at,
                            url: `https://petition.parliament.uk/petitions/${item.id}`,
                            creator: item.attributes.creator_name || 'Anonymous',
                            source: 'parliament'
                        });
                    }
                });
                
                page++;
            } catch (pageError) {
                console.error(`[PetitionMatcher] Error fetching page ${page}:`, pageError);
                hasMorePages = false;
            }
        }
        
        console.log(`[PetitionMatcher] Fetched ${allPetitions.length} Parliament petitions`);
        
        // Cache the results
        parliamentPetitionsCache = allPetitions;
        cacheTimestamp = Date.now();
        
        return allPetitions;
    } catch (error) {
        console.error('[PetitionMatcher] Failed to fetch Parliament petitions:', error);
        return [];
    }
}

// ---- Extract significant keywords from text ----
function extractBillKeywords(title, description) {
    // Common English stopwords to exclude
    const stopwords = new Set([
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
        'the', 'to', 'was', 'will', 'with', 'bill', 'provision', 'make',
        'act', 'amendment', 'section', 'about', 'any', 'provisions', 'new',
        'be', 'is', 'must', 'should', 'require', 'establish', 'create'
    ]);
    
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    // Split into words and filter
    const words = text.split(/\W+/)
        .filter(word => word.length > 3 && !stopwords.has(word))
        .slice(0, 20); // Limit to top 20 unique keywords
    
    // Get unique keywords
    return [...new Set(words)];
}

// ---- Find matching petitions for a bill ----
export async function findMatchingPetitions(billTitle, billDescription) {
    try {
        // Extract keywords from bill
        const keywords = extractBillKeywords(billTitle, billDescription);
        
        if (keywords.length === 0) {
            console.log('[PetitionMatcher] No significant keywords extracted');
            return [];
        }
        
        console.log(`[PetitionMatcher] Searching for petitions matching keywords:`, keywords);
        
        // Fetch Parliament petitions
        const allPetitions = await fetchParliamentPetitions();
        
        if (!allPetitions || allPetitions.length === 0) {
            console.log('[PetitionMatcher] No petitions available');
            return [];
        }
        
        // Score petitions based on title keyword matches
        const petitionsWithScores = allPetitions
            .map(petition => {
                const petitionTitle = (petition.title || '').toLowerCase();
                const petitionBackground = (petition.background || '').toLowerCase();
                
                // Count keyword matches - prioritize title matches
                let score = 0;
                keywords.forEach(keyword => {
                    if (petitionTitle.includes(keyword)) score += 3;
                    if (petitionBackground.includes(keyword)) score += 1;
                });
                
                return { ...petition, matchScore: score };
            })
            .filter(p => p.matchScore > 0) // Only include petitions with at least one match
            .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
            .slice(0, 5); // Limit to top 5 matches
        
        console.log(`[PetitionMatcher] Found ${petitionsWithScores.length} matching petitions`);
        
        return petitionsWithScores;
    } catch (error) {
        console.error('[PetitionMatcher] Error finding matching petitions:', error);
        return [];
    }
}

// ---- Public API: Get petitions for a bill ----
export async function getPetitionsForBill(billTitle, billDescription) {
    return await findMatchingPetitions(billTitle, billDescription);
}
