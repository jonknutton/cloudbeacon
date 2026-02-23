/**
 * search.js - Feed search functionality
 * Provides real-time search of posts and projects on the feed with fuzzy matching
 */

import { db, auth } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allFeedItems = [];
let currentFilter = 'all';
let currentSearchTerm = '';
let currentlyFiltered = false;

/**
 * Initialize search when feed is viewed
 */
export function initializeSearch() {
    const searchInput = document.getElementById('feedSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', searchFeedCount);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchFeedFiltered();
                e.preventDefault();
            }
        });
    }
}

/**
 * Extract all searchable text from a feed item element
 * Simplified: just get all visible text from the post
 */
function extractSearchableText(feedElement) {
    if (!feedElement) return '';
    
    // Simple approach: just get all visible text
    const text = feedElement.innerText || feedElement.textContent || '';
    
    return text.toLowerCase();
}

/**
 * Simple string matching
 * Returns a score (higher = better match)
 */
function getMatchScore(searchTerm, targetText) {
    if (!searchTerm || !targetText) return 0;
    
    const term = searchTerm.toLowerCase().trim();
    const target = targetText.toLowerCase();
    
    // Empty search = no match
    if (term.length === 0) return 0;
    
    // Check if search term is in the text
    if (target.includes(term)) {
        return 100;  // Match found
    }
    
    return 0;  // No match
}

/**
 * Helper to get all feed items (top-level post containers only)
 */
function getAllFeedItems() {
    const postsContainer = document.getElementById('posts');
    if (!postsContainer) return [];
    
    // Get ONLY direct children of posts container
    // Exclude special status elements
    let feedItems = Array.from(postsContainer.children).filter(child => {
        if (child.id === 'syncStatus' || child.id === 'searchStatus') {
            return false;
        }
        return true;
    });
    
    console.log('[getAllFeedItems] Selected', feedItems.length, 'post containers. First 3:');
    feedItems.slice(0, 3).forEach((item, idx) => {
        const text = item.innerText || item.textContent;
        console.log(`  Post ${idx}:`, {
            tag: item.tagName,
            class: item.className,
            textPreview: text.substring(0, 40)
        });
    });
    
    return feedItems;
}

/**
 * Show count of matching posts without filtering
 * Called while typing in the search box
 */
