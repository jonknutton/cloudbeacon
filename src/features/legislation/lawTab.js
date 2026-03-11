/**
 * Law Tab - Legislation Management
 * Displays existing laws, bills under review, and community suggestions
 */

let currentCountry = 'UK';
let currentUserId = null;  // Stable user ID for this session/browser
let newlyEnactedLawsCache = [];  // Recently passed legislation from Atom feeds
let billsCache = [];              // Bills under review from Parliament API
let suggestionsCache = [];         // Community suggestions from Firestore
let allLegislationCache = [];      // All historical laws from Firestore (lazy-loaded)
let currentUserVotes = {};         // Track current user's votes: { legislationId: 'support'|'oppose'|'abstain' }
let filteredNewlyEnacted = [];
let filteredBills = [];
let searchTimeout;
let allLegislationLoaded = false;  // Track if all legislation has been lazy-loaded

// Pagination state
const PAGE_SIZE = 15; // Show 15 laws/bills per page
let currentNewlyEnactedPage = 0;
let currentBillsPage = 0;
let currentAllLegislationPage = 0;

/**
 * Get or create stable user ID for this browser
 */
function getCurrentUserId() {
    if (currentUserId) return currentUserId;
    
    // Try to get from localStorage
    try {
        let userId = localStorage.getItem('cloudbeacon_user_id');
        if (!userId) {
            // Create new user ID
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('cloudbeacon_user_id', userId);
        }
        currentUserId = userId;
        console.log(`[Law Tab] Current user ID: ${userId}`);
        return userId;
    } catch (e) {
        // localStorage not available, use session-based ID
        if (!currentUserId) {
            currentUserId = `session_${Math.random().toString(36).substr(2, 9)}`;
        }
        return currentUserId;
    }
}

/**
 * Navigate to the project for a bill (bills are now projects with category "law")
 */
async function navigateToProjectForBill(projectId, billName) {
    try {
        console.log(`[Bill Navigation] Navigating to project: ${projectId} (${billName})`);
        if (projectId) {
            window.location.href = `src/features/projects/projectpage/project.html?id=${projectId}&type=project`;
        } else {
            alert(`Project for bill "${billName}" not found.`);
        }
    } catch (error) {
        console.error('[Bill Navigation] Error:', error);
        alert('Error navigating to project.');
    }
}

/**
 * Load laws, bills, and community suggestions
 */
async function loadLawsAndBills(country = 'UK') {
    currentCountry = country;
    
    // Scroll to top of page
    window.scrollTo(0, 0);
    
    // Get/create user ID at start
    getCurrentUserId();
    
    console.log(`[Law Tab] Loading legislation for ${country}...`);
    
    try {
        // Show loading states
        const newlyEnactedContainer = document.getElementById('newlyEnactedLaws');
        const billsContainer = document.getElementById('billsInParliament');
        if (newlyEnactedContainer) newlyEnactedContainer.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">Loading newly enacted laws...</p>';
        if (billsContainer) billsContainer.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">Loading bills under consideration...</p>';
        
        // Load newly enacted laws from Atom feed
        console.log('[Law Tab] Fetching newly enacted laws from legislation.gov.uk...');
        const newlyEnacted = await (typeof window.fetchNewlyEnactedLaws === 'function' 
            ? window.fetchNewlyEnactedLaws() 
            : Promise.resolve([]));
        
        // Filter to last 90 days for "newly enacted"
        if (newlyEnacted.length > 0) {
            newlyEnactedLawsCache = filterByRecency(newlyEnacted, 90);
            console.log(`[Law Tab] Loaded ${newlyEnactedLawsCache.length} newly enacted laws (last 90 days)`);
        } else {
            console.log('[Law Tab] No newly enacted laws from Atom feed');
            newlyEnactedLawsCache = [];
        }
        
        // Try to load real bills from Parliament API
        let mockData = await loadRealBillsOrMock();
        billsCache = mockData.filter(item => item.status === 'bill');
        
        // Initialize filtered arrays to show all
        filteredNewlyEnacted = [];
        filteredBills = [];
        
        // Load community suggestions from Firebase
        await loadCommunitySuggestions();
        
        // Load votes from Firestore and apply to legislation
        await loadAndApplyVotesFromFirestore(country);
        
        // Render all sections (except All Legislation which is lazy-loaded)
        renderNewlyEnactedLawsSection();
        renderBillsSection();
        renderSuggestionsSection();
        
        console.log(`[Law Tab] Loaded ${newlyEnactedLawsCache.length} newly enacted laws, ${billsCache.length} bills, ${suggestionsCache.length} suggestions`);
    } catch (error) {
        console.error('[Law Tab] Error loading data:', error);
        throw error;
    }
}

/**
 * Try loading real bills from Parliament API, fall back to empty
 */
async function loadRealBillsOrMock() {
    try {
        // Check if we have window.loadRealBills available (from billsDataService)
        if (typeof window.loadRealBills === 'function') {
            console.log('[Law Tab] Attempting to load real bills from Parliament API...');
            const realBills = await window.loadRealBills();
            
            if (realBills && realBills.length > 0) {
                console.log(`[Law Tab] Successfully loaded ${realBills.length} real bills`);
                return realBills;
            } else {
                console.warn('[Law Tab] Real bills API returned empty');
                return []; // Return empty instead of mock data
            }
        } else {
            console.warn('[Law Tab] loadRealBills not available');
            return []; // Return empty instead of mock data
        }
    } catch (error) {
        console.error('[Law Tab] Error loading real bills:', error);
        return []; // Return empty instead of mock data
    }
}

