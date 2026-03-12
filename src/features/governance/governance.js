/**
 * Governance Workspace - Tab & Modal Management
 */

// Import Firebase and Firestore functions 
import { db, auth } from '../../../firebase.js';
import { collection, getDocs, query } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import real Budget 2025 data
import { budget2025 } from './budget2025_data.js';
import { POLICY_PRIORITIES, PRIORITY_SCALE, PARTY_PRIORITY_SCORES, PARTY_POSITION_SOURCES, PARTY_PRIORITY_SOURCE_URLS, PARTY_PRIORITY_SOURCE_DATES, calculatePartyAlignment, getPartyInfo, getPartyNamesFromArray, convertResponsesToScores, generateManifestoFromAverageScores, getPartyScoresForPriority, calculateUserPartyAlignment, generatePersonalManifestoFromResponses, getUserBestMatchParties, getPositionSource } from './prioritiesData.js';

// Import geolocation utility for IP-based country detection
import { detectIPCountry, checkCountryMismatch } from './geolocation.js';

console.log('[Governance Module] Loaded, auth object:', auth ? 'present' : 'missing');

// Initialize auth state IMMEDIATELY (don't wait for DOMContentLoaded)
function initializeAuthState() {
    console.log('[Governance Auth] Setting up listener...');
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.currentUserId = user.uid;
            console.log('[Governance Auth] ✅ User authenticated:', user.uid, 'email:', user.email);
            updateAuthUI(user);
        } else {
            window.currentUserId = null;
            console.log('[Governance Auth] ❌ No user authenticated');
            updateAuthUI(null);
        }
    });
}

// Call initialization immediately when module loads
initializeAuthState();

// Setup page exit handler for auto-save
window.addEventListener('beforeunload', async (e) => {
    // Save user profile before leaving
    const currentUser = auth.currentUser;
    if (currentUser) {
        await saveVoteProfile(currentUser.uid);
    }
});

// Also initialize on page load as backup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Governance] Page loaded, DOMContentLoaded firing...');
    console.log('[Governance] window.currentUserId:', window.currentUserId);
    console.log('[Governance] auth.currentUser:', auth.currentUser);
    
    await loadGovernanceData();
    
    // Check for country/IP mismatch (Phase 2A - warnings only)
    if (auth.currentUser) {
        await checkAndDisplayCountryMismatch(auth.currentUser.uid);
    }
    
    // Initialize priority averages from database
    await initializePriorityAverages();
    
    // Initialize party priority scores in Firestore (on first load)
    await initializePartyPriorityScores();
    
    // Enable debug mode with Ctrl+Shift+D on Law tab
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) {
                debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
                console.log('[Debug] Panel toggled. Press Ctrl+Shift+D to toggle again.');
            }
        }
    });
});

/**
 * Initialize Auth State
 * Ensures window.currentUserId is set from Firebase Auth
 */

/**
 * Update UI based on auth state
 */
function updateAuthUI(user) {
    const saveBtn = document.querySelector('button[onclick="saveTaxCalculatorToProfile()"]');
    const loadBtn = document.querySelector('button[onclick="loadTaxCalculatorFromProfile()"]');
    const authIndicator = document.getElementById('authStatusIndicator');
    
    if (saveBtn) {
        if (user) {
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
            saveBtn.title = 'Save your tax information to your profile';
        } else {
            saveBtn.style.opacity = '0.6';
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.title = 'Sign in to save your profile';
        }
    }
    
    if (loadBtn) {
        if (user) {
            loadBtn.style.opacity = '1';
            loadBtn.style.cursor = 'pointer';
            loadBtn.title = 'Load your saved tax information';
        } else {
            loadBtn.style.opacity = '0.6';
            loadBtn.style.cursor = 'not-allowed';
            loadBtn.title = 'Sign in to load your saved data';
        }
    }
    
    // Update auth status indicator
    if (authIndicator) {
        if (user) {
            const userEmail = typeof user === 'string' ? user : (user.email || 'Signed in');
            authIndicator.innerHTML = `<span style="color: #10b981;">✓ ${userEmail}</span>`;
            authIndicator.title = 'You are signed in and can save/load data';
        } else {
            authIndicator.innerHTML = `<span style="color: #ef4444;">✗ Not signed in</span>`;
            authIndicator.title = 'Sign in to your account to use save/load features';
        }
    }
}

/**
 * Switch between main tabs
 */
