/**
 * votingSystem.js
 * Core voting and aggregation logic for governance workspace
 * 
 * Data Model:
 * - governance/{country}/votes/{voteId} - Individual vote records
 * - governance/{country}/manifesto/{version} - Aggregated manifesto snapshot
 */

import { db } from '../../firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp,
    getDoc,
    doc,
    setDoc,
    deleteDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * VOTE TYPES
 * Different ways users can vote
 */
const VOTE_TYPES = {
    BILL: 'bill',              // Support/Oppose/Abstain
    BUDGET: 'budget',          // Department increase/maintain/decrease
    CONSULTATION: 'consultation', // Position on consultation
    SCHEME: 'scheme',          // Expand/maintain/cut
    TAX: 'tax',                // Numeric slider or support/oppose
    PRIORITY: 'priority'       // Rank the issues
};

/**
 * Cast a vote
 * @param {string} country - Country code (e.g., 'UK')
 * @param {string} voteType - Type of vote (VOTE_TYPES)
 * @param {string} referenceId - ID of what's being voted on
 * @param {string} referenceTitle - Name of what's being voted on
 * @param {string|number} position - Vote position (e.g., 'support', 'oppose', '3.2')
 * @param {string} userId - Cloud firestore user ID
 * @param {string} reasoning - Optional explanation for vote
 * @param {array} tags - Optional manifesto tags ['healthcare', 'taxation', etc]
 */
export async function castVote({
    country = 'UK',
    voteType,
    referenceId,
    referenceTitle,
    position,
    userId,
    reasoning = '',
    tags = []
}) {
    try {
        // Check if user already voted on this reference
        const existingVote = await getUsersVote(country, referenceId, userId);
        
        if (existingVote) {
            const previousPosition = existingVote.position;
            
            if (position === null) {
                // User removing their vote - delete the vote document
                await deleteDoc(doc(db, `governance/${country}/votes`, existingVote.id));
                console.log(`[Voting] Vote removed from: ${referenceTitle}`);
            } else if (previousPosition === position) {
                // User voting same way again - toggle off (remove vote)
                await deleteDoc(doc(db, `governance/${country}/votes`, existingVote.id));
                console.log(`[Voting] Vote toggled off: ${referenceTitle}`);
            } else {
                // User changing their vote - update existing vote document
                await updateDoc(doc(db, `governance/${country}/votes`, existingVote.id), {
                    position,
                    reasoning,
                    tags,
                    timestamp: serverTimestamp()
                });
                console.log(`[Voting] Vote changed: ${referenceTitle} (${previousPosition} → ${position})`);
            }
        } else if (position !== null) {
            // No previous vote, create new vote
            const voteDoc = {
                voteType,
                referenceId,
                referenceTitle,
                position,
                userId,
                reasoning,
                tags,
                weight: 1.0,
                timestamp: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, `governance/${country}/votes`), voteDoc);
            console.log(`[Voting] Vote cast: ${referenceTitle} (${position})`, docRef.id);
            
            await regenerateManifesto(country);
            return docRef.id;
        }

        // Regenerate manifesto with updated votes
        await regenerateManifesto(country);

        return existingVote?.id || 'vote_modified';
    } catch (error) {
        console.error('[Voting] Error casting vote:', error);
        throw error;
    }
}

/**
 * Get all votes of a certain type
 */
export async function getVotesByType(country, voteType) {
    try {
        const votesCollection = collection(db, `governance/${country}/votes`);
        const q = query(votesCollection, where('voteType', '==', voteType));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('[Voting] Error fetching votes:', error);
        return [];
    }
}

/**
 * Get user's previous vote on a reference
 */