window.searchFeedCount = function() {
    const searchInput = document.getElementById('feedSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    currentSearchTerm = searchTerm;
    
    console.log('[Search COUNT] Search term:', searchTerm);
    
    if (!searchTerm) {
        // No search term - hide status
        const statusEl = document.getElementById('searchStatus');
        if (statusEl) statusEl.style.display = 'none';
        
        // If currently filtered, clear the filter
        if (currentlyFiltered) {
            reloadFeedWithFilter(currentFilter);
        }
        return;
    }
    
    // Get all feed items
    const feedItems = getAllFeedItems();
    console.log(`[Search COUNT] Total items to check: ${feedItems.length}`);
    
    let matchCount = 0;
    const matchedItems = [];
    
    feedItems.forEach((feedElement, idx) => {
        const searchableText = extractSearchableText(feedElement);
        const score = getMatchScore(searchTerm, searchableText);
        
        if (score > 0) {
            matchCount++;
            matchedItems.push({idx, score, textPreview: searchableText.substring(0, 40)});
        }
    });
    
    console.log(`[Search COUNT] ✓ Found ${matchCount} matches`);
    matchedItems.forEach(m => console.log(`   Item ${m.idx}: score=${m.score}, text="${m.textPreview}..."`));
    showSearchStatus(matchCount, searchTerm, false);
};

/**
 * Perform actual search filtering
 * Called when Search button is clicked or Enter is pressed
 */
window.searchFeedFiltered = function() {
    const searchInput = document.getElementById('feedSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    currentSearchTerm = searchTerm;
    currentlyFiltered = true;
    
    console.log('[Search FILTER] Performing filtered search for:', searchTerm);
    
    if (!searchTerm) {
        // Clear search - reload the full feed
        console.log('[Search FILTER] Empty search, reloading full feed');
        reloadFeedWithFilter(currentFilter);
        return;
    }
    
    // Get all feed items
    const feedItems = getAllFeedItems();
    console.log(`[Search FILTER] Total items to check: ${feedItems.length}`);
    
    const results = [];
    
    feedItems.forEach((feedElement, idx) => {
        const searchableText = extractSearchableText(feedElement);
        const score = getMatchScore(searchTerm, searchableText);
        
        console.log(`[Search FILTER] Item ${idx}: score=${score}, text="${searchableText.substring(0, 40)}..."`);
        
        if (score > 0) {
            results.push({
                element: feedElement,
                index: idx,
                score: score,
                text: searchableText
            });
        }
    });
    
    // Sort by score descending (best matches first)
    results.sort((a, b) => b.score - a.score);
    
    console.log(`[Search FILTER] Found ${results.length} matches, now applying visibility`);
    
    // Apply visibility - show matched items, hide others
    let visibleCount = 0;
    feedItems.forEach((item, idx) => {
        const isMatch = results.some(r => r.element === item);
        
        if (isMatch) {
            // Show item
            item.style.display = '';
            item.style.visibility = 'visible';
            item.style.opacity = '1';
            item.classList.remove('hidden-by-search');
            visibleCount++;
        } else {
            // Hide item - collapse spacing completely
            item.style.display = 'none !important';
            item.style.visibility = 'hidden';
            item.style.height = '0';
            item.style.margin = '0';
            item.style.padding = '0';
            item.style.overflow = 'hidden';
            item.style.border = 'none';
            item.classList.add('hidden-by-search');
        }
    });
    
    console.log(`[Search FILTER] ✓ FINAL: Showing ${visibleCount} matching items out of ${feedItems.length} total`);
    
    // DEBUG: Count actually visible elements
    const postsContainer = document.getElementById('posts');
    const actualVisible = postsContainer.querySelectorAll(':scope > div:not([style*="display: none"])');
    const actualHidden = postsContainer.querySelectorAll(':scope > div[style*="display: none"]');
    console.log(`[Search FILTER] DEBUG: Actual DOM - ${actualVisible.length} visible divs, ${actualHidden.length} hidden divs`);
    
    showSearchStatus(visibleCount, searchTerm, true);
};

/**
 * Re-apply search filtering after feed reloads
 * This is called after loadPosts() to maintain filter state
 * Re-runs the entire search to handle DOM rebuild
 */
window.reapplySearchFilter = function() {
    if (!currentlyFiltered || !currentSearchTerm) {
        console.log('[Search REAPPLY] No active filter or search term');
        return;
    }
    
    console.log('[Search REAPPLY] Re-applying search filter after feed reload for:', currentSearchTerm);
    
    // Re-run the search with current search term
    const feedItems = getAllFeedItems();
    console.log(`[Search REAPPLY] Total items after reload: ${feedItems.length}`);
    
    const results = [];
    let visibleCount = 0;
    
    // Find matching items
    feedItems.forEach((feedElement, idx) => {
        const searchableText = extractSearchableText(feedElement);
        const score = getMatchScore(currentSearchTerm, searchableText);
        
        if (score > 0) {
            results.push({element: feedElement, score: score});
            console.log(`[Search REAPPLY] Item ${idx}: MATCH (score=${score})`);
        } else {
            console.log(`[Search REAPPLY] Item ${idx}: NO MATCH`);
        }
    });
    
    console.log(`[Search REAPPLY] Found ${results.length} matches after reload`);
    
    // Apply visibility
    feedItems.forEach((item, idx) => {
        const isMatch = results.some(r => r.element === item);
        
        if (isMatch) {
            item.style.display = '';
            item.style.visibility = 'visible';
            item.style.opacity = '1';
            item.classList.remove('hidden-by-search');
            visibleCount++;
        } else {
            item.style.display = 'none !important';
            item.style.visibility = 'hidden';
            item.style.height = '0';
            item.style.margin = '0';
            item.style.padding = '0';
            item.style.overflow = 'hidden';
            item.style.border = 'none';
            item.classList.add('hidden-by-search');
        }
    });
    
    console.log(`[Search REAPPLY] ✓ Final: ${visibleCount} visible, ${feedItems.length - visibleCount} hidden`);
};

/**
 * Show search status message
 */
function showSearchStatus(resultCount, searchTerm, isFiltered) {
    let statusEl = document.getElementById('searchStatus');
    
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'searchStatus';
        statusEl.style.cssText = 'padding:8px 12px; margin:8px 0; text-align:center; color:#888; font-size:14px; border-radius:6px; background:#2a2218; display:none;';
        const postsContainer = document.getElementById('posts');
        if (postsContainer) {
            // Insert at the top
            postsContainer.insertBefore(statusEl, postsContainer.firstChild);
        }
    }
    
    if (resultCount === 0) {
        statusEl.textContent = `No posts found matching "${searchTerm}"`;
        statusEl.style.display = 'block';
        statusEl.style.color = '#f87171';
    } else if (isFiltered) {
        statusEl.textContent = `✓ Showing ${resultCount} matching post${resultCount !== 1 ? 's' : ''} (filtered)`;
        statusEl.style.display = 'block';
        statusEl.style.color = '#86efac';
    } else {
        statusEl.textContent = `Found ${resultCount} matching post${resultCount !== 1 ? 's' : ''} • Click Search to filter`;
        statusEl.style.display = 'block';
        statusEl.style.color = '#60a5fa';
    }
}

/**
 * Helper function to reload feed with a specific filter
 */
function reloadFeedWithFilter(filter) {
    currentFilter = filter;
    currentlyFiltered = false;
    const postsContainer = document.getElementById('posts');
    if (!postsContainer) return;
    
    // Try multiple selector strategies
    let postElements = postsContainer.querySelectorAll('[data-post-id], [data-project-id], [data-feed-id]');
    
    if (postElements.length === 0) {
        postElements = postsContainer.querySelectorAll('div[style*="border"], div[style*="background"], article, .post-container, .feed-item, :scope > div, :scope > section, :scope > article');
    }
    
    postElements.forEach(postEl => {
        // Don't show sync status or search status
        if (postEl.id !== 'syncStatus' && postEl.id !== 'searchStatus') {
            postEl.style.display = '';
        }
    });
    
    // Hide search status
    const statusEl = document.getElementById('searchStatus');
    if (statusEl) statusEl.style.display = 'none';
    
    // Clear search input
    const searchInput = document.getElementById('feedSearchInput');
    if (searchInput) searchInput.value = '';
}

/**
 * Export for use in other modules
 */
export function updateCurrentFilter(filter) {
    currentFilter = filter;
}

// Initialize on module load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    initializeSearch();
}
