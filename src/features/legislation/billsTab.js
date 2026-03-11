/**
 * billsTab.js
 * Handles Bills tab functionality - displays votable bills and manages voting UI
 */

import { db } from './firebase.js';
import { 
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { castVote, getUsersVote, VOTE_TYPES } from './votingSystem.js';
import { getAuth } from 'firebase/auth';

let allBills = [];
let currentFilter = 'all';
let billVoteCounts = {};

/**
 * Load bills from Firestore
 */
export async function loadBillsTab() {
    console.log('[BillsTab] Loading bills...');
    
    try {
        const feedCollection = collection(db, 'feed');
        const q = query(
            feedCollection,
            where('isLegislation', '==', true),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        allBills = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`[BillsTab] Loaded ${allBills.length} bills`);
        
        // Render bills
        renderBills('all');
        
    } catch (error) {
        console.error('[BillsTab] Error loading bills:', error);
        document.getElementById('billsList').innerHTML = '<p style="color:#e53935;">Error loading bills. Please try again.</p>';
    }
}

/**
 * Render bills with optional filtering
 */
function renderBills(stage = 'all') {
    const billsList = document.getElementById('billsList');
    
    let billsToRender = allBills;
    if (stage !== 'all') {
        billsToRender = allBills.filter(bill => bill.stage === stage);
    }

    if (billsToRender.length === 0) {
        billsList.innerHTML = '<p style="color:#999;">No bills found for this stage.</p>';
        return;
    }

    billsList.innerHTML = billsToRender.map(bill => createBillCard(bill)).join('');
    
    // Re-attach event listeners
    attachBillEventListeners();
}

/**
 * Create HTML for a bill card
 */
function createBillCard(bill) {
    const votes = billVoteCounts[bill.id] || { support: 0, oppose: 0, abstain: 0 };
    const total = votes.support + votes.oppose + votes.abstain;
    const supportPct = total > 0 ? Math.round((votes.support / total) * 100) : 0;
    const opposePct = total > 0 ? Math.round((votes.oppose / total) * 100) : 0;
    const abstainPct = total > 0 ? Math.round((votes.abstain / total) * 100) : 0;

    const stageLabel = bill.stage ? bill.stage.replace('-', ' ').toUpperCase() : 'ACTIVE';
    const introduced = bill.createdAt 
        ? new Date(bill.createdAt.seconds * 1000).toLocaleDateString('en-GB')
        : 'Unknown date';
    const description = bill.description?.substring(0, 200) + (bill.description?.length > 200 ? '...' : '');

    return `
        <div class="bill-card">
            <div class="bill-header">
                <h3 class="bill-title">${bill.title || 'Untitled Bill'}</h3>
                <div class="bill-status-badge">${stageLabel}</div>
            </div>

            <p class="bill-description">${description || 'No description available.'}</p>

            <div class="bill-meta">
                <div class="bill-meta-item">
                    <span class="bill-meta-label">CATEGORY</span>
                    <span class="bill-meta-value">${bill.categories?.[0] || 'General'}</span>
                </div>
                <div class="bill-meta-item">
                    <span class="bill-meta-label">INTRODUCED</span>
                    <span class="bill-meta-value">${introduced}</span>
                </div>
                <div class="bill-meta-item">
                    <span class="bill-meta-label">BILL ID</span>
                    <span class="bill-meta-value">${bill.billId || 'N/A'}</span>
                </div>
            </div>

            <div class="bill-voting-section">
                <strong style="font-size:0.9em; color:#666;">Cloud Beacon Community Vote</strong>
                
                <div class="vote-tally">
                    <div class="vote-option">
                        <div class="vote-option-label">Support</div>
                        <div class="vote-option-count" style="color:#4CAF50;">${votes.support}</div>
                        <div class="vote-option-pct">${supportPct}%</div>
                    </div>
                    <div class="vote-option">
                        <div class="vote-option-label">Oppose</div>
                        <div class="vote-option-count" style="color:#E53935;">${votes.oppose}</div>
                        <div class="vote-option-pct">${opposePct}%</div>
                    </div>
                    <div class="vote-option">
                        <div class="vote-option-label">Abstain</div>
                        <div class="vote-option-count" style="color:#F57C00;">${votes.abstain}</div>
                        <div class="vote-option-pct">${abstainPct}%</div>
                    </div>
                </div>

                <div class="vote-buttons">
                    <button class="vote-btn support" onclick="castBillVote('${bill.id}', '${bill.title}', 'support', this)">
                        ✅ Support
                    </button>
                    <button class="vote-btn oppose" onclick="castBillVote('${bill.id}', '${bill.title}', 'oppose', this)">
                        ❌ Oppose
                    </button>
                    <button class="vote-btn abstain" onclick="castBillVote('${bill.id}', '${bill.title}', 'abstain', this)">
                        ⊘ Abstain
                    </button>
                </div>

                <div class="bill-reasoning" id="reasoning-${bill.id}">
                    <label for="reasoning-text-${bill.id}">Why are you voting this way? (optional)</label>
                    <textarea id="reasoning-text-${bill.id}" placeholder="Your reasoning helps the community understand the position..."></textarea>
                    <button onclick="submitBillVote('${bill.id}', '${bill.title}')">Submit Vote</button>
                </div>
            </div>

            <div class="bill-actions">
                <a href="${bill.url || 'https://bills.parliament.uk'}" target="_blank" class="bill-link-btn">
                    📖 View on Parliament.uk
                </a>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners to bill cards
 */
function attachBillEventListeners() {
    // Handle vote button clicks to show reasoning field
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Will be handled by castBillVote function
        });
    });
}

/**
 * Cast a bill vote (temporarily show reasoning field)
 */
window.castBillVote = function(billId, billTitle, position, buttonElement) {
    console.log(`[BillsTab] Selected vote: ${billTitle} - ${position}`);
    
    // Show reasoning field
    const reasoningDiv = document.getElementById(`reasoning-${billId}`);
    if (reasoningDiv) {
        reasoningDiv.classList.add('show');
    }

    // Highlight selected button
    const buttons = buttonElement.parentElement.querySelectorAll('.vote-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');

    // Store selected vote for submission
    window.selectedVote = { billId, billTitle, position };
};

/**
 * Submit bill vote with reasoning to Firestore
 */
window.submitBillVote = async function(billId, billTitle) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        alert('Please log in to vote');
        return;
    }

    const reasoningText = document.getElementById(`reasoning-text-${billId}`).value;
    
    try {
        await castVote({
            country: 'UK',
            voteType: VOTE_TYPES.BILL,
            referenceId: billId,
            referenceTitle: billTitle,
            position: window.selectedVote?.position || 'abstain',
            userId: user.uid,
            reasoning: reasoningText,
            tags: ['legislation']
        });

        // Update UI
        alert('✅ Vote recorded! Thank you for participating.');
        
        // Refresh bills
        await loadBillsTab();

    } catch (error) {
        console.error('[BillsTab] Error submitting vote:', error);
        alert('Error recording vote. Please try again.');
    }
};

/**
 * Filter bills by stage
 */
window.filterBillsByStage = function(stage) {
    currentFilter = stage;
    
    // Update button states
    document.querySelectorAll('.bill-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-stage="${stage}"]`).classList.add('active');

    // Render filtered bills
    renderBills(stage);
};

/**
 * Load vote counts for all bills (call after votes are cast)
 */
async function updateVoteCounts() {
    // This will aggregate votes from the voting system
    // For now, we'll initialize with zeros
    allBills.forEach(bill => {
        if (!billVoteCounts[bill.id]) {
            billVoteCounts[bill.id] = { support: 0, oppose: 0, abstain: 0 };
        }
    });
}

export { loadBillsTab, updateVoteCounts };
