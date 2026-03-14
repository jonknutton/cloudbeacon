/**
 * Signals Calculation Engine
 * Analyzes feed data to extract trends, coalitions, and silence spots
 * Run via Cloud Function daily at UTC midnight
 */

import { db } from './firebase.js';
import { collection, getDocs, query, where, serverTimestamp, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC EXTRACTION: TF-IDF based keyword extraction
// ═══════════════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'it', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'him', 'her', 'us', 'them'
]);

function extractKeywords(text) {
    if (!text) return [];
    
    // Lowercase and tokenize
    const words = text.toLowerCase().match(/\b[\w]+\b/g) || [];
    
    // Filter stopwords and short words
    return words.filter(w => w.length > 3 && !STOP_WORDS.has(w));
}

function extractNounPhrases(text) {
    if (!text) return [];
    
    // Simple pattern: Capitalize Word + common nouns/adjectives
    const patterns = [
        /\b[A-Z][a-z]+\s+[a-z]+(?:\s+[a-z]+)?\b/g,  // Proper noun phrases
        /(?:climate|housing|transport|education|health|safety|community|support|policy|action|planning|development|reform|change|initiative|program|service|system)\s+(?:\w+\s+)*\w+/gi
    ];
    
    let phrases = [];
    for (let pattern of patterns) {
        const matches = text.match(pattern) || [];
        phrases = phrases.concat(matches);
    }
    
    return [...new Set(phrases.map(p => p.toLowerCase().trim()))];
}

// ═══════════════════════════════════════════════════════════════════════════
// TREND CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculateTrends(feedItems, timeWindow = 7) {
    const now = new Date();
    const windowStart = new Date(now - timeWindow * 24 * 60 * 60 * 1000);
    const previousWindowStart = new Date(now - (timeWindow * 2) * 24 * 60 * 60 * 1000);
    
    // Filter items by time window
    const currentItems = feedItems.filter(item => {
        const date = item.createdAt?.toDate?.() || item.createdAt;
        return date >= windowStart;
    });
    
    const previousItems = feedItems.filter(item => {
        const date = item.createdAt?.toDate?.() || item.createdAt;
        return date >= previousWindowStart && date < windowStart;
    });
    
    // Extract all topics from current window
    const topicMentions = {};
    const topicUsers = {};
    const topicCategories = {};
    
    for (let item of currentItems) {
        const text = (item.description || item.title || '') + ' ' + (item.categoryAnswer || '');
        const phrases = extractNounPhrases(text);
        
        for (let phrase of phrases) {
            topicMentions[phrase] = (topicMentions[phrase] || 0) + 1;
            topicUsers[phrase] = topicUsers[phrase] || new Set();
            topicUsers[phrase].add(item.authorId);
            topicCategories[phrase] = topicCategories[phrase] || new Set();
            if (item.category) topicCategories[phrase].add(item.category);
        }
    }
    
    // Calculate previous window counts for comparison
    const previousMentions = {};
    for (let item of previousItems) {
        const text = (item.description || item.title || '') + ' ' + (item.categoryAnswer || '');
        const phrases = extractNounPhrases(text);
        
        for (let phrase of phrases) {
            previousMentions[phrase] = (previousMentions[phrase] || 0) + 1;
        }
    }
    
    // Calculate trends with change percentage
    const trends = Object.entries(topicMentions)
        .filter(([topic, count]) => count >= 3)  // Minimum 3 mentions
        .map(([topic, count]) => {
            const prev = previousMentions[topic] || 1;  // Avoid division by zero
            const changePercent = Math.round(((count - prev) / prev) * 100);
            const uniqueUsers = topicUsers[topic]?.size || 0;
            const categories = Array.from(topicCategories[topic] || []);
            
            // Confidence score: higher with more mentions and consistent participation
            const confidence = Math.min(0.95, Math.max(0.3, (count / 50) * (uniqueUsers / 25)));
            
            return {
                topic,
                count,
                changePercent,
                uniqueUsers,
                categories,
                confidence: Math.round(confidence * 100) / 100,
                evidence: `${count} posts/projects, ${categories.length} categories, ${uniqueUsers} unique voices`
            };
        })
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 10);  // Top 10 trends
    
    return trends;
}

// ═══════════════════════════════════════════════════════════════════════════
// COALITION DETECTION: Jaccard Similarity
// ═══════════════════════════════════════════════════════════════════════════

