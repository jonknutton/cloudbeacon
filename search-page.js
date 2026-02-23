/**
 * search-page.js - Dedicated search page functionality
 * Handles user, project, and post searches from Firestore
 */

import { db, auth } from './firebase.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentSearchTab = 'all';
let lastSearchQuery = '';

/**
 * Simple string matching (same as feed search)
 * Returns a score if match found, 0 if no match
 */
function getMatchScore(searchTerm, targetText) {
    if (!searchTerm || !targetText) return 0;
    
    const term = searchTerm.toLowerCase().trim();
    const target = targetText.toLowerCase();
    
    if (term.length === 0) return 0;
    
    // Check if search term is in the text
    if (target.includes(term)) {
        return 100;  // Match found
    }
    
    return 0;  // No match
}

/**
 * Switch between search tabs
 */
window.switchSearchTab = function(tab) {
    currentSearchTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.search-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Show/hide result containers
    document.querySelectorAll('.search-results').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`searchResults${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
};

/**
 * Perform search across all categories
 */
window.performSearch = async function() {
    const searchInput = document.getElementById('searchQueryInput');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    lastSearchQuery = query;
    
    console.log('[Search] Searching for:', query, 'in tab:', currentSearchTab);
    
    if (!query) {
        clearAllResults();
        return;
    }
    
    // Search only in active tab or all tabs if viewing "All"
    if (currentSearchTab === 'all') {
        await Promise.all([
            searchUsers(query),
            searchProjects(query),
            searchPosts(query)
        ]);
        updateAllResults();
    } else if (currentSearchTab === 'users') {
        await searchUsers(query);
    } else if (currentSearchTab === 'projects') {
        await searchProjects(query);
    } else if (currentSearchTab === 'posts') {
        await searchPosts(query);
    } else if (currentSearchTab === 'feeds') {
        displayFeedsComingSoon();
    }
};

/**
 * Search for users by username
 */
async function searchUsers(searchQuery) {
    const resultsContainer = document.getElementById('searchResultsUsers');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading">Searching users...</div>';
    
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const results = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            
            // Search in username field using same matching logic
            const score = getMatchScore(searchQuery, userData.username || '');
            
            if (score > 0) {
                results.push({
                    id: doc.id,
                    type: 'user',
                    username: userData.username || 'User',
                    email: userData.email || '',
                    avatar: userData.photoURL || '',
                    displayName: userData.displayName || userData.username || 'User'
                });
            }
        });
        
        displayUserResults(resultsContainer, results);
    } catch (error) {
        console.error('[Search] Error searching users:', error);
        resultsContainer.innerHTML = '<div class="no-results"><div class="no-results-icon">❌</div><p>Error searching users</p></div>';
    }
}

/**
 * Search for projects by title - searches all relevant fields
 */
async function searchProjects(searchQuery) {
    const resultsContainer = document.getElementById('searchResultsProjects');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading">Searching projects...</div>';
    
    try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const results = [];
        
        projectsSnapshot.forEach(doc => {
            const projectData = doc.data();
            
            // Search in both title and overview
            let searchableText = '';
            if (projectData.title) searchableText += ' ' + projectData.title;
            if (projectData.overview) searchableText += ' ' + projectData.overview;
            if (projectData.category) searchableText += ' ' + projectData.category;
            
            const score = getMatchScore(searchQuery, searchableText);
            
            if (score > 0) {
                results.push({
                    id: doc.id,
                    type: 'project',
                    title: projectData.title || 'Untitled Project',
                    overview: projectData.overview || '',
                    category: projectData.category || 'other',
                    isProposal: projectData.isProposal || false,
                    createdAt: projectData.createdAt || {}
                });
            }
        });
        
        displayProjectResults(resultsContainer, results);
    } catch (error) {
        console.error('[Search] Error searching projects:', error);
        resultsContainer.innerHTML = '<div class="no-results"><div class="no-results-icon">❌</div><p>Error searching projects</p></div>';
    }
}

/**
 * Search for posts by content text - searches all text fields
 */
async function searchPosts(searchQuery) {
    const resultsContainer = document.getElementById('searchResultsPosts');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading">Searching posts...</div>';
    
    try {
        const feedSnapshot = await getDocs(collection(db, 'feed'));
        const results = [];
        
        feedSnapshot.forEach(doc => {
            const postData = doc.data();
            
            // Extract all searchable text from the post (similar to feed search)
            let searchableText = '';
            
            // Add all text fields
            if (postData.content) searchableText += ' ' + postData.content;
            if (postData.title) searchableText += ' ' + postData.title;
            if (postData.description) searchableText += ' ' + postData.description;
            if (postData.overview) searchableText += ' ' + postData.overview;
            if (postData.authorName) searchableText += ' ' + postData.authorName;
            
            // Check if search matches any of this text
            const score = getMatchScore(searchQuery, searchableText);
            
            if (score > 0) {
                results.push({
                    id: doc.id,
                    type: 'post',
                    title: postData.title || 'Untitled Post',
                    content: postData.content || '',
                    author: postData.authorName || 'Anonymous',
                    createdAt: postData.createdAt || {}
                });
            }
        });
        
        displayPostResults(resultsContainer, results);
    } catch (error) {
        console.error('[Search] Error searching posts:', error);
        resultsContainer.innerHTML = '<div class="no-results"><div class="no-results-icon">❌</div><p>Error searching posts</p></div>';
    }
}

/**
 * Display user search results
 */
function displayUserResults(container, results) {
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results"><div class="no-results-icon">👥</div><p>No users found</p></div>';
        return;
    }
    
    let html = '';
    results.forEach(user => {
        const initials = user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        html += `
            <div class="result-item" onclick="window.location.href='profile.html?uid=${user.id}'">
                <div class="user-result-header">
                    <div class="user-avatar">${user.avatar ? '' : initials}</div>
                    <div class="user-info">
                        <div class="result-title">${escapeHtml(user.displayName)}</div>
                        <div class="result-subtitle">@${escapeHtml(user.username)}</div>
                        ${user.email ? `<div class="result-subtitle">${escapeHtml(user.email)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * Display project search results
 */
function displayProjectResults(container, results) {
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results"><div class="no-results-icon">📦</div><p>No projects found</p></div>';
        return;
    }
    
    let html = '';
    results.forEach(project => {
        const Badge = project.isProposal ? '📋 Proposal' : `${getCategoryEmoji(project.category)} ${capitalizeFirst(project.category)}`;
        const preview = project.overview.substring(0, 100) + (project.overview.length > 100 ? '...' : '');
        html += `
            <div class="result-item" onclick="window.location.href='project.html?id=${project.id}'">
                <div class="result-title">${escapeHtml(project.title)}</div>
                <div class="result-subtitle">${Badge}</div>
                ${preview ? `<div class="result-content">${escapeHtml(preview)}</div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * Display post search results
 */
function displayPostResults(container, results) {
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results"><div class="no-results-icon">📝</div><p>No posts found</p></div>';
        return;
    }
    
    let html = '';
    results.forEach(post => {
        // Show content excerpt as main result (since that's what's being searched)
        const contentPreview = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');
        html += `
            <div class="result-item">
                <div class="result-title">${escapeHtml(contentPreview)}</div>
                <div class="result-subtitle">Posted by ${escapeHtml(post.author)}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * Update the "All" results tab with combined results
 */
function updateAllResults() {
    const allContainer = document.getElementById('searchResultsAll');
    if (!allContainer) return;
    
    const usersHtml = document.getElementById('searchResultsUsers').innerHTML;
    const projectsHtml = document.getElementById('searchResultsProjects').innerHTML;
    const postsHtml = document.getElementById('searchResultsPosts').innerHTML;
    
    let html = '';
    
    if (usersHtml && !usersHtml.includes('no-results')) {
        html += '<h3 style="color:#fff; margin:20px 0 12px 0; font-size:16px;">Users</h3>' + usersHtml;
    }
    
    if (projectsHtml && !projectsHtml.includes('no-results')) {
        html += '<h3 style="color:#fff; margin:20px 0 12px 0; font-size:16px;">Projects</h3>' + projectsHtml;
    }
    
    if (postsHtml && !postsHtml.includes('no-results')) {
        html += '<h3 style="color:#fff; margin:20px 0 12px 0; font-size:16px;">Posts</h3>' + postsHtml;
    }
    
    if (!html) {
        allContainer.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div><p>No results found for "' + escapeHtml(lastSearchQuery) + '"</p></div>';
    } else {
        allContainer.innerHTML = html;
    }
}

/**
 * Clear all results
 */
function clearAllResults() {
    document.getElementById('searchResultsAll').innerHTML = '';
    document.getElementById('searchResultsUsers').innerHTML = '';
    document.getElementById('searchResultsProjects').innerHTML = '';
    document.getElementById('searchResultsPosts').innerHTML = '';
    document.getElementById('searchResultsFeeds').innerHTML = '';
}

/**
 * Helper: Get emoji for category
 */
function getCategoryEmoji(category) {
    const emojis = {
        legislative: '🏛️',
        physical: '🏗️',
        inventive: '💡',
        community: '🤝'
    };
    return emojis[category] || '📦';
}

/**
 * Display "Coming Soon" message for Feeds tab
 */
function displayFeedsComingSoon() {
    const resultsContainer = document.getElementById('searchResultsFeeds');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">🔄</div>
            <p>Feeds search is coming soon</p>
        </div>
    `;
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-focus search input on page load
window.addEventListener('load', () => {
    const searchInput = document.getElementById('searchQueryInput');
    if (searchInput) {
        searchInput.focus();
    }
});