function switchTab(tabName) {
    // Hide all panels
    document.querySelectorAll('.governance-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Deactivate all tabs
    document.querySelectorAll('.folder-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected panel
    const panel = document.getElementById(`panel-${tabName}`);
    if (panel) {
        panel.classList.add('active');
    }

    // Activate selected tab
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    if (tab) {
        tab.classList.add('active');
    }

    // Load tab-specific data
    loadTabData(tabName);
}

/**
 * Switch between Law subtabs
 */
function switchLawSubtab(subtabName) {
    // Hide all law subtab content
    document.querySelectorAll('.law-subtab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all law subtabs
    document.querySelectorAll('.law-subtab').forEach(subtab => {
        subtab.classList.remove('active');
    });

    // Show selected subtab content
    const content = document.getElementById(`law-${subtabName}`);
    if (content) {
        content.classList.add('active');
    }

    // Activate selected subtab button
    event.target.classList.add('active');

    // Load subtab-specific data if needed
    if (subtabName === 'laws') {
        loadLawsAndBills(getCurrentCountry());
    }
}

/**
 * Switch between Budget subtabs
 */
function switchBudgetSubtab(subtabName) {
    // Hide all budget subtab content
    document.querySelectorAll('.budget-subtab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all budget subtabs
    document.querySelectorAll('.budget-subtab').forEach(subtab => {
        subtab.classList.remove('active');
    });

    // Show selected subtab content
    const content = document.getElementById(`budget-${subtabName}`);
    if (content) {
        content.classList.add('active');
    }

    // Activate selected subtab button
    event.target.classList.add('active');

    // Load subtab-specific data if needed
    if (subtabName === 'spend') {
        loadBudgetSpendData();
    } else if (subtabName === 'revenue') {
        loadBudgetRevenueData();
    } else if (subtabName === 'personal') {
        loadBudgetPersonalData();
    }
}

/**
 * Toggle collapsible section
 */
function toggleCollapsible(headerElement) {
    const isCollapsed = headerElement.classList.contains('collapsed');
    const content = headerElement.nextElementSibling;

    if (isCollapsed) {
        headerElement.classList.remove('collapsed');
        content.classList.add('show');
    } else {
        headerElement.classList.add('collapsed');
        content.classList.remove('show');
    }
}

/**
 * Load tab-specific data
 */
async function loadTabData(tabName) {
    const country = getCurrentCountry();
    
    switch(tabName) {
        case 'manifesto':
            await loadManifestoTab(country);
            break;
        case 'leaders':
            await loadLeadersTab();
            break;
        case 'law':
            // Laws will load when switching to laws subtab
            break;
        case 'budget':
            // Budget tab placeholder
            break;
        case 'priorities':
            await loadPrioritiesTab(country);
            break;
        case 'schemes':
            await loadSchemesTab(country);
            break;
    }
}

/**
 * Get current selected country
 */
function getCurrentCountry() {
    return 'UK';
}

/**
 * Load governance data on page load
 */
async function loadGovernanceData() {
    const country = getCurrentCountry();
    await loadManifestoTab(country);
    document.getElementById('lastUpdated').textContent = 'just now';
    
    // Restore persisted user data from localStorage
    loadTaxProfileFromLocalStorage();
}

/**
 * Check and display country/IP mismatch warning
 * Phase 2A: Show warning banner if user's IP country doesn't match account country
 */
async function checkAndDisplayCountryMismatch(userId) {
    try {
        // Get user's account country
        const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.log('[Geolocation] No user document found');
            return;
        }
        
        const accountCountry = userDoc.data().country;
        
        if (!accountCountry) {
            console.log('[Geolocation] User has not set country yet');
            return;
        }
        
        // Check IP country
        const mismatchData = await checkCountryMismatch(accountCountry);
        
        if (!mismatchData) {
            console.log('[Geolocation] Could not verify IP country');
            return;
        }
        
        // Store in window for voting eligibility checks
        window.countryMismatch = mismatchData;
        
        if (!mismatchData.matches) {
            console.warn('[Geolocation] ⚠️ Country mismatch detected:', mismatchData);
            displayCountryMismatchBanner(mismatchData);
        } else {
            console.log('[Geolocation] ✅ IP country matches account country');
        }
        
    } catch (error) {
        console.error('[Geolocation] Error checking country mismatch:', error);
    }
}

/**
 * Display warning banner for country/IP mismatch
 */
function displayCountryMismatchBanner(mismatchData) {
    // Create banner if it doesn't exist
    let banner = document.getElementById('countryMismatchBanner');
    
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'countryMismatchBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #fff3cd;
            border-bottom: 2px solid #ff9800;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 0.95em;
        `;
        
        const warningIcon = document.createElement('span');
        warningIcon.textContent = '⚠️';
        warningIcon.style.fontSize = '1.2em';
        warningIcon.style.flexShrink = '0';
        
        const messageDiv = document.createElement('div');
        messageDiv.style.flex = '1';
        messageDiv.innerHTML = `
            <strong>Location Mismatch</strong><br>
            <span style="font-size: 0.9em;">Your IP address suggests you're in <strong>${mismatchData.ipCountry}</strong>, but your account is set to <strong>${mismatchData.accountCountry}</strong>. 
            You can still vote, but this may be reviewed. <a href="#" onclick="reportCountryMismatch(event)" style="color: #ff9800; text-decoration: underline;">Report change</a></span>
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.2em;
            cursor: pointer;
            color: #856404;
            padding: 0;
            flex-shrink: 0;
        `;
        closeBtn.onclick = () => banner.style.display = 'none';
        
        banner.appendChild(warningIcon);
        banner.appendChild(messageDiv);
        banner.appendChild(closeBtn);
        
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Add top margin to body to account for fixed banner
        document.body.style.paddingTop = (banner.offsetHeight + 10) + 'px';
    }
}

/**
 * Handle country mismatch report (prepare for Phase 2B)
 */
async function reportCountryMismatch(event) {
    event.preventDefault();
    
    if (!window.countryMismatch) return;
    
    const { ipCountry, accountCountry } = window.countryMismatch;
    
    const message = `I need to update my country. My IP suggests I'm in ${ipCountry}, but my account is set to ${accountCountry}. Please help me change this.`;
    
    alert(`Report sent:\n\n${message}\n\nSupport will review your request within 24 hours.`);
    console.log('[Geolocation] Country change report:', { ipCountry, accountCountry, timestamp: new Date().toISOString() });
}

/**
 * Load Latest Community or Personal Manifesto
 * Generates manifesto based on priority data
 */
async function loadLatestManifesto(country) {
    // By default, return community manifesto from priority averages
    if (!window.priorityAverages || Object.keys(window.priorityAverages).length === 0) {
        return {
            party: null,
            leader: 'Cloud Beacon Community',
            type: 'community',
            description: 'Community priorities (awaiting data)',
            policies: []
        };
    }
    
    // Convert averages to scores format
    const averages = {};
    for (const [key, avgValue] of Object.entries(window.priorityAverages)) {
        const [areaId, questionId] = key.split('.');
        if (!averages[areaId]) averages[areaId] = {};
        averages[areaId][questionId] = typeof avgValue === 'number' ? avgValue : 3;
    }
    
    // Generate community manifesto from averages
    const communityPolicies = generateManifestoFromAverageScores(averages);
    
    return {
        party: null,
        leader: 'Cloud Beacon Community',
        type: 'community',
        colour: '#10b981',
        description: 'Policies that the community prioritizes (average score >3.5)',
        keyline: `${communityPolicies.length} community priorities identified from user votes`,
        policies: communityPolicies.map(policy => ({
            title: policy.question,
            areaTitle: policy.areaTitle,
            position: `Community average: ${policy.averageScore}/5 - Supported by: ${policy.supportedBy}`,
            keyCommitments: `${Math.round(policy.averageScore * 20)}% of community rates this essential`
        })),
        totalVotes: window.priorityAverages ? Object.keys(window.priorityAverages).length : 0,
        stats: {
            totalVoters: Object.keys(loadUserPriorityResponses()).length
        }
    };
}

/**
 * Load Manifesto by Type (Party, Community, or Personal)
 */
async function loadManifestoByType(type) {
    // Personal manifesto
    if (type === 'personal') {
        const userResponses = loadUserPriorityResponses();
        if (!userResponses || Object.keys(userResponses).length === 0) {
            return {
                party: null,
                leader: 'Your Personal Manifesto',
                type: 'personal',
                colour: '#6366f1',
                description: 'Your political priorities (take the questionnaire to generate)',
                policies: []
            };
        }
        
        const personalPolicies = generatePersonalManifestoFromResponses(userResponses);
        const userAlignment = calculateUserPartyAlignment(userResponses);
        
        return {
            party: null,
            leader: 'Your Personal Manifesto',
            type: 'personal',
            colour: '#6366f1',
            description: 'Your political platform based on your priority responses',
            keyline: 'Issues you consider essential or important',
            policies: personalPolicies.map(policy => ({
                title: policy.question,
                areaTitle: policy.areaTitle,
                position: `Your position: ${policy.scoreLabel} - Supported by: ${policy.supportedBy}`,
                keyCommitments: [
                    `Party alignment: ${Object.entries(userAlignment).sort((a, b) => b[1] - a[1])[0][0]} (${Object.entries(userAlignment).sort((a, b) => b[1] - a[1])[0][1]}%)`
                ]
            })),
            stats: {
                totalVoters: 1,
                totalVotes: Object.values(userResponses).reduce((sum, area) => sum + Object.keys(area).length, 0)
            }
        };
    }
    
    // Community manifesto
    if (type === 'community') {
        return loadLatestManifesto('UK');
    }
    
    // Party manifesto - get from standardizedManifestos if available
    if (typeof getStandardizedManifesto === 'function') {
        return getStandardizedManifesto(type);
    }
    
    // Fallback to a basic party structure
    const partyInfo = {
        'labour': { name: 'Labour Party', colour: '#E4003B', leader: 'Sir Keir Starmer' },
        'conservative': { name: 'Conservative Party', colour: '#0087DC', leader: 'Rishi Sunak' },
        'libdems': { name: 'Liberal Democrats', colour: '#FAA61A', leader: 'Ed Davey' },
        'green': { name: 'Green Party', colour: '#6AB023', leader: 'Siân Berry & Adrian Ramsay' },
        'reform': { name: 'Reform UK', colour: '#0087DC', leader: 'Nigel Farage' },
        'plaid': { name: 'Plaid Cymru', colour: '#005B54', leader: 'Rhun ap Iorwerth' }
    };
    
    const info = partyInfo[type] || { name: type, colour: '#333' };
    
    return {
        party: info.name,
        leader: info.leader || 'TBD',
        colour: info.colour,
        type: 'party',
        description: `Official manifesto of the ${info.name}`,
        policies: [],
        sourceUrl: `https://www.gov.uk`
    };
}

/**
 * Load Manifesto Tab
 */
async function loadManifestoTab(country) {
    try {
        const manifesto = await loadLatestManifesto(country);
        renderManifestoTab(manifesto);
    } catch (error) {
        console.error('Error loading manifesto:', error);
        document.getElementById('manifestoContent').innerHTML = '<p>Unable to load manifesto data.</p>';
    }
}

/**
 * Switch between different manifestos
 */
async function switchManifesto(type) {
    try {
        console.log('[Governance] Switching to manifesto:', type);
        const manifesto = await loadManifestoByType(type);
        renderManifestoTab(manifesto);
        
        // Update dropdown to reflect current selection
        const dropdown = document.getElementById('manifestoSelector');
        if (dropdown) {
            dropdown.value = type;
        }
    } catch (error) {
        console.error('[Governance] Error switching manifesto:', error);
    }
}

/**
 * Render Manifesto Tab Content
 */
function renderManifestoTab(manifesto) {
    if (!manifesto) {
        document.getElementById('manifestoContent').innerHTML = '<p>No manifesto data available.</p>';
        return;
    }

    // Show/hide the Compare container based on manifesto type
    const compareContainer = document.getElementById('compareContainer');
    if (manifesto.party) {
        // Hide compare for party manifestos when viewing individual party
        compareContainer.style.display = 'none';
    } else {
        // Show compare for community/personal manifestos
        compareContainer.style.display = 'block';
    }

    // Hide/show stats based on manifesto type
    const statsContainer = document.querySelector('.manifesto-stats');
    if (statsContainer) {
        statsContainer.style.display = manifesto.party ? 'none' : 'grid';
    }

    // Update stats
    document.getElementById('stats-votes').textContent = manifesto.totalVotes?.toLocaleString() || '0';
    document.getElementById('stats-contributors').textContent = manifesto.contributors || manifesto.stats?.totalVoters || '0';
    document.getElementById('stats-bills').textContent = manifesto.billsVotedOn || '0';

    // Build manifesto header
    let html = '';
    
    // Show party info for party manifestos
    if (manifesto.party) {
        const bgColor = manifesto.colour ? manifesto.colour + '15' : '#f0f0f0'; // Light version of party color
        html += `
        <div style="background: ${bgColor}; padding: 20px; border-left: 4px solid ${manifesto.colour || '#333'}; margin-bottom: 20px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
                <div style="flex: 1;">
                    <div style="font-size: 0.9em; color: var(--color-fontSecondary);">Political Party Manifesto</div>
                    <h1 style="margin: 8px 0; font-size: 1.8em; color: var(--color-buttonPrimary);">${manifesto.party}</h1>
                    ${manifesto.leader ? `<div style="color: var(--color-fontSecondary); margin-bottom: 10px;">Leader: ${manifesto.leader}</div>` : ''}
                    <p style="margin: 12px 0; font-size: 1.1em; font-weight: 500;">${manifesto.description || manifesto.keyline}</p>
                    ${manifesto.keyline && manifesto.keyline !== manifesto.description ? `<p style="margin: 0; color: var(--color-fontSecondary);">${manifesto.keyline}</p>` : ''}
                </div>
                ${manifesto.sourceUrl ? `
                <a href="${manifesto.sourceUrl}" target="_blank" rel="noopener noreferrer" style="padding: 12px 20px; background: ${manifesto.colour || '#0087DC'}; color: white; text-decoration: none; border-radius: 4px; white-space: nowrap; display: inline-block; font-size: 0.95em; font-weight: 500; min-width: 160px; text-align: center; transition: opacity 0.2s;">
                    📄 Source Manifesto
                </a>
                ` : ''}
            </div>
        </div>
        `;
    } else {
        // Community or personal manifesto header
        html += `
        <div style="margin-bottom: 20px;">
            <h1 style="margin: 0 0 8px 0; font-size: 1.8em;color: var(--color-fontSecondary);">${manifesto.leader || 'Community Manifesto'}</h1>
            <p style="margin: 0; color: var(--color-fontPrimary);">${manifesto.description || 'Collective policy positions'}</p>
        </div>
        `;
    }

    // Show core values for party manifestos
    if (manifesto.coreValues && manifesto.coreValues.length > 0) {
        html += `
        <div style="background: var(--color-background2); padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <strong>Core Values:</strong>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
        `;
        manifesto.coreValues.forEach(value => {
            html += `<span style="background: var(--color-primary); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.9em;">${value}</span>`;
        });
        html += '</div></div>';
    }

    // Add transparency button for all manifestos
    html += `
    <div style="margin-bottom: 20px; padding: 12px 16px; background: var(--color-pageBackground); border-radius: 6px; display: flex; gap: 10px; align-items: center;">
        <button onclick="openPriorityScoresModal()" style="padding: 10px 16px; background: var(--color-buttonSecondary); color: var(--color-buttonPrimary); border: 2px solid var(--color-buttonPrimary); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: all 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
            View Scoring Methodology
        </button>
        <span style="font-size: 0.85em; color: var(--color-fontSecondary); flex: 1;">See how party scores are calculated for each priority</span>
    </div>
    `;
    if (manifesto.policies && manifesto.policies.length > 0) {
        manifesto.policies.forEach(policy => {
            // Determine styling for "no position" sections
            const isNoPosition = policy.hasNoPosition || policy.position.includes('has not published an official position');
            const sectionStyle = isNoPosition ? 'opacity: 0.7; background: var(--color-background2); padding: 12px; border-radius: 4px;' : '';
            
            html += `
            <div class="manifesto-section" style="${sectionStyle}">
                <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <h2 style="margin: 0; font-size: 1.3em;">${policy.title}</h2>
                        ${isNoPosition ? '<span style="font-size: 0.8em; color: var(--color-fontSecondary); font-style: italic;">No official position</span>' : ''}
                    </div>
                </div>
                <div class="manifesto-position">${policy.position}</div>
            `;

            // Add key commitments for party manifestos
            if (policy.keyCommitments && policy.keyCommitments.length > 0 && !isNoPosition) {
                html += '<div style="margin-top: 15px; background: var(--color-background2); padding: 12px; border-radius: 4px;"><strong>Key Commitments:</strong><ul style="margin: 8px 0; padding-left: 20px;">';
                policy.keyCommitments.forEach(commitment => {
                    html += `<li style="margin: 4px 0;">${commitment}</li>`;
                });
                html += '</ul></div>';
            }

            // Add supporting bills
            if (policy.supportingBills && policy.supportingBills.length > 0) {
                html += '<div style="margin-top: 15px;"><strong>Supporting Legislation:</strong>';
                policy.supportingBills.forEach(bill => {
                    html += `<div style="margin: 8px 0; font-size: 0.9em;">• ${bill.name} — ${bill.status}</div>`;
                });
                html += '</div>';
            }

            // Add vote stats (for community manifesto)
            if (policy.votes && !manifesto.party) {
                const total = policy.votes.support + policy.votes.oppose + policy.votes.abstain;
                const supportPct = total > 0 ? ((policy.votes.support / total) * 100).toFixed(0) : 0;
                html += `
                <div style="margin-top: 15px; padding: 12px; background: var(--color-background2); border-radius: 4px;">
                    <div style="font-size: 0.9em; margin-bottom: 8px;">
                        <span class="vote-stat">✓ Support: ${policy.votes.support} (${supportPct}%)</span>
                        <span class="vote-stat" style="margin-left: 15px;">✗ Oppose: ${policy.votes.oppose}</span>
                        <span class="vote-stat" style="margin-left: 15px;">~ Abstain: ${policy.votes.abstain}</span>
                    </div>
                </div>
                `;
            }

            html += '</div>';
        });
    } else {
        html += '<p style="color: var(--color-fontSecondary);">No policies in manifesto yet.</p>';
    }

    document.getElementById('manifestoContent').innerHTML = html;
}

/**
 * Load Priorities Tab
 */
/**
 * Define the 13 policy areas and political parties for voting
 */
const POLICY_AREAS = [
    { id: 'health', title: 'Health & Social Care', icon: '' },
    { id: 'economy', title: 'Economy & Business', icon: '' },
    { id: 'environment', title: 'Environment & Climate', icon: '' },
    { id: 'housing', title: 'Housing & Homelessness', icon: '' },
    { id: 'education', title: 'Education & Skills', icon: '' },
    { id: 'employment', title: 'Employment & Workers Rights', icon: '' },
    { id: 'transport', title: 'Public Transport & Infrastructure', icon: '' },
    { id: 'costliving', title: 'Cost of Living & Welfare', icon: '' },
    { id: 'crime', title: 'Crime & Justice', icon: '' },
    { id: 'immigration', title: 'Immigration & Asylum', icon: '' },
    { id: 'energy', title: 'Energy & Utilities', icon: '' },
    { id: 'devolution', title: 'Local Government & Devolution', icon: '' },
    { id: 'defence', title: 'Defence & Security', icon: '' }
];

const PARTIES = [
    { id: 'labour', name: 'Labour Party', color: '#E4003B' },
    { id: 'conservative', name: 'Conservative Party', color: '#0087DC' },
    { id: 'libdems', name: 'Liberal Democrats', color: '#FAA61A' },
    { id: 'green', name: 'Green Party', color: '#6AB023' },
    { id: 'reform', name: 'Reform UK', color: '#0087DC' },
    { id: 'plaid', name: 'Plaid Cymru', color: '#005B54' }
];

async function loadPrioritiesTab(country) {
    try {
        // Ensure averages are loaded before rendering
        if (!window.priorityAverages || Object.keys(window.priorityAverages).length === 0) {
            console.log('[Governance] Loading averages before rendering priorities...');
            window.priorityAverages = await calculateAverageScores();
        }
        
        await renderPrioritiesTab();
    } catch (error) {
        console.error('Error loading priorities:', error);
        document.getElementById('prioritiesContent').innerHTML = '<p>Unable to load priorities data.</p>';
    }
}

/**
 * Render Priorities Tab - Granular policy questions with 5-point priority scale
 */
async function renderPrioritiesTab() {
    const container = document.getElementById('prioritiesContent');
    
    // Load user's existing responses from localStorage
    const userResponses = loadUserPriorityResponses();
    
    // Calculate user stats for summary
    const totalQuestions = Object.values(POLICY_PRIORITIES).reduce((sum, area) => sum + area.questions.length, 0);
    // Only count responses for areas that exist in POLICY_PRIORITIES (filters out old 'controversies' data)
    const answeredQuestions = Object.entries(userResponses).reduce((sum, [areaId, questions]) => {
        return POLICY_PRIORITIES[areaId] ? sum + Object.keys(questions).length : sum;
    }, 0);
    const progressPercent = Math.round((answeredQuestions / totalQuestions) * 100);
    
    // Calculate user's party alignment
    const userPartyAlignment = calculateUserPartyAlignment(userResponses);
    const bestMatchParties = getUserBestMatchParties(userResponses);
    const topParty = bestMatchParties[0];
    
    // Calculate which priorities would be in the community manifesto (avg > 3.5)
    const communityManifestoPriorities = [];
    for (const [areaId, areaData] of Object.entries(POLICY_PRIORITIES)) {
        for (const question of areaData.questions) {
            const avgKey = `${areaId}.${question.id}`;
            const avgScore = window.priorityAverages?.[avgKey] || 0;
            if (typeof avgScore === 'number' && avgScore > 3.5) {
                communityManifestoPriorities.push({
                    areaId: areaId,
                    areaTitle: areaData.title,
                    questionId: question.id,
                    question: question.question,
                    averageScore: avgScore,
                    originParties: question.originParties
                });
            }
        }
    }
    
    let html = `
        <!-- Summary Header -->
        <div style="background: linear-gradient(135deg, var(--tab-color) 0%, rgba(99, 102, 241, 0.1) 100%); padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.2);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                <!-- Progress -->
                <div>
                    <div style="font-size: 0.85em; color: var(--color-fontSecondary); margin-bottom: 6px; font-weight: 600;">YOUR PROGRESS</div>
                    <div style="font-size: 1.8em; font-weight: 700; color: var(--color-fontPrimary); margin-bottom: 6px;">${answeredQuestions} / ${totalQuestions}</div>
                    <div style="width: 100%; height: 6px; background: var(--color-background2); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: var(--tab-color); transition: width 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.75em; color: var(--color-fontSecondary); margin-top: 6px;">${progressPercent}% Complete</div>
                </div>
                
                <!-- Top Match Party -->
                <div>
                    <div style="font-size: 0.85em; color: var(--color-fontSecondary); margin-bottom: 6px; font-weight: 600;">YOUR BEST MATCH</div>
                    ${topParty ? `
                        <div style="font-size: 1.8em; font-weight: 700; color: ${topParty.color}; margin-bottom: 6px;">${topParty.name}</div>
                        <div style="font-size: 0.85em; color: var(--color-fontPrimary);">Alignment: <span style="color: ${topParty.color}; font-weight: 600;">${topParty.score}%</span></div>
                    ` : `
                        <div style="font-size: 0.9em; color: var(--color-fontSecondary);">Answer more questions to see your best match party</div>
                    `}
                </div>
                
                <!-- Community Consensus -->
                <div>
                    <div style="font-size: 0.85em; color: var(--color-fontSecondary); margin-bottom: 6px; font-weight: 600;">COMMUNITY CONSENSUS</div>
                    <div style="font-size: 1.8em; font-weight: 700; color: var(--color-fontPrimary); margin-bottom: 6px;">${communityManifestoPriorities.length}</div>
                    <div style="font-size: 0.85em; color: var(--color-fontSecondary);">Priorities rated essential (avg >3.5)</div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="openPersonalProfile()" style="padding: 10px 16px; background: var(--tab-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    📊 View Full Political Profile
                </button>
                ${answeredQuestions > 0 ? `
                    <button onclick="downloadPersonalManifesto()" style="padding: 10px 16px; background: transparent; color: var(--tab-color); border: 2px solid var(--tab-color); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: all 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        📄 Download Your Manifesto
                    </button>
                ` : ''}
                <button onclick="openPriorityScoresModal()" style="padding: 10px 16px; background: transparent; color: var(--tab-color); border: 2px solid var(--tab-color); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9em; transition: all 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                    🔍 Show Scoring Methodology
                </button>
            </div>
        </div>

        <!-- Info Section -->
        <div style="background: var(--color-background2); padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.95em;">
                <strong>How it works:</strong> Rate your priorities across 13 key policy areas. For each statement, choose how strongly you agree or disagree (Mustn't to Must). Your responses help us understand your policy preferences and which parties align with your views.
            </p>
        </div>
        
        <!-- Community Manifesto Preview -->
        ${communityManifestoPriorities.length > 0 ? `
            <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 12px 0; color: var(--color-fontPrimary);">🏛️ Community Manifesto Preview</h3>
                <p style="margin: 0 0 15px 0; color: var(--color-fontSecondary); font-size: 0.9em;">These priorities have strong community consensus (average rating > 3.5):</p>
                <div style="display: grid; gap: 10px; max-height: 300px; overflow-y: auto;">
                    ${communityManifestoPriorities.sort((a, b) => b.averageScore - a.averageScore).slice(0, 10).map(priority => `
                        <div style="background: white; padding: 12px; border-radius: 6px; border-left: 3px solid ${POLICY_PRIORITIES[priority.areaId].color}; display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 0.9em; color: var(--color-fontPrimary); margin-bottom: 2px;">${priority.question}</div>
                                <div style="font-size: 0.8em; color: var(--color-fontSecondary);">${priority.areaTitle}</div>
                            </div>
                            <div style="background: ${POLICY_PRIORITIES[priority.areaId].color}; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 0.8em; margin-left: 12px;">
                                ${priority.averageScore.toFixed(1)}★
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    // Iterate through each policy area
    for (const [areaId, areaData] of Object.entries(POLICY_PRIORITIES)) {
        const isExpanded = localStorage.getItem(`priorityAreaExpanded_${areaId}`) !== 'false';
        const arrowSymbol = isExpanded ? '∨' : '›';
        const displayStyle = isExpanded ? 'block' : 'none';
        
        html += `
            <div style="margin-bottom: 15px; border: 1px solid var(--color-border); border-left: 4px solid ${areaData.color}; border-radius: 8px; overflow: hidden;">
                <!-- Area Header (Collapsible) -->
                <div class="priority-area-header" data-area-id="${areaId}" onclick="togglePriorityArea('${areaId}')" style="padding: 16px; background: var(--color-cardBackground); cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--color-fontPrimary); display: flex; align-items: center;">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${areaData.color}; border-radius: 3px; margin-right: 10px;"></span>
                            <span class="area-title">${areaData.title}</span>
                        </div>
                    </div>
                    <div class="area-arrow" style="font-size: 1.4em; color: ${areaData.color}; margin-left: 16px; flex-shrink: 0;">${arrowSymbol}</div>
                </div>
                
                <!-- Area Content (Collapsible) -->
                <div class="priority-area-content" data-area-id="${areaId}" style="display: ${displayStyle}; padding: 0; background: transparent; border-top: 1px solid var(--color-border);">
        `;

        // Show each question for this area
        for (const question of areaData.questions) {
            const currentResponse = userResponses?.[areaId]?.[question.id] || 'dont_care';
            const partyNames = getPartyNamesFromArray(question.originParties);
            
            // Get calculated average from global store (or show placeholder if not yet calculated)
            const avgKey = `${areaId}.${question.id}`;
            let avgScore = window.priorityAverages?.[avgKey] || '-';
            // If avgScore is NaN, display 3 (neutral/don't care)
            if (typeof avgScore === 'number' && isNaN(avgScore)) {
                avgScore = 3;
            } else if (typeof avgScore === 'number') {
                avgScore = avgScore.toFixed(1);
            }
            
            html += `
                <div style="margin-bottom: 0; padding: 15px; background: var(--color-cardBackground); border-bottom: 1px solid var(--color-border); border-left: 3px solid ${areaData.color}; position: relative;">
                    <!-- Average Score Badge -->
                    <div style="position: absolute; top: 12px; right: 12px; background: var(--color-background2); padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 600; color: var(--color-fontPrimary); border: 1px solid var(--color-border);">
                        Avg: <span style="color: ${areaData.color};">${avgScore}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px; padding-right: 80px;">
                        <div style="font-weight: 500; color: var(--color-fontPrimary); margin-bottom: 4px;">${question.question}</div>
                        <div style="font-size: 0.8em; color: var(--color-fontSecondary);">Supported by: ${partyNames}</div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            `;
            
            // Create 5 buttons for the priority scale
            for (const scaleOption of PRIORITY_SCALE) {
                const isSelected = currentResponse === scaleOption.value;
                const bgColor = isSelected ? scaleOption.color : 'var(--color-background)';
                const textColor = isSelected ? 'white' : 'var(--color-fontPrimary)';
                const borderColor = isSelected ? scaleOption.color : 'var(--color-border)';
                
                html += `
                    <button 
                        onclick="savePriorityResponse('${areaId}', '${question.id}', '${scaleOption.value}', ${scaleOption.score})"
                        style="
                            padding: 8px 12px;
                            border: 2px solid ${borderColor};
                            border-radius: 6px;
                            background-color: ${bgColor};
                            color: ${textColor};
                            cursor: pointer;
                            font-weight: ${isSelected ? '600' : '500'};
                            font-size: 0.9em;
                            transition: all 0.2s;
                            flex: 1;
                            min-width: 100px;
                        "
                        onmouseover="this.style.opacity='0.8'"
                        onmouseout="this.style.opacity='1'"
                    >
                        ${scaleOption.score}. ${scaleOption.label}
                    </button>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    html += `
        <div style="margin-top: 30px; padding: 15px; background: #f0f7ff; border-radius: 4px; border-left: 4px solid var(--tab-color);">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">
                Your responses are stored locally in your browser. Average scores show how the user base prioritizes each issue.
            </p>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Toggle Priority Area Expansion
 */
window.togglePriorityArea = function(areaId) {
    // Find using data attribute for reliability
    const header = document.querySelector(`.priority-area-header[data-area-id="${areaId}"]`);
    const content = document.querySelector(`.priority-area-content[data-area-id="${areaId}"]`);
    
    if (!header || !content) {
        console.error('[Governance] Could not find header or content for area:', areaId);
        return;
    }
    
    const isExpanded = content.style.display !== 'none';
    content.style.display = isExpanded ? 'none' : 'block';
    
    // Update arrow symbol - find it within the header
    const arrow = header.querySelector('.area-arrow');
    if (arrow) {
        arrow.textContent = isExpanded ? '›' : '∨';
    }
    
    // Save state to localStorage
    localStorage.setItem(`priorityAreaExpanded_${areaId}`, isExpanded ? 'false' : 'true');
};

/**
 * Save Priority Response
 * Updates user response locally, calculates and stores updated averages in Firestore
 */
window.savePriorityResponse = async function(areaId, questionId, responseValue, score) {
    // Phase 2A: Check voting eligibility (country mismatch logged but allowed)
    if (window.countryMismatch && !window.countryMismatch.matches) {
        console.warn('[Voting] ⚠️ User voting with country mismatch:', window.countryMismatch);
        // Log for review but allow voting (Phase 2B will enforce blocks)
    }
    
    const responses = loadUserPriorityResponses();
    
    // Capture the OLD response value before updating (for vote change detection)
    const oldResponseValue = responses[areaId]?.[questionId] || null;
    
    if (!responses[areaId]) {
        responses[areaId] = {};
    }
    
    responses[areaId][questionId] = responseValue;
    localStorage.setItem('userPriorityResponses', JSON.stringify(responses));
    
    // Update Firestore with average calculation, passing the old value
    // AWAIT this to ensure window.priorityAverages is updated before rendering
    await updatePriorityAverageInFirestore(areaId, questionId, score, oldResponseValue);
    
    // Re-render to show updated selection with fresh averages
    renderPrioritiesTab();
    
    // Trigger auto-save to Firestore
    scheduleAutoSave();
};

/**
 * Update Priority Average in Firestore
 * When user makes a selection, update the aggregated average and vote count
 * Accounts for vote changes (user changing their answer) vs new votes
 * 
 * @param {string} areaId - Policy area ID
 * @param {string} questionId - Question ID
 * @param {number} score - New score (1-5)
 * @param {string|null} oldResponseValue - User's previous response value (string), null if first vote
 */
async function updatePriorityAverageInFirestore(areaId, questionId, score, oldResponseValue) {
    try {
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Reference to the priority averages document
        const avgDocRef = doc(db, 'metadata', 'priorityAverages');
        
        // Get current average data
        const avgDocSnap = await getDoc(avgDocRef);
        let averageData = avgDocSnap.exists() ? avgDocSnap.data() : {};
        
        const questionKey = `${areaId}.${questionId}`;
        
        // Get the question to find supporting parties
        const area = POLICY_PRIORITIES[areaId];
        const question = area?.questions.find(q => q.id === questionId);
        const originParties = question?.originParties || [];
        
        // Initialize if not exists
        if (!averageData[questionKey]) {
            averageData[questionKey] = {
                currentAverage: 0,
                totalVotes: 0,
                updatedAt: new Date().toISOString(),
                originParties: originParties, // Track which parties support this priority
                areaId: areaId,
                questionId: questionId,
                question: question?.question || 'Unknown priority'
            };
        }
        
        // Determine if this is a vote change or new vote
        let userPreviousScore = null;
        if (oldResponseValue) {
            // Convert response value back to score using PRIORITY_SCALE
            const scaleItem = PRIORITY_SCALE.find(s => s.value === oldResponseValue);
            if (scaleItem) {
                userPreviousScore = scaleItem.score;
            }
        }
        
        // Update average with new score
        let current = averageData[questionKey];
        
        // Defensive checks: ensure current has properly initialized numeric values
        if (!current) {
            current = {
                currentAverage: 0,
                totalVotes: 0,
                updatedAt: new Date().toISOString(),
                originParties: originParties,
                areaId: areaId,
                questionId: questionId,
                question: question?.question || 'Unknown priority'
            };
        } else {
            // Normalize existing data (in case it came from old format or is corrupted)
            // Use Number.isFinite() to catch NaN, Infinity, and non-numbers
            current.currentAverage = Number.isFinite(current.currentAverage) ? current.currentAverage : 0;
            current.totalVotes = typeof current.totalVotes === 'number' && Number.isFinite(current.totalVotes) ? Math.max(0, current.totalVotes) : 0;
        }
        
        let newAverage;
        let newCount;
        
        // Only treat as vote CHANGE if:
        // 1. User had a previous response (oldResponseValue exists)
        // 2. AND there are existing votes in the system (totalVotes >= 1)
        // 3. AND current average is actually a valid finite number
        // Otherwise, it's a NEW vote (first time the system sees this response, or data was corrupted)
        if (userPreviousScore !== null && current.totalVotes >= 1 && Number.isFinite(current.currentAverage)) {
            // User is changing their vote - same vote count, adjusted average
            // Formula: ((current average * total votes) - old vote + new vote) / total votes
            const adjustedSum = (current.currentAverage * current.totalVotes) - userPreviousScore + score;
            newAverage = adjustedSum / current.totalVotes;
            // Clamp to 1-5 range and round
            newAverage = Math.max(1, Math.min(5, newAverage));
            newAverage = Math.round(newAverage * 10) / 10;
            newCount = current.totalVotes; // Vote count stays same
            console.log('[Governance] Vote CHANGED for', questionKey, '- old:', userPreviousScore, 'new:', score, '- sum:', adjustedSum, '- adjusted average:', newAverage, 'vote count:', newCount);
        } else {
            // User is voting for first time on this question (or system has no votes yet, or data was corrupted) - new vote
            const newSum = (current.currentAverage * current.totalVotes) + score;
            newCount = current.totalVotes + 1;
            newAverage = newSum / newCount;
            // Clamp to 1-5 range and round
            newAverage = Math.max(1, Math.min(5, newAverage));
            newAverage = Math.round(newAverage * 10) / 10;
            console.log('[Governance] NEW vote for', questionKey, '- score:', score, '- sum:', newSum, '- new average:', newAverage, 'vote count:', newCount);
        }
        
        // Final safeguard: ensure newAverage is finite before storing
        if (!Number.isFinite(newAverage)) {
            console.warn('[Governance] Detected non-finite newAverage:', newAverage, '- resetting to neutral 3');
            newAverage = 3;
        }
        
        // Update stored entry, preserving all metadata
        averageData[questionKey] = {
            ...current, // Preserve all existing fields
            currentAverage: newAverage,
            totalVotes: newCount,
            updatedAt: new Date().toISOString()
        };
        
        // Save to Firestore
        await setDoc(avgDocRef, averageData, { merge: true });
        
        // Update global store
        if (!window.priorityAverages) {
            window.priorityAverages = {};
        }
        window.priorityAverages[questionKey] = newAverage;
    } catch (error) {
        console.error('[Governance] Error updating priority average:', error);
    }
}

/**
 * Load and restore tax profile from localStorage on page load
 */
function loadTaxProfileFromLocalStorage() {
    // Set default values first
    const defaults = {
        salary: 35000,
        taxCode: '1257',
        studentLoan: 'none'
    };
    
    const taxData = localStorage.getItem('userTaxProfile');
    if (!taxData) {
        // No saved data, use defaults
        if (document.getElementById('taxSalaryInput')) {
            document.getElementById('taxSalaryInput').value = defaults.salary;
        }
        if (document.getElementById('taxCodeInput')) {
            document.getElementById('taxCodeInput').value = defaults.taxCode;
        }
        if (document.getElementById('studentLoanInput')) {
            document.getElementById('studentLoanInput').value = defaults.studentLoan;
        }
        
        // Save defaults to localStorage
        localStorage.setItem('userTaxProfile', JSON.stringify({
            salary: defaults.salary,
            taxCode: defaults.taxCode,
            studentLoan: defaults.studentLoan,
            savedAt: new Date().toISOString()
        }));
        
        // Recalculate taxes with defaults
        setTimeout(() => {
            calculatePersonalTaxes();
        }, 100);
        
        console.log('[Governance] Default tax profile initialized');
        return;
    }
    
    try {
        const profile = JSON.parse(taxData);
        if (document.getElementById('taxSalaryInput')) {
            document.getElementById('taxSalaryInput').value = profile.salary || defaults.salary;
        }
        if (document.getElementById('taxCodeInput')) {
            document.getElementById('taxCodeInput').value = profile.taxCode || defaults.taxCode;
        }
        if (document.getElementById('studentLoanInput')) {
            document.getElementById('studentLoanInput').value = profile.studentLoan || defaults.studentLoan;
        }
        
        // Recalculate taxes with restored values
        setTimeout(() => {
            calculatePersonalTaxes();
        }, 100);
        
        console.log('[Governance] Tax profile restored from localStorage');
    } catch (error) {
        console.error('[Governance] Error loading tax profile from localStorage:', error);
        // Fall back to defaults
        localStorage.setItem('userTaxProfile', JSON.stringify({
            salary: defaults.salary,
            taxCode: defaults.taxCode,
            studentLoan: defaults.studentLoan,
            savedAt: new Date().toISOString()
        }));
    }
}

/**
 * Save tax profile to localStorage
 */
window.saveTaxProfileToLocalStorage = function() {
    const salary = document.getElementById('taxSalaryInput')?.value || '35000';
    const taxCode = document.getElementById('taxCodeInput')?.value || '1257';
    const studentLoan = document.getElementById('studentLoanInput')?.value || 'none';
    
    const taxProfile = {
        salary: parseFloat(salary),
        taxCode: taxCode,
        studentLoan: studentLoan,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('userTaxProfile', JSON.stringify(taxProfile));
    console.log('[Governance] Tax profile saved to localStorage:', taxProfile);
};

/**
 * Load User Priority Responses from localStorage
 */
function loadUserPriorityResponses() {
    const stored = localStorage.getItem('userPriorityResponses');
    return stored ? JSON.parse(stored) : {};
}

/**
 * Load Priority Averages from Firestore
 * Reads pre-calculated averages from metadata/priorityAverages document
 * Averages are updated every time a user makes a priority selection
 */
async function calculateAverageScores() {
    try {
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Simply read the metadata document with pre-calculated averages
        const avgDocRef = doc(db, 'metadata', 'priorityAverages');
        const avgDocSnap = await getDoc(avgDocRef);
        
        if (avgDocSnap.exists()) {
            const data = avgDocSnap.data();
            
            // Extract just the averages and track corrupted entries
            const averages = {};
            const corruptedEntries = [];
            for (const [key, value] of Object.entries(data)) {
                if (value.currentAverage !== undefined) {
                    // Check for corrupted values
                    if (!Number.isFinite(value.currentAverage)) {
                        console.warn('[Governance] Detected corrupted average for', key, ':', value.currentAverage);
                        averages[key] = 3; // Reset to neutral for display
                        corruptedEntries.push(key);
                    } else {
                        averages[key] = value.currentAverage;
                    }
                }
            }
            
            // If we found corrupted data, reset it in Firestore too
            if (corruptedEntries.length > 0) {
                console.warn('[Governance] Found', corruptedEntries.length, 'corrupted entries - resetting in Firestore');
                const cleanedData = { ...data };
                for (const key of corruptedEntries) {
                    // Reset corrupted entry to fresh state
                    cleanedData[key] = {
                        currentAverage: 3, // Reset to neutral
                        totalVotes: 0,
                        updatedAt: new Date().toISOString(),
                        originParties: data[key]?.originParties || [],
                        areaId: data[key]?.areaId || '',
                        questionId: data[key]?.questionId || '',
                        question: data[key]?.question || 'Unknown priority'
                    };
                }
                // Save cleaned data back to Firestore
                await setDoc(avgDocRef, cleanedData, { merge: true });
                console.log('[Governance] Firestore cleaned and updated');
            }
            
            console.log('[Governance] Loaded averages from Firestore:', averages);
            return averages;
        } else {
            console.log('[Governance] No priority averages found in Firestore yet');
            return {};
        }
    } catch (error) {
        console.error('[Governance] Error loading priority averages:', error);
        return {};
    }
}

// Store averages globally for quick access
window.priorityAverages = {};

/**
 * Initialize and update priority averages on page load
 */
async function initializePriorityAverages() {
    window.priorityAverages = await calculateAverageScores();
    console.log('[Governance] Priority averages initialized:', window.priorityAverages);
    
    // Re-render priorities if they're currently visible
    const prioritiesContent = document.getElementById('prioritiesContent');
    if (prioritiesContent && prioritiesContent.innerHTML.length > 0) {
        console.log('[Governance] Re-rendering priorities with loaded averages');
        await renderPrioritiesTab();
    }
}

/**
 * Initialize Party Priority Scores in Firestore
 * On first app load, store party scores (1-5) for each priority based on party positions
 * This allows displaying which parties agree/disagree with each priority
 */
async function initializePartyPriorityScores() {
    try {
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const scoresDocRef = doc(db, 'metadata', 'partyPriorityScores');
        const scoresDocSnap = await getDoc(scoresDocRef);
        
        // If scores don't exist in Firestore yet, initialize them
        if (!scoresDocSnap.exists()) {
            console.log('[Governance] Initializing party priority scores in Firestore...');
            
            // Convert PARTY_PRIORITY_SCORES into Firestore document format
            const scoresToStore = { ...PARTY_PRIORITY_SCORES };
            
            // Add metadata
            scoresToStore._metadata = {
                initialized: new Date().toISOString(),
                version: '1.0',
                note: 'Party scores should be verified against official party manifestos'
            };
            
            // Store in Firestore
            await setDoc(scoresDocRef, scoresToStore);
            console.log('[Governance] Party priority scores initialized in Firestore:', Object.keys(PARTY_PRIORITY_SCORES).length + ' priorities');
        } else {
            console.log('[Governance] Party priority scores already exist in Firestore');
        }
        
        // Store in memory for quick access
        window.partyPriorityScores = PARTY_PRIORITY_SCORES;
    } catch (error) {
        console.error('[Governance] Error initializing party priority scores:', error);
    }
}

/**
 * Initialize default tax profile for new users
 */
async function initializeDefaultTaxProfile(userId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const voteProfileDoc = await getDoc(doc(db, 'users', userId, 'voteProfile', 'profile'));
        
        // If this is a new user or tax profile doesn't exist, set defaults
        if (!voteProfileDoc.exists() || !voteProfileDoc.data().taxProfile) {
            const defaultTaxProfile = {
                salary: 35000,
                taxCode: '1257',
                studentLoan: 'none'
            };
            
            localStorage.setItem('userTaxProfile', JSON.stringify(defaultTaxProfile));
            console.log('[Governance] Default tax profile initialized');
        }
    } catch (error) {
        console.error('[Governance] Error initializing tax profile:', error);
    }
}

/**
 * Load Budget Spend Subtab Data
 */
function loadBudgetSpendData() {
    const content = document.getElementById('budgetSpendContent');
    if (!content) return;

    // Get 2026-27 spending data
    const spendYear = '202627';
    const resourceSpendingData = budget2025.resourceSpending[spendYear] || {};
    const ameData = budget2025.annuallyManagedExpenditure[spendYear] || {};
    
    // Calculate totals
    const resourceTotal = Object.values(resourceSpendingData).reduce((sum, val) => sum + val, 0);
    const ameTotal = Object.values(ameData).reduce((sum, val) => sum + val, 0);
    const totalSpending = resourceTotal + ameTotal;
    
    // Structure: department headers matching Personal tab, with departments + associated items
    const spendingStructure = [
        {
            header: 'Health and Social Care',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Health and Social Care'], type: 'Department' }
            ]
        },
        {
            header: 'Education',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Education'], type: 'Department' }
            ]
        },
        {
            header: 'Defence',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Defence'], type: 'Department' }
            ]
        },
        {
            header: 'Work and Pensions',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Work and Pensions'], type: 'Department' },
                { name: 'Social Protection & Welfare', amount: ameData['Social Protection & Welfare'], type: 'AME' },
                { name: 'Public Sector Pensions', amount: ameData['Public Sector Pensions'], type: 'AME' }
            ]
        },
        {
            header: 'Home Office',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Home Office'], type: 'Department' }
            ]
        },
        {
            header: 'Justice',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Justice'], type: 'Department' }
            ]
        },
        {
            header: 'Transport',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Transport'], type: 'Department' }
            ]
        },
        {
            header: 'Environment and Rural Affairs',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Environment and Rural Affairs'], type: 'Department' }
            ]
        },
        {
            header: 'HM Revenue and Customs',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['HM Revenue and Customs'], type: 'Department' }
            ]
        },
        {
            header: 'Foreign, Commonwealth and Development',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Foreign, Commonwealth and Development'], type: 'Department' }
            ]
        },
        {
            header: 'Business and Trade',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Business and Trade'], type: 'Department' }
            ]
        },
        {
            header: 'Science, Innovation and Technology',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Science, Innovation and Technology'], type: 'Department' }
            ]
        },
        {
            header: 'Energy Security and Net Zero',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Energy Security and Net Zero'], type: 'Department' }
            ]
        },
        {
            header: 'Culture, Media and Sport',
            items: [
                { name: 'Department Spending', amount: resourceSpendingData['Culture, Media and Sport'], type: 'Department' }
            ]
        },
        {
            header: 'Debt Interest',
            items: [
                { name: 'Debt Interest', amount: ameData['Debt Interest'], type: 'AME' }
            ]
        },
        {
            header: 'Other Services & Administration',
            items: [
                { name: 'Other Services & Administration', amount: ameData['Other Services & Administration'], type: 'AME' }
            ]
        }
    ];
    
    // Create flat list of all items for pie chart (departments + AME)
    const allSpendingItems = [
        ...Object.entries(resourceSpendingData).map(([name, amount]) => ({
            name: name,
            amount: amount,
            type: 'Department'
        })),
        ...Object.entries(ameData).map(([name, amount]) => ({
            name: name,
            amount: amount,
            type: 'AME'
        }))
    ];
    
    // Generate pie chart SVG
    const pieChartSVG = generateSpendingPieChart(allSpendingItems, totalSpending);
    
    // Generate HTML with grouped structure
    const listHTML = generateGroupedSpendingList(spendingStructure, totalSpending);
    
    // Build main content
    content.innerHTML = `
        <div style="padding: 30px; max-width: 1200px; margin: 0 auto;">
            <!-- Total Spending Display -->
            <div style="background: var(--gradient-primary); padding: 30px; border-radius: 12px; margin-bottom: 30px; color: white; text-align: center;">
                <div style="font-size: 0.95em; opacity: 0.9; margin-bottom: 10px;">Total Government Spending (2026-27)</div>
                <div style="font-size: 3em; font-weight: bold; margin-bottom: 5px;">£${totalSpending.toFixed(1)}B</div>
                <div style="font-size: 0.85em; opacity: 0.85;">Resource DEL: £${resourceTotal.toFixed(1)}B | AME: £${ameTotal.toFixed(1)}B</div>
            </div>
            
            <!-- Methodology Note -->
            <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 12px 15px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 0.85em; color: #4b5563;">
                    <strong>Spending Breakdown:</strong> Resource DEL (departments) covers day-to-day operations. AME (Annually Managed Expenditure) covers transfer payments like welfare, pensions, and debt interest. Together they equal Total Managed Expenditure (TME).
                </p>
            </div>
            
            <!-- Pie Chart -->
            <div style="margin-bottom: 30px; text-align: center;">
                <h3 style="margin-bottom: 20px; color: var(--color-fontPrimary);">Spending Distribution</h3>
                ${pieChartSVG}
            </div>
            
            <!-- Expandable List -->
            <div style="margin-top: 30px;">
                <h3 style="margin-bottom: 20px; color: var(--color-fontPrimary);">Government Spending Categories</h3>
                ${listHTML}
            </div>
        </div>
    `;
}

/**
 * Generate Grouped Spending List with Department Headers
 */
function generateGroupedSpendingList(spendingStructure, totalSpending) {
    const colors = [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
        '#f97316', '#6366f1', '#a855f7', '#d946ef', '#0891b2', '#059669', '#7c2d12', '#1e3a8a'
    ];
    
    return spendingStructure.map((group, groupIndex) => {
        const color = colors[groupIndex % colors.length];
        const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
        const groupPercentage = ((groupTotal / totalSpending) * 100).toFixed(1);
        
        const itemsHTML = group.items.map((item, itemIndex) => {
            const itemPercentage = ((item.amount / totalSpending) * 100).toFixed(1);
            return `
                <div style="padding: 12px 16px; background: var(--color-pageBackground); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: var(--color-fontPrimary);">${item.name}</div>
                        <div style="font-size: 0.85em; color: ${item.type === 'AME' ? '#a855f7' : '#06b6d4'}; margin-top: 2px;">${item.type}</div>
                    </div>
                    <div style="text-align: right; margin-left: 16px;">
                        <div style="font-weight: 600; color: var(--color-fontPrimary);">£${item.amount.toFixed(1)}B</div>
                        <div style="font-size: 0.85em; color: var(--color-fontSecondary);">${itemPercentage}%</div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-bottom: 15px; border: 1px solid var(--color-border); border-left: 4px solid ${color}; border-radius: 8px; overflow: hidden;">
                <div class="spending-header" onclick="toggleSpendingHeader(this)" style="padding: 16px; background: var(--color-cardBackground); cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--color-fontPrimary);">${group.header}</div>
                        <div style="font-size: 0.95em; color: var(--color-fontSecondary); margin-top: 4px;">
                            £${groupTotal.toFixed(1)}B · ${groupPercentage}% of total
                        </div>
                    </div>
                    <div class="spending-header-arrow" style="font-size: 1.4em; color: ${color}; margin-left: 16px; flex-shrink: 0;">›</div>
                </div>
                <div class="spending-header-content" style="display: none; padding: 0; background: transparent; border-top: 1px solid var(--color-border);">
                    ${itemsHTML}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Generate SVG Pie Chart for Government Spending
 */
function generateSpendingPieChart(spendingItems, totalSpending) {
    const size = 400;
    const radius = 150;
    const textRadius = 95;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Extended color palette for all spending items
    const colors = [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
        '#f97316', '#6366f1', '#a855f7', '#d946ef', '#0891b2', '#059669', '#7c2d12', '#1e3a8a',
        '#713f12', '#78350f'
    ];
    
    let currentAngle = -Math.PI / 2;
    let svgPaths = '';
    let svgLabels = '';
    
    spendingItems.forEach((item, index) => {
        const sliceAngle = (item.amount / totalSpending) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        const midAngle = currentAngle + sliceAngle / 2;
        
        // Calculate coordinates for slice
        const x1 = centerX + radius * Math.cos(currentAngle);
        const y1 = centerY + radius * Math.sin(currentAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArc = sliceAngle > Math.PI ? 1 : 0;
        
        // Create path for this slice
        const pathData = `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
        `;
        
        const percentage = ((item.amount / totalSpending) * 100).toFixed(1);
        svgPaths += `<path d="${pathData}" fill="${colors[index % colors.length]}" stroke="white" stroke-width="2" style="cursor: pointer;" title="${item.name}: £${item.amount.toFixed(1)}B (${percentage}%)"/>`;
        
        // Calculate position for label text
        const labelX = centerX + textRadius * Math.cos(midAngle);
        const labelY = centerY + textRadius * Math.sin(midAngle);
        
        // Add label with percentage and amount
        svgLabels += `
            <text x="${labelX}" y="${labelY}" 
                  text-anchor="middle" 
                  dominant-baseline="middle" 
                  font-size="12" 
                  font-weight="bold" 
                  fill="white" 
                  style="pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                <tspan x="${labelX}" dy="0">${percentage}%</tspan>
                <tspan x="${labelX}" dy="14">£${item.amount.toFixed(0)}B</tspan>
            </text>
        `;
        
        currentAngle = endAngle;
    });
    
    // Add legend with amounts and percentages
    const legendHTML = spendingItems.map((item, index) => {
        const percentage = ((item.amount / totalSpending) * 100).toFixed(1);
        const typeLabel = item.type === 'AME' ? ' (AME)' : ' (Dept)';
        return `
        <div style="display: inline-block; margin-right: 20px; margin-bottom: 10px; font-size: 0.9em;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${colors[index % colors.length]}; margin-right: 6px; border-radius: 2px;"></span>
            ${item.name}${typeLabel}: £${item.amount.toFixed(1)}B (${percentage}%)
        </div>
    `}).join('');
    
    return `
        <div>
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="max-width: 100%; height: auto; margin-bottom: 20px;">
                ${svgPaths}
                ${svgLabels}
            </svg>
            <div style="text-align: center; color: var(--color-fontSecondary); font-size: 0.85em;">
                ${legendHTML}
            </div>
        </div>
    `;
}

/**
 * Toggle Spending Header Expansion
 */
window.toggleSpendingHeader = function(element) {
    const content = element.nextElementSibling;
    const arrow = element.querySelector('.spending-header-arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.textContent = '∨';
    } else {
        content.style.display = 'none';
        arrow.textContent = '›';
    }
};



/**
 * Load Budget Revenue Subtab Data
 */
function loadBudgetRevenueData() {
    const content = document.getElementById('budgetRevenueContent');
    if (!content) return;

    // Get 2026-27 revenue data (keys are numeric format: 202627 not 2026_27)
    const revenueYear = '202627';
    const taxData = budget2025.taxRevenue[revenueYear] || {};
    const nonTaxData = budget2025.nonTaxRevenue[revenueYear] || {};
    
    const totalTax = taxData.Total || 0;
    const totalNonTax = nonTaxData['Total Non-Tax'] || 0;
    const totalReceipts = totalTax + totalNonTax;
    
    // Create breakdown for pie chart (major sources)
    const majorSources = [
        { name: 'Income Tax', amount: taxData['Income Tax'] || 0 },
        { name: 'National Insurance', amount: taxData['National Insurance'] || 0 },
        { name: 'Value Added Tax', amount: taxData['Value Added Tax'] || 0 },
        { name: 'Corporation Tax', amount: taxData['Corporation Tax'] || 0 },
        { name: 'Other Taxes', amount: (totalTax - (taxData['Income Tax'] + taxData['National Insurance'] + taxData['Value Added Tax'] + taxData['Corporation Tax'])) || 0 },
        { name: 'Interest & Dividends', amount: nonTaxData['Interest and Dividends'] || 0 },
        { name: 'Operating Surplus', amount: nonTaxData['Gross Operating Surplus'] || 0 },
    ];
    
    // Calculate percentages
    const sourcesWithPercentages = majorSources.map(source => ({
        ...source,
        percentage: ((source.amount / totalReceipts) * 100).toFixed(1)
    }));
    
    // Generate pie chart SVG
    const pieChartSVG = generatePieChart(sourcesWithPercentages, totalReceipts);
    
    // Generate expandable list HTML
    const listHTML = generateRevenueList(sourcesWithPercentages, totalReceipts);
    
    // Build main content
    content.innerHTML = `
        <div style="padding: 30px; max-width: 1200px; margin: 0 auto;">
            <!-- Total Revenue Display -->
            <div style="background: var(--gradient-primary); padding: 30px; border-radius: 12px; margin-bottom: 30px; color: white; text-align: center;">
                <div style="font-size: 0.95em; opacity: 0.9; margin-bottom: 10px;">Total Government Revenue (2026-27)</div>
                <div style="font-size: 3em; font-weight: bold; margin-bottom: 5px;">£${totalReceipts.toFixed(1)}B</div>
                <div style="font-size: 0.85em; opacity: 0.85;">Tax: £${totalTax.toFixed(1)}B | Non-Tax: £${totalNonTax.toFixed(1)}B</div>
            </div>
            
            <!-- Pie Chart -->
            <div style="margin-bottom: 30px; text-align: center;">
                <h3 style="margin-bottom: 20px; color: var(--color-fontPrimary);">Revenue Sources</h3>
                ${pieChartSVG}
            </div>
            
            <!-- Expandable List -->
            <div style="margin-top: 30px;">
                <h3 style="margin-bottom: 20px; color: var(--color-fontPrimary);">Major Revenue Sources</h3>
                ${listHTML}
            </div>
        </div>
    `;
}

/**
 * Generate SVG Pie Chart for Revenue Sources
 */
function generatePieChart(sources, total) {
    const size = 400;
    const radius = 150;
    const textRadius = 95; // Distance from center for text labels
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Color palette for pie slices
    const colors = [
        '#2563eb', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#06b6d4', // cyan
        '#ec4899', // pink
    ];
    
    let currentAngle = -Math.PI / 2;
    let svgPaths = '';
    let svgLabels = '';
    
    sources.forEach((source, index) => {
        const sliceAngle = (source.amount / total) * 2 * Math.PI;
        const endAngle = currentAngle + sliceAngle;
        const midAngle = currentAngle + sliceAngle / 2;
        
        // Calculate coordinates for slice
        const x1 = centerX + radius * Math.cos(currentAngle);
        const y1 = centerY + radius * Math.sin(currentAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArc = sliceAngle > Math.PI ? 1 : 0;
        
        // Create path for this slice
        const pathData = `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
        `;
        
        svgPaths += `<path d="${pathData}" fill="${colors[index % colors.length]}" stroke="white" stroke-width="2" style="cursor: pointer;" title="${source.name}: £${source.amount.toFixed(1)}B (${source.percentage}%)"/>`;
        
        // Calculate position for label text
        const labelX = centerX + textRadius * Math.cos(midAngle);
        const labelY = centerY + textRadius * Math.sin(midAngle);
        
        // Add label with percentage and amount
        const labelText = `£${source.amount.toFixed(0)}B\n${source.percentage}%`;
        svgLabels += `
            <text x="${labelX}" y="${labelY}" 
                  text-anchor="middle" 
                  dominant-baseline="middle" 
                  font-size="12" 
                  font-weight="bold" 
                  fill="white" 
                  style="pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                <tspan x="${labelX}" dy="0">${source.percentage}%</tspan>
                <tspan x="${labelX}" dy="14">£${source.amount.toFixed(0)}B</tspan>
            </text>
        `;
        
        currentAngle = endAngle;
    });
    
    // Add legend with amounts and percentages
    const legendHTML = sources.map((source, index) => `
        <div style="display: inline-block; margin-right: 20px; margin-bottom: 10px; font-size: 0.9em;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${colors[index % colors.length]}; margin-right: 6px; border-radius: 2px;"></span>
            ${source.name}: £${source.amount.toFixed(1)}B (${source.percentage}%)
        </div>
    `).join('');
    
    return `
        <div>
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="max-width: 100%; height: auto; margin-bottom: 20px;">
                ${svgPaths}
                ${svgLabels}
            </svg>
            <div style="text-align: center; color: var(--color-fontSecondary); font-size: 0.85em;">
                ${legendHTML}
            </div>
        </div>
    `;
}

/**
 * Generate Expandable List of Revenue Sources
 */
function generateRevenueList(sources, total) {
    const colors = [
        '#2563eb', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#06b6d4', // cyan
        '#ec4899', // pink
    ];
    
    return sources.map((source, index) => {
        const color = colors[index % colors.length];
        return `
        <div style="margin-bottom: 15px; border: 1px solid var(--color-border); border-left: 4px solid ${color}; border-radius: 8px; overflow: hidden;">
            <div class="revenue-list-item" onclick="toggleRevenueDetails(this)" style="padding: 16px; background: var(--color-cardBackground); cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--color-fontPrimary);">${source.name}</div>
                    <div style="font-size: 0.95em; color: var(--color-fontSecondary); margin-top: 4px;">
                        £${source.amount.toFixed(1)}B · ${source.percentage}% of total
                    </div>
                </div>
                <div class="revenue-arrow" style="font-size: 1.4em; color: ${color}; margin-left: 16px; flex-shrink: 0;">›</div>
            </div>
            <div class="revenue-details" style="display: none; padding: 16px; background: var(--color-pageBackground); border-top: 1px solid var(--color-border); font-size: 0.9em; color: var(--color-fontSecondary);">
                <div style="margin-bottom: 8px;"><strong>Amount:</strong> £${source.amount.toFixed(1)} billion</div>
                <div style="margin-bottom: 8px;"><strong>Percentage of Total:</strong> ${source.percentage}%</div>
                <div><strong>Personal Share (per capita):</strong> £${(source.amount * 1000000000 / 67220000).toFixed(0)}</div>
            </div>
        </div>
    `;
    }).join('');
}

/**
 * Toggle Revenue Details Expansion
 */
window.toggleRevenueDetails = function(element) {
    const details = element.nextElementSibling;
    const arrow = element.querySelector('.revenue-arrow');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        arrow.textContent = '∨'; // Down caret
    } else {
        details.style.display = 'none';
        arrow.textContent = '›'; // Right caret
    }
};

/**
 * Load Budget Personal Subtab Data
 */
function loadBudgetPersonalData() {
    const content = document.getElementById('budgetPersonalContent');
    
    console.log('[Personal Tab] Loading...', {
        window_currentUserId: window.currentUserId,
        auth_currentUser: auth?.currentUser,
        auth_currentUser_uid: auth?.currentUser?.uid,
        content_exists: !!content
    });
    
    if (content) {
        // Check both window.currentUserId and auth.currentUser as fallback
        const isAuthenticated = window.currentUserId || auth?.currentUser?.uid;
        
        console.log('[Personal Tab] isAuthenticated:', isAuthenticated);
        
        if (isAuthenticated) {
            console.log('[Personal Tab] ✅ User is authenticated, rendering calculator');
            renderPersonalBudgetTab();
        } else {
            console.log('[Personal Tab] ❌ User not authenticated, showing sign-in message');
            content.innerHTML = `
                <div style="padding: 60px 40px; text-align: center;">
                    <h3 style="color: var(--color-fontPrimary); margin: 0 0 20px 0;">View Your Personal Tax Impact</h3>
                    <p style="color: var(--color-fontSecondary); margin: 0 0 30px 0; font-size: 1.05em;">
                        Sign in to see exactly how much you're contributing to each government scheme and service. 
                        This helps you understand the real-world impact of your taxes and make informed voting decisions.
                    </p>
                    <button onclick="window.location.href='index.html'" style="padding: 12px 24px; background: var(--color-buttonPrimary); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1em;">
                        ← Back to Sign In
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Render Personal Budget Tab with Tax Calculator
 */
function renderPersonalBudgetTab() {
    const content = document.getElementById('budgetPersonalContent');
    
    let html = `
        <div style="padding: 20px;">
            <!-- Tax Calculator Form -->
            <div style="background: var(--color-background2); padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid var(--color-buttonPrimary);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: var(--color-fontPrimary);">Tax Calculator</h3>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="saveTaxCalculatorToProfile()" style="padding: 8px 16px; background: var(--color-buttonPrimary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9em;">Save to Profile</button>
                    </div>
                </div>
                <p style="color: var(--color-fontSecondary); margin: 0 0 20px 0; font-size: 0.95em;">Enter your income details to calculate your estimated taxes:</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <!-- Annual Salary Input -->
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--color-fontPrimary);">Annual Salary (£)</label>
                        <input type="number" id="taxSalaryInput" placeholder="e.g., 35000" value="35000" 
                            style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-fontPrimary); font-size: 1em;" 
                            onblur="saveTaxProfileToLocalStorage(); scheduleAutoSave()" oninput="calculatePersonalTaxes()">
                    </div>
                    
                    <!-- Tax Code Selection -->
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--color-fontPrimary);">Tax Code</label>
                        <select id="taxCodeInput" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-fontPrimary); font-size: 1em;" 
                            onchange="calculatePersonalTaxes(); saveTaxProfileToLocalStorage(); scheduleAutoSave()">
                            <option value="1257">1257L (Standard 2024/25)</option>
                            <option value="1009">1009L (Reduced allowance)</option>
                            <option value="1400">1400L (Higher allowance)</option>
                            <option value="0">0T (Emergency code)</option>
                            <option value="1060">1060L (Standard 2023/24)</option>
                        </select>
                        <p style="color: var(--color-fontSecondary); font-size: 0.8em; margin: 8px 0 0 0;">Don't know your tax code? It's on your payslip or P45</p>
                    </div>
                    
                    <!-- Student Loan Option -->
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--color-fontPrimary);">Student Loan Repayments</label>
                        <select id="studentLoanInput" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-background); color: var(--color-fontPrimary); font-size: 1em;" 
                            onchange="calculatePersonalTaxes(); saveTaxProfileToLocalStorage(); scheduleAutoSave()">
                            <option value="none">None</option>
                            <option value="plan1">Plan 1 (£24k threshold)</option>
                            <option value="plan2">Plan 2 (£31.4k threshold)</option>
                            <option value="postgrad">Postgraduate (£21k threshold)</option>
                        </select>
                    </div>
                </div>
                
                <!-- Note about auto-save -->
                <div style="margin-top: 20px; padding: 12px; background: var(--color-background2); border-left: 3px solid var(--color-buttonPrimary); border-radius: 4px;">
                    <p style="margin: 0; font-size: 0.9em; color: var(--color-fontSecondary);">
                        Your tax information is automatically saved to your governance profile. Use the Save Profile button in the header to sync all your responses.
                    </p>
                </div>
            </div>
            
            <!-- Calculation Results -->
            <div id="taxCalculationResults" style="display: none;">
                <!-- Header Summary -->
                <div style="background: var(--color-background2); padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid var(--color-buttonPrimary);">
                    <h3 style="margin: 0 0 15px 0; color: var(--color-fontPrimary);">Your Annual Tax Contribution</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Annual Income</p>
                            <p style="margin: 5px 0 0 0; font-size: 1.5em; font-weight: bold; color: var(--color-fontPrimary);" id="resultIncome">£0</p>
                        </div>
                        <div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Total Taxes & Deductions</p>
                            <p style="margin: 5px 0 0 0; font-size: 1.5em; font-weight: bold; color: #ef4444;" id="resultTotalTaxes">£0</p>
                        </div>
                        <div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Take-Home Pay</p>
                            <p style="margin: 5px 0 0 0; font-size: 1.5em; font-weight: bold; color: #10b981;" id="resultTakeHome">£0</p>
                        </div>
                        <div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Effective Tax Rate</p>
                            <p style="margin: 5px 0 0 0; font-size: 1.5em; font-weight: bold; color: var(--color-fontPrimary);" id="resultTaxRate">0%</p>
                        </div>
                    </div>
                </div>
                
                <!-- Tax Breakdown -->
                <h3 style="margin: 30px 0 20px 0; color: var(--color-fontPrimary);">Where Your Taxes Come From</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 40px;" id="taxBreakdownCards">
                </div>
                
                <!-- Spending Allocation -->
                <h3 style="margin: 30px 0 20px 0; color: var(--color-fontPrimary);">Where Your Taxes Go (Annual Budget Services)</h3>
                <p style="color: var(--color-fontSecondary); margin: 0 0 10px 0;">Your taxes fund these government services:</p>
                
                <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 12px 15px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 0.85em; color: #4b5563;">
                        <strong>📊 Methodology:</strong> This shows where ALL government spending goes (£1.37T Total Managed Expenditure), based on Budget 2025 data. 
                        Your tax contribution is estimated as a proportion of total revenue. Note: Government also funds spending through borrowing, so this allocation represents overall 
                        budget priorities rather than a direct line from your taxes to specific services. For educational purposes.
                    </p>
                </div>
                
                <div style="display: grid; gap: 12px;" id="allocationCards">
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    
    // Initialize calculation on load
    calculatePersonalTaxes();
}

/**
 * Expand scheme breakdown when user clicks on a service card
 */
function expandSchemeBreakdown(serviceKey, totalTaxes) {
    // Check if breakdown is already open
    const existing = document.querySelector(`[data-breakdown-panel="${serviceKey}"]`);
    if (existing) {
        existing.remove();
        return;
    }
    
    // Close any other open panels
    document.querySelectorAll('[data-breakdown-panel]').forEach(panel => {
        panel.remove();
    });
    
    // Get the service card that was clicked
    const allocationCards = document.getElementById('allocationCards');
    const breakdownHtml = renderSchemeBreakdown(serviceKey, totalTaxes);
    
    // Create a container for the breakdown
    const container = document.createElement('div');
    container.setAttribute('data-breakdown-panel', serviceKey);
    container.innerHTML = breakdownHtml;
    
    // Insert after allocation cards
    allocationCards.parentElement.insertBefore(container, allocationCards.nextSibling);
    
    // Smooth scroll to breakdown
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Detailed scheme breakdown by service category
 * This will be used when users click on a service card in the Personal tax calculator
 */
// Build scheme breakdowns from real Budget 2025 data
const schemeBreakdowns = {
    'health_social_care': {
        name: 'Health and Social Care',
        description: 'NHS, health services, and social care',
        schemes: budget2025.realSchemes['Health and Social Care'],
        totalResourceSpending_2025_26: 203.4, // £ billions
        allocationPercentage: 0.185
    },
    'education': {
        name: 'Education',
        description: 'Schools, universities, and training programs',
        schemes: budget2025.realSchemes['Education'],
        totalResourceSpending_2025_26: 95.2,
        allocationPercentage: 0.089
    },
    'defence': {
        name: 'Defence',
        description: 'Military and national security',
        schemes: budget2025.realSchemes['Defence'],
        totalResourceSpending_2025_26: 38.6,
        allocationPercentage: 0.038
    },
    'work_pensions': {
        name: 'Work and Pensions',
        description: 'Welfare, pensions, and employment support',
        schemes: budget2025.realSchemes['Work and Pensions'],
        totalResourceSpending_2025_26: 10.3,
        allocationPercentage: 0.255
    },
    'home_office': {
        name: 'Home Office',
        description: 'Border control, police, and home security',
        schemes: budget2025.realSchemes['Home Office'],
        totalResourceSpending_2025_26: 19.6,
        allocationPercentage: 0.023
    },
    'justice': {
        name: 'Justice',
        description: 'Police, prisons, courts, and emergency services',
        schemes: budget2025.realSchemes['Justice'],
        totalResourceSpending_2025_26: 12.0,
        allocationPercentage: 0.026
    },
    'transport': {
        name: 'Transport',
        description: 'Roads, railways, and public transport',
        schemes: budget2025.realSchemes['Transport'],
        totalResourceSpending_2025_26: 8.1,
        allocationPercentage: 0.010
    },
    'environment': {
        name: 'Environment and Rural Affairs',
        description: 'Environmental protection and rural support',
        schemes: budget2025.realSchemes['Environment and Rural Affairs'],
        totalResourceSpending_2025_26: 4.9,
        allocationPercentage: 0.006
    },
    'hmrc': {
        name: 'HM Revenue and Customs',
        description: 'Tax administration and customs',
        schemes: budget2025.realSchemes['HM Revenue and Customs'],
        totalResourceSpending_2025_26: 6.0,
        allocationPercentage: 0.006
    },
    'fcdo': {
        name: 'Foreign, Commonwealth and Development',
        description: 'Embassies, diplomatic relations, and aid',
        schemes: budget2025.realSchemes['Foreign, Commonwealth and Development'],
        totalResourceSpending_2025_26: 8.0,
        allocationPercentage: 0.008
    },
    'business_trade': {
        name: 'Business and Trade',
        description: 'Business support and trade policy',
        schemes: budget2025.realSchemes['Business and Trade'],
        totalResourceSpending_2025_26: 2.0,
        allocationPercentage: 0.002
    },
    'science_tech': {
        name: 'Science, Innovation and Technology',
        description: 'Research funding and tech development',
        schemes: budget2025.realSchemes['Science, Innovation and Technology'],
        totalResourceSpending_2025_26: 0.7,
        allocationPercentage: 0.004
    },
    'energy_netzero': {
        name: 'Energy Security and Net Zero',
        description: 'Energy policy and climate targets',
        schemes: budget2025.realSchemes['Energy Security and Net Zero'],
        totalResourceSpending_2025_26: 1.9,
        allocationPercentage: 0.002
    },
    'culture_sport': {
        name: 'Culture, Media and Sport',
        description: 'Arts, heritage, media, and sports',
        schemes: budget2025.realSchemes['Culture, Media and Sport'],
        totalResourceSpending_2025_26: 1.6,
        allocationPercentage: 0.001
    }
};

/**
 * Render detailed scheme breakdown for a service category
 * Called when user clicks on a service card
 */
function renderSchemeBreakdown(serviceKey, totalTaxes) {
    const serviceData = schemeBreakdowns[serviceKey];
    if (!serviceData) return '';
    
    // Calculate user's allocation to this service based on their tax contribution
    const userServiceAllocation = totalTaxes * serviceData.allocationPercentage;
    
    let html = `
        <div style="background: var(--color-background2); border: 2px solid var(--color-buttonPrimary); border-radius: 8px; padding: 25px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: var(--color-fontPrimary);">Detailed Breakdown: ${serviceData.name}</h4>
                    <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">${serviceData.description}</p>
                </div>
                <button onclick="this.closest('[data-breakdown-panel]').remove()" style="padding: 5px 10px; background: var(--color-border); border: none; border-radius: 4px; cursor: pointer; color: var(--color-fontSecondary);">✕ Close</button>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--color-border);">
                        <th style="text-align: left; padding: 10px; color: var(--color-fontSecondary); font-weight: 600;">Scheme / Program</th>
                        <th style="text-align: center; padding: 10px; color: var(--color-fontSecondary); font-weight: 600;">Your Annual Contribution</th>
                        <th style="text-align: left; padding: 10px; color: var(--color-fontSecondary); font-weight: 600;">What It Funds</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    let totalAmount = 0;
    serviceData.schemes.forEach(scheme => {
        // Scale scheme amount to user's personal contribution
        // Formula: (scheme amount in billions / total department spending) × user's allocation to this service
        const schemeContribution = (scheme.amount / serviceData.totalResourceSpending_2025_26) * userServiceAllocation;
        totalAmount += schemeContribution;
        html += `
                    <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-background);">
                        <td style="padding: 12px 10px; color: var(--color-fontPrimary); font-weight: 500;">${scheme.name}</td>
                        <td style="padding: 12px 10px; text-align: center; color: var(--color-buttonPrimary); font-weight: 600; font-size: 1.05em;">£${schemeContribution.toFixed(2)}</td>
                        <td style="padding: 12px 10px; color: var(--color-fontSecondary); font-size: 0.9em;">${scheme.description}</td>
                    </tr>
        `;
    });
    
    html += `
                </tbody>
                <tfoot>
                    <tr style="border-top: 2px solid var(--color-border); background: var(--color-background2);">
                        <td style="padding: 12px 10px; color: var(--color-fontPrimary); font-weight: 600;">Total for this service</td>
                        <td style="padding: 12px 10px; text-align: center; color: var(--color-buttonPrimary); font-weight: 700; font-size: 1.1em;">£${totalAmount.toFixed(2)}</td>
                        <td style="padding: 12px 10px; color: var(--color-fontSecondary); font-size: 0.9em;">~${((totalAmount / totalTaxes) * 100).toFixed(1)}% of your total tax</td>
                    </tr>
                </tfoot>
            </table>
            
            <p style="margin: 15px 0 0 0; padding: 15px; background: #f3f4f6; border-radius: 4px; color: var(--color-fontSecondary); font-size: 0.9em;">
                <strong>Tip:</strong> This breakdown shows exactly how your taxes fund real-world services. 
                Use this information when voting on how you think government budgets should be allocated.
            </p>
        </div>
    `;
    
    return html;
}

/**
 * Calculate Personal Taxes based on calculator inputs
 */
function calculatePersonalTaxes() {
    const salaryInput = document.getElementById('taxSalaryInput');
    const taxCodeInput = document.getElementById('taxCodeInput');
    const studentLoanInput = document.getElementById('studentLoanInput');
    
    if (!salaryInput || !taxCodeInput) return;
    
    const salary = parseFloat(salaryInput.value) || 35000;
    const taxCode = parseInt(taxCodeInput.value) || 1257;
    const studentLoan = studentLoanInput?.value || 'none';
    
    // Calculate tax-free allowance from tax code
    // Tax code format: XXXL (e.g., 1257L = £12,570 allowance)
    const taxFreeAllowance = taxCode * 10;
    
    // Income Tax calculation (20% basic rate on amount over allowance)
    const taxableIncome = Math.max(0, salary - taxFreeAllowance);
    let incomeTax = 0;
    
    if (taxableIncome > 0 && taxableIncome <= 50270) {
        // Basic rate: 20%
        incomeTax = taxableIncome * 0.20;
    } else if (taxableIncome > 50270) {
        // Basic rate on first 50,270 + Higher rate (40%) on remainder
        incomeTax = (50270 * 0.20) + ((taxableIncome - 50270) * 0.40);
    }
    
    // National Insurance (8% on earnings over £12,570)
    const niThreshold = 12570;
    const niableIncome = Math.max(0, salary - niThreshold);
    let nationalInsurance = niableIncome * 0.08;
    
    // Student Loan Repayment (9% on earnings over threshold)
    let studentLoanRepayment = 0;
    if (studentLoan === 'plan1' && salary > 24000) {
        studentLoanRepayment = (salary - 24000) * 0.09;
    } else if (studentLoan === 'plan2' && salary > 31400) {
        studentLoanRepayment = (salary - 31400) * 0.09;
    } else if (studentLoan === 'postgrad' && salary > 21000) {
        studentLoanRepayment = (salary - 21000) * 0.09;
    }
    
    // VAT estimate (20% on spend - assume 50% of net income is spent on VATable items)
    const netIncome = salary - incomeTax - nationalInsurance - studentLoanRepayment;
    const vatableSpending = netIncome * 0.5;
    const vat = vatableSpending * 0.20;
    
    // Other taxes (council tax, fuel duty, etc.)
    const otherTaxes = 800;
    
    const totalTaxes = incomeTax + nationalInsurance + studentLoanRepayment + vat + otherTaxes;
    const takeHome = salary - totalTaxes;
    const effectiveTaxRate = ((totalTaxes / salary) * 100).toFixed(1);
    
    // Update results display
    document.getElementById('taxCalculationResults').style.display = 'block';
    document.getElementById('resultIncome').textContent = '£' + salary.toLocaleString();
    document.getElementById('resultTotalTaxes').textContent = '£' + Math.round(totalTaxes).toLocaleString();
    document.getElementById('resultTakeHome').textContent = '£' + Math.round(takeHome).toLocaleString();
    document.getElementById('resultTaxRate').textContent = effectiveTaxRate + '%';
    
    // Render tax breakdown cards
    const taxBreakdownCards = document.getElementById('taxBreakdownCards');
    taxBreakdownCards.innerHTML = `
        <div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Income Tax</p>
            <p style="margin: 8px 0 0 0; font-size: 1.3em; font-weight: bold;">£${Math.round(incomeTax).toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">${((incomeTax / totalTaxes) * 100).toFixed(0)}% of taxes</p>
        </div>
        <div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">National Insurance</p>
            <p style="margin: 8px 0 0 0; font-size: 1.3em; font-weight: bold;">£${Math.round(nationalInsurance).toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">${((nationalInsurance / totalTaxes) * 100).toFixed(0)}% of taxes</p>
        </div>
        ${studentLoanRepayment > 0 ? `
        <div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Student Loan</p>
            <p style="margin: 8px 0 0 0; font-size: 1.3em; font-weight: bold;">£${Math.round(studentLoanRepayment).toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">${((studentLoanRepayment / totalTaxes) * 100).toFixed(0)}% of taxes</p>
        </div>
        ` : ''}
        <div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">VAT & Duties</p>
            <p style="margin: 8px 0 0 0; font-size: 1.3em; font-weight: bold;">£${Math.round(vat).toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">${((vat / totalTaxes) * 100).toFixed(0)}% of taxes</p>
        </div>
        <div style="background: var(--color-background); border: 1px solid var(--color-border); padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">Other Taxes</p>
            <p style="margin: 8px 0 0 0; font-size: 1.3em; font-weight: bold;">£${Math.round(otherTaxes).toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">${((otherTaxes / totalTaxes) * 100).toFixed(0)}% of taxes</p>
        </div>
    `;
    
    // Allocation to ALL government spending (Total Managed Expenditure ~£1.37T in 2025-26)
    // Includes Resource DEL (operational), Capital DEL (investment), AND AME (transfers, pensions, debt)
    // Based on actual Budget 2025 Tables C.1-C.4
    const allocation = {
        work_pensions: { name: 'Work and Pensions (Welfare & Pensions)', percentage: 0.255, color: '#8b5cf6' },
        health_social_care: { name: 'Health and Social Care', percentage: 0.185, color: '#06b6d4' },
        debt_interest: { name: 'Debt Interest & Financial Costs', percentage: 0.108, color: '#6b7280' },
        education: { name: 'Education', percentage: 0.089, color: '#10b981' },
        public_pensions: { name: 'Public Sector Pensions', percentage: 0.082, color: '#ec4899' },
        other_services: { name: 'Other Services & Administration', percentage: 0.144, color: '#64748b' },
        defence: { name: 'Defence', percentage: 0.038, color: '#ef4444' },
        justice: { name: 'Justice & Public Order', percentage: 0.026, color: '#dc2626' },
        home_office: { name: 'Home Office', percentage: 0.023, color: '#6366f1' },
        transport: { name: 'Transport', percentage: 0.010, color: '#f97316' },
        fcdo: { name: 'Foreign, Commonwealth & Development', percentage: 0.008, color: '#14b8a6' },
        hmrc: { name: 'HM Revenue and Customs', percentage: 0.006, color: '#78716c' },
        environment: { name: 'Environment and Rural Affairs', percentage: 0.006, color: '#84cc16' },
        science_tech: { name: 'Science, Innovation & Technology', percentage: 0.004, color: '#60a5fa' },
        energy_netzero: { name: 'Energy Security & Net Zero', percentage: 0.002, color: '#f59e0b' },
        business_trade: { name: 'Business and Trade', percentage: 0.002, color: '#a78bfa' },
        culture_sport: { name: 'Culture, Media and Sport', percentage: 0.001, color: '#fb7185' }
    };
    
    // Render allocation cards
    const allocationCards = document.getElementById('allocationCards');
    let allocationHtml = '';
    
    Object.entries(allocation).forEach(([serviceKey, service]) => {
        const amount = totalTaxes * service.percentage;
        const percentage = (service.percentage * 100).toFixed(0);
        
        allocationHtml += `
            <div style="background: var(--color-background); border: 1px solid var(--color-border); border-left: 4px solid ${service.color}; padding: 15px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; hover: box-shadow: 0 4px 12px rgba(0,0,0,0.1);" 
                onclick="expandSchemeBreakdown('${serviceKey}', ${totalTaxes})"
                onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.background='var(--color-background2)';"
                onmouseout="this.style.boxShadow='none'; this.style.background='var(--color-background)';">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <p style="margin: 0; font-weight: 600; color: var(--color-fontPrimary);">${service.name}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 1.2em; font-weight: bold; color: ${service.color};">£${Math.round(amount).toLocaleString()}</p>
                        <p style="margin: 5px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">${percentage}% of your taxes</p>
                    </div>
                </div>
                <!-- Progress bar -->
                <div style="background: var(--color-border); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${service.color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                </div>
                <p style="margin: 10px 0 0 0; color: var(--color-fontSecondary); font-size: 0.85em;">👇 Click to see specific schemes</p>
            </div>
        `;
    });
    
    allocationCards.innerHTML = allocationHtml;
    
    // Note about scheme breakdown feature
    const note = document.createElement('div');
    note.style.cssText = 'margin-top: 30px; padding: 15px; background: #f0f9ff; border: 1px solid #aae6ff; border-radius: 6px; color: var(--color-fontPrimary);';
    note.innerHTML = `
        <p style="margin: 0 0 10px 0; font-weight: 600;">📊 Detailed Scheme Breakdown</p>
        <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.95em;">
            Click on any service category above to see exactly how much you're contributing to specific schemes and programs. 
            For example, you'll see that you're paying £8.20 a year for free school meals, or £45 annually for Universal Credit support. 
            This puts your tax contribution into real-world perspective and helps you make informed voting decisions.
        </p>
    `;
    allocationCards.parentElement.appendChild(note);
}

/**
 * Wait for Auth to be Ready
 * Returns promise that resolves when auth state is determined
 */
function waitForAuthReady() {
    return new Promise((resolve) => {
        // If auth is already determined, resolve immediately
        if (auth.currentUser !== undefined) {
            resolve(auth.currentUser);
            return;
        }
        
        // Otherwise wait for onAuthStateChanged to fire
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
            unsubscribe();
            resolve(null);
        }, 5000);
    });
}

/**
 * Save Tax Calculator Data to User Profile
 */
async function saveTaxCalculatorToProfile() {
    const salary = document.getElementById('taxSalaryInput')?.value || '35000';
    const taxCode = document.getElementById('taxCodeInput')?.value || '1257';
    const studentLoan = document.getElementById('studentLoanInput')?.value || 'none';
    
    // Wait for auth to be ready
    const currentUser = await waitForAuthReady();
    
    if (!currentUser) {
        console.warn('[Governance] No user after auth check. auth.currentUser:', auth.currentUser);
        alert('Please sign in to save your tax information to your profile');
        return;
    }
    
    try {
        // Import Firestore functions
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userId = typeof currentUser === 'string' ? currentUser : currentUser.uid;
        
        // Save to user's profile
        await setDoc(
            doc(db, 'users', userId),
            {
                taxCalculator: {
                    salary: parseFloat(salary),
                    taxCode: parseInt(taxCode),
                    studentLoan: studentLoan,
                    savedAt: new Date().toISOString()
                }
            },
            { merge: true }
        );
        
        console.log('[Governance] Tax calculator saved for user:', userId);
        alert('✅ Your tax information has been saved to your profile!');
    } catch (error) {
        console.error('[Governance] Error saving tax calculator data:', error);
        alert('Error saving to profile. Please try again.');
    }
}

/**
 * Load Tax Calculator Data from User Profile
 */
async function loadTaxCalculatorFromProfile() {
    // Wait for auth to be ready
    const currentUser = await waitForAuthReady();
    
    if (!currentUser) {
        console.warn('[Governance] No user after auth check. auth.currentUser:', auth.currentUser);
        alert('Please sign in to load your saved tax information');
        return;
    }
    
    try {
        // Import Firestore functions
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userId = typeof currentUser === 'string' ? currentUser : currentUser.uid;
        
        // Get user's profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists() && userDoc.data().taxCalculator) {
            const taxData = userDoc.data().taxCalculator;
            
            // Populate form with saved values
            document.getElementById('taxSalaryInput').value = taxData.salary || 35000;
            document.getElementById('taxCodeInput').value = taxData.taxCode || 1257;
            document.getElementById('studentLoanInput').value = taxData.studentLoan || 'none';
            
            // Recalculate with loaded values
            calculatePersonalTaxes();
            
            console.log('[Governance] Tax calculator loaded for user:', userId);
            alert('✅ Your saved tax information has been loaded!');
        } else {
            alert('No saved tax information found on your profile');
        }
    } catch (error) {
        console.error('[Governance] Error loading tax calculator data:', error);
        alert('Error loading from profile. Please try again.');
    }
}

/**
 * Save Comprehensive Vote Profile to Firestore
 * Stores: priorities responses, tax profile, voting activity, and personal manifesto
 * Called on auto-save, manual save, or page exit
 */
window.saveVoteProfile = async function(userId = null) {
    // Use current user if not specified
    if (!userId) {
        const currentUser = await waitForAuthReady();
        if (!currentUser) {
            console.warn('[Governance] No user to save vote profile');
            return false;
        }
        userId = typeof currentUser === 'string' ? currentUser : currentUser.uid;
    }

    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Collect all governance data
        const priorityResponses = loadUserPriorityResponses();
        const priorityScores = convertResponsesToScores(priorityResponses);
        
        // Load tax data from localStorage instead of DOM (persists across refreshes)
        let taxProfile = { salary: 35000, taxCode: '1257', studentLoan: 'none' };
        const storedTaxData = localStorage.getItem('userTaxProfile');
        if (storedTaxData) {
            try {
                taxProfile = JSON.parse(storedTaxData);
            } catch (e) {
                console.warn('[Governance] Error parsing stored tax profile:', e);
            }
        }
        
        // Calculate party alignment
        const partyAlignment = calculatePartyAlignment(priorityResponses);
        
        const voteProfile = {
            userId: userId,
            
            // Priority questionnaire responses (all 65 questions across 13 areas)
            // Stored as text values (absolutely_not, probably_not, dont_care, probably, absolutely)
            priorityResponses: priorityResponses,
            
            // Priority scores converted to 1-5 scale for analysis
            priorityScores: priorityScores,
            
            // Tax and earnings profile
            taxProfile: {
                salary: parseFloat(taxProfile.salary) || 35000,
                taxCode: taxProfile.taxCode || '1257',
                studentLoan: taxProfile.studentLoan || 'none'
            },
            
            // Calculated party alignment based on responses (0-100 for each party)
            partyAlignment: partyAlignment,
            
            // Voting activity (to track hypothesis votes, amendments, etc.)
            votingActivity: {
                hypothesisVotes: window.hypothesisVotes || {},
                suggestedAmendments: window.suggestedAmendments || [],
                manifestoPreferences: window.manifestoPreferences || {}
            },
            
            // Timestamps for audit trail
            createdAt: window.voteProfileCreatedAt || new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            
            // Metadata
            governancePhase: 'phase1',
            version: 1
        };
        
        // Save or update the Vote Profile document
        await setDoc(
            doc(db, 'users', userId, 'voteProfile', 'profile'),
            voteProfile,
            { merge: true }
        );
        
        // Also update top-level user doc with reference
        await setDoc(
            doc(db, 'users', userId),
            {
                voteProfileExists: true,
                voteProfileUpdatedAt: new Date().toISOString()
            },
            { merge: true }
        );
        
        console.log('[Governance] Vote profile saved successfully for user:', userId);
        return true;
    } catch (error) {
        console.error('[Governance] Error saving vote profile:', error);
        return false;
    }
}

/**
 * Load Comprehensive Vote Profile from Firestore
 */
window.loadVoteProfile = async function() {
    const currentUser = await waitForAuthReady();
    
    if (!currentUser) {
        console.warn('[Governance] No user to load vote profile');
        alert('Please sign in to load your governance profile');
        return false;
    }

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userId = typeof currentUser === 'string' ? currentUser : currentUser.uid;
        const profileDoc = await getDoc(doc(db, 'users', userId, 'voteProfile', 'profile'));
        
        if (!profileDoc.exists()) {
            console.log('[Governance] No vote profile found for user:', userId);
            alert('No saved governance profile found. Start filling out the questionnaire!');
            return false;
        }
        
        const profile = profileDoc.data();
        
        // Restore priority responses
        if (profile.priorityResponses) {
            localStorage.setItem('userPriorityResponses', JSON.stringify(profile.priorityResponses));
            await renderPrioritiesTab();
        }
        
        // Restore tax profile
        if (profile.taxProfile) {
            localStorage.setItem('userTaxProfile', JSON.stringify(profile.taxProfile));
            document.getElementById('taxSalaryInput').value = profile.taxProfile.salary;
            document.getElementById('taxCodeInput').value = profile.taxProfile.taxCode;
            document.getElementById('studentLoanInput').value = profile.taxProfile.studentLoan;
            calculatePersonalTaxes();
        }
        
        // Restore voting activity
        if (profile.votingActivity) {
            window.hypothesisVotes = profile.votingActivity.hypothesisVotes || {};
            window.suggestedAmendments = profile.votingActivity.suggestedAmendments || [];
            window.manifestoPreferences = profile.votingActivity.manifestoPreferences || {};
        }
        
        // Store creation date for future saves
        window.voteProfileCreatedAt = profile.createdAt;
        
        console.log('[Governance] Vote profile loaded successfully for user:', userId);
        alert('✅ Your governance profile has been loaded!');
        return true;
    } catch (error) {
        console.error('[Governance] Error loading vote profile:', error);
        alert('Error loading your governance profile. Please try again.');
        return false;
    }
}

/**
 * Auto-save Vote Profile on field changes
 * Debounced to avoid excessive saves
 */
let autoSaveTimeout = null;
window.scheduleAutoSave = function() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const success = await saveVoteProfile(currentUser.uid);
            if (success) {
                console.log('[Governance] Auto-save completed');
                // Show save indicator
                const indicator = document.getElementById('autoSaveIndicator');
                if (indicator) {
                    indicator.textContent = '✓ Saved';
                    indicator.style.opacity = '1';
                    setTimeout(() => {
                        indicator.style.opacity = '0.5';
                    }, 2000);
                }
            }
        }
    }, 2000); // Save 2 seconds after last change
};

/**
 * Open Suggest Amendment Modal
 */
function openSuggestModal() {
    document.getElementById('suggestModal').classList.add('show');
    document.getElementById('suggestTitle').focus();
}

/**
 * Close Suggest Amendment Modal
 */
function closeSuggestModal() {
    document.getElementById('suggestModal').classList.remove('show');
    // Clear form
    document.getElementById('suggestTitle').value = '';
    document.getElementById('suggestRelatedLaws').value = '';
    document.getElementById('suggestProblem').value = '';
    document.getElementById('suggestSolution').value = '';
    document.getElementById('suggestImpact').value = '';
}

/**
 * Close modal when clicking overlay
 */
document.addEventListener('click', function(e) {
    const modal = document.getElementById('suggestModal');
    if (e.target === modal) {
        closeSuggestModal();
    }
});

/**
 * Submit Law Suggestion
 */
async function submitSuggestion() {
    const title = document.getElementById('suggestTitle').value.trim();
    const relatedLaws = document.getElementById('suggestRelatedLaws').value.trim();
    const problem = document.getElementById('suggestProblem').value.trim();
    const solution = document.getElementById('suggestSolution').value.trim();
    const impact = document.getElementById('suggestImpact').value.trim();

    if (!title || !problem || !solution) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        // Create a new project/proposal for this law suggestion
        const overview = `
## Problem
${problem}

## Proposed Solution
${solution}

## Related Legislation
${relatedLaws || 'None specified'}

## Expected Impact
${impact || 'To be determined'}
        `;

        const projectId = await createProject(
            title,
            'Law',
            overview,
            true, // isPublic
            null, // no header image
            true  // isProposal
        );

        alert('Amendment suggestion submitted successfully!');
        closeSuggestModal();
        
        // Load community suggestions to show the new one
        loadCommunitySuggestions();
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        alert('Error submitting suggestion: ' + error.message);
    }
}

/**
 * Check if createProject is available (from projects.js)
 */
async function createProject(title, category, overview, isPublic, headerImage, isProposal) {
    if (typeof window.createProject === 'function') {
        return await window.createProject(title, category, overview, isPublic, headerImage, isProposal);
    } else {
        throw new Error('Project creation module not loaded');
    }
}

/**
 * Show policy comparison across all parties
 */
async function showPolicyComparison(policyArea) {
    if (!policyArea) {
        return;
    }

    // Hide manifesto content, show comparison
    document.getElementById('manifestoContent').style.display = 'none';
    document.getElementById('comparisonContent').style.display = 'block';

    // Load all party manifestos
    const parties = [
        { id: 'labour', label: 'Labour Party' },
        { id: 'conservative', label: 'Conservative Party' },
        { id: 'libdems', label: 'Liberal Democrats' },
        { id: 'green', label: 'Green Party' },
        { id: 'reform', label: 'Reform UK' },
        { id: 'plaid', label: 'Plaid Cymru' }
    ];

    let html = `<h2 style="margin: 0 0 20px 0; font-size: 1.5em;">Policy Comparison: ${document.querySelector(`#policyCompareSelector option[value="${policyArea}"]`)?.textContent || policyArea}</h2>`;
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">';

    for (const party of parties) {
        const manifesto = await loadManifestoByType(party.id);
        const policy = manifesto.policies.find(p => p.area === policyArea);

        if (policy) {
            const isNoPosition = policy.hasNoPosition || policy.position.includes('has not published an official position');
            const bgColor = isNoPosition ? '#f5f5f5' : 'transparent';
            const borderColor = manifesto.colour || '#999';

            html += `
            <div style="border: 2px solid ${borderColor}; border-radius: 8px; padding: 20px; background: ${bgColor};">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px solid ${borderColor};">
                    <span style="font-size: 1.6em;">${policy.icon || '📋'}</span>
                    <div>
                        <div style="font-weight: 700; font-size: 1.1em;">${manifesto.party || party.label}</div>
                        ${manifesto.leader ? `<div style="font-size: 0.85em; color: #666;">Leader: ${manifesto.leader}</div>` : ''}
                        ${isNoPosition ? '<div style="font-size: 0.8em; color: #999; font-style: italic;">No official position</div>' : ''}
                    </div>
                </div>
                <div style="line-height: 1.6; color: #333; margin-bottom: 15px;">
                    ${policy.position}
                </div>
                ${policy.keyCommitments && policy.keyCommitments.length > 0 && !isNoPosition ? `
                <div style="background: #f9f9f9; padding: 12px; border-radius: 4px; border-left: 3px solid ${borderColor};">
                    <strong style="font-size: 0.9em; display: block; margin-bottom: 8px;">Key Commitments:</strong>
                    <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
                        ${policy.keyCommitments.map(c => `<li style="margin: 4px 0;">${c}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            `;
        }
    }

    html += '</div>';
    document.getElementById('comparisonContent').innerHTML = html;
}

/**
 * Close policy comparison and show regular manifesto view
 */
function closePolicyComparison() {
    document.getElementById('manifestoContent').style.display = 'block';
    document.getElementById('comparisonContent').style.display = 'none';
    document.getElementById('policyCompareSelector').value = '';
}

/**
 * Generate grid of colored circles representing parliamentary seats (13 rows x 50 columns = 650 seats)
 */
function generateSeatsGrid(composition) {
    const rows = 26;
    const cols = 25;
    const circleSize = 8;
    const spacing = 14;
    const width = cols * spacing + 40;
    const height = rows * spacing + 40;
    
    // Build seat allocation array
    let seats = [];
    composition.forEach(party => {
        for (let i = 0; i < party.seats; i++) {
            seats.push({ colour: party.colour, party: party.party });
        }
    });
    
    // Fill remaining with grey if needed
    while (seats.length < rows * cols) {
        seats.push({ colour: '#e0e0e0', party: 'Vacant' });
    }
    
    let svg = `<svg width="${width}" height="${height}" style="display: inline-block; border: 1px solid #ddd; border-radius: 4px; background: white;">`;
    
    let seatIndex = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = 20 + c * spacing;
            const y = 20 + r * spacing;
            const seat = seats[seatIndex];
            svg += `<circle cx="${x}" cy="${y}" r="4" fill="${seat.colour}" stroke="white" stroke-width="0.5" opacity="0.9" title="${seat.party}"/>`;
            seatIndex++;
        }
    }
    
    svg += `</svg>`;
    return svg;
}


/**
 * Get sample MPs data - used when Firestore is unavailable
 */
function getSampleMPs() {
    return [
        { name: 'Keir Starmer', party: 'Labour', constituency: 'Holborn & St Pancras', firstElected: '4 Jul 2024', votes: 7403, percentage: 16.8 },
        { name: 'Lucy Powell', party: 'Labour', constituency: 'Manchester Central', firstElected: '4 Jul 2024', votes: 6357, percentage: 15.9 },
        { name: 'Rachel Reeves', party: 'Labour', constituency: 'Leeds West & Pudsey', firstElected: '4 Jul 2024', votes: 5294, percentage: 14.2 },
        { name: 'David Lammy', party: 'Labour', constituency: 'Tottenham', firstElected: '4 Jul 2024', votes: 4821, percentage: 13.5 },
        { name: 'Angela Rayner', party: 'Labour', constituency: 'Ashton-under-Lyne', firstElected: '4 Jul 2024', votes: 5612, percentage: 15.1 },
        { name: 'Kemi Badenoch', party: 'Conservative', constituency: 'North West Essex', firstElected: '4 Jul 2024', votes: 4532, percentage: 12.3 },
        { name: 'Ed Davey', party: 'Liberal Democrat', constituency: 'Kingston & Surbiton', firstElected: '4 Jul 2024', votes: 3891, percentage: 10.5 },
        { name: 'John Swinney', party: 'Scottish National Party', constituency: 'Perthshire North & Kinross-shire', firstElected: '4 Jul 2024', votes: 2847, percentage: 8.9 },
        { name: 'Rhun ap Iorwerth', party: 'Plaid Cymru', constituency: 'Anglesey', firstElected: '4 Jul 2024', votes: 2143, percentage: 7.2 },
        { name: 'Jeffrey Donaldson', party: 'Democratic Unionist Party', constituency: 'Lagan Valley', firstElected: '4 Jul 2024', votes: 1876, percentage: 6.4 },
    ];
}

/**
 * Fetch MPs data - Priority: Firestore > Sample
 */
async function fetchMPsFromAPI() {
    try {
        // Use modular SDK API
        console.log('[MPs] Querying Firestore mps collection...');
        const mpsCollection = collection(db, 'mps');
        const snapshot = await getDocs(mpsCollection);
        
        if (snapshot.empty) {
            console.log('[MPs] No MPs found in Firestore');
            return getSampleMPs();
        }
        
        const mps = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            mps.push({
                name: data.name,
                party: data.party,
                constituency: data.constituency,
                firstElected: data.firstElected,
                votes: data.votes,
                percentage: data.percentage
            });
        });
        
        // Sort by party then by name for consistency
        mps.sort((a, b) => {
            if (a.party !== b.party) return a.party.localeCompare(b.party);
            return a.name.localeCompare(b.name);
        });
        
        console.log(`[MPs] ✅ Loaded ${mps.length} MPs from Firestore 'mps' collection`);
        return mps;
    } catch (error) {
        console.error('[MPs] Error querying Firestore:', error.message);
        console.log('[MPs] Falling back to sample data');
        return getSampleMPs();
    }
}

/**
 * Generate table rows HTML from MPs data array
 */
function generateMPsTableRows(mpsData) {
    const partyColorMap = {
        'Labour': '#E4003B',
        'Labour (Co-op)': '#E4003B',
        'Conservative': '#0087DC',
        'Liberal Democrat': '#FAA61A',
        'SNP': '#FADA01',
        'Scottish National Party': '#FADA01',
        'Plaid Cymru': '#005B54',
        'DUP': '#2AA82F',
        'Democratic Unionist Party': '#2AA82F',
        'Independent': '#999',
        'Green Party': '#6AB023',
        'Reform UK': '#0087DC',
        'Sinn Féin': '#005B54',
        'Social Democratic & Labour Party': '#999',
        'Alliance': '#F78200',
        'Ulster Unionist Party': '#A51930',
        'Traditional Unionist Voice': '#003296'
    };
    
    return mpsData.map(mp => {
        const partyColor = partyColorMap[mp.party] || '#999';
        const votes = mp.votes ? `${mp.votes.toLocaleString()} (${mp.percentage}%)` : 'N/A';
        
        return `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 15px; color: #333;">
                <strong style="color: ${partyColor};">●</strong> ${mp.name}
            </td>
            <td style="padding: 12px 15px; color: #666;">
                ${mp.party}
            </td>
            <td style="padding: 12px 15px; color: #666;">
                ${mp.constituency}
            </td>
            <td style="padding: 12px 15px; color: #666; text-align: center;">
                ${mp.firstElected}
            </td>
            <td style="padding: 12px 15px; color: #666; text-align: center;">
                ${votes}
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * Get sample MPs table rows (fallback data)
 * In production, this would pull from Parliament API
 */
function getMPsTableRows() {
    // Sample MPs data - fallback if API fails
    const sampleMPs = [
        { name: 'Keir Starmer', party: 'Labour', constituency: 'Holborn & St Pancras', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Lucy Powell', party: 'Labour', constituency: 'Manchester Central', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Rachel Reeves', party: 'Labour', constituency: 'Leeds West & Pudsey', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'David Lammy', party: 'Labour', constituency: 'Tottenham', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Angela Rayner', party: 'Labour', constituency: 'Ashton-under-Lyne', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Kemi Badenoch', party: 'Conservative', constituency: 'North West Essex', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Ed Davey', party: 'Liberal Democrats', constituency: 'Kingston & Surbiton', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'John Swinney', party: 'SNP', constituency: 'Perthshire North & Kinross-shire', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Rhun ap Iorwerth', party: 'Plaid Cymru', constituency: 'Anglesey', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        { name: 'Jeffrey Donaldson', party: 'DUP', constituency: 'Lagan Valley', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
    ];
    
    return generateMPsTableRows(sampleMPs);
}

/**
 * Load and render Leaders Tab with real API data
 */
async function loadLeadersTab() {
    try {
        const leaders = getLeadersData();
        
        // Fetch MPs data from Firestore (or sample if unavailable)
        let mpsData = await fetchMPsFromAPI();
        
        // Now mpsData is guaranteed to be populated (either Firestore or sample)
        
        renderLeadersTab(leaders, mpsData);
    } catch (error) {
        console.error('Error loading leaders:', error);
        document.getElementById('leadersContent').innerHTML = '<p>Unable to load leaders data.</p>';
    }
}

/**
 * Get leaders data structure
 */
function getLeadersData() {
    return {
        nationalPositions: [
            {
                title: 'Prime Minister',
                incumbent: 'Keir Starmer',
                party: 'Labour Party',
                partyColor: '#E4003B',
                term: '2024-2029',
                nextElection: 'By 2029',
                elected: true,
                description: 'Head of Government and Head of State representative. Chief executive of UK government.',
                responsibilities: [
                    'Chairs Cabinet and government',
                    'Sets government policy and direction',
                    'Represents UK internationally',
                    'Commander-in-Chief authority'
                ]
            },
            {
                title: 'Leader of the Opposition',
                incumbent: 'Kemi Badenoch',
                party: 'Conservative Party',
                partyColor: '#0087DC',
                term: '2024-Next Election',
                nextElection: 'By 2029',
                elected: true,
                description: 'Leader of the largest opposition party. Shadows the Prime Minister and government.',
                responsibilities: [
                    'Leads opposition party',
                    'Holds government to account',
                    'Develops alternative policies',
                    'Shadow Cabinet oversight'
                ]
            },
            {
                title: 'Speaker of the House of Commons',
                incumbent: 'Lindsay Hoyle',
                party: 'Non-partisan',
                partyColor: '#999',
                term: '2019-Present',
                nextElection: 'MP re-election in 2029',
                elected: true,
                description: 'Presides over House of Commons. Maintains parliamentary order and impartiality.',
                responsibilities: [
                    'Presides over House debates',
                    'Maintains parliamentary order',
                    'Protects members\' rights',
                    'Administers Commons procedures'
                ]
            },
            {
                title: 'Chancellor of the Exchequer',
                incumbent: 'Rachel Reeves',
                party: 'Labour Party',
                partyColor: '#E4003B',
                term: '2024-2029',
                nextElection: 'Personal election 2029',
                elected: true,
                description: 'Minister for Finance. Head of the Treasury and chief economic policymaker.',
                responsibilities: [
                    'Manages UK economy',
                    'Sets fiscal policy',
                    'Controls public spending',
                    'Manages national debt'
                ]
            },
            {
                title: 'Foreign Secretary',
                incumbent: 'David Lammy',
                party: 'Labour Party',
                partyColor: '#E4003B',
                term: '2024-2029',
                nextElection: 'Personal election 2029',
                elected: true,
                description: 'Minister for Foreign Affairs. Leads international relations and diplomacy.',
                responsibilities: [
                    'Manages foreign policy',
                    'Represents UK internationally',
                    'Leads diplomatic corps',
                    'Oversees overseas development'
                ]
            }
        ],
        parliamentaryPositions: [
            {
                chamber: 'House of Commons',
                seats: 650,
                composition: [
                    { party: 'Labour Party', colour: '#E4003B', seats: 412, leader: 'Keir Starmer' },
                    { party: 'Conservative Party', colour: '#0087DC', seats: 121, leader: 'Kemi Badenoch' },
                    { party: 'Liberal Democrats', colour: '#FAA61A', seats: 72, leader: 'Ed Davey' },
                    { party: 'SNP (Scottish)', colour: '#FADA01', seats: 9, leader: 'John Swinney' },
                    { party: 'Plaid Cymru (Welsh)', colour: '#005B54', seats: 4, leader: 'Rhun ap Iorwerth' },
                    { party: 'DUP (Northern Ireland)', colour: '#2AA82F', seats: 5, leader: 'Jeffrey Donaldson' },
                    { party: 'Others/Independent', colour: '#999', seats: 27, leader: 'Various' }
                ],
                elections: 'General election every 5 years (maximum)',
                lastElection: '4 July 2024',
                nextElection: 'By 28 January 2029',
                type: 'Elected'
            },
            {
                chamber: 'House of Lords',
                seats: 793,
                composition: [
                    { type: 'Life Peers', count: 679 },
                    { type: 'Hereditary Peers', count: 92 },
                    { type: 'Bishops', count: 22 }
                ],
                elections: 'Not elected (appointed/hereditary)',
                type: 'Non-elected (advisory & legislative review)',
                description: 'Upper chamber. Provides scrutiny of legislation and acts as a court of final appeal.'
            }
        ],
        devolved: [
            {
                title: 'Scotland',
                position: 'First Minister',
                incumbent: 'John Swinney',
                party: 'Scottish National Party (SNP)',
                partyColor: '#FADA01',
                parliament: 'Scottish Parliament (129 MSPs)',
                elections: 'Every 5 years',
                lastElection: 'May 2021',
                nextElection: 'May 2026',
                devolved: ['Health', 'Education', 'Transport', 'Housing', 'Local Government']
            },
            {
                title: 'Wales',
                position: 'First Minister',
                incumbent: 'Vaughan Gething',
                party: 'Plaid Cymru',
                partyColor: '#005B54',
                parliament: 'Welsh Parliament (60 Members)',
                elections: 'Every 5 years',
                lastElection: 'October 2021',
                nextElection: 'October 2026',
                devolved: ['Education', 'Health', 'Housing', 'Environment', 'Economic Development']
            },
            {
                title: 'Northern Ireland',
                position: 'First Minister & Deputy First Minister',
                incumbent: 'Michelle O\'Neill (SF) & Emma Little-Pengelly (DUP)',
                party: 'Power-sharing between Sinn Féin & DUP',
                partyColor: '#999',
                parliament: 'Northern Ireland Assembly (90 MLAs)',
                elections: 'Every 5 years',
                lastElection: 'May 2022',
                nextElection: 'May 2027',
                devolved: ['Health', 'Education', 'Economic Development', 'Environment', 'Agriculture']
            }
        ]
    };
}

/**
 * Render Leaders Tab
 */
/**
 * Render Leaders Tab content
 */
function renderLeadersTab(leaders, mpsData = null) {
    // Use default sample data if not provided
    if (!mpsData) {
        const sampleMPs = [
            { name: 'Keir Starmer', party: 'Labour', constituency: 'Holborn & St Pancras', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Lucy Powell', party: 'Labour', constituency: 'Manchester Central', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Rachel Reeves', party: 'Labour', constituency: 'Leeds West & Pudsey', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'David Lammy', party: 'Labour', constituency: 'Tottenham', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Angela Rayner', party: 'Labour', constituency: 'Ashton-under-Lyne', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Kemi Badenoch', party: 'Conservative', constituency: 'North West Essex', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Ed Davey', party: 'Liberal Democrats', constituency: 'Kingston & Surbiton', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'John Swinney', party: 'SNP', constituency: 'Perthshire North & Kinross-shire', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Rhun ap Iorwerth', party: 'Plaid Cymru', constituency: 'Anglesey', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
            { name: 'Jeffrey Donaldson', party: 'DUP', constituency: 'Lagan Valley', elected: '4 Jul 2024', nextElection: 'By 28 Jan 2029' },
        ];
        mpsData = sampleMPs;
    }
    
    let html = '';

    // Parliamentary composition - FIRST (just seats grid and stats)
    html += '<h3 style="margin: 0 0 15px 0; font-size: 1.3em; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px;">Parliament Composition</h3>';
    
    let mpsHtml = ''; // Store MPs section for later
    leaders.parliamentaryPositions.forEach(chamber => {
        if (chamber.chamber === 'House of Commons') {
            // Generate seat grid
            const seatsGrid = generateSeatsGrid(chamber.composition);
            
            html += `
            <div style="background: var(--color-background2); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h4 style="margin: 0 0 20px 0; font-size: 1.1em;">${chamber.chamber}</h4>
                
                <!-- Seats Grid Visualization -->
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    ${seatsGrid}
                </div>
                
                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
                    ${chamber.composition.map(party => `
                    <div style="background: white; padding: 12px; border-left: 4px solid ${party.colour}; border-radius: 4px; text-align: center;">
                        <div style="font-weight: 700; color: ${party.colour}; font-size: 0.9em;">${party.party}</div>
                        <div style="font-size: 1.5em; font-weight: 700; margin: 6px 0; color: #333;">${party.seats}</div>
                        <div style="font-size: 0.8em; color: #666;">seats</div>
                    </div>
                    `).join('')}
                </div>
                
                <div style="background: #f9f9f9; padding: 12px; border-radius: 4px; margin-top: 15px; font-size: 0.9em; color: #666;">
                    <div style="margin-bottom: 6px;"><strong>Last Election:</strong> ${chamber.lastElection}</div>
                    <div style="margin-bottom: 6px;"><strong>Next Election:</strong> ${chamber.nextElection}</div>
                    <div><strong>Total Seats:</strong> ${chamber.seats} (Majority: ${Math.floor(chamber.seats / 2) + 1} seats)</div>
                </div>
            </div>
            `;
            
            // Store MPs section to render after Key Leadership
            mpsHtml = `
            <h3 style="margin: 30px 0 15px 0; font-size: 1.3em; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px;">Members of Parliament</h3>
            <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; max-height: 600px; overflow-y: auto; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead style="background: #f5f5f5; position: sticky; top: 0;">
                        <tr style="border-bottom: 2px solid #ddd;">
                            <th style="padding: 12px 15px; text-align: left; font-weight: 700; color: #333;">Name</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 700; color: #333;">Party</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 700; color: #333;">Constituency</th>
                            <th style="padding: 12px 15px; text-align: center; font-weight: 700; color: #333;">Last Elected</th>
                            <th style="padding: 12px 15px; text-align: center; font-weight: 700; color: #333;">Votes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateMPsTableRows(mpsData)}
                    </tbody>
                </table>
            </div>
            `;
        }
    });

    // National positions section - SECOND, with expandable headers
    html += '<h3 style="margin: 30px 0 15px 0; font-size: 1.3em; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px;">Key Leadership Positions</h3>';
    
    leaders.nationalPositions.forEach((position, index) => {
        const collapsibleId = `leader-${index}`;
        html += `
        <div style="margin-bottom: 12px; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden;">
            <!-- Header - Always Visible -->
            <div onclick="toggleLeader('${collapsibleId}')" style="cursor: pointer; padding: 16px 20px; background: var(--color-background2); display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    <div style="font-size: 1.2em;">
                        ${position.partyColor !== '#999' ? `<span style="color: ${position.partyColor}; font-weight: 700;">●</span>` : ''}
                    </div>
                    <div>
                        <h4 style="margin: 0 0 2px 0; font-size: 1em; font-weight: 700;">${position.title}</h4>
                        <p style="margin: 0; font-size: 0.85em; color: var(--color-fontSecondary);">${position.incumbent} • ${position.party}</p>
                    </div>
                </div>
                <span style="font-size: 1.2em; color: var(--color-fontSecondary);" id="${collapsibleId}-icon">▼</span>
            </div>
            
            <!-- Expanded Content - Hidden by default -->
            <div id="${collapsibleId}" style="display: none; padding: 20px; border-top: 1px solid var(--color-border); background: white;">
                <p style="margin: 0 0 15px 0; color: #666; font-size: 0.95em;">${position.description}</p>
                <div style="background: var(--color-background2); padding: 12px; border-radius: 4px; margin-bottom: 15px; border-left: 3px solid ${position.partyColor};">
                    <div style="font-size: 0.9em; margin-bottom: 6px;"><strong>Term:</strong> ${position.term}</div>
                    <div style="font-size: 0.9em;"><strong>Next Election:</strong> ${position.nextElection}</div>
                </div>
                <strong style="display: block; margin-bottom: 10px; font-size: 0.95em;">Key Responsibilities:</strong>
                <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
                    ${position.responsibilities.map(r => `<li style="margin: 6px 0;">${r}</li>`).join('')}
                </ul>
            </div>
        </div>
        `;
    });

    // Add MPs table here - THIRD (after Key Leadership)
    html += mpsHtml;

    // Devolved governments section - FOURTH
    html += '<h3 style="margin: 30px 0 15px 0; font-size: 1.3em; border-bottom: 2px solid var(--color-primary); padding-bottom: 10px;">Devolved Governments</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
    
    leaders.devolved.forEach(gov => {
        html += `
        <div style="border: 2px solid ${gov.partyColor}; border-radius: 8px; padding: 20px; background: var(--color-background2);">
            <h4 style="margin: 0 0 10px 0; font-size: 1.2em;">${gov.title}</h4>
            <div style="margin-bottom: 15px;">
                <div style="font-size: 0.9em; color: var(--color-fontSecondary); margin-bottom: 4px;">${gov.position}</div>
                <div style="font-size: 1.1em; font-weight: 700;">${gov.incumbent}</div>
                <span style="background: ${gov.partyColor}; color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.8em; display: inline-block; margin-top: 6px;">${gov.party}</span>
            </div>
            <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: 12px; border-left: 3px solid ${gov.partyColor}; font-size: 0.9em;">
                <div style="margin-bottom: 4px;"><strong>${gov.parliament}</strong></div>
                <div><strong>Elections:</strong> ${gov.elections}</div>
                <div><strong>Next Election:</strong> ${gov.nextElection}</div>
            </div>
            <strong style="display: block; margin-bottom: 8px; font-size: 0.9em;">Devolved Responsibilities:</strong>
            <div style="font-size: 0.9em;">
                ${gov.devolved.map(d => `<span style="display: inline-block; background: var(--color-primary); color: white; padding: 3px 8px; border-radius: 4px; margin: 3px 3px 3px 0;">${d}</span>`).join('')}
            </div>
        </div>
        `;
    });
    
    html += '</div>';

    document.getElementById('leadersContent').innerHTML = html;
}

/**
 * Toggle expandable leader section
 */
function toggleLeader(sectionId) {
    const content = document.getElementById(sectionId);
    const icon = document.getElementById(sectionId + '-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

/**
 * API INTEGRATION GUIDE - Live Parliament Data
 * 
 * To fetch live data from UK Parliament, use the Members API:
 * https://members-api.parliament.uk/api/Members
 * 
 * Example implementation for fetching MPs:
 * 
 * async function fetchMPsFromParliament() {
 *     try {
 *         const response = await fetch('https://members-api.parliament.uk/api/Members?House=Commons&IsCurrentMember=true');
 *         const data = await response.json();
 *         return data.value.map(mp => ({
 *             name: mp.nameFullTitle,
 *             party: mp.latestParty.name,
 *             constituency: mp.latestHouseMembership.membershipFrom,
 *             elected: new Date(mp.latestHouseMembership.startDate).toLocaleDateString(),
 *             nextElection: 'By 28 Jan 2029'
 *         }));
 *     } catch (error) {
 *         console.error('Error fetching MPs:', error);
 *         return [];
 *     }
 * }
 * 
 * Alternative sources:
 * - Electoral Commission: https://www.electoral-commission.org.uk/api/
 * - Parliament Data Service: https://data.parliament.uk/
 * 
 * Tips for implementation:
 *  1. Cache the data and refresh every 24 hours
 * 2. Use CORS proxy if needed: https://cors-anywhere.herokuapp.com/
 * 3. Store refresh timestamp to show "Last updated" info
 * 4. Implement error handling with fallback to cached data
 */

/**
 * Load Schemes Tab
 * Displays government schemes, benefits, and eligibility information
 */
async function loadSchemesTab(country) {
    try {
        const schemes = await fetchUKSchemes();
        renderSchemesTab(schemes);
    } catch (error) {
        console.error('Error loading schemes:', error);
        document.getElementById('schemesContent').innerHTML = '<p>Unable to load schemes data at this time. Please try again later.</p>';
    }
}

/**
 * Fetch UK Government Schemes
 * Comprehensive data on government benefits and support schemes
 * Based on 2024-25 Department for Work and Pensions & government resources
 */
async function fetchUKSchemes() {
    return [
        // UNIVERSAL SUPPORT
        {
            id: 'universal-credit',
            name: 'Universal Credit',
            category: 'Universal Support',
            description: 'Unified payment to help with living costs. Replaces six older benefits into one system.',
            eligibility: 'Aged 18-66, in the UK, pass income/savings tests, expected to seek work (unless exempted)',
            maxPayment: '£300-600/month (varies by household)',
            budget: '£172.5 billion (2024-25)',
            beneficiaries: '5.8 million households',
            howToApply: 'Apply online at claim-universal-credit.service.gov.uk',
            relatedLaws: 'Welfare Reform Act 2012',
            keyPoints: ['Work incentive - earn £293/month before benefits reduce', 'Replaces: JSA, ESA, Tax Credits, Housing Benefit, Child Benefit (partial)', 'Claims can take 5-7 weeks to process']
        },
        {
            id: 'employment-support',
            name: 'Employment & Support Allowance (ESA)',
            category: 'Work & Disability Support',
            description: 'Payment for people unable to work due to illness or disability.',
            eligibility: 'Have a health condition/disability that limits ability to work, pass savings test, have paid NI contributions or on low income',
            maxPayment: '£184-288/week',
            budget: '£18.2 billion (2024-25)',
            beneficiaries: '1.5 million',
            howToApply: 'Apply online at https://www.gov.uk/employment-support-allowance',
            relatedLaws: 'Welfare Reform Act 2007',
            keyPoints: ['Medical assessment to determine work capability', 'Support Group: No time limit, no work expectations', 'Work-Related Activity Group: Expected to undertake activities to improve employability']
        },
        {
            id: 'jobseekers-allowance',
            name: 'Jobseeker\'s Allowance (JSA)',
            category: 'Work & Disability Support',
            description: 'Financial support while actively looking for work.',
            eligibility: 'Unemployed, aged 18+, available for work, actively seeking employment, pass income/savings tests',
            maxPayment: '£184-288/week',
            budget: '£5.3 billion (2024-25)',
            beneficiaries: '450,000',
            howToApply: 'Apply online or at Jobcentre Plus',
            relatedLaws: 'Jobseekers Act 1995',
            keyPoints: ['Must attend fortnightly sign-ins', 'Claimant Commitment sets job search/apply targets', 'Sanctions for non-compliance']
        },
        // FAMILY & CHILDREN
        {
            id: 'child-benefit',
            name: 'Child Benefit',
            category: 'Families & Children',
            description: 'Regular payment to help with the cost of raising children up to age 20 (in eligible circumstances).',
            eligibility: 'Children under 16, or 16-19 in eligible education, parent/carer resident in UK',
            maxPayment: '£1,067/year per child (about £21/week first child)',
            budget: '£13.5 billion (2024-25)',
            beneficiaries: '7.2 million families',
            howToApply: 'Apply online at www.gov.uk/child-benefit',
            relatedLaws: 'Social Security Contributions and Benefits Act 1992',
            keyPoints: ['Means-tested if household income >£60,000', 'Building back child tax credit planned', 'Highest rate of working families in UK']
        },
        {
            id: 'child-tax-credit',
            name: 'Child Tax Credit (legacy)',
            category: 'Families & Children',
            description: 'Payment to families with children on a low income (legacy system, being replaced).',
            eligibility: 'Have dependent children, on low income, pass savings test',
            maxPayment: '£2,250/year per child (varies)',
            budget: '£13.2 billion (2024-25, declining)',
            beneficiaries: '3.1 million (declining)',
            howToApply: 'Existing claimants only - no new applications',
            relatedLaws: 'Tax Credits Act 2002',
            keyPoints: ['Being migrated to Universal Credit', 'New claimants must use Universal Credit instead']
        },
        {
            id: 'free-school-meals',
            name: 'Free School Meals',
            category: 'Families & Children',
            description: 'Free lunch for eligible school children every school day.',
            eligibility: 'Ages 5-16, eligible family income thresholds, attending school',
            maxPayment: 'One free meal per day',
            budget: '£1.8 billion (2024-25)',
            beneficiaries: '2.2 million children',
            howToApply: 'Apply through school or online via local authority',
            relatedLaws: 'Education Act 1996',
            keyPoints: ['Universal in Reception-Year 2 (all children)', 'Means-tested from Year 3 onwards', 'Eligible: Parents on UC, JSA, ESA, Tax Credits']
        },
        {
            id: 'holiday-activities-food',
            name: 'Holiday Activities & Food Programme',
            category: 'Families & Children',
            description: 'Free childcare and meals during school holidays for disadvantaged children.',
            eligibility: 'Aged 5-16, eligible for free school meals, local authority participating',
            maxPayment: 'Free provision during holidays',
            budget: '£2.1 billion (2024-25)',
            beneficiaries: '2.3 million (projected)',
            howToApply: 'Apply through school or local authority',
            relatedLaws: 'Department for Education Initiative',
            keyPoints: ['Runs during summer, Easter, Christmas, half-term holidays', 'Activities + meal provision + school resources']
        },
        // HOUSING
        {
            id: 'housing-benefit',
            name: 'Housing Benefit',
            category: 'Housing & Homelessness',
            description: 'Help with rent payments for people on low income (legacy system).',
            eligibility: 'On low income, pay rent, pass savings test, not in full-time work (varies)',
            maxPayment: 'Up to full rent depending on area, family size, circumstances',
            budget: '£17.3 billion (2024-25)',
            beneficiaries: '3.1 million',
            howToApply: 'Apply at local council',
            relatedLaws: 'Social Security Act 1992',
            keyPoints: ['Being migrated to Universal Credit', 'Rent Allowance cap in many areas', 'Local Housing Allowance (LHA) used to calculate eligible rent']
        },
        {
            id: 'council-tax-support',
            name: 'Council Tax Support',
            category: 'Housing & Homelessness',
            description: 'Help with paying council tax (property tax) if on low income.',
            eligibility: 'On low income, pass savings test, occupy property as main home',
            maxPayment: 'Up to 100% council tax bill (varies by council)',
            budget: '£3.8 billion (2024-25)',
            beneficiaries: '2.0 million',
            howToApply: 'Apply to local council',
            relatedLaws: 'Local Government Finance Act 1992',
            keyPoints: ['Each council sets own scheme', 'Many councils cap at 75-85% of bill', 'Means-tested like Housing Benefit']
        },
        {
            id: 'homelessness-support',
            name: 'Homelessness Support & Housing',
            category: 'Housing & Homelessness',
            description: 'Emergency accommodation and support for homeless individuals and families.',
            eligibility: 'Homeless or at risk of homelessness, in priority need (families, pregnant women, vulnerable)',
            maxPayment: 'Varies by accommodation type (temporary to permanent housing)',
            budget: '£2.4 billion (2024-25)',
            beneficiaries: '350,000 in temporary accommodation',
            howToApply: 'Contact local council housing department or call 111 for emergency help',
            relatedLaws: 'Housing Act 1996',
            keyPoints: ['Priority given to families with children, pregnant women', 'Local authority duty to provide temporary housing', 'Right to Acquire disabled facilities grants available']
        },
        // PENSIONS & OLDER PEOPLE
        {
            id: 'state-pension',
            name: 'State Pension',
            category: 'Pensions & Older People',
            description: 'Regular payment from age 66 (increasing to 67-68) based on National Insurance record.',
            eligibility: 'Reached State Pension age, have 10+ years NI contributions for basic pension',
            maxPayment: '£11,502/year New State Pension (full rate)',
            budget: '£89.6 billion (2024-25)',
            beneficiaries: '12.4 million',
            howToApply: 'Automatic when eligible - claim if not received',
            relatedLaws: 'Pensions Act 2014',
            keyPoints: ['Full rate requires 35 years NI contributions', 'Can defer to age 68+ for higher payments', 'Current: 66, increasing to 67 (2026), 68 (2028)']
        },
        {
            id: 'pension-credit',
            name: 'Pension Credit',
            category: 'Pensions & Older People',
            description: 'Additional financial support for older people on low pensions.',
            eligibility: 'Reached State Pension age, on low income/savings',
            maxPayment: 'Guarantee Credit up to £246-388/week; Savings Credit up to £62/week',
            budget: '£8.9 billion (2024-25)',
            beneficiaries: '1.5 million',
            howToApply: 'Apply online or call Pension Credit team',
            relatedLaws: 'State Pension Credit Act 2002',
            keyPoints: ['Automatic eligibility check if on UC', 'Means-tested on income and savings', 'Helps with housing costs']
        },
        {
            id: 'attendance-allowance',
            name: 'Attendance Allowance',
            category: 'Pensions & Older People',
            description: 'Tax-free payment for people over 65 with disabilities who need care.',
            eligibility: 'Over 65, have personal care/supervision needs, passed 26-week health condition test',
            maxPayment: '£232-348/week (two rates based on need level)',
            budget: '£17.3 billion (2024-25)',
            beneficiaries: '1.4 million',
            howToApply: 'Apply at www.gov.uk/attendance-allowance',
            relatedLaws: 'Social Security Contributions and Benefits Act 1992',
            keyPoints: ['Non-means-tested', 'Not affected by income or savings', 'Doesn\'t affect other benefits']
        },
        // HEALTH & DISABILITY
        {
            id: 'personal-independence-payment',
            name: 'Personal Independence Payment (PIP)',
            category: 'Health & Disability Support',
            description: 'Payment for people aged 16-64 with disabilities affecting daily life and mobility.',
            eligibility: 'Aged 16-64, have condition lasting 9+ months, have mobility/personal care difficulties',
            maxPayment: '£230-638/month (varies by assessment level)',
            budget: '£19.2 billion (2024-25)',
            beneficiaries: '2.5 million',
            howToApply: 'Apply at www.gov.uk/apply-personal-independence-payment',
            relatedLaws: 'Welfare Reform Act 2012',
            keyPoints: ['Medical assessment required', 'Two components: Daily Living (£232-667/month), Mobility (£73-229/month)', 'Can receive both or one component']
        },
        {
            id: 'disability-living-allowance',
            name: 'Disability Living Allowance (DLA)',
            category: 'Health & Disability Support',
            description: 'Payment for children with disabilities (legacy - being replaced by PIP for others).',
            eligibility: 'Under 16, severe physical/mental disability managing daily life',
            maxPayment: '£75-267/month',
            budget: '£2.1 billion (2024-25)',
            beneficiaries: '380,000 children',
            howToApply: 'Apply at www.gov.uk/disability-living-allowance-children',
            relatedLaws: 'Social Security Contributions and Benefits Act 1992',
            keyPoints: ['Early notification of migration to PIP underway', 'Can transfer to Adult PIP at age 16']
        },
        {
            id: 'nhs-help-health-costs',
            name: 'NHS Help With Health Costs',
            category: 'Health & Disability Support',
            description: 'Support with prescription charges, dental care, eye tests, and travel costs for NHS care.',
            eligibility: 'Low income (claiming UC, JSA, ESA, Tax Credits, Pension Credit, Housing Benefit, CTC), certain conditions, pregnant women, children',
            maxPayment: 'Varies (prescription exemption, dental help, optical support)',
            budget: '£3.2 billion (2024-25)',
            beneficiaries: '9.2 million',
            howToApply: 'Apply at www.gov.uk/help-nhs-costs or HC1 form',
            relatedLaws: 'Health and Social Care Act 2008',
            keyPoints: ['Prescription cost cap: £11.90 per item or unlimited for £171.40/year', 'Free prescriptions if over 60, under 16, pregnant, specific conditions']
        },
        // WORK & EMPLOYMENT
        {
            id: 'apprenticeships',
            name: 'Apprenticeships',
            category: 'Work & Employment',
            description: 'Paid work-based training combining on-the-job training with classroom learning.',
            eligibility: 'Aged 16+ (no upper age limit), resident in England, agree to take part, employer willing',
            maxPayment: 'Apprentice Minimum Wage (£6.40/hour from April 2024)',
            budget: '£3.5 billion (2024-25)',
            beneficiaries: '445,000 starts p.a.',
            howToApply: 'Search www.findapprenticeship.service.gov.uk or direct with employers',
            relatedLaws: 'Apprenticeships, Skills, Children & Learning Act 2009',
            keyPoints: ['1-4 year programmes', 'Employer levy funds training', 'Range of Level 2 (GCSE equiv) to Level 6 (degree equiv)']
        },
        {
            id: 'supported-internships',
            name: 'Supported Internships',
            category: 'Work & Employment',
            description: 'Paid internships for young people with learning difficulties or disabilities leading to employment.',
            eligibility: 'Aged 16-24, learning difficulty/disability affecting employment prospects, education provider/employer involved',
            maxPayment: 'Minimum wage (paid by employer)',
            budget: '£0.8 billion (2024-25)',
            beneficiaries: '6,500 annually',
            howToApply: 'Contact local Further Education college or supported internship provider',
            relatedLaws: 'Education & Skills Act 2008',
            keyPoints: ['6-12 month programme', 'Specialist job coach support', 'Aimed at sustainable employment outcomes']
        },
        {
            id: 'start-up-loan',
            name: 'Start Up Loans Scheme',
            category: 'Work & Employment',
            description: 'Government-backed loans for new business startups.',
            eligibility: 'Aged 18+, business plan approved, can demonstrate ability to repay, previously unable to secure bank funding',
            maxPayment: 'Up to £25,000 loans',
            budget: '£0.3 billion (2024-25)',
            beneficiaries: '2,500 loans p.a.',
            howToApply: 'Apply at www.startuploans.co.uk',
            relatedLaws: 'Enterprise Act 2016',
            keyPoints: ['No interest for first 12 months', 'Fixed interest after', 'Mentoring support provided']
        }
    ];
}

/**
 * Render Schemes Tab
 */
function renderSchemesTab(schemes) {
    if (!schemes || schemes.length === 0) {
        document.getElementById('schemesContent').innerHTML = '<p>No schemes data available.</p>';
        return;
    }

    // Group schemes by category
    const categories = {};
    schemes.forEach(scheme => {
        if (!categories[scheme.category]) {
            categories[scheme.category] = [];
        }
        categories[scheme.category].push(scheme);
    });

    let html = `
        <!-- Search & Filter -->
        <div style="background: var(--color-background2); padding: 16px; margin-bottom: 20px; border-radius: 8px; sticky; top: 0; z-index: 10;">
            <input 
                type="text" 
                placeholder="🔍 Search schemes by name, eligibility, or category..." 
                id="schemeSearchInput"
                onkeyup="filterSchemes(this.value)"
                style="width: 100%; padding: 12px; border: 2px solid var(--color-border); border-radius: 6px; font-size: 0.95em; font-family: inherit;"
            />
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button onclick="filterByCategory('all')" style="padding: 6px 12px; background: var(--tab-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em;">All Schemes</button>
                ${Object.keys(categories).map(cat => `
                    <button onclick="filterByCategory('${cat}')" style="padding: 6px 12px; background: transparent; color: var(--color-fontPrimary); border: 1px solid var(--color-border); border-radius: 6px; cursor: pointer; font-size: 0.85em; transition: all 0.2s;" onmouseover="this.style.background='var(--color-background2)'" onmouseout="this.style.background='transparent'">
                        ${cat}
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- Info Box -->
        <div style="background: #f0f7ff; padding: 16px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid var(--tab-color);">
            <p style="margin: 0; font-size: 0.9em; color: var(--color-fontSecondary);">
                <strong>About Government Schemes:</strong> The UK government provides financial support through various schemes. The amounts shown are based on 2024-25 budgets and eligibility criteria. Schemes are frequently updated - check gov.uk for the latest information before applying.
            </p>
        </div>
    `;

    // Render schemes by category
    Object.entries(categories).sort().forEach(([catName, schemesInCat]) => {
        const categoryColor = [
            '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981',
            '#f59e0b', '#ef4444', '#14b8a6'
        ][Object.keys(categories).indexOf(catName) % 8];

        html += `
            <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; color: var(--color-fontPrimary); font-size: 1.3em; padding-bottom: 8px; border-bottom: 2px solid ${categoryColor};">
                    ${catName} (${schemesInCat.length})
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px;">
        `;

        schemesInCat.forEach(scheme => {
            html += `
                <div class="scheme-card" data-category="${catName}" style="background: var(--color-cardBackground); border: 2px solid ${categoryColor}50; border-radius: 8px; overflow: hidden; transition: all 0.2s; cursor: pointer;" onclick="toggleSchemeDetails('${scheme.id}')" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                    <!-- Header -->
                    <div style="background: ${categoryColor}15; padding: 16px; border-bottom: 1px solid ${categoryColor}33;">
                        <h3 style="margin: 0 0 8px 0; font-size: 1.1em; color: var(--color-fontPrimary); font-weight: 700;">${scheme.name}</h3>
                        <div style="font-size: 0.8em; color: ${categoryColor}; font-weight: 600; margin-bottom: 8px;">${catName}</div>
                        <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em; line-height: 1.4;">${scheme.description}</p>
                    </div>

                    <!-- Quick Stats -->
                    <div style="padding: 12px 16px; background: var(--color-background2); display: flex; justify-content: space-between; font-size: 0.8em; color: var(--color-fontSecondary); border-bottom: 1px solid var(--color-border);">
                        <div>💷 <strong>${scheme.maxPayment}</strong></div>
                        <div>👥 <strong>${scheme.beneficiaries}</strong></div>
                    </div>

                    <!-- Details (Hidden) -->
                    <div id="details-${scheme.id}" style="display: none; padding: 16px; background: white; border-top: 1px solid var(--color-border);">
                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: 600; color: var(--color-fontPrimary); margin-bottom: 6px;">Who qualifies:</div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em; line-height: 1.4;">${scheme.eligibility}</p>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: 600; color: var(--color-fontPrimary); margin-bottom: 6px;">How to apply:</div>
                            <p style="margin: 0; color: var(--tab-color); font-size: 0.9em; text-decoration: underline; word-break: break-word;">${scheme.howToApply}</p>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: 600; color: var(--color-fontPrimary); margin-bottom: 6px;">Budget allocation:</div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">${scheme.budget}</p>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: 600; color: var(--color-fontPrimary); margin-bottom: 6px;">Related legislation:</div>
                            <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.85em; font-style: italic;">${scheme.relatedLaws}</p>
                        </div>

                        ${scheme.keyPoints ? `
                            <div>
                                <div style="font-weight: 600; color: var(--color-fontPrimary); margin-bottom: 6px;">Key points:</div>
                                <ul style="margin: 0; padding-left: 20px; color: var(--color-fontSecondary); font-size: 0.85em;">
                                    ${scheme.keyPoints.map(point => `<li style="margin-bottom: 4px;">${point}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
        <!-- Footer Info -->
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 0.9em; color: #78350f;">
                <strong>⚠️ Important:</strong> This information is based on 2024-25 data. Government schemes change frequently. Always check the official gov.uk website for the most up-to-date information, eligibility requirements, and application processes before applying.
            </p>
        </div>
    `;

    document.getElementById('schemesContent').innerHTML = html;
}

/**
 * Toggle Scheme Details
 */
function toggleSchemeDetails(schemeId) {
    const details = document.getElementById(`details-${schemeId}`);
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Filter Schemes by Search Term
 */
function filterSchemes(searchTerm) {
    const cards = document.querySelectorAll('.scheme-card');
    const term = searchTerm.toLowerCase();
    let visibleCount = 0;
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const isVisible = text.includes(term);
        card.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
    });
    
    // Show "no results" message if needed
    if (visibleCount === 0) {
        const container = document.getElementById('schemesContent');
        const noResults = container.querySelector('[data-no-results]');
        if (noResults) {
            noResults.style.display = 'block';
        } else {
            const msg = document.createElement('div');
            msg.setAttribute('data-no-results', 'true');
            msg.style.cssText = 'padding: 20px; text-align: center; color: var(--color-fontSecondary);';
            msg.textContent = `No schemes match "${searchTerm}". Try a different search term.`;
            container.appendChild(msg);
        }
    } else {
        const noResults = document.querySelector('[data-no-results]');
        if (noResults) noResults.style.display = 'none';
    }
}

/**
 * Filter Schemes by Category
 */
function filterByCategory(category) {
    const cards = document.querySelectorAll('.scheme-card');
    cards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            card.style.display = card.getAttribute('data-category') === category ? 'block' : 'none';
        }
        // Close any open details
        const details = card.querySelector('[id^="details-"]');
        if (details) {
            details.style.display = 'none';
        }
    });
}

// Expose functions to window for onclick handlers in HTML (module context requires explicit export)
window.switchTab = switchTab;
window.switchLawSubtab = switchLawSubtab;
window.switchBudgetSubtab = switchBudgetSubtab;
window.toggleCollapsible = toggleCollapsible;
window.toggleLeader = toggleLeader;
window.openSuggestModal = openSuggestModal;
window.switchManifesto = switchManifesto;
window.showPolicyComparison = showPolicyComparison;
window.toggleSchemeDetails = toggleSchemeDetails;
window.filterSchemes = filterSchemes;
window.loadBudgetSpendData = loadBudgetSpendData;
window.loadBudgetRevenueData = loadBudgetRevenueData;
window.loadBudgetPersonalData = loadBudgetPersonalData;
window.calculatePersonalTaxes = calculatePersonalTaxes;
window.saveTaxCalculatorToProfile = saveTaxCalculatorToProfile;
window.loadTaxCalculatorFromProfile = loadTaxCalculatorFromProfile;
window.waitForAuthReady = waitForAuthReady;
window.updateAuthUI = updateAuthUI;
window.renderPersonalBudgetTab = renderPersonalBudgetTab;
window.expandSchemeBreakdown = expandSchemeBreakdown;
window.toggleRevenueDetails = toggleRevenueDetails;
window.reportCountryMismatch = reportCountryMismatch;
/**
 * Get manifesto for a specific party by calling standardized manifesto functions
 */
async function getManifestoForParty(partyId) {
    switch(partyId) {
        case 'labour':
            return getLabourManifestoStandardized();
        case 'conservative':
            return getConservativeManifestoStandardized();
        case 'libdems':
            return getLibDemManifestoStandardized();
        case 'green':
            return getGreenManifestoStandardized();
        case 'reform':
            return getReformManifestoStandardized();
        case 'plaid':
            return getPlaidCymruManifestoStandardized();
        default:
            return getLabourManifestoStandardized();
    }
}

/**
 * Get user's policy votes from localStorage
 */
function getUserVotes() {
    const stored = localStorage.getItem('cb_user_votes');
    return stored ? JSON.parse(stored) : {};
}

/**
 * Save a user vote and update personal manifesto
 */
async function saveUserVote(policyArea, partyId) {
    const votes = getUserVotes();
    votes[policyArea] = partyId;
    localStorage.setItem('cb_user_votes', JSON.stringify(votes));
    
    // Update personal manifesto
    await generatePersonalManifestoFromVotes(votes);
    
    // Re-render priorities tab to show updated selection
    await renderPrioritiesTab();
    
    console.log('[Governance] Vote saved:', policyArea, '→', partyId);
}

/**
 * Generate personal manifesto from user's votes
 */
async function generatePersonalManifestoFromVotes(votes) {
    if (!votes || Object.keys(votes).length === 0) {
        console.log('[Governance] No votes yet, cannot generate personal manifesto');
        return;
    }

    // Create personal manifesto by collecting user's selected policies
    const personalManifesto = {
        country: 'UK',
        type: 'personal',
        party: 'Your Personal Manifesto',
        leader: 'You',
        version: '1.0',
        colour: '#6366f1',
        description: 'Your personal policy positions based on your votes',
        keyline: 'Built from your choices across the political spectrum',
        policies: []
    };

    // For each policy area, find the selected party's position
    for (const area of POLICY_AREAS) {
        const selectedPartyId = votes[area.id];
        
        if (selectedPartyId) {
            const manifesto = await getManifestoForParty(selectedPartyId);
            const policy = manifesto.policies.find(p => p.area === area.id);
            
            if (policy) {
                personalManifesto.policies.push({
                    area: policy.area,
                    title: policy.title,
                    icon: policy.icon,
                    position: policy.position,
                    keyCommitments: policy.keyCommitments || [],
                    selectedParty: selectedPartyId
                });
            }
        } else {
            // No vote yet for this area
            personalManifesto.policies.push({
                area: area.id,
                title: area.title,
                icon: area.icon,
                position: 'No vote cast yet. Select a party position above to add this to your manifesto.',
                keyCommitments: [],
                hasNoVote: true
            });
        }
    }

    // Store personal manifesto in localStorage and Firestore (when user is signed in)
    localStorage.setItem('cb_personal_manifesto', JSON.stringify(personalManifesto));
    console.log('[Governance] Personal manifesto generated from votes');
    
    return personalManifesto;
}

/**
 * Load personal manifesto (used when switching to Manifesto tab with 'Personal' selected)
 */
function getPersonalManifestoStandardized() {
    const stored = localStorage.getItem('cb_personal_manifesto');
    if (stored) {
        return JSON.parse(stored);
    }
    
    // Return empty skeleton if no votes yet
    return {
        country: 'UK',
        type: 'personal',
        party: 'Your Personal Manifesto',
        leader: 'You',
        version: '1.0',
        colour: '#6366f1',
        description: 'Your personal policy positions',
        keyline: 'Vote on policies in the Priorities tab to build this',
        policies: POLICY_AREAS.map(area => ({
            area: area.id,
            title: area.title,
            icon: area.icon,
            position: 'No policy selected yet. Visit the Priorities tab to choose your positions.',
            keyCommitments: [],
            hasNoVote: true
        }))
    };
}

window.switchTab = switchTab;
window.switchLawSubtab = switchLawSubtab;
window.switchBudgetSubtab = switchBudgetSubtab;
window.toggleCollapsible = toggleCollapsible;
window.toggleLeader = toggleLeader;
window.openSuggestModal = openSuggestModal;
window.switchManifesto = switchManifesto;
window.showPolicyComparison = showPolicyComparison;
window.toggleSchemeDetails = toggleSchemeDetails;
window.filterSchemes = filterSchemes;
window.loadBudgetSpendData = loadBudgetSpendData;
/**
 * Open Personal Political Profile (standalone modal/page)
 */
function openPersonalProfile() {
    const userResponses = loadUserPriorityResponses();
    
    if (Object.keys(userResponses).length === 0) {
        alert('Please answer at least a few priority questions first to see your political profile.');
        return;
    }
    
    // Generate profile data
    const partyAlignment = calculateUserPartyAlignment(userResponses);
    const bestMatches = getUserBestMatchParties(userResponses);
    const personalManifesto = generatePersonalManifestoFromResponses(userResponses);
    
    // Get total questions answered
    const totalAnswered = Object.values(userResponses).reduce((sum, area) => sum + Object.keys(area).length, 0);
    
    // Build modal HTML
    let modalHtml = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
            <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: start; position: sticky; top: 0; z-index: 100;">
                    <div>
                        <h2 style="margin: 0 0 8px 0; font-size: 1.8em;">Your Political Profile</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 0.95em;">Based on ${totalAnswered} priorities you've ranked</p>
                    </div>
                    <button onclick="closePersonalProfile()" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5em; cursor: pointer; padding: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ✕
                    </button>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <!-- Party Alignment Grid -->
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">🏛️ Your Party Alignment</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 40px;">
                        ${bestMatches.map((party, index) => `
                            <div style="background: ${party.color}15; border: 2px solid ${party.color}; border-radius: 8px; padding: 20px; text-align: center;">
                                <div style="font-weight: 700; color: var(--color-fontPrimary); margin-bottom: 8px; font-size: 1.1em;">${party.name}</div>
                                <div style="font-size: 2.5em; font-weight: 700; color: ${party.color}; margin-bottom: 8px;">${party.score}%</div>
                                <div style="font-size: 0.85em; color: var(--color-fontSecondary); margin-bottom: 12px;">Alignment Score</div>
                                <div style="font-size: 0.8em; color: var(--color-fontSecondary); padding-top: 12px; border-top: 1px solid ${party.color}33;">
                                    ${index === 0 ? '✓ Your Best Match' : `Rank #${index + 1}`}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Personal Manifesto -->
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">📜 Your Key Commitments</h3>
                    ${personalManifesto.length > 0 ? `
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 0; overflow: hidden; margin-bottom: 40px;">
                            ${personalManifesto.map(priority => `
                                <div style="padding: 16px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: var(--color-fontPrimary); margin-bottom: 4px;">${priority.question}</div>
                                        <div style="font-size: 0.85em; color: var(--color-fontSecondary); margin-bottom: 6px;">${priority.areaTitle}</div>
                                        <div style="font-size: 0.8em; color: var(--color-fontSecondary);">Supported by: ${priority.supportedBy}</div>
                                    </div>
                                    <div style="background: ${PRIORITY_SCALE[priority.userScore - 1].color}; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.85em; white-space: nowrap; margin-left: 12px;">
                                        ${priority.scoreLabel}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: var(--color-fontSecondary); font-style: italic;">Answer more priority questions with scores of 4 or 5 to see your key commitments.</p>
                    `}
                    
                    <!-- Strongest Disagreements -->
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">⚖️ Your Strongest Disagreements</h3>
                    ${buildStrongestDisagreements(userResponses, bestMatches[0])}
                </div>
            </div>
        </div>
    `;
    
    // Create modal
    const modalDiv = document.createElement('div');
    modalDiv.id = 'personalProfileModal';
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv);
    
    // Close on outside click
    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
            closePersonalProfile();
        }
    });
}

/**
 * Close Personal Profile Modal
 */
function closePersonalProfile() {
    const modal = document.getElementById('personalProfileModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Build strongest disagreements section
 */
function buildStrongestDisagreements(userResponses, topParty) {
    if (!topParty) {
        return '<p style="color: var(--color-fontSecondary);">Answer more questions to see disagreements.</p>';
    }
    
    const disagreements = [];
    
    for (const [areaId, questions] of Object.entries(userResponses)) {
        // Skip areas that don't exist in POLICY_PRIORITIES (like old 'controversies')
        const area = POLICY_PRIORITIES[areaId];
        if (!area) continue;
        
        for (const [questionId, responseValue] of Object.entries(questions)) {
            const response = PRIORITY_SCALE.find(s => s.value === responseValue);
            if (!response) continue;
            
            const userScore = response.score;
            const partyScores = getPartyScoresForPriority(areaId, questionId);
            const partyScore = partyScores[topParty.partyId] || 3;
            const difference = Math.abs(userScore - partyScore);
            
            if (difference >= 2) {  // Only show major disagreements
                const question = area.questions.find(q => q.id === questionId);
                
                if (question) {
                    disagreements.push({
                        question: question.question,
                        areaTitle: area.title,
                        userScore: userScore,
                        partyScore: partyScore,
                        difference: difference
                    });
                }
            }
        }
    }
    
    if (disagreements.length === 0) {
        return '<p style="color: var(--color-fontSecondary);">Great alignment! Few major disagreements with your top party.</p>';
    }
    
    return `
        <div style="background: #fee2e2; border-radius: 8px; padding: 0; overflow: hidden;">
            ${disagreements.sort((a, b) => b.difference - a.difference).slice(0, 5).map(d => `
                <div style="padding: 16px; border-bottom: 1px solid #fecaca; display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${d.question}</div>
                        <div style="font-size: 0.85em; color: #7f1d1d;">${d.areaTitle}</div>
                    </div>
                    <div style="text-align: right; margin-left: 12px;">
                        <div style="font-size: 0.8em; color: #7f1d1d; margin-bottom: 4px;">You: ${d.userScore} vs Party: ${d.partyScore}</div>
                        <div style="font-size: 0.75em; color: #991b1b; font-weight: 600;">Difference: ${Math.abs(d.userScore - d.partyScore)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Download Personal Manifesto as JSON or text
 */
function downloadPersonalManifesto() {
    const userResponses = loadUserPriorityResponses();
    const personalManifesto = generatePersonalManifestoFromResponses(userResponses);
    const partyAlignment = calculateUserPartyAlignment(userResponses);
    
    // Build text manifesto
    let manifestoText = `PERSONAL POLITICAL MANIFESTO\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    manifestoText += `PARTY ALIGNMENT SCORES:\n`;
    
    Object.entries(partyAlignment).forEach(([party, score]) => {
        manifestoText += `  ${party.charAt(0).toUpperCase() + party.slice(1)}: ${score}%\n`;
    });
    
    manifestoText += `\nKEY COMMITMENTS (${personalManifesto.length}):\n\n`;
    
    personalManifesto.forEach(priority => {
        manifestoText += `${priority.question}\n`;
        manifestoText += `  Area: ${priority.areaTitle}\n`;
        manifestoText += `  Position: ${priority.scoreLabel}\n`;
        manifestoText += `  Supported by: ${priority.supportedBy}\n\n`;
    });
    
    // Create download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(manifestoText));
    element.setAttribute('download', `personal-manifesto-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    console.log('[Governance] Personal manifesto downloaded');
}

/**
 * Open Priority Scoring Transparency Modal
 * Shows all priorities, party scores, and sources/assumptions used
 */
function openPriorityScoresModal() {
    // Remove existing modal if any
    const existing = document.getElementById('priorityScoresModal');
    if (existing) existing.remove();
    
    const partyColors = {
        labour: '#E4003B',
        conservative: '#0087DC',
        libdems: '#FAA61A',
        green: '#6AB023',
        reform: '#0087DC',
        plaid: '#005B54'
    };
    
    const partyNames = {
        labour: 'Labour',
        conservative: 'Conservative',
        libdems: 'Lib Dems',
        green: 'Green',
        reform: 'Reform',
        plaid: 'Plaid'
    };
    
    let html = `
        <div id="priorityScoresModal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        " onclick="if(event.target.id==='priorityScoresModal') closePriorityScoresModal()">
            <div style="
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                max-width: 1200px;
                width: 100%;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="margin: 0 0 8px 0; color: var(--color-fontPrimary);">
                            Priority Scoring Transparency
                        </h2>
                        <p style="margin: 0; color: var(--color-fontSecondary); font-size: 0.9em;">
                            Party scores and sources for all ${Object.values(POLICY_PRIORITIES).reduce((sum, area) => sum + area.questions.length, 0)} priorities
                        </p>
                    </div>
                    <button onclick="closePriorityScoresModal()" style="
                        background: transparent;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: var(--color-fontSecondary);
                    ">✕</button>
                </div>
                
                <!-- Content -->
                <div style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                ">
                    <div style="display: grid; gap: 20px;">
    `;
    
    // Generate a row for each priority
    for (const [areaId, areaData] of Object.entries(POLICY_PRIORITIES)) {
        for (const question of areaData.questions) {
            const scores = PARTY_PRIORITY_SCORES[`${areaId}.${question.id}`];
            
            if (!scores) continue;
            
            html += `
                <div style="
                    border: 1px solid var(--color-border);
                    border-left: 4px solid ${areaData.color};
                    border-radius: 8px;
                    padding: 16px;
                    background: var(--color-cardBackground);
                ">
                    <!-- Question Header -->
                    <div style="margin-bottom: 12px;">
                        <div style="
                            font-weight: 600;
                            color: var(--color-fontPrimary);
                            margin-bottom: 4px;
                        ">
                            ${question.question}
                        </div>
                        <div style="
                            font-size: 0.85em;
                            color: var(--color-fontSecondary);
                        ">
                            ${areaData.title}
                        </div>
                    </div>
                    
                    <!-- Party Scores Grid -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 12px;
                    ">
            `;
            
            // Show score for each party
            for (const party of ['labour', 'conservative', 'libdems', 'green', 'reform', 'plaid']) {
                const score = scores[party];
                const scoreLabels = {
                    1: 'Strong Oppose',
                    2: 'Oppose',
                    3: 'Neutral',
                    4: 'Support',
                    5: 'Strong Support'
                };
                const scoreBg = score === 5 ? '#dcfce7' : score === 4 ? '#dbeafe' : score === 3 ? '#f3f4f6' : score === 2 ? '#fee2e2' : '#fecaca';
                const sourceUrl = PARTY_PRIORITY_SOURCE_URLS[`${areaId}.${question.id}`]?.[party] || '';
                const sourceDate = PARTY_PRIORITY_SOURCE_DATES[`${areaId}.${question.id}`]?.[party] || 'N/A';
                
                html += `
                    <div style="
                        background: ${scoreBg};
                        border-radius: 6px;
                        padding: 12px;
                        text-align: center;
                        border: 1px solid var(--color-border);
                    ">
                        <div style="
                            font-weight: 600;
                            color: ${partyColors[party]};
                            margin-bottom: 4px;
                        ">
                            ${partyNames[party]}
                        </div>
                        <div style="
                            font-size: 1.3em;
                            font-weight: 700;
                            color: var(--color-fontPrimary);
                            margin-bottom: 4px;
                        ">
                            ${score}
                        </div>
                        <div style="
                            font-size: 0.75em;
                            color: var(--color-fontSecondary);
                        ">
                            ${scoreLabels[score]}
                        </div>
                        ${sourceUrl ? `
                            <a href="${sourceUrl}" target="_blank" style="display: block; margin-top: 6px; color: var(--tab-color); text-decoration: none; font-weight: 600; font-size: 0.7em;">
                                📖 Source
                            </a>
                            <div style="font-size: 0.65em; color: var(--color-fontSecondary); margin-top: 2px; font-style: italic;">
                                ${sourceDate}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            html += `
                    </div>
                    
                    <!-- Source Note -->
                    <div style="
                        margin-top: 12px;
                        padding: 8px 12px;
                        background: var(--color-background2);
                        border-radius: 4px;
                        font-size: 0.85em;
                        color: var(--color-fontSecondary);
                    ">
                        📋 Scores based on party manifestos, parliamentary votes, and public statements
                    </div>
                </div>
            `;
        }
    }
    
    html += `
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-border);
                    background: var(--color-background2);
                    border-radius: 0 0 12px 12px;
                    text-align: center;
                    font-size: 0.85em;
                    color: var(--color-fontSecondary);
                ">
                    ℹ️ These scores represent Cloud Beacon's analysis of each party's positions. Scores may change as party positions evolve.
                    <br>
                    <strong>Methodology:</strong> Scores derived from official party manifestos, parliamentary voting records, public statements by party leaders, and news reporting.
                </div>
            </div>
        </div>
    `;
    
    const modalEl = document.createElement('div');
    modalEl.innerHTML = html;
    document.body.appendChild(modalEl);
}

/**
 * Close Priority Scores Modal
 */
function closePriorityScoresModal() {
    const modal = document.getElementById('priorityScoresModal');
    if (modal) modal.remove();
}

window.openPriorityScoresModal = openPriorityScoresModal;
window.closePriorityScoresModal = closePriorityScoresModal;

window.loadBudgetRevenueData = loadBudgetRevenueData;
window.loadBudgetPersonalData = loadBudgetPersonalData;
window.calculatePersonalTaxes = calculatePersonalTaxes;
window.saveTaxCalculatorToProfile = saveTaxCalculatorToProfile;
window.loadTaxCalculatorFromProfile = loadTaxCalculatorFromProfile;
window.waitForAuthReady = waitForAuthReady;
window.updateAuthUI = updateAuthUI;
window.renderPersonalBudgetTab = renderPersonalBudgetTab;
window.expandSchemeBreakdown = expandSchemeBreakdown;
window.toggleRevenueDetails = toggleRevenueDetails;
window.renderSchemeBreakdown = renderSchemeBreakdown;
window.filterByCategory = filterByCategory;
window.getManifestoForParty = getManifestoForParty;
window.getUserVotes = getUserVotes;
window.saveUserVote = saveUserVote;
window.openPersonalProfile = openPersonalProfile;
window.closePersonalProfile = closePersonalProfile;
window.downloadPersonalManifesto = downloadPersonalManifesto;