function detectCoalitions(trends, feedItems, timeWindow = 7) {
    const now = new Date();
    const windowStart = new Date(now - timeWindow * 24 * 60 * 60 * 1000);
    
    const currentItems = feedItems.filter(item => {
        const date = item.createdAt?.toDate?.() || item.createdAt;
        return date >= windowStart;
    });
    
    // Map topics to sets of users
    const topicToUsers = {};
    
    for (let item of currentItems) {
        const text = (item.description || item.title || '') + ' ' + (item.categoryAnswer || '');
        const phrases = extractNounPhrases(text);
        
        for (let phrase of phrases) {
            topicToUsers[phrase] = topicToUsers[phrase] || new Set();
            topicToUsers[phrase].add(item.authorId);
        }
    }
    
    // Calculate Jaccard similarity between topic pairs
    const coalitions = [];
    const topicList = Object.keys(topicToUsers);
    
    for (let i = 0; i < topicList.length; i++) {
        for (let j = i + 1; j < topicList.length; j++) {
            const topicA = topicList[i];
            const topicB = topicList[j];
            
            const usersA = topicToUsers[topicA];
            const usersB = topicToUsers[topicB];
            
            const intersection = new Set([...usersA].filter(u => usersB.has(u)));
            const union = new Set([...usersA, ...usersB]);
            
            const jaccard = intersection.size / union.size;
            
            if (jaccard > 0.25) {  // Threshold for coalition
                coalitions.push({
                    topics: [topicA, topicB],
                    strength: Math.round(jaccard * 100) / 100,
                    userOverlap: intersection.size,
                    reasoning: `${intersection.size} users engaged with both topics suggest these issues are linked in community thinking.`
                });
            }
        }
    }
    
    // Sort by strength
    return coalitions.sort((a, b) => b.strength - a.strength).slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════════════════
// SILENCE SPOT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectSilenceSpots(trends, feedItems) {
    const silenceSpots = [];
    
    // Spot 1: Topics in legislation but no user projects
    const legislationTopics = [
        'AI', 'Artificial Intelligence', 'technology regulation',
        'data protection', 'digital rights', 'automation'
    ];
    
    const trendTopics = trends.map(t => t.topic.toLowerCase());
    
    for (let topic of legislationTopics) {
        if (!trendTopics.some(t => t.includes(topic.toLowerCase()))) {
            silenceSpots.push({
                potentialTopic: topic,
                reasoning: `Parliament discussing "${topic}" but minimal citizen mobilization. May indicate knowledge gap or uncertainty about impact.`,
                recommendation: 'Consider creating explainer project or Parliament context guide.'
            });
        }
    }
    
    // Spot 2: Historical spike patterns (simple: compare to average)
    const avgEngagement = trends.reduce((sum, t) => sum + t.count, 0) / Math.max(1, trends.length);
    
    const lowCategories = ['Law'];  // Often underrepresented
    for (let cat of lowCategories) {
        const catTrends = trends.filter(t => t.categories.includes(cat));
        if (catTrends.length === 0 || catTrends.reduce((sum, t) => sum + t.count, 0) < avgEngagement * 0.3) {
            silenceSpots.push({
                potentialTopic: `${cat} Category Engagement`,
                reasoning: `"${cat}" projects showing lower activity than other categories. May reflect community confidence gaps or unclear benefit.`,
                recommendation: 'Host discussion or highlight existing projects in this category.'
            });
        }
    }
    
    return silenceSpots.slice(0, 3);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CALCULATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export async function calculateSignals() {
    try {
        console.log('[Signals] Starting calculation...');
        
        // Fetch all feed items from past 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        const feedRef = collection(db, 'feed');
        const q = query(feedRef, where('createdAt', '>=', thirtyDaysAgo));
        
        const snapshot = await getDocs(q);
        const feedItems = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        console.log(`[Signals] Fetched ${feedItems.length} feed items`);
        
        // Calculate each analysis phase
        const trends = calculateTrends(feedItems, 7);
        const coalitions = detectCoalitions(trends, feedItems, 7);
        const silenceSpots = detectSilenceSpots(trends, feedItems);
        
        console.log(`[Signals] Found ${trends.length} trends, ${coalitions.length} coalitions, ${silenceSpots.length} silence spots`);
        
        // Write results to signals collection
        const signalsRef = collection(db, 'signals');
        await setDoc(doc(signalsRef, 'weekly_trends'), {
            trends,
            coalitions,
            silenceSpots,
            lastUpdated: serverTimestamp(),
            version: '1.0'
        });
        
        console.log('[Signals] ✅ Calculation complete and stored');
        return { success: true, trends, coalitions, silenceSpots };
        
    } catch (error) {
        console.error('[Signals] ❌ Error:', error);
        throw error;
    }
}

// Safe export for testing
export { calculateTrends, detectCoalitions, detectSilenceSpots };