/**
 * Load community suggestions from Firestore
 */
async function loadCommunitySuggestions() {
    try {
        // Query Firestore for Law projects with isProposal=true
        if (typeof window.queryCommunitySuggestions === 'function') {
            suggestionsCache = await window.queryCommunitySuggestions();
            console.log(`[Law Tab] Loaded ${suggestionsCache.length} community suggestions`);
        } else {
            console.warn('[Law Tab] Community suggestions query function not available');
            suggestionsCache = [];
        }
    } catch (error) {
        console.error('[Law Tab] Error loading suggestions:', error);
        suggestionsCache = [];
    }
}

/**
 * Load votes from Firestore and apply to legislation
 */
async function loadAndApplyVotesFromFirestore(country) {
    try {
        console.log(`[Law Tab] Loading votes from Firestore for ${country}...`);
        
        // Dynamic import of Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Get Firestore instance
        const db = getFirestore();
        
        // Query all votes for this country
        const votesRef = collection(db, `governance/${country}/votes`);
        const snapshot = await getDocs(votesRef);
        
        // Group votes by referenceId
        const votesByReference = {};
        currentUserVotes = {}; // Reset user votes
        
        const userId = getCurrentUserId();
        
        snapshot.forEach(doc => {
            const vote = doc.data();
            const refId = vote.referenceId;
            
            if (!votesByReference[refId]) {
                votesByReference[refId] = { support: 0, oppose: 0, abstain: 0 };
            }
            
            if (vote.position === 'support') {
                votesByReference[refId].support += vote.weight || 1;
            } else if (vote.position === 'oppose') {
                votesByReference[refId].oppose += vote.weight || 1;
            } else if (vote.position === 'abstain') {
                votesByReference[refId].abstain += vote.weight || 1;
            }
            
            // Track current user's votes
            if (vote.userId === userId) {
                currentUserVotes[refId] = vote.position;
                console.log(`[Law Tab] Found current user's ${vote.position} vote on ${refId}`);
            }
        });
        
        // Apply votes to legislation
        newlyEnactedLawsCache.forEach(law => {
            if (votesByReference[law.id]) {
                law.votes = votesByReference[law.id];
            }
        });
        
        billsCache.forEach(bill => {
            if (votesByReference[bill.id]) {
                bill.votes = votesByReference[bill.id];
            }
        });
        
        allLegislationCache.forEach(law => {
            if (votesByReference[law.id]) {
                law.votes = votesByReference[law.id];
            }
        });
        
        const totalVotes = snapshot.size;
        const userVoteCount = Object.keys(currentUserVotes).length;
        console.log(`[Law Tab] Applied votes from ${totalVotes} vote records (${userVoteCount} from current user)`);
        
    } catch (error) {
        console.log('[Law Tab] Could not load votes from Firestore (may not be configured yet)');
        // This is OK - votes just won't load from database until Firestore is set up
    }
}

/**
 * Render Newly Enacted Laws section
 */