export async function getUsersVote(country, referenceId, userId) {
    try {
        const votesCollection = collection(db, `governance/${country}/votes`);
        const q = query(
            votesCollection,
            where('referenceId', '==', referenceId),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return null;
        
        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('[Voting] Error fetching user vote:', error);
        return null;
    }
}

/**
 * MANIFESTO REGENERATION - Core aggregation logic
 * This is called whenever a new vote is cast
 * Aggregates all votes into policy positions
 */
export async function regenerateManifesto(country = 'UK') {
    console.log(`[Manifesto] Regenerating for ${country}...`);

    try {
        // Get all votes
        const votesCollection = collection(db, `governance/${country}/votes`);
        const votesSnapshot = await getDocs(votesCollection);
        const allVotes = votesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (allVotes.length === 0) {
            console.log('[Manifesto] No votes yet');
            return;
        }

        // Aggregate by type
        const manifestoData = {
            version: new Date().toISOString().split('T')[0],
            generatedAt: serverTimestamp(),
            
            // Bills: support/oppose counts
            bills: aggregateBillVotes(allVotes),
            
            // Budget: department allocations
            budget: aggregateBudgetVotes(allVotes),
            
            // Consultations: positions
            consultations: aggregateConsultationVotes(allVotes),
            
            // Schemes: expand/maintain/cut
            schemes: aggregateSchemeVotes(allVotes),
            
            // Taxes: preferred rates
            taxes: aggregateTaxVotes(allVotes),
            
            // Priorities: ranked issues
            priorities: aggregatePriorityVotes(allVotes),
            
            // Overall stats
            stats: {
                totalVoters: new Set(allVotes.map(v => v.userId)).size,
                totalVotes: allVotes.length,
                generatedAt: new Date().toISOString()
            }
        };

        // Save manifesto snapshot
        const manifestoRef = doc(db, `governance/${country}/manifesto`, manifestoData.version);
        await setDoc(manifestoRef, manifestoData);

        console.log(`[Manifesto] Regenerated: ${allVotes.length} votes, ${manifestoData.stats.totalVoters} voters`);

        return manifestoData;
    } catch (error) {
        console.error('[Manifesto] Error regenerating:', error);
        throw error;
    }
}

/**
 * Aggregate bill votes
 * Returns bills with support/oppose percentages
 */
function aggregateBillVotes(allVotes) {
    const billVotes = allVotes.filter(v => v.voteType === VOTE_TYPES.BILL);
    const byBill = {};

    billVotes.forEach(vote => {
        if (!byBill[vote.referenceId]) {
            byBill[vote.referenceId] = {
                title: vote.referenceTitle,
                support: 0,
                oppose: 0,
                abstain: 0,
                total: 0,
                topReasons: {}
            };
        }

        byBill[vote.referenceId][vote.position]++;
        byBill[vote.referenceId].total++;

        // Track reasoning
        if (vote.reasoning) {
            if (!byBill[vote.referenceId].topReasons[vote.reasoning]) {
                byBill[vote.referenceId].topReasons[vote.reasoning] = 0;
            }
            byBill[vote.referenceId].topReasons[vote.reasoning]++;
        }
    });

    // Calculate percentages
    Object.keys(byBill).forEach(billId => {
        const bill = byBill[billId];
        bill.supportPct = Math.round((bill.support / bill.total) * 100);
        bill.opposePct = Math.round((bill.oppose / bill.total) * 100);
        bill.abstainPct = Math.round((bill.abstain / bill.total) * 100);
    });

    return byBill;
}

/**
 * Aggregate budget votes
 * Returns department spending preferences
 */
function aggregateBudgetVotes(allVotes) {
    const budgetVotes = allVotes.filter(v => v.voteType === VOTE_TYPES.BUDGET);
    const byDept = {};

    budgetVotes.forEach(vote => {
        if (!byDept[vote.referenceId]) {
            byDept[vote.referenceId] = {
                name: vote.referenceTitle,
                increase: 0,
                maintain: 0,
                decrease: 0,
                total: 0,
                suggestedAmounts: []
            };
        }

        byDept[vote.referenceId][vote.position]++;
        byDept[vote.referenceId].total++;

        // Track suggested amounts if vote.reasoning contains number
        if (vote.reasoning && !isNaN(vote.reasoning)) {
            byDept[vote.referenceId].suggestedAmounts.push(parseFloat(vote.reasoning));
        }
    });

    // Calculate percentages and averages
    Object.keys(byDept).forEach(deptId => {
        const dept = byDept[deptId];
        dept.increasePct = Math.round((dept.increase / dept.total) * 100);
        dept.maintainPct = Math.round((dept.maintain / dept.total) * 100);
        dept.decreasePct = Math.round((dept.decrease / dept.total) * 100);

        if (dept.suggestedAmounts.length > 0) {
            dept.medianAmount = getMedian(dept.suggestedAmounts);
            dept.meanAmount = getAverage(dept.suggestedAmounts);
        }
    });

    return byDept;
}

/**
 * Aggregate consultation votes
 */
function aggregateConsultationVotes(allVotes) {
    const consultVotes = allVotes.filter(v => v.voteType === VOTE_TYPES.CONSULTATION);
    const byConsult = {};

    consultVotes.forEach(vote => {
        if (!byConsult[vote.referenceId]) {
            byConsult[vote.referenceId] = {
                title: vote.referenceTitle,
                positions: {},
                total: 0
            };
        }

        if (!byConsult[vote.referenceId].positions[vote.position]) {
            byConsult[vote.referenceId].positions[vote.position] = 0;
        }

        byConsult[vote.referenceId].positions[vote.position]++;
        byConsult[vote.referenceId].total++;
    });

    return byConsult;
}

/**
 * Aggregate scheme votes
 */
function aggregateSchemeVotes(allVotes) {
    const schemeVotes = allVotes.filter(v => v.voteType === VOTE_TYPES.SCHEME);
    const byScheme = {};

    schemeVotes.forEach(vote => {
        if (!byScheme[vote.referenceId]) {
            byScheme[vote.referenceId] = {
                name: vote.referenceTitle,
                expand: 0,
                maintain: 0,
                cut: 0,
                total: 0
            };
        }

        byScheme[vote.referenceId][vote.position]++;
        byScheme[vote.referenceId].total++;
    });

    // Calculate percentages
    Object.keys(byScheme).forEach(schemeId => {
        const scheme = byScheme[schemeId];
        scheme.expandPct = Math.round((scheme.expand / scheme.total) * 100);
        scheme.maintainPct = Math.round((scheme.maintain / scheme.total) * 100);
        scheme.cutPct = Math.round((scheme.cut / scheme.total) * 100);
    });

    return byScheme;
}

/**
 * Aggregate tax votes
 */
function aggregateTaxVotes(allVotes) {
    const taxVotes = allVotes.filter(v => v.voteType === VOTE_TYPES.TAX);
    const byTax = {};

    taxVotes.forEach(vote => {
        if (!byTax[vote.referenceId]) {
            byTax[vote.referenceId] = {
                name: vote.referenceTitle,
                values: [],
                positions: {}
            };
        }

        // Could be numeric (rate) or string (support/oppose)
        if (!isNaN(vote.position)) {
            byTax[vote.referenceId].values.push(parseFloat(vote.position));
        } else {
            if (!byTax[vote.referenceId].positions[vote.position]) {
                byTax[vote.referenceId].positions[vote.position] = 0;
            }
            byTax[vote.referenceId].positions[vote.position]++;
        }
    });

    // Calculate statistics
    Object.keys(byTax).forEach(taxId => {
        const tax = byTax[taxId];
        if (tax.values.length > 0) {
            tax.median = getMedian(tax.values);
            tax.mean = getAverage(tax.values);
            tax.min = Math.min(...tax.values);
            tax.max = Math.max(...tax.values);
        }
    });

    return byTax;
}

/**
 * Aggregate priority votes (ranking)
 */
function aggregatePriorityVotes(allVotes) {
    const priorityVotes = allVotes.filter(v => v.voteType === VOTE_TYPES.PRIORITY);
    const byPriority = {};

    priorityVotes.forEach(vote => {
        if (!byPriority[vote.referenceId]) {
            byPriority[vote.referenceId] = {
                title: vote.referenceTitle,
                ranks: [],
                total: 0
            };
        }

        byPriority[vote.referenceId].ranks.push(parseInt(vote.position) || 0);
        byPriority[vote.referenceId].total++;
    });

    // Calculate average ranking
    Object.keys(byPriority).forEach(priorityId => {
        const priority = byPriority[priorityId];
        priority.avgRank = getAverage(priority.ranks);
    });

    // Sort by rank
    const sorted = Object.values(byPriority)
        .sort((a, b) => a.avgRank - b.avgRank)
        .map((p, i) => ({ ...p, finalRank: i + 1 }));

    return sorted;
}

/**
 * UTILITY FUNCTIONS
 */

function getMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getAverage(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export { VOTE_TYPES };