function renderNewlyEnactedLawsSection() {
    const container = document.getElementById('newlyEnactedLaws');
    const laws = filteredNewlyEnacted.length > 0 ? filteredNewlyEnacted : newlyEnactedLawsCache;
    
    // Update header with count
    const section = container.closest('.collapsible-section');
    if (section) {
        const header = section.querySelector('.collapsible-header span:last-child');
        if (header) {
            header.textContent = `Newly Enacted Laws (${newlyEnactedLawsCache.length})`;
        }
    }
    
    if (!laws || laws.length === 0) {
        container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">No newly enacted laws found.</p>';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(laws.length / PAGE_SIZE);
    const startIdx = currentNewlyEnactedPage * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageItems = laws.slice(startIdx, endIdx);
    
    // Reset page if out of bounds
    if (currentNewlyEnactedPage >= totalPages && totalPages > 0) {
        currentNewlyEnactedPage = totalPages - 1;
        return renderNewlyEnactedLawsSection();
    }
    
    let html = '';
    pageItems.forEach((law, index) => {
        html += createLawItem(law, startIdx + index, 'newly-enacted');
    });
    
    // Add pagination controls if multiple pages
    if (totalPages > 1) {
        html += createPaginationControls('newly-enacted', currentNewlyEnactedPage, totalPages);
    }
    
    container.innerHTML = html;
}

/**
 * Render Bills Under Review section
 */
function renderBillsSection() {
    const container = document.getElementById('billsInParliament');
    const bills = filteredBills.length > 0 ? filteredBills : billsCache;
    
    // Update header with count
    const section = container.closest('.collapsible-section');
    if (section) {
        const header = section.querySelector('.collapsible-header span:last-child');
        if (header) {
            header.textContent = `Bills Under Review (${billsCache.length})`;
        }
    }
    
    if (!bills || bills.length === 0) {
        container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">No bills found.</p>';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(bills.length / PAGE_SIZE);
    const startIdx = currentBillsPage * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageItems = bills.slice(startIdx, endIdx);
    
    // Reset page if out of bounds
    if (currentBillsPage >= totalPages && totalPages > 0) {
        currentBillsPage = totalPages - 1;
        return renderBillsSection();
    }
    
    let html = '';
    pageItems.forEach((bill, index) => {
        html += createLawItem(bill, startIdx + index, 'bill');
    });
    
    // Add pagination controls if multiple pages
    if (totalPages > 1) {
        html += createPaginationControls('bills', currentBillsPage, totalPages);
    }
    
    container.innerHTML = html;
}

/**
 * Render Community Suggestions section
 */
function renderSuggestionsSection() {
    const container = document.getElementById('communitySuggestions');
    
    // Update header with count
    const section = container.closest('.collapsible-section');
    if (section) {
        const header = section.querySelector('.collapsible-header span:last-child');
        if (header) {
            header.textContent = `Community Suggested Amendments (${suggestionsCache.length})`;
        }
    }
    
    if (!suggestionsCache || suggestionsCache.length === 0) {
        container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">No community suggestions yet. Be the first to suggest an amendment!</p>';
        return;
    }
    
    let html = '';
    suggestionsCache.forEach((suggestion, index) => {
        html += createSuggestionItem(suggestion, index);
    });
    
    container.innerHTML = html;
}

/**
 * Render All Legislation section (lazy-loaded)
 */
function renderAllLegislationSection() {
    const container = document.getElementById('allLegislation');
    const legislation = allLegislationCache;
    
    // Update header with count
    const section = container.closest('.collapsible-section');
    if (section) {
        const header = section.querySelector('.collapsible-header span:last-child');
        if (header) {
            header.textContent = `All Legislation (${allLegislationCache.length})`;
        }
    }
    
    if (!allLegislationLoaded) {
        container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">Expand this section to load all historical legislation...</p>';
        return;
    }
    
    if (!legislation || legislation.length === 0) {
        container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">No historical legislation found.</p>';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(legislation.length / PAGE_SIZE);
    const startIdx = currentAllLegislationPage * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageItems = legislation.slice(startIdx, endIdx);
    
    // Reset page if out of bounds
    if (currentAllLegislationPage >= totalPages && totalPages > 0) {
        currentAllLegislationPage = totalPages - 1;
        return renderAllLegislationSection();
    }
    
    let html = '';
    pageItems.forEach((law, index) => {
        html += createLawItem(law, startIdx + index, 'historical');
    });
    
    // Add pagination controls if multiple pages
    if (totalPages > 1) {
        html += createPaginationControls('all-legislation', currentAllLegislationPage, totalPages);
    }
    
    container.innerHTML = html;
}

/**
 * Lazy-load all legislation when section is expanded
 */
async function onAllLegislationExpand(headerElement) {
    if (allLegislationLoaded) {
        return; // Already loaded
    }
    
    // Show loading state
    const container = document.getElementById('allLegislation');
    container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">Loading all legislation...</p>';
    
    try {
        // Load all legislation from Firestore via data service
        console.log('[Law Tab] Loading all legislation sources...');
        let allLegislationItems = [];
        
        if (typeof window.loadAllLegislationFromFirestore === 'function') {
            console.log('[Law Tab] Loading historical legislation from Firestore...');
            const historical = await window.loadAllLegislationFromFirestore();
            allLegislationItems = allLegislationItems.concat(historical);
            console.log(`[Law Tab] Loaded ${historical.length} historical laws`);
        }
        
        // Load current UK Parliament bills
        if (typeof window.fetchAllUKParliamentBills === 'function') {
            console.log('[Law Tab] Loading current UK Parliament bills...');
            const parliamentBills = await window.fetchAllUKParliamentBills();
            allLegislationItems = allLegislationItems.concat(parliamentBills);
            console.log(`[Law Tab] Loaded ${parliamentBills.length} UK Parliament bills`);
        }
        
        allLegislationCache = allLegislationItems;
        allLegislationLoaded = true;
        console.log(`[Law Tab] Total legislation loaded: ${allLegislationCache.length} items`);
        
        if (allLegislationCache.length === 0) {
            console.warn('[Law Tab] No legislation data available');
            container.innerHTML = '<p style="color: var(--color-fontSecondary); padding: 20px; text-align: center;">No legislation found.</p>';
        } else {
            renderAllLegislationSection();
        }
    } catch (error) {
        console.error('[Law Tab] Error loading all legislation:', error);
        container.innerHTML = '<p style="color: #c41e3a; padding: 20px; text-align: center;">Error loading legislation. Please try again.</p>';
    }
}

/**
 * Create pagination controls
 */
function createPaginationControls(type, currentPage, totalPages) {
    let html = '<div class="law-pagination" style="margin-top: 20px; display: flex; gap: 6px; justify-content: center; align-items: center;">';
    
    // Previous button
    html += `<button class="page-btn ${currentPage === 0 ? 'disabled' : ''}" 
                    onclick="goToPage('${type}', ${currentPage - 1})" 
                    ${currentPage === 0 ? 'disabled' : ''}>
                ← Previous
            </button>`;
    
    // Page numbers
    const maxVisible = 5;
    const startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="goToPage('${type}', ${i})">
                    ${i + 1}
                </button>`;
    }
    
    // Next button
    html += `<button class="page-btn ${currentPage === totalPages - 1 ? 'disabled' : ''}" 
                    onclick="goToPage('${type}', ${currentPage + 1})" 
                    ${currentPage === totalPages - 1 ? 'disabled' : ''}>
                Next →
            </button>`;
    
    html += `<span style="margin-left: 12px; color: var(--color-fontSecondary); font-size: 0.85em;">
                Page ${currentPage + 1} of ${totalPages}
            </span>`;
    
    html += '</div>';
    return html;
}

/**
 * Navigate to a different page
 */
function goToPage(type, page) {
    if (type === 'newly-enacted') {
        currentNewlyEnactedPage = Math.max(0, page);
        renderNewlyEnactedLawsSection();
    } else if (type === 'bills') {
        currentBillsPage = Math.max(0, page);
        renderBillsSection();
    } else if (type === 'all-legislation') {
        currentAllLegislationPage = Math.max(0, page);
        renderAllLegislationSection();
    }
    
    // Scroll to top of section
    let containerId;
    if (type === 'newly-enacted') containerId = 'newlyEnactedLaws';
    else if (type === 'bills') containerId = 'billsInParliament';
    else if (type === 'all-legislation') containerId = 'allLegislation';
    
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

/**
 * Create a law or bill item
 */
function createLawItem(item, index, type) {
    const itemId = `law-item-${type}-${index}`;
    const voteData = item.votes || { support: 0, oppose: 0, abstain: 0 };
    const totalVotes = voteData.support + voteData.oppose + voteData.abstain;
    const supportPct = totalVotes > 0 ? Math.round((voteData.support / totalVotes) * 100) : 0;
    
    // Safely encode the legislation ID for passing through onclick
    const legislationId = (item.id || item.name || '').replace(/'/g, "\\'");
    
    // Check which vote the current user made
    const userVotePosition = currentUserVotes[item.id];
    const supportActive = userVotePosition === 'support' ? 'active' : '';
    const opposeActive = userVotePosition === 'oppose' ? 'active' : '';
    
    let statusLabel;
    if (type === 'newly-enacted') statusLabel = 'Recently Enacted';
    else if (type === 'historical') statusLabel = 'Historical Law';
    else statusLabel = `${item.stage || 'Bill'}`;
    
    return `
    <div class="law-item" id="${itemId}" data-legislation-id="${item.id || item.name}">
        <div class="law-item-header" onclick="toggleLawItem('${itemId}')">
            <span class="law-expand-icon">></span>
            <div style="flex: 1;">
                <div class="law-item-title">${item.name}</div>
                <div class="law-item-meta">${statusLabel} • ${totalVotes} votes</div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center; margin-left: 20px;">
                <div style="text-align: right; font-size: 0.85em;">
                    <div style="color: var(--color-success); font-weight: 600;">${supportPct}% Support</div>
                    <div style="color: var(--color-fontSecondary); font-size: 0.8em;">Support: ${voteData.support} • Oppose: ${voteData.oppose}</div>
                </div>
                <div class="law-vote-quick" style="display: flex; gap: 6px;">
                    <button class="vote-triangle support ${supportActive}" onclick="event.stopPropagation(); quickVote('${itemId}', 'support', '${type}')" title="Support"></button>
                    <button class="vote-triangle oppose ${opposeActive}" onclick="event.stopPropagation(); quickVote('${itemId}', 'oppose', '${type}')" title="Oppose"></button>
                </div>
            </div>
        </div>
        
        <!-- Approval Bar (visible always) -->
        <div class="approval-bar-container">
            <div class="approval-fill" style="width: ${supportPct}%; background: var(--color-success);"></div>
            <div class="approval-fill" style="width: ${100 - supportPct}%; background: #c41e3a;"></div>
        </div>
        
        <div class="law-item-content" id="content-${itemId}">
            <div class="law-description">
                ${item.description || item.summary || 'No description available.'}
            </div>
            
            <div class="law-details">
                ${type === 'bill' ? `
                    <div class="law-detail-item">
                        <span class="law-detail-label">Bill ID</span>
                        <span class="law-detail-value">${item.billId || 'N/A'}</span>
                    </div>
                    <div class="law-detail-item">
                        <span class="law-detail-label">Current Stage</span>
                        <span class="law-detail-value">${item.stage || 'House of Commons'}</span>
                    </div>
                    <div class="law-detail-item">
                        <span class="law-detail-label">Introduced</span>
                        <span class="law-detail-value">${formatDate(item.introducedDate)}</span>
                    </div>
                ` : `
                    <div class="law-detail-item">
                        <span class="law-detail-label">Enacted/Updated</span>
                        <span class="law-detail-value">${formatDate(item.introducedDate || item.passedDate || item.engrossedDate || item.dateEnacted)}</span>
                    </div>
                `}
                <div class="law-detail-item">
                    <span class="law-detail-label">Community Votes</span>
                    <span class="law-detail-value">${totalVotes} votes cast</span>
                </div>
            </div>
            
            <div style="background: ${supportPct >= 50 ? 'rgba(76, 175, 80, 0.15)' : supportPct <= 33 ? 'rgba(196, 30, 58, 0.15)' : 'rgba(255, 193, 7, 0.1)'}; padding: 12px; border-radius: 4px; margin: 15px 0;">
                <div style="font-size: 0.9em; color: var(--color-fontPrimary); margin-bottom: 10px;">
                    <strong>Community Position:</strong>
                    ${totalVotes > 0 
                        ? supportPct >= 50 
                            ? `Broadly supported (${supportPct}% in favor)`
                            : supportPct <= 33
                                ? `Broadly opposed (${supportPct}% in favor)`
                                : `Mixed opinion (${supportPct}% in favor)`
                        : 'No community votes yet'
                    }
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                ${item.parliamentLink || item.url ? `
                    <a href="${item.parliamentLink || item.url}" target="_blank" class="law-link-btn">
                        View Full Documentation
                    </a>
                ` : ''}
                ${item.projectId ? `
                    <button onclick="navigateToProjectForBill('${item.projectId}', '${item.name.replace(/'/g, "\\'")}'); return false;" class="law-link-btn" style="background: var(--color-buttonSecondary); cursor: pointer; border: none; text-decoration: none; padding: 10px 14px; border-radius: 4px;">
                        Go to Project
                    </button>
                ` : ''}
            </div>
        </div>
    </div>
    `;
}

/**
 * Create a community suggestion item
 */
function createSuggestionItem(suggestion, index) {
    const suggestionId = `suggestion-${index}`;
    
    return `
    <div class="law-item" id="${suggestionId}">
        <div class="law-item-header" onclick="toggleLawItem('${suggestionId}')">
            <span class="law-expand-icon">></span>
            <div style="flex: 1;">
                <div class="law-item-title">${suggestion.title}</div>
                <div class="law-item-meta">Suggested by ${suggestion.authorName || 'Community'}</div>
            </div>
            <div style="font-size: 0.85em; color: var(--color-fontSecondary);">
                ${suggestion.votes || 0} supporters
            </div>
        </div>
        
        <div class="law-item-content" id="content-${suggestionId}">
            <h4 style="margin: 0 0 10px 0; color: var(--color-buttonPrimary);">The Problem</h4>
            <div class="law-description">${suggestion.problem}</div>
            
            <h4 style="margin: 20px 0 10px 0; color: var(--color-buttonPrimary);">Proposed Solution</h4>
            <div class="law-description">${suggestion.solution}</div>
            
            ${suggestion.relatedLaws ? `
                <h4 style="margin: 20px 0 10px 0; color: var(--color-buttonPrimary);">Related Legislation</h4>
                <div class="law-description">${suggestion.relatedLaws}</div>
            ` : ''}
            
            ${suggestion.impact ? `
                <h4 style="margin: 20px 0 10px 0; color: var(--color-buttonPrimary);">Expected Impact</h4>
                <div class="law-description">${suggestion.impact}</div>
            ` : ''}
            
            <div class="law-voting" style="margin-top: 15px;">
                <button class="law-vote-btn" onclick="supportSuggestion('${suggestionId}')">Support This Suggestion</button>
            </div>
        </div>
    </div>
    `;
}

/**
 * Toggle law item expand/collapse
 */
function toggleLawItem(itemId) {
    console.log(`[Toggle] Attempting to toggle item: ${itemId}`);
    
    const element = document.getElementById(itemId);
    const header = element ? element.querySelector('.law-item-header') : null;
    const content = element ? element.querySelector('.law-item-content') : null;
    
    console.log(`[Toggle] Element found: ${!!element}, Header found: ${!!header}, Content found: ${!!content}`);
    
    if (!header || !content) {
        console.error(`[Toggle] Missing header or content for ${itemId}`);
        return;
    }
    
    const isExpanded = header.classList.contains('expanded');
    console.log(`[Toggle] Current state - Expanded: ${isExpanded}`);
    
    if (isExpanded) {
        header.classList.remove('expanded');
        content.classList.remove('show');
        console.log(`[Toggle] Collapsed ${itemId}`);
    } else {
        header.classList.add('expanded');
        content.classList.add('show');
        console.log(`[Toggle] Expanded ${itemId}`);
    }
}

/**
 * Quick vote from collapsed view (should NOT expand)
 */
function quickVote(itemId, voteType, legislationType) {
    // Just vote - don't expand the item
    expandedVote(itemId, voteType, legislationType);
}

/**
 * Vote from expanded view
 */
async function expandedVote(itemId, voteType, legislationType) {
    // Get the legislation element and extract ID from data attribute
    const element = document.getElementById(itemId);
    if (!element) {
        console.error('Legislation element not found:', itemId);
        return;
    }
    
    // Get legislation ID from data attribute
    const legislationId = element.getAttribute('data-legislation-id');
    if (!legislationId) {
        console.error('Legislation ID not found in data attribute:', itemId);
        return;
    }
    
    // Find the actual legislation object from the cache
    let legislation = null;
    if (legislationType === 'newly-enacted') {
        legislation = newlyEnactedLawsCache.find(item => item.id === legislationId);
    } else if (legislationType === 'bill') {
        legislation = billsCache.find(item => item.id === legislationId);
    } else if (legislationType === 'historical') {
        legislation = allLegislationCache.find(item => item.id === legislationId);
    }
    
    if (!legislation) {
        console.error('Legislation not found in cache for ID:', legislationId);
        return;
    }
    
    try {
        const previousVote = currentUserVotes[legislationId];
        
        if (previousVote === null || previousVote === undefined) {
            // No previous vote - cast new vote
            await castLawVote(
                legislation.id || legislation.name,
                voteType,
                legislationType === 'bill' ? 'BILL' : 'LAW',
                currentCountry,
                legislation
            );
            
            currentUserVotes[legislationId] = voteType;
            
            // Update vote counts
            if (!legislation.votes) legislation.votes = { support: 0, oppose: 0, abstain: 0 };
            if (voteType === 'support') {
                legislation.votes.support = (legislation.votes.support || 0) + 1;
            } else if (voteType === 'oppose') {
                legislation.votes.oppose = (legislation.votes.oppose || 0) + 1;
            }
            
            console.log(`[Law Tab] New vote recorded: ${legislationId} → ${voteType}`);
            
        } else if (previousVote === voteType) {
            // User voting the same way - remove vote (toggle off)
            await castLawVote(
                legislation.id || legislation.name,
                null,
                legislationType === 'bill' ? 'BILL' : 'LAW',
                currentCountry,
                legislation
            );
            
            currentUserVotes[legislationId] = null;
            
            // Update vote counts
            if (!legislation.votes) legislation.votes = { support: 0, oppose: 0, abstain: 0 };
            if (voteType === 'support') {
                legislation.votes.support = Math.max(0, (legislation.votes.support || 0) - 1);
            } else if (voteType === 'oppose') {
                legislation.votes.oppose = Math.max(0, (legislation.votes.oppose || 0) - 1);
            }
            
            console.log(`[Law Tab] Vote removed: ${legislationId}`);
            
        } else {
            // User changing vote - remove old, add new
            await castLawVote(
                legislation.id || legislation.name,
                voteType,
                legislationType === 'bill' ? 'BILL' : 'LAW',
                currentCountry,
                legislation
            );
            
            // Update vote counts
            if (!legislation.votes) legislation.votes = { support: 0, oppose: 0, abstain: 0 };
            if (previousVote === 'support') {
                legislation.votes.support = Math.max(0, (legislation.votes.support || 0) - 1);
            } else if (previousVote === 'oppose') {
                legislation.votes.oppose = Math.max(0, (legislation.votes.oppose || 0) - 1);
            }
            
            if (voteType === 'support') {
                legislation.votes.support = (legislation.votes.support || 0) + 1;
            } else if (voteType === 'oppose') {
                legislation.votes.oppose = (legislation.votes.oppose || 0) + 1;
            }
            
            currentUserVotes[legislationId] = voteType;
            
            console.log(`[Law Tab] Vote changed: ${legislationId} ${previousVote} → ${voteType}`);
        }
        
        // Update the vote triangle buttons to show this vote
        const supportBtn = element.querySelector('.law-voting .vote-triangle.support');
        const opposeBtn = element.querySelector('.law-voting .vote-triangle.oppose');
        if (supportBtn && opposeBtn) {
            if (currentUserVotes[legislationId] === 'support') {
                supportBtn.classList.add('active');
                opposeBtn.classList.remove('active');
            } else if (currentUserVotes[legislationId] === 'oppose') {
                opposeBtn.classList.add('active');
                supportBtn.classList.remove('active');
            } else {
                supportBtn.classList.remove('active');
                opposeBtn.classList.remove('active');
            }
        }
        
        // Update the vote display with new tallies
        updateVoteDisplay(itemId, legislation);
        
        console.log(`[Law Tab] Vote action completed for ${legislation.name}`);
        
        // Don't reload - keep the UI stable with the just-voted-on item still visible
        // Vote is already in Firestore, user can refresh page to see updated counts
        
    } catch (error) {
        console.error('Error casting vote:', error);
        alert('Failed to record your vote. Please try again.');
    }
}

/**
 * Support a community suggestion
 */
function supportSuggestion(suggestionId) {
    alert('Support recorded for this suggestion! (Feature in development)');
}

/**
 * Show visual feedback for vote
 */
function showVoteFeedback(itemId, voteType) {
    const triangles = document.querySelectorAll(`#${itemId} .vote-triangle`);
    
    // Remove active class from all triangles
    triangles.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to the voted triangle
    triangles.forEach(btn => {
        if ((voteType === 'support' && btn.classList.contains('support')) ||
            (voteType === 'oppose' && btn.classList.contains('oppose'))) {
            btn.classList.add('active');
        }
    });
}

/**
 * Update vote display with new tallies after voting
 */
function updateVoteDisplay(itemId, legislation) {
    const element = document.getElementById(itemId);
    if (!element) return;
    
    const voteData = legislation.votes || { support: 0, oppose: 0, abstain: 0 };
    const totalVotes = voteData.support + voteData.oppose + voteData.abstain;
    const supportPct = totalVotes > 0 ? Math.round((voteData.support / totalVotes) * 100) : 0;
    
    // Update percentage display
    const supportPctEl = element.querySelector('[style*="color-success"]');
    if (supportPctEl) {
        supportPctEl.textContent = `${supportPct}% Support`;
    }
    
    // Update vote counts display
    const voteCountEl = element.querySelector('[style*="color-fontSecondary"]');
    if (voteCountEl && voteCountEl.textContent.includes('Support:')) {
        voteCountEl.innerHTML = `Support: ${voteData.support} • Oppose: ${voteData.oppose}`;
    }
    
    // Update total votes count in meta
    const metaEl = element.querySelector('.law-item-meta');
    if (metaEl) {
        metaEl.textContent = metaEl.textContent.replace(/\d+ votes/, `${totalVotes} votes`);
    }
    
    // Update approval bar
    const approvalContainer = element.querySelector('.approval-bar-container');
    if (approvalContainer) {
        approvalContainer.innerHTML = `
            <div class="approval-fill" style="width: ${supportPct}%; background: var(--color-success);"></div>
            <div class="approval-fill" style="width: ${100 - supportPct}%; background: #c41e3a;"></div>
        `;
    }
}

/**
 * Cast a vote through the voting system
 */
async function castLawVote(legislationId, position, voteType, country, legislationData) {
    try {
        if (typeof castVote === 'function') {
            // Use the persistent current user ID
            const userId = getCurrentUserId();
            
            // If position is null, we're removing the vote - pass it through
            const voteId = await castVote({
                country,
                voteType: voteType === 'LAW' ? 'bill' : 'bill', // Use consistent vote type
                referenceId: legislationId || legislationData.name,
                referenceTitle: legislationData.name,
                position,
                userId,
                reasoning: '',
                tags: []
            });
            
            console.log(`[Law Vote] Vote recorded: ${voteId}`);
            
            // Sync vote to the project (bills are now projects with category "law")
            try {
                const projectId = legislationData.projectId;
                
                // Vote on the project
                if (projectId && typeof window.voteOnProject === 'function') {
                    // Map vote position to project vote type
                    const projectVoteType = position === 'support' ? 'up' : position === 'oppose' ? 'down' : null;
                    if (projectVoteType) {
                        console.log(`[Law Vote] Syncing vote to project: ${projectId}`);
                        await window.voteOnProject(projectId, null, projectVoteType);
                    }
                } else {
                    console.warn('[Law Vote] projectId not available for syncing');
                }
            } catch (projectError) {
                console.warn('[Law Vote] Could not sync to project:', projectError.message);
                // Continue anyway - governance vote was recorded
            }
            
            return voteId;
        } else {
            console.warn('[Law Vote] castVote function not available');
            console.log(`[Law Vote - Local] ${position} on ${legislationData.name}`);
        }
    } catch (error) {
        console.error('[Law Vote] Error:', error);
        throw error;
    }
}

/**
 * Format date string
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

/**
 * Mock laws and bills for development
 * Data is manually curated from government sources (not auto-refreshed)
 */
function getMockLawsAndBills() {
    return [
        // Current Laws
        {
            id: 'law-1',
            name: 'Environmental Protection Act 2023',
            status: 'enacted',
            type: 'bill',
            passedDate: '2023-06-15',
            description: 'Comprehensive environmental standards including carbon emission regulations and renewable energy requirements.',
            parliamentLink: 'https://bills.parliament.uk/bills/2991',
            votes: { support: 156, oppose: 34, abstain: 12 }
        },
        {
            id: 'law-2',
            name: 'Health and Social Care Act 2022',
            status: 'enacted',
            type: 'bill',
            passedDate: '2022-04-20',
            description: 'NHS reforms and social care integration including workforce expansion and mental health improvements.',
            parliamentLink: 'https://bills.parliament.uk/bills/2990',
            votes: { support: 203, oppose: 18, abstain: 8 }
        },
        {
            id: 'law-3',
            name: 'Digital Markets Act 2023',
            status: 'enacted',
            type: 'bill',
            passedDate: '2023-11-30',
            description: 'Regulation of large digital platforms to promote fair competition and user privacy.',
            parliamentLink: 'https://bills.parliament.uk/bills/3010',
            votes: { support: 89, oppose: 67, abstain: 22 }
        },
        
        // Bills Under Review
        {
            id: 'bill-1',
            name: 'Fair Pay Agreement Bill',
            status: 'bill',
            stage: 'Second Reading',
            introducedDate: '2024-01-15',
            description: 'Establishes sector-wide wage agreements requiring large employers to negotiate pay terms with unions.',
            parliamentLink: 'https://bills.parliament.uk/bills/3445',
            votes: { support: 67, oppose: 45, abstain: 15 }
        },
        {
            id: 'bill-2',
            name: 'Housing Affordability Bill',
            status: 'bill',
            stage: 'Committee',
            introducedDate: '2024-02-01',
            description: 'Increases affordable housing provision through new build requirements and first-time buyer assistance.',
            parliamentLink: 'https://bills.parliament.uk/bills/3456',
            votes: { support: 124, oppose: 31, abstain: 8 }
        },
        {
            id: 'bill-3',
            name: 'Climate Action Acceleration Bill',
            status: 'bill',
            stage: 'Pre-Legislative Scrutiny',
            introducedDate: '2024-02-15',
            description: 'Accelerates UK climate targets to net-zero by 2040 with mandatory transition requirements.',
            parliamentLink: 'https://bills.parliament.uk/bills/3478',
            votes: { support: 145, oppose: 22, abstain: 6 }
        }
    ];
}

/**
 * Debounce search input to avoid excessive filtering
 */
function debounceSearch() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300);
}

/**
 * Apply filters and search to laws/bills
 */
function applyFilters() {
    const typeFilter = document.getElementById('lawTypeFilter')?.value || '';
    const categoryFilter = document.getElementById('lawCategoryFilter')?.value || '';
    const searchTerm = document.getElementById('lawSearchBox')?.value.toLowerCase() || '';
    
    // Filter newly enacted laws
    filteredNewlyEnacted = newlyEnactedLawsCache.filter(law => {
        if (typeFilter && law.status !== typeFilter) return false;
        if (categoryFilter && law.category !== categoryFilter) return false;
        if (searchTerm && 
            !law.name.toLowerCase().includes(searchTerm) &&
            !law.description.toLowerCase().includes(searchTerm)) return false;
        return true;
    });
    
    // Filter bills
    filteredBills = billsCache.filter(bill => {
        if (typeFilter && bill.status !== typeFilter) return false;
        if (categoryFilter && bill.category !== categoryFilter) return false;
        if (searchTerm && 
            !bill.name.toLowerCase().includes(searchTerm) &&
            !bill.description.toLowerCase().includes(searchTerm)) return false;
        return true;
    });
    
    // Reset pagination when filters applied
    currentNewlyEnactedPage = 0;
    currentBillsPage = 0;
    
    // Re-render sections
    renderNewlyEnactedLawsSection();
    renderBillsSection();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('lawSearchBox').value = '';
    document.getElementById('lawTypeFilter').value = '';
    document.getElementById('lawCategoryFilter').value = '';
    applyFilters();
}

/**
 * DEBUG: Reload with real bills from Parliament API
 */
async function reloadWithRealBills() {
    console.log('[Law Tab DEBUG] Reloading with real bills from Parliament API...');
    
    if (typeof window.loadRealBills !== 'function') {
        alert('loadRealBills not available. Make sure billsDataService.js is loaded.');
        return;
    }
    
    try {
        const realBills = await window.loadRealBills();
        
        if (!realBills || realBills.length === 0) {
            alert('No bills returned from API. Check console for errors.');
            return;
        }
        
        // Separate by status
        newlyEnactedLawsCache = realBills.filter(item => item.status === 'enacted');
        billsCache = realBills.filter(item => item.status === 'bill');
        
        // Reset pagination
        currentNewlyEnactedPage = 0;
        currentBillsPage = 0;
        filteredNewlyEnacted = [];
        filteredBills = [];
        
        // Re-render
        renderNewlyEnactedLawsSection();
        renderBillsSection();
        
        alert(`✓ Loaded ${newlyEnactedLawsCache.length} laws + ${billsCache.length} bills from Parliament API`);
        console.log('[Law Tab DEBUG] Successfully reloaded with real bills');
    } catch (error) {
        alert(`✗ Error loading real bills: ${error.message}`);
        console.error('[Law Tab DEBUG] Error:', error);
    }
}

/**
 * DEBUG: Test Parliament API connection
 */
async function testParliamentAPI() {
    console.log('[Law Tab DEBUG] Testing Parliament API...');
    
    if (typeof window.testBillsAPI !== 'function') {
        alert('testBillsAPI not available. Check billsDataService.js is loaded.');
        return;
    }
    
    try {
        const testBills = await window.testBillsAPI();
        console.log('[Law Tab DEBUG] API test complete. Check console for results.');
        alert(`API Test Complete - Found ${testBills.length} bills. See console for details.`);
    } catch (error) {
        alert(`✗ API Test failed: ${error.message}`);
        console.error('[Law Tab DEBUG] Error:', error);
    }
}

/**
 * DEBUG: Inspect API endpoints
 */
async function inspectParliamentAPI() {
    console.log('[Law Tab DEBUG] Inspecting Parliament API endpoints...');
    
    if (typeof window.inspectAPIEndpoints !== 'function') {
        alert('inspectAPIEndpoints not available. Check billsDataService.js is loaded.');
        return;
    }
    
    try {
        await window.inspectAPIEndpoints();
        alert('API Inspection complete. Check console for results.');
    } catch (error) {
        alert(`✗ API Inspection failed: ${error.message}`);
        console.error('[Law Tab DEBUG] Error:', error);
    }
}

/**
 * DEBUG: Show current bills in console
 */
function debugShowBills() {
    console.log('\n========== CURRENT LEGISLATION IN MEMORY ==========');
    console.log(`Newly Enacted Laws Cache: ${newlyEnactedLawsCache.length} items`);
    console.log(newlyEnactedLawsCache.slice(0, 3));
    console.log(`\nBills Cache: ${billsCache.length} items`);
    console.log(billsCache.slice(0, 3));
    console.log(`\nAll Legislation Cache: ${allLegislationCache.length} items (loaded: ${allLegislationLoaded})`);
    console.log('==================================================\n');
}

/**
 * Mock historical legislation for development/fallback
 * In production, this will come from Firestore bulk import
 */
function getMockAllLegislation() {
    return [
        {
            id: 'law-hist-1',
            name: 'Inquiry into Inquiry into Mirror Group Newspapers plc',
            status: 'enacted',
            type: 'historical',
            dateEnacted: '2023-05-15',
            description: 'Historical legislation concerning inquiry proceedings.',
            votes: { support: 45, oppose: 12, abstain: 5 }
        },
        {
            id: 'law-hist-2',
            name: 'Courts and Legal Services Act 1990',
            status: 'enacted',
            type: 'historical',
            dateEnacted: '1990-07-01',
            description: 'Reform of the court system and legal profession in England and Wales.',
            votes: { support: 78, oppose: 8, abstain: 2 }
        },
        {
            id: 'law-hist-3',
            name: 'Human Rights Act 1998',
            status: 'enacted',
            type: 'historical',
            dateEnacted: '1998-11-09',
            description: 'Incorporation of the European Convention on Human Rights into UK law.',
            votes: { support: 156, oppose: 23, abstain: 10 }
        }
    ];
}
