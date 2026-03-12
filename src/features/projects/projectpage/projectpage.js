import { getProject, getFeedItem, voteOnProject, voteOnFeedItem } from '../projects.js';
import { findMatchingPetitions } from '../../../services/petitionMatcher.js';
import { watchAuthState } from '../../../core/auth.js';
import { db, auth } from '../../../../firebase.js';
import { logActivity } from '../../../services/ActivityService.js';
import {
    collection, addDoc, getDocs, orderBy, query,
    serverTimestamp, doc, updateDoc, getDoc, setDoc,
    where, deleteDoc, limit
} from '../../../core/firebase-sdk.js';
import { getStorage, ref, uploadBytes, getBytes, listAll } from '../../../core/firebase-sdk.js';
import { handleError, getSafeElement, setElementText, ERROR_TYPES } from '../../../core/error-handler.js';
import { getDisplayName, formatFirebaseDate } from '../../../utils/helpers.js';
import { getCategoryTemplate, hasPermission } from '../../../core/constants.js';

const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');
const itemType  = params.get('type');
let currentItem = null;
let activeTab   = 'overview';
let activeSubTab = {};

// Plan tab data
let planData = {
    activities: [],  // { id, name, parentId (null for top-level), tasks: [], subActivities: [] }
    tasks: []        // { id, name, activityId, startDate, finishDate, duration, status, description }
};
let editingTaskId = null; // set when editing an existing task, null when creating new

// Files tab data
let filesData = [];  // { id, name, path, type, size, url, createdAt, createdBy, parentPath }
let currentFilePath = '';  // Current folder path for navigation

// ── Display ID helpers ────────────────────────────────────────────────────
// Activities are numbered 1,2,3... in the order they were created (by their
// stored activityNumber field). Tasks within an activity are numbered 1,2,3...
// so task 1 of activity 2 → displayId "2.1"

function getActivityDisplayId(activityId) {
    const act = planData.activities.find(a => a.id === activityId);
    return act ? String(act.activityNumber || '?') : '?';
}

function getTaskDisplayId(task) {
    const actDisplay = getActivityDisplayId(task.activityId);
    return `${actDisplay}.${task.taskNumber || '?'}`;
}

// Resolve a display ID like "2.1" back to the internal Firestore task id
function resolveDisplayId(displayId) {
    const parts = displayId.trim().split('.');
    if (parts.length === 1) {
        // Activity-level reference – not used for pred/succ but handle gracefully
        return null;
    }
    const actNum = parseInt(parts[0]);
    const taskNum = parseInt(parts[1]);
    const task = planData.tasks.find(t => t.taskNumber === taskNum &&
        planData.activities.find(a => a.id === t.activityId && a.activityNumber === actNum));
    return task ? task.id : null;
}

// Get the next activity number
function nextActivityNumber() {
    if (!planData.activities.length) return 1;
    return Math.max(...planData.activities.map(a => a.activityNumber || 0)) + 1;
}

// Get the next task number within an activity
function nextTaskNumber(activityId) {
    const actTasks = planData.tasks.filter(t => t.activityId === activityId);
    if (!actTasks.length) return 1;
    return Math.max(...actTasks.map(t => t.taskNumber || 0)) + 1;
}


const SUB_TABS = {
    team: {
        all: [{ id: 'members', label: 'Members' }, { id: 'structure', label: 'Structure' }]
    },
    plan: {
        all:         [{ id: 'overview', label: 'Overview' }, { id: 'tasks', label: 'Tasks' }, { id: 'gantt', label: 'Gantt' }],
        physical:    [{ id: 'overview', label: 'Overview' }, { id: 'tasks', label: 'Tasks' }, { id: 'gantt', label: 'Gantt' }],
        inventive:   [{ id: 'overview', label: 'Overview' }, { id: 'tasks', label: 'Tasks' }, { id: 'gantt', label: 'Gantt' }],
        community:   [{ id: 'overview', label: 'Overview' }, { id: 'tasks', label: 'Tasks' }, { id: 'gantt', label: 'Gantt' }],
        legislative: [{ id: 'overview', label: 'Overview' }, { id: 'tasks', label: 'Tasks' }, { id: 'gantt', label: 'Gantt' }]
    },
    cost: {
        all:         [{ id: 'cost-overview', label: 'Overview' }],
        physical:    [{ id: 'cost-overview', label: 'Overview' }, { id: 'cost-bids', label: 'Bids' }],
        inventive:   [{ id: 'cost-overview', label: 'Overview' }, { id: 'cost-grants', label: 'Grants' }],
        community:   [{ id: 'cost-overview', label: 'Overview' }, { id: 'cost-grants', label: 'Grants' }],
        legislative: [{ id: 'cost-overview', label: 'Overview' }]
    },
    fund: {
        all:       [{ id: 'fund-overview', label: 'Overview' }, { id: 'fund-bid', label: 'Bid' }, { id: 'fund-invest', label: 'Invest' }],
        physical:  [{ id: 'fund-overview', label: 'Overview' }, { id: 'fund-bid', label: 'Bid' }, { id: 'fund-invest', label: 'Invest' }],
        inventive: [{ id: 'fund-overview', label: 'Overview' }, { id: 'fund-bid', label: 'Bid' }, { id: 'fund-invest', label: 'Invest' }],
        community: [{ id: 'fund-overview', label: 'Overview' }, { id: 'fund-bid', label: 'Bid' }, { id: 'fund-invest', label: 'Invest' }],
        legislative:[{ id: 'fund-overview', label: 'Overview' }, { id: 'fund-bid', label: 'Bid' }, { id: 'fund-invest', label: 'Invest' }]
    },
    updates: {
        all: [{ id: 'updates-public', label: 'Public Updates' }, { id: 'updates-internal', label: 'Internal' }]
    }
};

// ---- Load ----
async function loadProject() {
    try {
        if (!projectId) return;
        
        if (itemType === 'legislation') {
            currentItem = await getFeedItem(projectId);
            if (!currentItem) { 
                setElementText('projectTitle', 'Bill not found');
                return; 
            }
            currentItem._category = 'legislative';
        } else {
            currentItem = await getProject(projectId);
            if (!currentItem) { 
                setElementText('projectTitle', 'Project not found');
                return; 
            }
        }
        
        renderOverview();
        loadVoteStats();
        loadTasks();
        loadChat();
        loadUpdates();
        loadTeam();
        await initializePlanTab();
        updateLegislativeTabVisibility();
        updateTentacleActivities();
        // Defer tentacle initialization to next frame to ensure layout is calculated
        requestAnimationFrame(() => initTentacleWidget());
    } catch (err) {
        handleError(err, 'loading project', { 
            notify: true,
            context: { projectId, itemType }
        });
        setElementText('projectTitle', 'Error loading project');
    }
}

function getCategory() {
    if (itemType === 'legislation') return 'legislative';
    return (currentItem?.category || 'all').toLowerCase();
}

// Show/hide legislative-only tabs (Votes, Petition) based on project type
function updateLegislativeTabVisibility() {
    const isLegislative = itemType === 'legislation';
    const votesTab = document.getElementById('votesTab');
    const petitionTab = document.getElementById('petitionTab');
    const votesPanel = document.getElementById('panel-votes');
    const petitionPanel = document.getElementById('panel-petition');
    
    if (votesTab) votesTab.style.display = isLegislative ? 'block' : 'none';
    if (petitionTab) petitionTab.style.display = isLegislative ? 'block' : 'none';
    if (votesPanel) votesPanel.style.display = isLegislative ? 'block' : 'none';
    if (petitionPanel) petitionPanel.style.display = isLegislative ? 'block' : 'none';
}

// ---- Overview ----
function renderOverview() {
    const item = currentItem;
    const cat  = getCategory();
    const catLabels = { legislative: 'Legislative', physical: 'Physical', inventive: 'Inventive', community: 'Community' };

    document.title = item.title + ' — Cloud Beacon';

    const badge = document.getElementById('projectCategoryBadge');
    if (badge) {
        badge.textContent = catLabels[cat] || 'Project';
        badge.className = `category-badge ${cat}`;
    }

    const titleEl = document.getElementById('projectTitle');
    if (titleEl) titleEl.textContent = item.title;
    
    const titleInput = document.getElementById('titleInput');
    if (titleInput) titleInput.value = item.title;

    // Header picture
    const headerPicture = item.headerPictureUrl || '';
    const headerEl = document.getElementById('projectHeaderPicture');
    const headerDisplay = document.getElementById('headerPictureDisplay');
    if (headerPicture && headerEl && headerDisplay) {
        headerEl.style.backgroundImage = `url('${headerPicture}')`;
        headerEl.style.backgroundSize = 'cover';
        headerEl.style.backgroundPosition = 'center';
        headerEl.style.display = 'block';
        headerDisplay.style.display = 'none';
    } else if (headerEl && headerDisplay) {
        headerEl.style.display = 'none';
        headerDisplay.style.display = 'block';
    }

    const status = item.status || 'Active';
    const statusEl = document.getElementById('statusDisplay');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.className = `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    const statusEdit = document.getElementById('statusEdit');
    if (statusEdit) statusEdit.value = status;
    
    const metaStatus = document.getElementById('metaStatus');
    if (metaStatus) metaStatus.textContent = status;

    const desc = item.description || '';
    const projDesc = document.getElementById('projectDescription');
    if (projDesc) {
        projDesc.textContent = desc || 'No description yet.';
        projDesc.className = `description-text${desc ? '' : ' muted'}`;
    }
    
    const descInput = document.getElementById('descriptionInput');
    if (descInput) descInput.value = desc;

    const solution = item.solution || '';
    const projSol = document.getElementById('projectSolution');
    if (projSol) {
        projSol.textContent = solution || 'No solution added yet.';
        projSol.className = `description-text${solution ? '' : ' muted'}`;
    }
    
    const solInput = document.getElementById('solutionInput');
    if (solInput) solInput.value = solution;

    const thresholdInput = document.getElementById('thresholdInput');
    if (thresholdInput) thresholdInput.value = item.voteThreshold || 1;
    
    const thresholdDisplay = document.getElementById('thresholdDisplay');
    if (thresholdDisplay) thresholdDisplay.textContent = item.voteThreshold || 1;

    const date = item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-GB') : '—';
    
    const metaAuthor = document.getElementById('metaAuthor');
    if (metaAuthor) metaAuthor.textContent = item.ownerName || item.authorName || 'UK Parliament';
    
    const metaCreated = document.getElementById('metaCreated');
    if (metaCreated) metaCreated.textContent = date;
    
    const metaCategory = document.getElementById('metaCategory');
    if (metaCategory) metaCategory.textContent = catLabels[cat] || cat;
    
    // Project number — assign one if not yet set
    const projNumEl = document.getElementById('metaProjectNumber');
    if (projNumEl) {
        if (item.projectNumber) {
            projNumEl.textContent = '#' + String(item.projectNumber).padStart(4, '0');
        } else if (itemType !== 'legislation') {
            // Assign a project number based on Firestore doc creation order (client-side approximation)
            const num = item.createdAt ? Math.floor((item.createdAt.seconds % 100000)) : Math.floor(Math.random() * 9999) + 1;
            const basePath2 = 'projects';
            updateDoc(doc(db, basePath2, projectId), { projectNumber: num }).catch(() => {});
            projNumEl.textContent = '#' + String(num).padStart(4, '0');
        } else {
            projNumEl.textContent = item.parliamentBillId ? 'Bill #' + item.parliamentBillId : '—';
        }
    }
}

// ---- Project share ----
function shareProject(triggerEl) {
    if (!currentItem) return;
    const title = currentItem.title || 'Cloud Beacon Project';
    const description = currentItem.description || currentItem.solution || '';
    const url = window.location.href;
    // openShareMenu is defined in app.js and exposed on window
    if (typeof openShareMenu === 'function') {
        openShareMenu(triggerEl, title, url, description);
    } else {
        // Fallback if called from project.html without app.js
        const text = encodeURIComponent(title + (description ? ' — ' + description.substring(0, 200) : ''));
        const encodedUrl = encodeURIComponent(url);
        window.open('https://bsky.app/intent/compose?text=' + text + '%0A' + encodedUrl, '_blank');
    }
}
window.shareProject = shareProject;

// ---- Vote stats ----
async function loadVoteStats() {
    try {
        const basePath = itemType === 'legislation' ? 'feed' : 'projects';
        const snap = await getDocs(collection(db, basePath, projectId, 'votes'));

        let up = 0, down = 0;
        snap.forEach(d => {
            const t = d.data().type;
            if (t === 'up') up++;
            else if (t === 'down') down++;
        });

        const total     = up + down;
        const threshold = currentItem?.voteThreshold || 1;
        const net       = up - down;
        const approvalPct     = total > 0 ? Math.round((up / total) * 100) : 0;
        const participationPct = Math.min(100, Math.round((total / threshold) * 100));

        // Use safe DOM access utilities
        setElementText('projectVotes', net >= 0 ? `+${net}` : `${net}`);
        setElementText('voterCount', `${total} voter${total !== 1 ? 's' : ''}`);
        setElementText('upvoteCount', `${up} support`);
        setElementText('downvoteCount', `${down} oppose`);

        setElementText('participationPct', `${participationPct}%`);
        const pCaptionEl = getSafeElement('participationCaption');
        if (pCaptionEl) pCaptionEl.innerHTML = `${total} of <span id="thresholdDisplay">${threshold}</span> target votes`;
        
        const pBar = getSafeElement('participationBar');
        if (pBar) {
            pBar.style.width      = `${participationPct}%`;
            pBar.style.background = barColor(participationPct);
        }

        setElementText('approvalPct', total > 0 ? `${approvalPct}%` : '—');
        setElementText('approvalCaption', total > 0
            ? `${up} support · ${down} oppose` : 'No votes yet');
        
        // Set approval bar
        const aBar = getSafeElement('approvalBar');
        if (aBar) {
            aBar.style.width      = total > 0 ? `${approvalPct}%` : '0%';
            aBar.style.background = barColor(approvalPct);
        }
    } catch (err) {
        handleError(err, 'loading vote statistics', {
            notify: false, // Silent - this is secondary data
            context: { projectId, itemType }
        });
    }
}

// Search for related Parliament petitions (for legislation type)
window.searchRelatedPetitions = async function() {
    if (itemType !== 'legislation') {
        alert('Only legislation items can be matched to petitions');
        return;
    }
    
    try {
        const title = currentItem?.title || '';
        const description = currentItem?.content || '';
        
        if (!title) {
            alert('Cannot search: legislation title not available');
            return;
        }
        
        console.log('[Project] Searching for related petitions for:', title);
        
        const petitions = await findMatchingPetitions(title, description);
        
        if (petitions && petitions.length > 0) {
            // Display petitions in a new window
            let petitionsHTML = '<h3>Related Parliament Petitions</h3><ul style="max-height:600px;overflow:auto;">';
            petitions.forEach(p => {
                petitionsHTML += `<li><a href="https://petition.parliament.uk/petitions/${p.id}" target="_blank">${p.title}</a> (${p.signatureCount || 0} signatures)</li>`;
            });
            petitionsHTML += '</ul>';
            
            const w = window.open();
            w.document.write(petitionsHTML);
        } else {
            alert('No related petitions found');
        }
    } catch (err) {
        console.error('[Project] Error searching petitions:', err);
        alert('Error searching for petitions: ' + err.message);
    }
};

function barColor(pct) {
    if (pct >= 66) return 'linear-gradient(90deg, #51cf66, #2f9e44)';
    if (pct >= 33) return 'linear-gradient(90deg, #fcc419, #e67700)';
    return 'linear-gradient(90deg, #ff6b6b, #c92a2a)';
}

async function handleProjectVote(voteType) {
    try {
        if (itemType === 'legislation') await voteOnFeedItem(projectId, voteType);
        else await voteOnProject(projectId, null, voteType);
        loadVoteStats();
    } catch (err) {
        handleError(err, `voting on this ${itemType === 'legislation' ? 'bill' : 'project'}`, {
            notify: true,
            context: { projectId, voteType }
        });
    }
}

// ---- Inline edit ----
function startEdit(field) {
    const show = id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    };
    const hide = id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    };
    const showFlex = id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    };

    if (field === 'title') {
        hide('titleField'); showFlex('titleEdit');
        const el = document.getElementById('titleInput');
        if (el) el.focus();
    } else if (field === 'status') {
        hide('statusDisplay'); show('statusEdit');
    } else if (field === 'description') {
        hide('projectDescription'); show('descriptionEdit');
        const el = document.getElementById('descriptionInput');
        if (el) el.focus();
    } else if (field === 'solution') {
        hide('projectSolution'); show('solutionEdit');
        const el = document.getElementById('solutionInput');
        if (el) el.focus();
    } else if (field === 'committedDate') {
        show('committedDateEdit');
        const el = document.getElementById('committedDateInput');
        if (el) {
            el.value = currentItem?.committedCompletionDate || '';
            el.focus();
        }
    } else if (field === 'wbsDesc') {
        hide('wbsDescription'); show('wbsDescEdit');
        const el = document.getElementById('wbsDescInput');
        if (el) {
            el.value = currentItem?.wbsDescription || '';
            el.focus();
        }
    } else if (field === 'team') {
        show('teamEdit');
        const el = document.getElementById('teamSearchInput');
        if (el) el.focus();
    } else if (field === 'headerPicture') {
        show('headerPictureEdit');
        const el = document.getElementById('headerPictureInput');
        if (el) {
            el.value = currentItem?.headerPictureUrl || '';
            el.focus();
        }
    }
}

function cancelEdit(field) {
    const show = id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    };
    const hide = id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    };
    const showFlex = id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    };

    if (field === 'title') {
        showFlex('titleField'); hide('titleEdit');
    } else if (field === 'status') {
        show('statusDisplay'); hide('statusEdit');
    } else if (field === 'description') {
        show('projectDescription'); hide('descriptionEdit');
    } else if (field === 'solution') {
        show('projectSolution'); hide('solutionEdit');
    } else if (field === 'committedDate') {
        hide('committedDateEdit');
    } else if (field === 'wbsDesc') {
        show('wbsDescription'); hide('wbsDescEdit');
    } else if (field === 'team') {
        hide('teamEdit');
        const searchInput = document.getElementById('teamSearchInput');
        if (searchInput) searchInput.value = '';
        const results = document.getElementById('userSearchResults');
        if (results) results.innerHTML = '';
    } else if (field === 'headerPicture') {
        hide('headerPictureEdit');
    }
}

async function saveField(field) {
    try {
        const basePath = itemType === 'legislation' ? 'feed' : 'projects';
        const ref = doc(db, basePath, projectId);

        if (field === 'title') {
            const titleInput = getSafeElement('titleInput');
            const value = titleInput ? titleInput.value.trim() : '';
            if (!value) return;
            await logChange('title', currentItem?.title, value);
            await updateDoc(ref, { title: value });
            setElementText('projectTitle', value);
            cancelEdit('title');

        } else if (field === 'status') {
            const value = document.getElementById('statusEdit').value;
            await logChange('status', currentItem?.status, value);
            await updateDoc(ref, { status: value });
            const el = document.getElementById('statusDisplay');
            if (el) {
                el.textContent = value;
                el.className = `status-badge status-${value.toLowerCase().replace(/\s+/g, '-')}`;
            }
            const metaStatus = document.getElementById('metaStatus');
            if (metaStatus) metaStatus.textContent = value;
            cancelEdit('status');

        } else if (field === 'description') {
            const value = document.getElementById('descriptionInput').value.trim();
            await logChange('description', currentItem?.description, value);
            await updateDoc(ref, { description: value });
            const el = document.getElementById('projectDescription');
            if (el) {
                el.textContent = value || 'No description yet.';
                el.className = `description-text${value ? '' : ' muted'}`;
            }
            cancelEdit('description');

        } else if (field === 'solution') {
            const value = document.getElementById('solutionInput').value.trim();
            await logChange('solution', currentItem?.solution, value);
            await updateDoc(ref, { solution: value });
            const el = document.getElementById('projectSolution');
            if (el) {
                el.textContent = value || 'No solution added yet.';
                el.className = `description-text${value ? '' : ' muted'}`;
            }
            cancelEdit('solution');

        } else if (field === 'committedDate') {
            const value = document.getElementById('committedDateInput').value;
            if (!value) {
                alert('Please select a date');
                return;
            }
            await logChange('committedDate', currentItem?.committedCompletionDate, value);
            await updateDoc(ref, { committedCompletionDate: value });
            currentItem.committedCompletionDate = value;
            const metaCommitted = document.getElementById('metaCommittedDate');
            if (metaCommitted) metaCommitted.textContent = new Date(value).toLocaleDateString('en-GB');
            await updatePlanMetrics();
            cancelEdit('committedDate');
            return;
        } else if (field === 'wbsDesc') {
            const value = document.getElementById('wbsDescInput').value.trim();
            await logChange('wbsDesc', currentItem?.wbsDescription, value);
            await updateDoc(ref, { wbsDescription: value });
            const el = document.getElementById('wbsDescription');
            if (el) {
                el.textContent = value || 'No WBS description yet.';
                el.className = `description-text${value ? '' : ' muted'}`;
            }
            cancelEdit('wbsDesc');
        } else if (field === 'headerPicture') {
            if (!tempImages.headerPicture) {
                alert('Please select an image first');
                return;
            }
            await logChange('headerPictureUrl', currentItem?.headerPictureUrl, 'uploaded image');
            await updateDoc(ref, { headerPictureUrl: tempImages.headerPicture });
            const el = document.getElementById('projectHeaderPicture');
            if (el) {
                el.style.backgroundImage = `url('${tempImages.headerPicture}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.display = 'block';
            }
            const displayEl = document.getElementById('headerPictureDisplay');
            if (displayEl) displayEl.style.display = 'none';
            tempImages.headerPicture = null;
            document.getElementById('headerPictureName').textContent = '';
            cancelEdit('headerPicture');
        }
        currentItem = itemType === 'legislation' ? await getFeedItem(projectId) : await getProject(projectId);
    } catch (err) {
        handleError(err, `saving ${field}`, {
            notify: true,
            context: { projectId, field }
        });
    }
}

async function logChange(field, oldValue, newValue) {
    try {
        if (!auth.currentUser) return;
        const basePath = itemType === 'legislation' ? 'feed' : 'projects';
        
        // Map field names to display names
        const fieldLabels = {
            'title': 'Title',
            'status': 'Status',
            'description': 'Problem Statement',
            'solution': 'Proposed Solution',
            'committedDate': 'Committed Completion Date',
            'wbsDesc': 'WBS Description',
            'headerPictureUrl': 'Header Picture',
            'voteThreshold': 'Vote Threshold'
        };
        
        const fieldLabel = fieldLabels[field] || field;
        
        await addDoc(collection(db, basePath, projectId, 'changes'), {
            field,
            fieldLabel,
            oldValue: oldValue !== undefined ? String(oldValue) : null,
            newValue: newValue !== undefined ? String(newValue) : null,
            changedBy: auth.currentUser.displayName || auth.currentUser.email || 'User',
            changedById: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });
    } catch (err) {
        console.error('Error logging change:', err);
    }
}

async function saveThreshold() {
    const value = parseInt(document.getElementById('thresholdInput').value) || 1;
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    await updateDoc(doc(db, basePath, projectId), { voteThreshold: value });
    currentItem.voteThreshold = value;
    loadVoteStats();
}

// ---- Team modal ----
let selectedUser = null;

function openTeamModal() {
    document.getElementById('teamModal').style.display = 'flex';
    setTimeout(() => document.getElementById('teamSearchInput').focus(), 50);
}

function closeTeamModal(e) {
    if (e && e.target !== document.getElementById('teamModal')) return;
    _resetTeamModal();
}

function _resetTeamModal() {
    document.getElementById('teamModal').style.display = 'none';
    document.getElementById('teamSearchInput').value = '';
    document.getElementById('userSearchResults').innerHTML = '';
    document.getElementById('selectedUserBlock').style.display = 'none';
    document.getElementById('externalBlock').style.display = 'none';
    document.getElementById('externalName').value = '';
    document.getElementById('externalEmail').value = '';
    selectedUser = null;
}

let searchTimeout = null;

async function searchUsers() {
    const raw = document.getElementById('teamSearchInput').value.trim();
    const resultsEl = document.getElementById('userSearchResults');
    document.getElementById('selectedUserBlock').style.display = 'none';
    document.getElementById('externalBlock').style.display = 'none';
    selectedUser = null;

    if (!raw || raw.length < 2) { resultsEl.innerHTML = ''; return; }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const lower = raw.toLowerCase();

        // Get a broader sample and filter client-side for substring matches (fuzzy search)
        try {
            const allUsersSnap = await getDocs(query(collection(db, 'users'), limit(100)));
            const allUsers = allUsersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

            // Filter: username or email contains the search term (case-insensitive)
            const filtered = allUsers.filter(u => {
                const username = (u.username || '').toLowerCase();
                const email = (u.email || '').toLowerCase();
                return username.includes(lower) || email.includes(lower);
            }).slice(0, 12); // limit to 12 results

            const users = filtered;

            if (!users.length) {
                resultsEl.innerHTML = `
                    <div class="search-no-results">
                        No Cloud Beacon users found.
                        <button class="add-external-btn" data-external-input="${raw}">Add external member instead</button>
                    </div>`;
                resultsEl.querySelector('.add-external-btn').addEventListener('click', (e) => {
                    showExternalForm(e.target.dataset.externalInput);
                });
                return;
            }

            resultsEl.innerHTML = users.map(u => `
                <div class="search-result-item" data-uid="${u.uid}" data-username="${u.username || ''}" data-email="${u.email || ''}">
                    <div class="team-avatar small">${(u.username || '?')[0].toUpperCase()}</div>
                    <div>
                        <div class="search-result-name">${u.username}</div>
                        <div class="search-result-email">${u.email || ''}</div>
                    </div>
                </div>
            `).join('') + `
                <div class="search-result-external" data-external-input="${raw}">
                    + Add external member not on Cloud Beacon
                </div>`;
            
            // Attach event listeners
            resultsEl.querySelectorAll('.search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                    selectUser(el.dataset.uid, el.dataset.username, el.dataset.email);
                });
            });
            resultsEl.querySelectorAll('.search-result-external').forEach(el => {
                el.addEventListener('click', () => {
                    showExternalForm(el.dataset.externalInput);
                });
            });
        } catch (err) {
            console.error('Error searching users:', err);
            resultsEl.innerHTML = '<div class="search-no-results">Error searching users</div>';
        }
    }, 300);
}

function selectUser(uid, username, email) {
    selectedUser = { uid, username, email, external: false };
    document.getElementById('userSearchResults').innerHTML = '';
    document.getElementById('teamSearchInput').value = username;
    document.getElementById('selectedUserBlock').style.display = 'block';
    document.getElementById('externalBlock').style.display = 'none';
    document.getElementById('selectedUserDisplay').innerHTML = `
        <div class="team-avatar" style="display:inline-flex;margin-right:10px;width:32px;height:32px;font-size:14px;">${username[0].toUpperCase()}</div>
        <div>
            <strong>${username}</strong>
            ${email ? `<div style="color:#aaa;font-size:12px;">${email}</div>` : ''}
        </div>
    `;
}

function showExternalForm(prefill) {
    document.getElementById('userSearchResults').innerHTML = '';
    document.getElementById('selectedUserBlock').style.display = 'none';
    document.getElementById('externalBlock').style.display = 'block';
    // Prefill name if it looks like a name (not email), email if it looks like one
    if (prefill.includes('@')) {
        document.getElementById('externalEmail').value = prefill;
    } else {
        document.getElementById('externalName').value = prefill;
    }
    selectedUser = { external: true };
}

async function confirmAddTeamMember() {
    // Get role from whichever block is visible
    const isExternal = selectedUser?.external;
    const roleSelect = isExternal
        ? document.querySelector('#externalBlock select')
        : document.querySelector('#selectedUserBlock select');
    const role = roleSelect ? roleSelect.value : 'Member';
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    if (selectedUser?.external) {
        // External member — name + email only, no uid
        const name  = document.getElementById('externalName').value.trim();
        const email = document.getElementById('externalEmail').value.trim();
        if (!name) { document.getElementById('externalName').focus(); return; }

        await addDoc(collection(db, basePath, projectId, 'team'), {
            username: name,
            email: email || '',
            role,
            external: true,
            uid: null,
            addedAt: serverTimestamp()
        });
    } else {
        if (!selectedUser?.uid) return;

        const existing = await getDoc(doc(db, basePath, projectId, 'team', selectedUser.uid));
        if (existing.exists()) {
            document.getElementById('selectedUserDisplay').innerHTML += 
                '<div style="color:#e03131;font-size:12px;margin-top:4px;">Already a team member</div>';
            return;
        }

        await setDoc(doc(db, basePath, projectId, 'team', selectedUser.uid), {
            uid: selectedUser.uid,
            username: selectedUser.username,
            email: selectedUser.email,
            role,
            external: false,
            addedAt: serverTimestamp()
        });

        // Back-reference on their user doc
        await setDoc(doc(db, 'users', selectedUser.uid, 'projects', projectId), {
            projectId,
            title: currentItem?.title || '',
            type: itemType || 'project',
            role,
            addedAt: serverTimestamp()
        });
    }

    _resetTeamModal();
    loadTeam();
}

async function removeTeamMember(uid) {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    await deleteDoc(doc(db, basePath, projectId, 'team', uid));
    await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
    loadTeam();
}

// ---- Join / Follow Project ----
async function openJoinProjectForm() {
    if (!auth.currentUser) {
        alert('You must be logged in to request to join');
        return;
    }
    
    const message = prompt('Include a message with your join request (optional):');
    if (message === null) return; // cancelled
    
    try {
        const basePath = itemType === 'legislation' ? 'feed' : 'projects';
        
        // Get project sponsor/manager to send notification
        const projectDocRef = doc(db, basePath, projectId);
        const projectSnap = await getDoc(projectDocRef);
        const projectData = projectSnap.exists() ? projectSnap.data() : {};
        
        // Get team members to find manager or fall back to sponsor
        const teamSnap = await getDocs(collection(db, basePath, projectId, 'team'));
        let managerOrSponsor = null;
        let notificationRecipient = null;
        
        teamSnap.docs.forEach(d => {
            const member = d.data();
            if (member.role === 'Manager' && !managerOrSponsor) {
                managerOrSponsor = member;
                notificationRecipient = d.id;
            } else if (member.role === 'Sponsor' && !notificationRecipient) {
                managerOrSponsor = member;
                notificationRecipient = d.id;
            }
        });
        
        // Store join request in joinRequests sub-collection
        await addDoc(collection(db, basePath, projectId, 'joinRequests'), {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || auth.currentUser.email || 'Guest',
            userEmail: auth.currentUser.email,
            message: message || '',
            createdAt: serverTimestamp(),
            status: 'pending',
            notifyUserId: notificationRecipient || projectData.ownerId || ''
        });
        
        alert('Join request sent! The project manager will review your request.');
    } catch (err) {
        console.error('Error sending join request:', err);
        alert('Error sending join request: ' + err.message);
    }
}

async function handleFollowProject() {
    if (!auth.currentUser) {
        alert('You must be logged in to follow a project');
        return;
    }
    
    try {
        // Add project to user's followed projects list
        const userProjectsRef = doc(db, 'users', auth.currentUser.uid, 'projects', projectId);
        await setDoc(userProjectsRef, {
            projectId: projectId,
            projectName: currentItem?.title || 'Project',
            type: itemType || 'project',
            followedAt: serverTimestamp(),
            role: 'Follower'  // Not a team member yet, just following
        }, { merge: true });
        
        alert('Now following this project!');
        document.getElementById('followProjectBtn').textContent = 'Following ✓';
        document.getElementById('followProjectBtn').disabled = true;
    } catch (err) {
        console.error('Error following project:', err);
        alert('Error following project: ' + err.message);
    }
}

// ---- Plan tab functions ----
function getIndentSize() {
    // Reduce indentation on mobile devices (< 768px)
    return window.innerWidth < 768 ? 12 : 20;
}

function openAddTaskModal() {
    editingTaskId = null; // reset edit state
    document.getElementById('taskModal').style.display = 'flex';
    document.getElementById('taskModalTitle').textContent = 'New Task';
    const displayEl = document.getElementById('taskModalDisplayId');
    if (displayEl) displayEl.textContent = '';
    // Reset form
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskActivitySelect').value = '';
    document.getElementById('taskStartInput').value = '';
    document.getElementById('taskFinishInput').value = '';
    document.getElementById('taskDurationInput').value = '';
    document.getElementById('taskStatusSelect').value = 'Not Started';
    document.getElementById('taskDescInput').value = '';
    // Reset cost fields
    if (document.getElementById('taskNoCostCheckbox')) document.getElementById('taskNoCostCheckbox').checked = true;
    if (document.getElementById('taskCostAmount')) document.getElementById('taskCostAmount').value = '';
    if (document.getElementById('taskAssignedInput')) document.getElementById('taskAssignedInput').value = '';
    if (document.getElementById('taskSupplierInput')) document.getElementById('taskSupplierInput').value = '';
    if (document.getElementById('taskProcurementNotes')) document.getElementById('taskProcurementNotes').value = '';
    toggleTaskCostFields();
    
    // Populate activity dropdown
    populateActivityDropdown();
    
    // Populate team member dropdown
    populateTeamDropdown();
    
    // Setup auto-calculation listeners
    document.getElementById('taskStartInput').addEventListener('change', autoCalculateDates);
    document.getElementById('taskFinishInput').addEventListener('change', autoCalculateDates);
    document.getElementById('taskDurationInput').addEventListener('change', autoCalculateDates);
    
    // Setup start date listener for auto-status and status listener for auto-date
    document.getElementById('taskStartInput').addEventListener('change', function() {
        const startInput = document.getElementById('taskStartInput');
        const statusSelect = document.getElementById('taskStatusSelect');
        if (startInput.value) {
            const startDate = new Date(startInput.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate < today && statusSelect.value === 'Not Started') {
                statusSelect.value = 'In Progress';
            }
        }
    });
    
    document.getElementById('taskStatusSelect').addEventListener('change', function() {
        if (this.value === 'Not Started') {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            document.getElementById('taskStartInput').value = dateStr;
            
            // Calculate finish date = today + duration
            const durationInput = document.getElementById('taskDurationInput');
            if (durationInput.value) {
                const duration = parseInt(durationInput.value);
                const finishDate = new Date(today);
                finishDate.setDate(finishDate.getDate() + duration - 1);
                document.getElementById('taskFinishInput').value = finishDate.toISOString().split('T')[0];
            }
        }
    });
    
    setTimeout(() => document.getElementById('taskNameInput').focus(), 50);
}

function toggleTaskCostFields() {
    const noCost = !!document.getElementById('taskNoCostCheckbox')?.checked;
    const costKnownBlock = document.getElementById('costKnownBlock');
    const costDetails = document.getElementById('costDetails');
    const procurementBlock = document.getElementById('procurementBlock');
    if (!costKnownBlock) return;
    if (noCost) {
        costKnownBlock.style.display = 'none';
        if (costDetails) costDetails.style.display = 'none';
        if (procurementBlock) procurementBlock.style.display = 'none';
        return;
    }
    costKnownBlock.style.display = 'block';
    const known = document.querySelector('input[name="taskCostKnown"]:checked')?.value === 'yes';
    if (known) {
        if (costDetails) costDetails.style.display = 'block';
        if (procurementBlock) procurementBlock.style.display = 'none';
    } else {
        if (costDetails) costDetails.style.display = 'none';
        if (procurementBlock) procurementBlock.style.display = 'block';
    }
}

function populateActivityDropdown() {
    const select = document.getElementById('taskActivitySelect');
    if (!select) return;
    select.innerHTML = '<option value="">Select an activity...</option>';
    
    const addActivitiesRecursive = (activities, depth = 0) => {
        activities.forEach(activity => {
            const option = document.createElement('option');
            option.value = activity.id;
            option.textContent = '  '.repeat(depth) + `[${activity.activityNumber || '?'}] ${activity.name}`;
            select.appendChild(option);

            if (activity.subActivities && activity.subActivities.length > 0) {
                const subActivities = planData.activities.filter(a => activity.subActivities.includes(a.id));
                addActivitiesRecursive(subActivities, depth + 1);
            }
        });
    };
    
    const topLevelActivities = planData.activities.filter(a => !a.parentId);
    addActivitiesRecursive(topLevelActivities);
}

async function populateTeamDropdown() {
    const select = document.getElementById('taskAssignedInput');
    if (!select) return;
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        const snap = await getDocs(collection(db, basePath, projectId, 'team'));
        const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Fetch enriched data (username, etc)
        const enriched = await Promise.all(members.map(async m => {
            try {
                const userSnap = await getDoc(doc(db, 'users', m.uid || m.id));
                const userData = userSnap.exists() ? userSnap.data() : {};
                return { ...m, ...userData };
            } catch { return m; }
        }));
        
        select.innerHTML = '<option value="">— Not assigned —</option>';
        enriched.forEach(m => {
            const option = document.createElement('option');
            option.value = m.uid || m.id;
            option.textContent = m.username || m.email || 'Unknown';
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading team members:', err);
    }
}

function autoCalculateDates() {
    const startInput = document.getElementById('taskStartInput');
    const finishInput = document.getElementById('taskFinishInput');
    const durationInput = document.getElementById('taskDurationInput');
    
    if (!startInput || !finishInput || !durationInput) return;
    
    const startDate = startInput.value ? new Date(startInput.value) : null;
    const finishDate = finishInput.value ? new Date(finishInput.value) : null;
    const duration = durationInput.value ? parseInt(durationInput.value) : null;
    
    // If start and finish are set, calculate duration
    if (startDate && finishDate) {
        const diffTime = Math.abs(finishDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
        durationInput.value = diffDays;
    }
    // If start and duration are set, calculate finish
    else if (startDate && duration) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        finishInput.value = endDate.toISOString().split('T')[0];
    }
}

function closeTaskModal(e) {
    if (e && e.target !== document.getElementById('taskModal')) return;
    document.getElementById('taskModal').style.display = 'none';
    // Re-enable any disabled inputs (in case modal was opened in view mode)
    const inputs = document.querySelectorAll('#taskModal .modal-input, #taskModal .modal-select, #taskModal .modal-textarea, #taskModal input[type="checkbox"], #taskModal input[type="radio"]');
    inputs.forEach(i => i.disabled = false);
    // Restore save button and cancel label
    const saveBtn = document.querySelector('#taskModal .modal-actions .save-btn');
    const cancelBtn = document.querySelector('#taskModal .modal-actions .cancel-btn');
    if (saveBtn) saveBtn.style.display = '';
    if (cancelBtn) cancelBtn.textContent = 'Cancel';
}

async function confirmAddTask() {
    const taskName = document.getElementById('taskNameInput').value.trim();
    const activityId = document.getElementById('taskActivitySelect').value;
    const start = document.getElementById('taskStartInput').value;
    const finish = document.getElementById('taskFinishInput').value;
    const duration = document.getElementById('taskDurationInput').value;
    let status = document.getElementById('taskStatusSelect').value;
    const description = document.getElementById('taskDescInput').value.trim();

    if (!taskName || !activityId) {
        alert('Please fill in task name and activity');
        return;
    }

    if (start) {
        const startDate = new Date(start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today && status === 'Not Started') status = 'In Progress';
    }

    const predDisplayIds = document.getElementById('taskPredecessorInput')?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const succDisplayIds = document.getElementById('taskSuccessorInput')?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const predecessors = predDisplayIds.map(d => resolveDisplayId(d)).filter(Boolean);
    const successors   = succDisplayIds.map(d => resolveDisplayId(d)).filter(Boolean);

    // ---- Cost / procurement fields ----
    const noCost = !!document.getElementById('taskNoCostCheckbox')?.checked;
    let costKnown = false;
    let costAmount = null;
    let assignedTo = null;
    let supplier = null;
    let procurementNotes = null;
    let tendered = false;

    if (!noCost) {
        const costKnownVal = document.querySelector('input[name="taskCostKnown"]:checked')?.value || 'unknown';
        costKnown = costKnownVal === 'yes';
        if (costKnown) {
            const v = document.getElementById('taskCostAmount')?.value;
            costAmount = v ? parseFloat(v) : null;
            assignedTo = document.getElementById('taskAssignedInput')?.value?.trim() || null;
            supplier = document.getElementById('taskSupplierInput')?.value?.trim() || null;
            tendered = false;
        } else {
            procurementNotes = document.getElementById('taskProcurementNotes')?.value?.trim() || null;
            tendered = true;
        }
    } else {
        // explicit no cost
        costKnown = false;
        costAmount = null;
        tendered = false;
    }

    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    if (editingTaskId) {
        // ── EDIT MODE: update existing task ──────────────────────────────
        const task = planData.tasks.find(t => t.id === editingTaskId);
        if (!task) { editingTaskId = null; return; }

        const updates = {
            name: taskName,
            activityId,
            startDate: start || null,
            finishDate: finish || null,
            duration: duration ? parseInt(duration) : 1,
            status,
            description,
            predecessors,
            successors
        };

        // include cost fields
        updates.noCost = noCost;
        updates.costKnown = costKnown;
        updates.costAmount = costAmount;
        updates.assignedTo = assignedTo || null;
        updates.supplier = supplier || null;
        updates.procurementNotes = procurementNotes || null;
        updates.tendered = tendered;

        try {
            await updateDoc(doc(db, basePath, projectId, 'plan_tasks', editingTaskId), updates);
        } catch (err) {
            handleError(err, 'updating task', {
                notify: true,
                context: { projectId, taskId: editingTaskId }
            });
            return;
        }

        // If activity changed, update both old and new activity task lists
        if (task.activityId !== activityId) {
            const oldActivity = planData.activities.find(a => a.id === task.activityId);
            const newActivity = planData.activities.find(a => a.id === activityId);
            if (oldActivity) {
                oldActivity.tasks = oldActivity.tasks.filter(id => id !== editingTaskId);
                await updateDoc(doc(db, basePath, projectId, 'plan_activities', oldActivity.id), { tasks: oldActivity.tasks });
            }
            if (newActivity && !newActivity.tasks.includes(editingTaskId)) {
                newActivity.tasks.push(editingTaskId);
                await updateDoc(doc(db, basePath, projectId, 'plan_activities', newActivity.id), { tasks: newActivity.tasks });
            }
        }

        // Apply updates in-memory
        Object.assign(task, updates);
        editingTaskId = null;

    } else {
        // ── CREATE MODE: add new task ─────────────────────────────────────
        const activity = planData.activities.find(a => a.id === activityId);
        const taskNumber = nextTaskNumber(activityId);

        let firestoreId;
        try {
            const savedDoc = await addDoc(collection(db, basePath, projectId, 'plan_tasks'), {
                name: taskName,
                activityId,
                taskNumber,
                startDate: start || null,
                finishDate: finish || null,
                duration: duration ? parseInt(duration) : 1,
                status,
                description,
                predecessors,
                successors,
                noCost,
                costKnown,
                costAmount,
                assignedTo: assignedTo || null,
                supplier: supplier || null,
                procurementNotes: procurementNotes || null,
                tendered
            });
            firestoreId = savedDoc.id;
        } catch (err) {
            handleError(err, 'creating task', {
                notify: true,
                context: { projectId, activityId, taskName }
            });
            return;
        }

        const task = {
            id: firestoreId, name: taskName, activityId, taskNumber,
            startDate: start || null, finishDate: finish || null,
            duration: duration ? parseInt(duration) : 1,
            status, description, predecessors, successors
        };

        planData.tasks.push(task);

        if (activity) {
            activity.tasks.push(firestoreId);
            await updateDoc(doc(db, basePath, projectId, 'plan_activities', activity.id), {
                tasks: activity.tasks
            }).catch(err => console.error('❌ Error updating activity:', err));
        }
    }

    await propagateDependencies();
    renderPlanOverview();
    renderPlanTasks();
    renderGanttChart();
    updatePlanMetrics();
    closeTaskModal();
}

function startAddActivity() {
    document.getElementById('addActivityForm').style.display = 'block';
    document.getElementById('newActivityTitle').value = '';
    document.getElementById('parentActivityInput').value = '';
    setTimeout(() => document.getElementById('newActivityTitle').focus(), 50);
}

function cancelAddActivity() {
    document.getElementById('addActivityForm').style.display = 'none';
    document.getElementById('newActivityTitle').value = '';
    document.getElementById('parentActivityInput').value = '';
}

async function confirmAddActivity(parentActivityId = null) {
    const activityName = document.getElementById('newActivityTitle').value.trim();
    if (!activityName) {
        alert('Please enter an activity name');
        return;
    }

    const activityNumber = nextActivityNumber();
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    // Save to Firestore first to get the real doc ID
    let firestoreId;
    try {
        const savedDoc = await addDoc(collection(db, basePath, projectId, 'plan_activities'), {
            name: activityName,
            activityNumber,
            parentId: parentActivityId || null,
            tasks: [],
            subActivities: []
        });
        firestoreId = savedDoc.id;
    } catch (err) {
        handleError(err, 'creating activity', {
            notify: true,
            context: { projectId, activityName }
        });
        return;
    }

    const activity = {
        id: firestoreId,
        name: activityName,
        activityNumber,
        parentId: parentActivityId || null,
        tasks: [],
        subActivities: []
    };

    planData.activities.push(activity);

    // Add to parent activity if specified
    if (parentActivityId) {
        const parent = planData.activities.find(a => a.id === parentActivityId);
        if (parent && !parent.subActivities.includes(firestoreId)) {
            parent.subActivities.push(firestoreId);
            await updateDoc(doc(db, basePath, projectId, 'plan_activities', parentActivityId), {
                subActivities: parent.subActivities
            });
        }
    }

    renderPlanOverview();
    renderPlanTasks();
    renderGanttChart();
    cancelAddActivity();
}

async function startAddSubActivity(parentActivityId) {
    const parent = planData.activities.find(a => a.id === parentActivityId);
    if (!parent) return;

    const input = prompt(`Create sub-activity under "${parent.name}":`);
    if (!input || !input.trim()) return;

    const activityNumber = nextActivityNumber();
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    let firestoreId;
    try {
        const savedDoc = await addDoc(collection(db, basePath, projectId, 'plan_activities'), {
            name: input.trim(),
            activityNumber,
            parentId: parentActivityId,
            tasks: [],
            subActivities: []
        });
        firestoreId = savedDoc.id;
    } catch (err) {
        console.error('Error saving sub-activity:', err);
        return;
    }

    const subActivity = {
        id: firestoreId,
        name: input.trim(),
        activityNumber,
        parentId: parentActivityId,
        tasks: [],
        subActivities: []
    };

    planData.activities.push(subActivity);
    parent.subActivities.push(firestoreId);

    // Update parent in Firestore
    await updateDoc(doc(db, basePath, projectId, 'plan_activities', parentActivityId), {
        subActivities: parent.subActivities
    });

    renderPlanOverview();
    renderPlanTasks();
    renderGanttChart();
}

// ── Dependency propagation ────────────────────────────────────────────────
// Topologically sorts tasks by predecessor chain, then for each task that
// has predecessors, pushes its startDate to max(predecessor finishDates) and
// recalculates finishDate = startDate + duration. Saves any changed dates to
// Firestore and returns true if anything changed.

async function propagateDependencies() {
    if (!planData.tasks.length) return false;

    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    // Build adjacency for topological sort (predecessor → successor edges)
    // We process tasks in an order where predecessors always come before their successors.
    const taskMap = new Map(planData.tasks.map(t => [t.id, t]));

    // Kahn's algorithm topological sort
    const inDegree = new Map(planData.tasks.map(t => [t.id, 0]));
    planData.tasks.forEach(t => {
        (t.predecessors || []).forEach(predId => {
            if (taskMap.has(predId)) inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
        });
    });

    const queue = planData.tasks.filter(t => (inDegree.get(t.id) || 0) === 0).map(t => t.id);
    const sorted = [];
    while (queue.length) {
        const id = queue.shift();
        sorted.push(id);
        // Find all tasks that have this as a predecessor
        planData.tasks.forEach(t => {
            if ((t.predecessors || []).includes(id)) {
                const newDeg = (inDegree.get(t.id) || 1) - 1;
                inDegree.set(t.id, newDeg);
                if (newDeg === 0) queue.push(t.id);
            }
        });
    }

    // Warn if any tasks were excluded (indicates a circular dependency)
    if (sorted.length < planData.tasks.length) {
        const excluded = planData.tasks.filter(t => !sorted.includes(t.id)).map(t => getTaskDisplayId(t));
        console.warn('⚠️ Circular dependency detected — these tasks were skipped:', excluded.join(', '));
    }

    // Process in topological order — push dependent start dates
    const savePromises = [];
    let anyChanged = false;

    sorted.forEach(taskId => {
        const task = taskMap.get(taskId);
        if (!task || !task.predecessors || !task.predecessors.length) return;

        // Find the latest finish date among all predecessors
        let latestPredFinish = null;
        task.predecessors.forEach(predId => {
            const pred = taskMap.get(predId);
            if (pred && pred.finishDate) {
                const d = new Date(pred.finishDate);
                if (!latestPredFinish || d > latestPredFinish) latestPredFinish = d;
            }
        });

        if (!latestPredFinish) return; // predecessor has no finish date yet — skip

        // New start = day after predecessor finishes
        const newStart = new Date(latestPredFinish);
        newStart.setDate(newStart.getDate() + 1);
        const newStartStr = newStart.toISOString().split('T')[0];

        // Only update if the start date is actually being pushed later
        const currentStart = task.startDate ? new Date(task.startDate) : null;
        if (currentStart && currentStart >= newStart) return;

        // Recalculate finish = newStart + (duration - 1)
        const duration = task.duration || 1;
        const newFinish = new Date(newStart);
        newFinish.setDate(newFinish.getDate() + duration - 1);
        const newFinishStr = newFinish.toISOString().split('T')[0];

        // Update in-memory
        task.startDate  = newStartStr;
        task.finishDate = newFinishStr;
        anyChanged = true;

        // Queue Firestore update
        savePromises.push(
            updateDoc(doc(db, basePath, projectId, 'plan_tasks', taskId), {
                startDate:  newStartStr,
                finishDate: newFinishStr
            }).catch(err => console.error('Failed to propagate task', taskId, err))
        );
    });

    if (savePromises.length) await Promise.all(savePromises);
    return anyChanged;
}


function renderPlanOverview() {
    const wbsTree = document.getElementById('wbsTree');
    if (!planData.activities.length) {
        wbsTree.innerHTML = '<p class="placeholder-text" style="margin:20px 0;">No activities yet. Create one to get started.</p>';
        return;
    }
    
    const indentSize = getIndentSize();
    const renderActivityTree = (activities, depth = 0) => {
        return activities.map(activity => {
            const taskList = activity.tasks.map(taskId => {
                const task = planData.tasks.find(t => t.id === taskId);
                if (!task) return '';
                const taskDates = task.startDate ? ` (${task.startDate} - ${task.finishDate || '?'})` : '';
                const taskStatus = task.status || 'Not Started';
                return `
                    <div class="wbs-task-item" style="padding-left: ${20 + depth * indentSize}px;">
                        <span class="task-display-id">${getTaskDisplayId(task)}</span>
                        <span class="wbs-task-name">${task.name}</span>
                        <span class="wbs-task-dates">${taskDates}</span>
                        <span class="wbs-task-status task-status-badge ${taskStatus.toLowerCase().replace(/\s+/g, '-')}">${taskStatus}</span>
                        <button class="plan-delete-btn" onclick="event.stopPropagation(); deleteTask('${task.id}')" title="Delete task">🗑</button>
                    </div>
                `;
            }).join('');
            
            const subActivities = activity.subActivities ? planData.activities.filter(a => activity.subActivities.includes(a.id)) : [];
            const hasSubActivities = subActivities.length > 0;
            const taskCount = activity.tasks.length;
            const isExpanded = document.querySelector(`[data-activity-id="${activity.id}"]`)?.classList.contains('expanded');
            
            return `
                <div class="wbs-activity" style="margin-left: ${depth * indentSize}px;">
                    <div class="wbs-activity-header" onclick="toggleActivity('${activity.id}')">
                        <div class="wbs-activity-toggle">${hasSubActivities || taskCount > 0 ? (isExpanded ? '▼' : '▶') : '•'}</div>
                        <span class="wbs-activity-id">${activity.activityNumber || '?'}</span>
                        <span class="wbs-activity-name">${activity.name}</span>
                        <span class="wbs-task-count">${taskCount + subActivities.length}</span>
                        <button class="wbs-quick-btn" onclick="event.stopPropagation(); openAddTaskModalForActivity('${activity.id}')">+Task</button>
                        <button class="wbs-quick-btn" onclick="event.stopPropagation(); startAddSubActivity('${activity.id}')">+Activity</button>
                        <button class="plan-delete-btn" onclick="event.stopPropagation(); deleteActivity('${activity.id}')" title="Delete activity">🗑</button>
                    </div>
                    <div class="wbs-activity-tasks ${isExpanded ? 'expanded' : ''}" data-activity-id="${activity.id}">
                        ${taskList}
                        ${hasSubActivities ? renderActivityTree(subActivities, depth + 1) : ''}
                    </div>
                </div>
            `;
        }).join('');
    };
    
    const topLevelActivities = planData.activities.filter(a => !a.parentId);
    wbsTree.innerHTML = renderActivityTree(topLevelActivities);
}

function renderPlanTasks() {
    const container = document.getElementById('tasksTableBody');
    const noTasksMsg = document.getElementById('noTasksMessage');
    
    if (!planData.tasks.length) {
        container.innerHTML = '';
        noTasksMsg.style.display = 'block';
        return;
    }
    
    noTasksMsg.style.display = 'none';
    
    const indentSize = window.innerWidth < 768 ? 10 : 16;
    const renderActivityList = (activities, depth = 0) => {
        return activities.map(activity => {
            const activityTasks = planData.tasks.filter(t => t.activityId === activity.id);
            const subActivities = activity.subActivities ? planData.activities.filter(a => activity.subActivities.includes(a.id)) : [];
            const hasContent = activityTasks.length > 0 || subActivities.length > 0;
            const isExpanded = document.querySelector(`[data-task-activity-id="${activity.id}"]`)?.classList.contains('expanded');
            
            return `
                <div class="tasks-list-item tasks-activity-row" style="padding-left: ${depth * indentSize}px;">
                    <div class="tasks-activity-header" onclick="toggleTaskActivity('${activity.id}')">
                        <span class="tasks-toggle">${hasContent ? (isExpanded ? '▼' : '▶') : '•'}</span>
                        <span class="tasks-activity-id">${activity.activityNumber || '?'}</span>
                        <span class="tasks-activity-name">${activity.name}</span>
                        <button class="plan-delete-btn" onclick="event.stopPropagation(); deleteActivity('${activity.id}')" title="Delete activity">🗑</button>
                    </div>
                    <div class="tasks-activity-content ${isExpanded ? 'expanded' : ''}" data-task-activity-id="${activity.id}">
                        ${activityTasks.map(task => {
                            const isTaskExpanded = document.querySelector(`[data-task-id="${task.id}"]`)?.classList.contains('expanded');
                            const statusClass = task.status.toLowerCase().replace(/\s+/g, '-');
                            const taskDisplayId = getTaskDisplayId(task);
                            // Resolve stored internal predecessor/successor IDs to display IDs
                            const predDisplay = (task.predecessors || []).map(pid => {
                                const pt = planData.tasks.find(t => t.id === pid);
                                return pt ? getTaskDisplayId(pt) : pid;
                            }).join(', ');
                            const succDisplay = (task.successors || []).map(sid => {
                                const st = planData.tasks.find(t => t.id === sid);
                                return st ? getTaskDisplayId(st) : sid;
                            }).join(', ');
                            return `
                                <div class="tasks-task-row" style="padding-left: ${(depth + 1) * indentSize}px;">
                                    <div class="tasks-task-header" onclick="toggleTask('${task.id}')">
                                        <span class="tasks-toggle">▶</span>
                                        <span class="task-display-id">${taskDisplayId}</span>
                                        <span class="tasks-task-name">${task.name}</span>
                                        <span class="tasks-task-status task-status-badge ${statusClass}">${task.status}</span>
                                        <button class="plan-delete-btn" onclick="event.stopPropagation(); deleteTask('${task.id}')" title="Delete task">🗑</button>
                                    </div>
                                    <div class="tasks-task-details ${isTaskExpanded ? 'expanded' : ''}" data-task-id="${task.id}">
                                        <div class="task-detail-row">
                                            <span class="detail-label">Task ID:</span>
                                            <span class="detail-value task-id-chip">${taskDisplayId}</span>
                                        </div>
                                        <div class="task-detail-row">
                                            <span class="detail-label">Start:</span>
                                            <span class="detail-value">${task.startDate || '—'}</span>
                                        </div>
                                        <div class="task-detail-row">
                                            <span class="detail-label">Finish:</span>
                                            <span class="detail-value">${task.finishDate || '—'}</span>
                                        </div>
                                        <div class="task-detail-row">
                                            <span class="detail-label">Duration:</span>
                                            <span class="detail-value">${task.duration || '—'} days</span>
                                        </div>
                                        ${predDisplay ? `<div class="task-detail-row"><span class="detail-label">Predecessors:</span><span class="detail-value">${predDisplay}</span></div>` : ''}
                                        ${succDisplay ? `<div class="task-detail-row"><span class="detail-label">Successors:</span><span class="detail-value">${succDisplay}</span></div>` : ''}
                                        ${task.description ? `<div class="task-detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${task.description}</span></div>` : ''}
                                        <div style="display:flex;gap:8px;">
                                            <button class="task-view-btn" onclick="viewTask('${task.id}')">View</button>
                                            <button class="task-edit-btn" onclick="editTask('${task.id}')">✎ Edit</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        ${subActivities.length > 0 ? renderActivityList(subActivities, depth + 1) : ''}
                    </div>
                </div>
            `;
        }).join('');
    };
    
    const topLevelActivities = planData.activities.filter(a => !a.parentId);
    container.innerHTML = renderActivityList(topLevelActivities);
}

function toggleTask(taskId) {
    const el = document.querySelector(`[data-task-id="${taskId}"]`);
    if (el) el.classList.toggle('expanded');
}

function toggleTaskActivity(activityId) {
    const el = document.querySelector(`[data-task-activity-id="${activityId}"]`);
    if (el) el.classList.toggle('expanded');
}

function toggleActivity(activityId) {
    const container = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (container) {
        container.classList.toggle('expanded');
        renderPlanOverview(); // Re-render to update arrow direction
    }
}

async function deleteTask(taskId) {
    if (!confirm('Delete this task? This cannot be undone.')) return;

    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    // Remove from Firestore
    try {
        await deleteDoc(doc(db, basePath, projectId, 'plan_tasks', taskId));
    } catch (err) {
        console.error('❌ Error deleting task:', err);
        alert('Error deleting task: ' + err.message);
        return;
    }

    // Remove from in-memory planData
    planData.tasks = planData.tasks.filter(t => t.id !== taskId);

    // Remove from parent activity's task list
    planData.activities.forEach(activity => {
        if (activity.tasks.includes(taskId)) {
            activity.tasks = activity.tasks.filter(id => id !== taskId);
            updateDoc(doc(db, basePath, projectId, 'plan_activities', activity.id), {
                tasks: activity.tasks
            }).catch(err => console.error('Error updating activity after task delete:', err));
        }
    });

    // Remove as predecessor/successor from other tasks and update Firestore
    const affectedTasks = planData.tasks.filter(t =>
        (t.predecessors || []).includes(taskId) || (t.successors || []).includes(taskId)
    );
    await Promise.all(affectedTasks.map(async t => {
        t.predecessors = (t.predecessors || []).filter(id => id !== taskId);
        t.successors   = (t.successors   || []).filter(id => id !== taskId);
        await updateDoc(doc(db, basePath, projectId, 'plan_tasks', t.id), {
            predecessors: t.predecessors,
            successors:   t.successors
        }).catch(() => {});
    }));

    await propagateDependencies();
    renderPlanOverview();
    renderPlanTasks();
    renderGanttChart();
    updatePlanMetrics();
}

async function deleteActivity(activityId) {
    const activity = planData.activities.find(a => a.id === activityId);
    if (!activity) return;

    const taskCount = planData.tasks.filter(t => t.activityId === activityId).length;
    const subCount  = (activity.subActivities || []).length;
    const warning   = taskCount || subCount
        ? `This activity has ${taskCount} task(s)${subCount ? ` and ${subCount} sub-activit${subCount > 1 ? 'ies' : 'y'}` : ''}. All will be deleted. Continue?`
        : 'Delete this activity?';

    if (!confirm(warning)) return;

    const basePath = itemType === 'legislation' ? 'feed' : 'projects';

    // Recursively collect all activity IDs to delete (including sub-activities)
    function collectActivityIds(aId) {
        const a = planData.activities.find(x => x.id === aId);
        if (!a) return [aId];
        return [aId, ...(a.subActivities || []).flatMap(collectActivityIds)];
    }
    const activityIdsToDelete = collectActivityIds(activityId);

    // Delete all tasks belonging to these activities
    const tasksToDelete = planData.tasks.filter(t => activityIdsToDelete.includes(t.activityId));
    await Promise.all(tasksToDelete.map(t =>
        deleteDoc(doc(db, basePath, projectId, 'plan_tasks', t.id)).catch(() => {})
    ));
    planData.tasks = planData.tasks.filter(t => !activityIdsToDelete.includes(t.activityId));

    // Delete all activity docs
    await Promise.all(activityIdsToDelete.map(aId =>
        deleteDoc(doc(db, basePath, projectId, 'plan_activities', aId)).catch(() => {})
    ));
    planData.activities = planData.activities.filter(a => !activityIdsToDelete.includes(a.id));

    // Remove from parent's subActivities list
    planData.activities.forEach(a => {
        if ((a.subActivities || []).includes(activityId)) {
            a.subActivities = a.subActivities.filter(id => id !== activityId);
            updateDoc(doc(db, basePath, projectId, 'plan_activities', a.id), {
                subActivities: a.subActivities
            }).catch(() => {});
        }
    });

    renderPlanOverview();
    renderPlanTasks();
    renderGanttChart();
    updatePlanMetrics();
}


function openAddTaskModalForActivity(activityId) {
    openAddTaskModal();
    document.getElementById('taskActivitySelect').value = activityId;
}

function editTask(taskId) {
    const task = planData.tasks.find(t => t.id === taskId);
    if (!task) return;

    openAddTaskModal();
    editingTaskId = taskId; // mark as edit mode AFTER openAddTaskModal resets it
    const displayId = getTaskDisplayId(task);
    document.getElementById('taskModalTitle').textContent = `Edit Task ${displayId}`;
    const displayEl = document.getElementById('taskModalDisplayId');
    if (displayEl) displayEl.textContent = displayId;
    document.getElementById('taskNameInput').value = task.name;
    document.getElementById('taskActivitySelect').value = task.activityId;
    document.getElementById('taskStartInput').value = task.startDate || '';
    document.getElementById('taskFinishInput').value = task.finishDate || '';
    document.getElementById('taskDurationInput').value = task.duration || '';
    document.getElementById('taskStatusSelect').value = task.status;
    document.getElementById('taskDescInput').value = task.description || '';
    // Populate pred/succ as display IDs
    const predDisplay = (task.predecessors || []).map(pid => {
        const pt = planData.tasks.find(t => t.id === pid);
        return pt ? getTaskDisplayId(pt) : pid;
    }).join(', ');
    const succDisplay = (task.successors || []).map(sid => {
        const st = planData.tasks.find(t => t.id === sid);
        return st ? getTaskDisplayId(st) : sid;
    }).join(', ');
    const predEl = document.getElementById('taskPredecessorInput');
    const succEl = document.getElementById('taskSuccessorInput');
    if (predEl) predEl.value = predDisplay;
    if (succEl) succEl.value = succDisplay;
    // Populate cost fields
    if (document.getElementById('taskNoCostCheckbox')) document.getElementById('taskNoCostCheckbox').checked = !!task.noCost;
    if (task.noCost) {
        // defaults
        if (document.querySelector('input[name="taskCostKnown"]:checked')) document.querySelector('input[name="taskCostKnown"]:checked').checked = false;
    } else {
        if (task.costKnown) {
            const el = document.querySelector('input[name="taskCostKnown"][value="yes"]'); if (el) el.checked = true;
            if (document.getElementById('taskCostAmount')) document.getElementById('taskCostAmount').value = task.costAmount || '';
            if (document.getElementById('taskAssignedInput')) document.getElementById('taskAssignedInput').value = task.assignedTo || '';
            if (document.getElementById('taskSupplierInput')) document.getElementById('taskSupplierInput').value = task.supplier || '';
        } else {
            const el = document.querySelector('input[name="taskCostKnown"][value="no"]'); if (el) el.checked = true;
            if (document.getElementById('taskProcurementNotes')) document.getElementById('taskProcurementNotes').value = task.procurementNotes || '';
        }
    }
    toggleTaskCostFields();
    // leave activity dropdown as populated by openAddTaskModal so selection persists
}

function viewTask(taskId) {
    const task = planData.tasks.find(t => t.id === taskId);
    if (!task) return;

    openAddTaskModal();
    // Populate fields like editTask but keep form read-only
    document.getElementById('taskModalTitle').textContent = `View Task ${getTaskDisplayId(task)}`;
    const displayEl = document.getElementById('taskModalDisplayId');
    if (displayEl) displayEl.textContent = getTaskDisplayId(task);
    document.getElementById('taskNameInput').value = task.name;
    document.getElementById('taskActivitySelect').value = task.activityId;
    document.getElementById('taskStartInput').value = task.startDate || '';
    document.getElementById('taskFinishInput').value = task.finishDate || '';
    document.getElementById('taskDurationInput').value = task.duration || '';
    document.getElementById('taskStatusSelect').value = task.status;
    document.getElementById('taskDescInput').value = task.description || '';
    const predDisplay = (task.predecessors || []).map(pid => {
        const pt = planData.tasks.find(t => t.id === pid);
        return pt ? getTaskDisplayId(pt) : pid;
    }).join(', ');
    const succDisplay = (task.successors || []).map(sid => {
        const st = planData.tasks.find(t => t.id === sid);
        return st ? getTaskDisplayId(st) : sid;
    }).join(', ');
    if (document.getElementById('taskPredecessorInput')) document.getElementById('taskPredecessorInput').value = predDisplay;
    if (document.getElementById('taskSuccessorInput')) document.getElementById('taskSuccessorInput').value = succDisplay;

    // Cost fields
    if (document.getElementById('taskNoCostCheckbox')) document.getElementById('taskNoCostCheckbox').checked = !!task.noCost;
    if (!task.noCost) {
        if (task.costKnown) {
            const el = document.querySelector('input[name="taskCostKnown"][value="yes"]'); if (el) el.checked = true;
            if (document.getElementById('taskCostAmount')) document.getElementById('taskCostAmount').value = task.costAmount || '';
            if (document.getElementById('taskAssignedInput')) document.getElementById('taskAssignedInput').value = task.assignedTo || '';
            if (document.getElementById('taskSupplierInput')) document.getElementById('taskSupplierInput').value = task.supplier || '';
        } else {
            const el = document.querySelector('input[name="taskCostKnown"][value="no"]'); if (el) el.checked = true;
            if (document.getElementById('taskProcurementNotes')) document.getElementById('taskProcurementNotes').value = task.procurementNotes || '';
        }
    }
    toggleTaskCostFields();

    // Make inputs read-only / disabled
    const inputs = document.querySelectorAll('#taskModal .modal-input, #taskModal .modal-select, #taskModal .modal-textarea, #taskModal input[type="checkbox"], #taskModal input[type="radio"]');
    inputs.forEach(i => i.disabled = true);

    // Hide save button and change cancel to Close
    const saveBtn = document.querySelector('#taskModal .modal-actions .save-btn');
    const cancelBtn = document.querySelector('#taskModal .modal-actions .cancel-btn');
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.textContent = 'Close';
}

async function initializePlanTab() {
    // Load plan data from Firestore
    try {
        const basePath = itemType === 'legislation' ? 'feed' : 'projects';
        
        // Load activities
        const activitiesSnap = await getDocs(collection(db, basePath, projectId, 'plan_activities'));
        planData.activities = activitiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load tasks
        const tasksSnap = await getDocs(collection(db, basePath, projectId, 'plan_tasks'));
        planData.tasks = tasksSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('Loaded activities:', planData.activities);
        console.log('Loaded tasks:', planData.tasks);
        
        // FIX: Rebuild activity.tasks arrays from loaded tasks to ensure counts are accurate
        planData.activities.forEach(activity => {
            activity.tasks = planData.tasks
                .filter(t => t.activityId === activity.id)
                .map(t => t.id);
        });
        
        console.log('✅ Reconciled activity.tasks arrays:', planData.activities);
    } catch (err) {
        // Collection may not exist yet, that's OK
        console.log('Plan data not yet created:', err.message);
    }
    
    await propagateDependencies();
    renderPlanOverview();
    renderPlanTasks();
    renderGanttChart();
    updatePlanMetrics();
}

// Calculate planned finish date (latest finish date of all tasks)
function getPlannedFinishDate() {
    if (!planData.tasks.length) return null;
    const finishDates = planData.tasks
        .filter(t => t.finishDate)
        .map(t => new Date(t.finishDate));
    if (!finishDates.length) return null;
    return new Date(Math.max(...finishDates));
}

// Calculate hazard (committed - planned finish)
function calculateHazard() {
    const plannedFinish = getPlannedFinishDate();
    const committed = currentItem?.committedCompletionDate;
    if (!plannedFinish || !committed) return null;
    
    const committedDate = new Date(committed);
    const diffTime = committedDate - plannedFinish;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Update metrics in overview
async function updatePlanMetrics() {
    const plannedFinish = getPlannedFinishDate();
    const plannedStr = plannedFinish ? plannedFinish.toLocaleDateString('en-GB') : '—';
    const metaPlannedEl = document.getElementById('metaPlannedFinish');
    if (metaPlannedEl) metaPlannedEl.textContent = plannedStr;
    
    const committed = currentItem?.committedCompletionDate;
    const committedStr = committed ? new Date(committed).toLocaleDateString('en-GB') : '—';
    const metaCommittedEl = document.getElementById('metaCommittedDate');
    if (metaCommittedEl) metaCommittedEl.textContent = committedStr;
    
    const hazard = calculateHazard();
    const metaHazardEl = document.getElementById('metaHazard');
    if (metaHazardEl) {
        if (hazard !== null) {
            const hazardStr = hazard >= 0 ? `+${hazard}` : `${hazard}`;
            const hazardColor = hazard >= 0 ? 'green' : 'red';
            metaHazardEl.textContent = hazardStr + ' days';
            metaHazardEl.style.color = hazardColor;
        } else {
            metaHazardEl.textContent = '—';
        }
    }
}

// Calculate earliest allowable start date based on predecessor task finish dates
function calculateEarliestStartDate(taskId) {
    const task = planData.tasks.find(t => t.id === taskId);
    if (!task || !task.predecessors || task.predecessors.length === 0) {
        return null;
    }
    
    let maxFinishDate = null;
    task.predecessors.forEach(predId => {
        const predTask = planData.tasks.find(t => t.id === predId);
        if (predTask && predTask.finishDate) {
            const finishDate = new Date(predTask.finishDate);
            if (!maxFinishDate || finishDate > maxFinishDate) {
                maxFinishDate = finishDate;
            }
        }
    });
    
    return maxFinishDate;
}

function renderGanttChart() {
    const ganttContainer = document.getElementById('ganttChart');
    if (!ganttContainer) return;
    
    if (!planData.tasks.length) {
        ganttContainer.innerHTML = '<p class="placeholder-text">No tasks to display.</p>';
        return;
    }
    
    // Get date range for timeline
    let minDate = new Date();
    let maxDate = new Date();
    
    planData.tasks.forEach(task => {
        if (task.startDate) {
            const start = new Date(task.startDate);
            if (start < minDate) minDate = start;
        }
        if (task.finishDate) {
            const finish = new Date(task.finishDate);
            if (finish > maxDate) maxDate = finish;
        }
    });
    
    // Include committed date if available
    if (currentItem?.committedCompletionDate) {
        const committed = new Date(currentItem.committedCompletionDate);
        if (committed > maxDate) maxDate = committed;
    }
    
    // Ensure minimum span
    if (minDate >= maxDate) {
        maxDate = new Date(minDate);
        maxDate.setDate(maxDate.getDate() + 30);
    }
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    const pixelsPerDay = Math.max(2, 800 / Math.max(1, totalDays));

    // Timeline sizing and ticks
    const timelineWidth = totalDays * pixelsPerDay;
    const tickInterval = Math.max(1, Math.ceil(totalDays / 10));
    const ticks = [];
    for (let d = 0; d <= totalDays; d += tickInterval) {
        const dt = new Date(minDate);
        dt.setDate(dt.getDate() + d);
        ticks.push({ label: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), left: d * pixelsPerDay });
    }
    const today = new Date();
    const todayLeft = Math.ceil((today - minDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay;

    // Build Gantt HTML with axis row
    let dateLabelsHtml = ticks.map(t => `<div style="position:absolute;left:${t.left}px;top:0;color:#666;font-size:11px;white-space:nowrap;">${t.label}</div>`).join('');

    let html = `<div style="overflow-x:auto;border:1px solid #eae8e2;border-radius:6px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
                <tr style="background:#f5f4f0;border-bottom:2px solid #ddd;">
                    <th style="text-align:left;padding:8px;width:200px;position:sticky;left:0;background:#f5f4f0;z-index:10;">Task Name</th>
                    <th style="text-align:left;padding:8px;width:100px;">Start</th>
                    <th style="text-align:left;padding:8px;width:100px;">Finish</th>
                    <th style="text-align:left;padding:8px;" colspan="1">Timeline</th>
                </tr>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th style="padding:0 8px;">
                        <div style="position:relative;height:28px;overflow:hidden;">
                            <div style="position:relative;width:${timelineWidth}px;height:28px;">
                                ${dateLabelsHtml}
                                <div style="position:absolute;left:${Math.max(0, Math.min(todayLeft, timelineWidth))}px;top:0;height:100%;border-left:2px solid rgba(220,38,38,0.95);z-index:20;pointer-events:none;" title="Today"></div>
                            </div>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>`;
    
    // Add task rows
    planData.tasks.forEach((task, idx) => {
        const taskStart = task.startDate ? new Date(task.startDate) : null;
        const taskEnd = task.finishDate ? new Date(task.finishDate) : null;
        
        const startStr = taskStart ? taskStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
        const endStr = taskEnd ? taskEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
        
        let barHtml = '';
        if (taskStart && taskEnd) {
            const barStart = Math.ceil((taskStart - minDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
            const barWidth = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
            
            // Determine bar color based on status
            let barColor = '#3b82f6';
            if (task.status === 'Complete') barColor = '#10b981';
            else if (task.status === 'On Hold') barColor = '#f59e0b';
            else if (task.status === 'In Progress') barColor = '#06b6d4';
            
            barHtml = `<div style="position:relative;height:24px;margin:2px 0;">
                <div class="gantt-bar" data-task-id="${task.id}" style="position:absolute;left:${barStart}px;width:${Math.max(barWidth, 40)}px;height:100%;background:${barColor};border-radius:3px;cursor:pointer;display:flex;align-items:center;padding:0 4px;font-size:10px;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${task.name}">${task.name}</div>
            </div>`;
        }
        
        html += `<tr style="border-bottom:1px solid #eae8e2;">
            <td class="gantt-task-name" data-task-id="${task.id}" style="padding:8px;position:sticky;left:0;background:white;z-index:5;cursor:pointer;color:#2b8a3e;text-decoration:none;font-weight:500;overflow:hidden;text-overflow:ellipsis;">${task.name}</td>
            <td style="padding:8px;font-size:11px;color:#888;">${startStr}</td>
            <td style="padding:8px;font-size:11px;color:#888;">${endStr}</td>
            <td style="padding:0 8px;"><div style="position:relative;width:${timelineWidth}px;height:24px;">${barHtml}</div></td>
        </tr>`;
    });
    
    // Add milestone row for committed date
    if (currentItem?.committedCompletionDate) {
        const committed = new Date(currentItem.committedCompletionDate);
        const committedStr = committed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const milestoneStart = Math.ceil((committed - minDate) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
        
        html += `<tr style="border-bottom:2px solid #ddd;background:#fff9e6;">
            <td style="padding:8px;font-weight:600;position:sticky;left:0;background:#fff9e6;z-index:5;">⚡ Committed Finish</td>
            <td style="padding:8px;font-size:11px;color:#888;">—</td>
            <td style="padding:8px;font-size:11px;color:#888;">${committedStr}</td>
            <td style="padding:0 8px;"><div style="position:relative;width:${timelineWidth}px;height:24px;">
                <div style="position:absolute;left:${milestoneStart}px;width:2px;height:100%;background:#f59e0b;border:1px solid #d97706;"></div>
            </div></td>
        </tr>`;
    }
    
    html += `</tbody></table></div>`;
    ganttContainer.innerHTML = html;
    
    // Add event listeners for clickable elements
    ganttContainer.querySelectorAll('.gantt-bar, .gantt-task-name').forEach(el => {
        el.addEventListener('click', (e) => {
            const taskId = el.dataset.taskId;
            if (taskId) switchToTasksTab(taskId);
        });
    });
}

// Switch to Tasks tab and highlight a specific task
function switchToTasksTab(taskId) {
    switchTab('plan');
    switchSubTab('plan', 'tasks');

    setTimeout(() => {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskElement.style.background = '#ffffcc';
            setTimeout(() => taskElement.style.background = '', 2000);
        }
    }, 150);
}

// ---- Fund tab rendering & donation handling ----
async function renderFundOverview() {
    const container = document.getElementById('fundBreakdown');
    if (!container) return;

    // Sum known costs
    const knownTasks = planData.tasks.filter(t => t.costKnown && t.costAmount);
    const totalKnown = knownTasks.reduce((s, t) => s + (parseFloat(t.costAmount) || 0), 0);

    // Sum received funds
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const fundsSnap = await getDocs(collection(db, basePath, projectId, 'funds'));
    const funds = fundsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const received = funds.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

    document.getElementById('fundTotal').textContent = totalKnown ? `£${totalKnown.toLocaleString()}` : '—';
    document.getElementById('fundReceived').textContent = received ? `£${received.toLocaleString()}` : '—';

    const deficitEl = document.getElementById('fundDeficit');
    const diff = received - totalKnown;
    if (isNaN(diff)) deficitEl.textContent = '—';
    else {
        deficitEl.textContent = (diff >= 0 ? '+' : '') + `£${diff.toLocaleString()}`;
        deficitEl.style.color = diff >= 0 ? 'green' : 'red';
    }

    // Build breakdown table
    const rows = planData.tasks.filter(t => t.costKnown || t.tendered || !t.noCost).map(t => {
        const activityName = (planData.activities.find(a => a.id === t.activityId) || {}).name || '-';
        const cost = t.costKnown && t.costAmount ? `£${Number(t.costAmount).toLocaleString()}` : (t.tendered ? 'Tender' : (t.noCost ? 'No cost' : 'Unknown'));
        const supplier = t.assignedTo || t.supplier || '-';
        return `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${t.name}</td><td style="padding:6px;">${activityName}</td><td style="padding:6px;">${cost}</td><td style="padding:6px;">${supplier}</td><td style="padding:6px;"><button class="fund-view-btn" data-task-id="${t.id}" style="cursor:pointer;padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:3px;font-size:12px;">View</button></td></tr>`;
    });

    container.innerHTML = rows.length ? `<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:6px;">Task</th><th style="text-align:left;padding:6px;">Activity</th><th style="text-align:left;padding:6px;">Cost</th><th style="text-align:left;padding:6px;">Assigned/Supplier</th><th style="padding:6px;"></th></tr></thead><tbody>${rows.join('')}</tbody></table>` : '<p class="placeholder-text">No cost items yet.</p>';
    
    // Add event listeners for view buttons
    setTimeout(() => {
        container.querySelectorAll('.fund-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchToTasksTab(btn.dataset.taskId);
            });
        });
    }, 0);
}

async function renderFundBids() {
    const list = document.getElementById('fundBidList');
    if (!list) return;
    const tenders = planData.tasks.filter(t => t.tendered === true);
    if (!tenders.length) { list.innerHTML = '<p class="placeholder-text">No open tenders.</p>'; return; }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    list.innerHTML = tenders.map(task => {
        const expanded = document.querySelector(`[data-bid-task-id="${task.id}"]`)?.classList.contains('expanded') ? 'expanded' : '';
        return `
            <div class="bid-task-row" data-bid-task-id="${task.id}" style="border:1px solid #eae8e2;border-radius:6px;margin-bottom:8px;overflow:hidden;">
                <div class="bid-task-header" onclick="toggleBidTask('${task.id}')" style="padding:12px;background:#f5f4f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;">
                        <span style="font-size:16px;color:#666;">${expanded ? '▼' : '▶'}</span>
                        <div>
                            <strong>${task.name}</strong>
                            <div style="font-size:12px;color:#888;margin-top:2px;" data-bid-count-for="${task.id}">Loading bid count...</div>
                        </div>
                    </div>
                    <button class="save-btn" onclick="event.stopPropagation(); openBidModal('${task.id}')">+ Bid</button>
                </div>
                <div class="bid-task-content" style="display:${expanded ? 'block' : 'none'};padding:12px;background:#fff;">
                    <div id="bids-for-${task.id}" style="font-size:13px;">Loading bids...</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Fetch bid counts for each tender
    for (const task of tenders) {
        try {
            const bidsSnap = await getDocs(collection(db, basePath, projectId, 'tasks', task.id, 'bids'));
            const bidCount = bidsSnap.size;
            const countEl = document.querySelector(`[data-bid-count-for="${task.id}"]`);
            if (countEl) {
                countEl.textContent = bidCount > 0 
                    ? `${bidCount} bid${bidCount !== 1 ? 's' : ''} received`
                    : (task.procurementNotes || 'No details');
            }
        } catch (err) {
            console.error('Error loading bid count:', err);
        }
    }
    
    // Fetch and render bids for any expanded tasks
    for (const task of tenders) {
        const isExpanded = document.querySelector(`[data-bid-task-id="${task.id}"]`)?.classList.contains('expanded');
        if (isExpanded) {
            await renderBidsForTask(task.id);
        }
    }
}

async function toggleBidTask(taskId) {
    const container = document.querySelector(`[data-bid-task-id="${taskId}"]`);
    if (!container) return;
    container.classList.toggle('expanded');
    if (container.classList.contains('expanded')) {
        await renderBidsForTask(taskId);
    } else {
        container.querySelector('.bid-task-content').style.display = 'none';
    }
}

async function renderBidsForTask(taskId) {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const container = document.querySelector(`[data-bid-task-id="${taskId}"] .bid-task-content`);
    if (!container) return;
    
    try {
        // Fetch all bids for this task
        const bidsSnap = await getDocs(collection(db, basePath, projectId, 'tasks', taskId, 'bids'));
        const bids = await Promise.all(bidsSnap.docs.map(async d => {
            const bid = d.data();
            const votes = await getDocs(collection(db, basePath, projectId, 'tasks', taskId, 'bids', d.id, 'votes'));
            const voteCounts = { up: 0, down: 0 };
            votes.forEach(v => {
                const voteType = v.data().type;
                if (voteType === 'up') voteCounts.up++;
                else if (voteType === 'down') voteCounts.down++;
            });
            return { id: d.id, ...bid, voteCounts };
        }));
        
        // Sort by favorability (total votes * approval %)
        bids.sort((a, b) => {
            const aFav = calculateBidFavorability(a.voteCounts);
            const bFav = calculateBidFavorability(b.voteCounts);
            return bFav - aFav;
        });
        
        if (!bids.length) {
            container.innerHTML = '<p style="color:#999;font-size:12px;">No bids yet.</p>';
            return;
        }
        
        container.innerHTML = bids.map(bid => {
            const total = bid.voteCounts.up + bid.voteCounts.down;
            const approvalPct = total > 0 ? Math.round((bid.voteCounts.up / total) * 100) : 0;
            const linkDisplay = bid.bidderLink ? `<a href="${bid.bidderLink}" target="_blank" style="color:#3b82f6;text-decoration:none;font-size:11px;">website ↗</a>` : '';
            return `
                <div style="padding:10px;border-bottom:1px solid #f0ede6;display:flex;justify-content:space-between;align-items:center;">
                    <div style="flex:1;">
                        <div><strong>${bid.bidderName}</strong>${bid.bidderCompany ? ` · ${bid.bidderCompany}` : ''}</div>
                        <div style="font-size:11px;color:#888;margin-top:2px;">£${bid.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${linkDisplay}</div>
                        ${bid.notes ? `<div style="font-size:11px;color:#999;margin-top:4px;font-style:italic;">"${bid.notes}"</div>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-left:12px;">
                        <div style="text-align:center;font-size:12px;">
                            <div style="color:#999;">${approvalPct}%</div>
                            <div style="font-size:10px;color:#bbb;">${total} votes</div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px;">
                            <button class="bid-vote-btn" data-task-id="${taskId}" data-bid-id="${bid.id}" data-vote-type="up" style="padding:4px 6px;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;border-radius:3px;cursor:pointer;font-size:12px;font-weight:600;">▲</button>
                            <button class="bid-vote-btn" data-task-id="${taskId}" data-bid-id="${bid.id}" data-vote-type="down" style="padding:4px 6px;background:#ffebee;color:#c62828;border:1px solid #ef5350;border-radius:3px;cursor:pointer;font-size:12px;font-weight:600;">▼</button>
                            <button class="bid-award-btn" data-task-id="${taskId}" data-bid-id="${bid.id}" style="padding:4px 6px;background:#fff3cd;color:#856404;border:1px solid #ffc107;border-radius:3px;cursor:pointer;font-size:12px;font-weight:600;">Award</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners for bid buttons
        container.querySelectorAll('.bid-vote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                handleBidVote(btn.dataset.taskId, btn.dataset.bidId, btn.dataset.voteType);
            });
        });
        container.querySelectorAll('.bid-award-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                awardBid(btn.dataset.taskId, btn.dataset.bidId);
            });
        });
        
        container.parentElement.querySelector('.bid-task-content').style.display = 'block';
    } catch (err) {
        console.error('Error loading bids:', err);
        container.innerHTML = '<p style="color:#c62828;">Error loading bids</p>';
    }
}

function calculateBidFavorability(voteCounts) {
    const total = voteCounts.up + voteCounts.down;
    if (total === 0) return 0;
    const approvalPct = voteCounts.up / total;
    return total * approvalPct;
}

async function handleBidVote(taskId, bidId, voteType) {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const userId = auth.currentUser?.uid || 'anonymous';
    
    try {
        // Check if this user already voted on this bid
        const existingVotes = await getDocs(
            query(
                collection(db, basePath, projectId, 'tasks', taskId, 'bids', bidId, 'votes'),
                where('userId', '==', userId)
            )
        );
        
        if (existingVotes.size > 0) {
            alert('You have already voted on this bid');
            return;
        }
        
        await addDoc(collection(db, basePath, projectId, 'tasks', taskId, 'bids', bidId, 'votes'), {
            type: voteType,
            userId: userId,
            createdAt: serverTimestamp()
        });
        // Re-render bids to reflect new vote
        await renderBidsForTask(taskId);
    } catch (err) {
        console.error('Error voting on bid:', err);
        alert('Error recording vote');
    }
}

async function awardBid(taskId, bidId) {
    const task = planData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!confirm('Award this bid to complete the contract?')) return;
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    try {
        // Fetch the bid details
        const bidSnap = await getDoc(doc(db, basePath, projectId, 'tasks', taskId, 'bids', bidId));
        if (!bidSnap.exists()) {
            alert('Bid not found');
            return;
        }
        
        const bid = bidSnap.data();
        
        // Update task with known cost and bidder info
        await updateDoc(doc(db, basePath, projectId, 'plan_tasks', taskId), {
            costKnown: true,
            costAmount: bid.amount,
            assignedTo: bid.bidderName + (bid.bidderCompany ? ` (${bid.bidderCompany})` : ''),
            supplier: bid.bidderEmail,
            awardedBidId: bidId,
            noCost: false,
            tendered: false
        });
        
        // Update in-memory task
        task.costKnown = true;
        task.costAmount = bid.amount;
        task.assignedTo = bid.bidderName + (bid.bidderCompany ? ` (${bid.bidderCompany})` : '');
        task.supplier = bid.bidderEmail;
        task.awardedBidId = bidId;
        task.noCost = false;
        task.tendered = false;
        
        alert('Bid awarded! Task updated with contract details.');
        renderFundBids();
        renderFundOverview();
    } catch (err) {
        console.error('Error awarding bid:', err);
        alert('Error awarding bid: ' + err.message);
    }
}

async function renderFundInvest() {
    const donationsEl = document.getElementById('donationsList');
    if (!donationsEl) return;
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const snap = await getDocs(collection(db, basePath, projectId, 'funds'));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!rows.length) { donationsEl.innerHTML = '<p class="placeholder-text">No donations yet.</p>'; return; }
    donationsEl.innerHTML = rows.map(r => `<div style="padding:8px;border-bottom:1px solid #eee;font-size:13px;"><strong>£${Number(r.amount).toLocaleString()}</strong> <span style="color:#666;font-size:12px;margin-left:8px;">${r.name || 'Anonymous'}</span></div>`).join('');
    // update overview funding display too
    renderFundOverview();
}

function openBidModal(taskId) {
    const task = planData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('bidModal').style.display = 'flex';
    document.getElementById('bidTaskName').textContent = `Task ${getTaskDisplayId(task)}`;
    document.getElementById('bidTaskTitle').textContent = task.name;
    document.getElementById('bidTaskProcurement').textContent = task.procurementNotes || 'No procurement details';
    document.getElementById('bidAmount').value = '';
    document.getElementById('bidderName').value = '';
    document.getElementById('bidderCompany').value = '';
    document.getElementById('bidderEmail').value = '';
    document.getElementById('bidderLink').value = '';
    document.getElementById('bidNotes').value = '';
    
    // Store task ID for use in confirmPlaceBid
    document.getElementById('bidModal').dataset.taskId = taskId;
    
    setTimeout(() => document.getElementById('bidAmount').focus(), 50);
}

function closeBidModal(e) {
    if (e && e.target !== document.getElementById('bidModal')) return;
    document.getElementById('bidModal').style.display = 'none';
}

async function confirmPlaceBid() {
    const taskId = document.getElementById('bidModal').dataset.taskId;
    const amount = parseFloat(document.getElementById('bidAmount')?.value || 0);
    const name = document.getElementById('bidderName')?.value?.trim();
    const company = document.getElementById('bidderCompany')?.value?.trim();
    const email = document.getElementById('bidderEmail')?.value?.trim();
    const link = document.getElementById('bidderLink')?.value?.trim();
    const notes = document.getElementById('bidNotes')?.value?.trim();
    
    if (!amount || amount <= 0) { alert('Enter a bid amount'); return; }
    if (!name) { alert('Enter your name or organisation'); return; }
    if (!email) { alert('Enter your email'); return; }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        const bidRef = await addDoc(collection(db, basePath, projectId, 'plan_tasks', taskId, 'bids'), {
            amount: amount,
            bidderName: name,
            bidderCompany: company || null,
            bidderEmail: email,
            bidderLink: link || null,
            notes: notes || null,
            createdAt: serverTimestamp()
        });
        
        // Log bid activity if user is logged in
        const user = auth.currentUser;
        if (user) {
            try {
                const taskSnap = await getDoc(doc(db, basePath, projectId, 'plan_tasks', taskId));
                const taskData = taskSnap.exists() ? taskSnap.data() : {};
                const projectSnap = await getDoc(doc(db, basePath, projectId));
                const projectData = projectSnap.exists() ? projectSnap.data() : {};
                
                await logActivity({
                    type: 'bid_created',
                    contentId: bidRef.id,
                    contentType: 'bid',
                    metadata: {
                        projectId: projectId,
                        projectTitle: projectData.title || 'Project',
                        projectCategory: projectData.category,
                        taskId: taskId,
                        taskName: taskData.name || 'Task',
                        bidAmount: amount,
                        bidderName: name,
                        summary: `Bid £${amount} on task "${taskData.name || 'Unnamed'}"`
                    }
                });
            } catch (actErr) {
                console.error('Error logging bid activity:', actErr);
                // Don't fail the bid creation if logging fails
            }
        }
        
        alert('Bid submitted successfully!');
        closeBidModal();
        renderFundBids();
    } catch (err) {
        console.error('Error submitting bid:', err);
        alert('Error submitting bid: ' + err.message);
    }
}

async function confirmDonate() {
    const amt = parseFloat(document.getElementById('donationAmount')?.value || 0);
    const name = document.getElementById('donorName')?.value?.trim() || null;
    if (!amt || amt <= 0) { alert('Enter an amount'); return; }
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        await addDoc(collection(db, basePath, projectId, 'funds'), { amount: amt, name: name, createdAt: serverTimestamp() });
        document.getElementById('donationAmount').value = '';
        document.getElementById('donorName').value = '';
        renderFundInvest();
        renderFundOverview();
        alert('Thanks for your pledge');
    } catch (err) {
        console.error('Error saving pledge:', err);
        alert('Error saving pledge');
    }
}

async function loadTeam() {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const snap = await getDocs(collection(db, basePath, projectId, 'team'));
    const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const container = document.getElementById('teamGrid');
    if (!members.length) {
        container.innerHTML = '<p class="placeholder-text" style="grid-column:1/-1;">No team members yet.</p>';
        return;
    }

    // Fetch profile pics/display names from users collection
    const enriched = await Promise.all(members.map(async m => {
        try {
            const userSnap = await getDoc(doc(db, 'users', m.uid || m.id));
            const userData = userSnap.exists() ? userSnap.data() : {};
            return { ...m, ...userData };
        } catch { return m; }
    }));

    container.innerHTML = enriched.map(m => {
        const initials = (m.username || m.email || '?')[0].toUpperCase();
        const uid = m.uid || m.id;
        const isExternal = m.external === true || !m.uid;
        return `
            <div class="team-card">
                <div class="team-card-avatar" style="${m.photoURL ? `background-image:url(${m.photoURL});background-size:cover;` : ''}">${m.photoURL ? '' : initials}</div>
                <div class="team-card-name">${m.username || 'Unknown'}</div>
                <div class="team-card-role">${m.role || 'Member'}</div>
                ${isExternal ? '<div class="team-card-external">External</div>' : ''}
                ${m.bio ? `<div class="team-card-bio">${m.bio}</div>` : ''}
                <div class="team-card-actions">
                    ${!isExternal ? `<a href="profile.html?uid=${uid}" class="team-card-profile-btn">View Profile</a>` : ''}
                    <button class="remove-btn" onclick="removeTeamMember('${m.id || uid}')">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

// ---- Tasks ----
async function loadTasks() {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const q = query(collection(db, basePath, projectId, 'tasks'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const container = document.getElementById('taskList');
    if (!container) return; // page may not include the legacy taskList element
    container.innerHTML = tasks.length ? tasks.map(t => `
        <div class="task-item">
            <div><p>${t.title}</p><small>Added by ${t.authorName}</small></div>
        </div>
    `).join('') : '<p class="placeholder-text">No tasks yet.</p>';
}

async function handleAddTask() {
    const user = auth.currentUser;
    if (!user) return;
    const title = document.getElementById('newTaskTitle').value.trim();
    if (!title) return;
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    await addDoc(collection(db, basePath, projectId, 'tasks'), {
        title, authorId: user.uid,
        authorName: getDisplayName(user),
        createdAt: serverTimestamp()
    });
    document.getElementById('newTaskTitle').value = '';
    loadTasks();
}

// ---- Chat ----
async function loadChat() {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const q = query(collection(db, basePath, projectId, 'chat'), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const allMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Filter only top-level messages (no parentMessageId)
    const topLevelMessages = allMessages.filter(m => !m.parentMessageId);
    
    const container = document.getElementById('chatList');
    if (!topLevelMessages.length) {
        container.innerHTML = '<p class="placeholder-text">No messages yet.</p>';
        return;
    }
    
    let html = '';
    for (const msg of topLevelMessages) {
        // Get votes for this message
        const votesSnap = await getDocs(collection(db, basePath, projectId, 'chat', msg.id, 'votes'));
        const votes = votesSnap.docs.map(d => d.data());
        const upVotes = votes.filter(v => v.type === 'up').length;
        const downVotes = votes.filter(v => v.type === 'down').length;
        const totalVotes = upVotes + downVotes;
        const approvalPct = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;
        
        // Get replies to this message - use where without orderBy
        let replies = [];
        try {
            const repliesSnap = await getDocs(query(
                collection(db, basePath, projectId, 'chat'),
                where('parentMessageId', '==', msg.id)
            ));
            replies = repliesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by createdAt in JS
            replies.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(0);
                const bTime = b.createdAt?.toDate?.() || new Date(0);
                return aTime - bTime;
            });
        } catch (err) {
            console.error('Error loading replies:', err);
        }
        
        html += renderChatMessage(msg, upVotes, downVotes, totalVotes, approvalPct);
        
        // Add replies
        if (replies.length) {
            html += '<div style="margin-left:24px; margin-top:8px; padding-left:12px; border-left:2px solid #e0e0e0;">';
            for (const reply of replies) {
                const replyVotesSnap = await getDocs(collection(db, basePath, projectId, 'chat', reply.id, 'votes'));
                const replyVotes = replyVotesSnap.docs.map(d => d.data());
                const replyUpVotes = replyVotes.filter(v => v.type === 'up').length;
                const replyDownVotes = replyVotes.filter(v => v.type === 'down').length;
                const replyTotalVotes = replyUpVotes + replyDownVotes;
                const replyApprovalPct = replyTotalVotes > 0 ? Math.round((replyUpVotes / replyTotalVotes) * 100) : 0;
                html += renderChatMessage(reply, replyUpVotes, replyDownVotes, replyTotalVotes, replyApprovalPct);
            }
            html += '</div>';
        }
    }
    
    container.innerHTML = html;
}

function renderChatMessage(msg, upVotes, downVotes, totalVotes, approvalPct) {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const timePassed = formatTimePassed(msg.createdAt?.toDate?.() || new Date());
    const barGradient = barColor(approvalPct);
    
    return `
        <div class="chat-message-card">
            <!-- Vote bar at top -->
            <div style="margin-bottom:8px;">
                <div style="height:6px; background:#e8e6e0; border-radius:4px; overflow:hidden;">
                    <div style="height:100%; width:${approvalPct}%; background:${barGradient}; border-radius:4px;"></div>
                </div>
            </div>
            
            <!-- Message content with avatar -->
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <!-- Avatar -->
                <div style="width:36px; height:36px; background:#3b82f6; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14px; flex-shrink:0;">
                    ${msg.authorName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                
                <!-- Message -->
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="font-weight:600; font-size:13px; color:#222;">${msg.authorName}</span>
                        <span style="font-size:11px; color:#999;">${timePassed}</span>
                    </div>
                    <p style="margin:0; font-size:13px; color:#444; line-height:1.5; word-break:break-word;">${msg.content}</p>
                </div>
            </div>
            
            <!-- Voting and reply buttons -->
            <div style="display:flex; gap:12px; align-items:center; font-size:12px; margin-top:8px;">
                <div style="display:flex; gap:4px; align-items:center;">
                    <button onclick="chatVote('${msg.id}', 'up')" style="background:none; border:none; cursor:pointer; font-size:14px; padding:4px; opacity:0.6; transition:opacity 0.2s;">👍</button>
                    <span style="color:#999; font-size:11px;">${upVotes}</span>
                </div>
                <div style="display:flex; gap:4px; align-items:center;">
                    <button onclick="chatVote('${msg.id}', 'down')" style="background:none; border:none; cursor:pointer; font-size:14px; padding:4px; opacity:0.6; transition:opacity 0.2s;">👎</button>
                    <span style="color:#999; font-size:11px;">${downVotes}</span>
                </div>
                <button onclick="openChatReplyForm('${msg.id}')" style="background:none; border:none; cursor:pointer; font-size:12px; color:#3b82f6; padding:0; text-decoration:underline;">Reply</button>
            </div>
            
            <!-- Reply form (hidden) -->
            <div id="replyForm-${msg.id}" style="display:none; margin-top:12px; padding:8px; background:#f9f9f9; border-radius:4px;">
                <input type="text" id="replyInput-${msg.id}" placeholder="Write a reply..." style="width:100%; padding:6px; font-size:12px; border:1px solid #ddd; border-radius:3px; margin-bottom:6px;">
                <div style="display:flex; gap:6px;">
                    <button onclick="submitChatReply('${msg.id}')" style="background:#3b82f6; color:white; padding:6px 10px; border:none; border-radius:3px; cursor:pointer; font-size:12px;">Send</button>
                    <button onclick="closeChatReplyForm('${msg.id}')" style="background:#e0e0e0; color:#666; padding:6px 10px; border:none; border-radius:3px; cursor:pointer; font-size:12px;">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

function formatTimePassed(date) {
    if (!date) return 'just now';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'now';
    if (diff < 3600) return Math.floor(diff / 60) + 'min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'hr';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    if (diff < 2592000) return Math.floor(diff / 604800) + 'w';
    return Math.floor(diff / 2592000) + 'mo';
}

async function chatVote(messageId, voteType) {
    if (!auth.currentUser) {
        alert('You must be logged in to vote');
        return;
    }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const voteRef = doc(db, basePath, projectId, 'chat', messageId, 'votes', auth.currentUser.uid);
    const existingVote = await getDoc(voteRef);
    
    if (existingVote.exists()) {
        const currentVote = existingVote.data().type;
        if (currentVote === voteType) {
            // Remove vote if clicking same button
            await deleteDoc(voteRef);
        } else {
            // Change vote
            await updateDoc(voteRef, { type: voteType });
        }
    } else {
        // Add new vote
        await setDoc(voteRef, { type: voteType, createdAt: serverTimestamp() });
    }
    
    loadChat();
}

function openChatReplyForm(messageId) {
    document.getElementById(`replyForm-${messageId}`).style.display = 'block';
    document.getElementById(`replyInput-${messageId}`).focus();
}

function closeChatReplyForm(messageId) {
    document.getElementById(`replyForm-${messageId}`).style.display = 'none';
    document.getElementById(`replyInput-${messageId}`).value = '';
}

async function submitChatReply(parentMessageId) {
    const input = document.getElementById(`replyInput-${parentMessageId}`);
    const content = input.value.trim();
    if (!content) return;
    
    if (!auth.currentUser) {
        alert('You must be logged in to reply');
        return;
    }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        const replyDocRef = await addDoc(collection(db, basePath, projectId, 'chat'), {
            content: content,
            authorId: auth.currentUser.uid,
            authorName: auth.currentUser.displayName || auth.currentUser.email || 'Guest',
            createdAt: serverTimestamp(),
            parentMessageId: parentMessageId
        });
        
        // Also post to feed as a chat reference (for top-level messages only)
        if (basePath === 'projects') {
            await addDoc(collection(db, 'feed'), {
                type: 'chat',
                projectId: projectId,
                projectName: currentItem?.title || 'Project',
                chatId: replyDocRef.id,
                content: content,
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || auth.currentUser.email || 'Guest',
                createdAt: serverTimestamp(),
                votes: 0,
                isReply: true
            });
        }
        
        input.value = '';
        closeChatReplyForm(parentMessageId);
        loadChat();
    } catch (err) {
        alert('Error posting reply: ' + err.message);
    }
}

async function handleAddChat() {
    const user = auth.currentUser;
    if (!user) return;
    const content = document.getElementById('newChatMessage').value.trim();
    if (!content) return;
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    try {
        // Add chat message to project
        const chatDocRef = await addDoc(collection(db, basePath, projectId, 'chat'), {
            content, authorId: user.uid,
            authorName: getDisplayName(user),
            createdAt: serverTimestamp()
        });
        
        // Also post to feed as a chat reference (for top-level messages only)
        if (basePath === 'projects') {
            await addDoc(collection(db, 'feed'), {
                type: 'chat',
                projectId: projectId,
                projectName: currentItem?.title || 'Project',
                chatId: chatDocRef.id,
                content: content,
                authorId: user.uid,
                authorName: getDisplayName(user),
                createdAt: serverTimestamp(),
                votes: 0
            });
        }
        
        document.getElementById('newChatMessage').value = '';
        loadChat();
    } catch (err) {
        console.error('Error posting chat:', err);
        alert('Error posting message: ' + err.message);
    }
}

// ---- Updates ----
async function loadUpdates() {
    await loadUpdatesData();
    await renderPublicUpdates();
    await renderInternalUpdates();
}

async function handleAddUpdate() {
    const user = auth.currentUser;
    if (!user) return;
    const title = document.getElementById('newUpdateTitle').value.trim();
    const body  = document.getElementById('newUpdateBody').value.trim();
    if (!title) return;
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    await addDoc(collection(db, basePath, projectId, 'updates'), {
        title, body, authorId: user.uid,
        authorName: getDisplayName(user),
        createdAt: serverTimestamp()
    });
    document.getElementById('newUpdateTitle').value = '';
    document.getElementById('newUpdateBody').value = '';
    loadUpdates();
}

// ---- Change Log ----
async function loadChangeLog() {
    const container = document.getElementById('changeLog');
    if (!container) return;
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        const q = query(collection(db, basePath, projectId, 'changes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const changes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (!changes.length) {
            container.innerHTML = '<p class="placeholder-text">No changes yet. Edits to project details will appear here.</p>';
            return;
        }
        
        const html = changes.map(change => {
            const date = change.createdAt?.toDate ? new Date(change.createdAt.toDate()).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Recent';
            
            const oldVal = change.oldValue ? `<code style="background:#f0f0f0;padding:2px 4px;border-radius:3px;font-size:12px;">${escapeHtml(change.oldValue)}</code>` : '(empty)';
            const newVal = change.newValue ? `<code style="background:#f0f0f0;padding:2px 4px;border-radius:3px;font-size:12px;">${escapeHtml(change.newValue)}</code>` : '(empty)';
            
            return `
                <div style="padding:12px;border-bottom:1px solid #eee;border-left:3px solid #8b5cf6;">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
                        <strong style="color:#333;">${change.fieldLabel || change.field}</strong>
                        <span style="font-size:11px;color:#999;">${date}</span>
                    </div>
                    <div style="font-size:12px;color:#666;margin-bottom:4px;">
                        <strong>${change.changedBy}</strong> changed this
                    </div>
                    <div style="font-size:12px;color:#666;">
                        From: ${oldVal}<br>
                        To: ${newVal}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    } catch (err) {
        console.error('Error loading change log:', err);
        container.innerHTML = '<p class="placeholder-text">Error loading change log.</p>';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ---- Tab switching ----
function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.folder-tab').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-panel').forEach(panel =>
        panel.classList.toggle('active', panel.id === `panel-${tabName}`));
    
    // Load data when switching tabs
    if (tabName === 'files') {
        loadFilesData();
    }
    if (tabName === 'updates') {
        loadUpdatesData();
    }
    if (tabName === 'change') {
        loadChangeLog();
    }
    
    renderSubTabs(tabName);
}

function renderSubTabs(tabName) {
    const subTabRow = document.getElementById('subTabRow');
    const cat = getCategory();
    const tabDefs = SUB_TABS[tabName];
    if (!tabDefs) { subTabRow.innerHTML = ''; return; }
    const defs = tabDefs[cat] || tabDefs['all'] || [];
    if (defs.length <= 1) { subTabRow.innerHTML = ''; return; }
    const currentSub = activeSubTab[tabName] || defs[0].id;
    subTabRow.innerHTML = defs.map(def => `
        <button class="sub-tab ${def.id === currentSub ? 'active' : ''}"
                onclick="switchSubTab('${tabName}', '${def.id}')">${def.label}</button>
    `).join('');
    activateSubPanel(tabName, currentSub);
}

function switchSubTab(tabName, subId) {
    activeSubTab[tabName] = subId;
    renderSubTabs(tabName);
    activateSubPanel(tabName, subId);
}

function activateSubPanel(tabName, subId) {
    document.querySelectorAll(`#panel-${tabName} .subpanel`).forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`subpanel-${subId}`);
    if (target) target.classList.add('active');
    
    // On-demand rendering for Fund subtabs
    if (tabName === 'fund') {
        if (subId === 'fund-overview') renderFundOverview();
        if (subId === 'fund-bid') renderFundBids();
        if (subId === 'fund-invest') renderFundInvest();
    }
    
    // On-demand rendering for Updates subtabs
    if (tabName === 'updates') {
        if (subId === 'updates-public') renderPublicUpdates();
        if (subId === 'updates-internal') renderInternalUpdates();
    }
}

// ---- Auth ----
watchAuthState(function(user) {
    const loggedIn = user && !user.isAnonymous;
    ['addTaskSection', 'addChatSection', 'addPublicUpdateSection', 'addInternalUpdateSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = loggedIn ? 'flex' : 'none';
    });
});

// ---- Expose ----
window.switchTab            = switchTab;
window.switchSubTab         = switchSubTab;
window.handleAddTask        = handleAddTask;
window.handleAddChat        = handleAddChat;
window.handleAddUpdate      = handleAddUpdate;
window.handleProjectVote    = handleProjectVote;
window.startEdit            = startEdit;
window.cancelEdit           = cancelEdit;
window.saveField            = saveField;
window.chatVote             = chatVote;
window.openChatReplyForm    = openChatReplyForm;
window.closeChatReplyForm   = closeChatReplyForm;
window.submitChatReply      = submitChatReply;
window.openJoinProjectForm  = openJoinProjectForm;
window.handleFollowProject  = handleFollowProject;

// ─────────────────────────────────────────────────────────────────────
// TENTACLE WIDGET - Activity Visualization
// ─────────────────────────────────────────────────────────────────────

const TENTACLE_NUM = 8;
let tentacleTasks = [];
let tentaclePhase = 0;
let tentacleNextId = 1;

function updateTentacleActivities() {
    // Extract activities from the projection plan data
    
    // Clear existing tasks
    tentacleTasks = [];
    tentacleNextId = 1;
    
    console.log('[Tentacle] updating - planData.activities:', planData?.activities?.length);
    console.log('[Tentacle] updating - planData.tasks:', planData?.tasks?.length);
    
    if (planData && planData.activities && Array.isArray(planData.activities)) {
        // Get only TOP LEVEL activities (no parentId) to avoid including sub-activities
        const topLevelActivities = planData.activities
            .filter(a => !a.parentId)
            .slice(0, TENTACLE_NUM);
        
        console.log('[Tentacle] Top-level activities:', topLevelActivities.length);
        
        topLevelActivities.forEach((activity, idx) => {
            // Get all tasks for this activity
            const activityTasks = planData.tasks 
                ? planData.tasks.filter(t => t.activityId === activity.id)
                : [];
            
            // Store complete activity data with all tasks
            tentacleTasks.push({
                id: tentacleNextId++,
                activityId: activity.id,
                activityName: activity.name,
                tasks: activityTasks.map(t => ({
                    id: t.id,
                    name: t.name || t.text || '?',
                    done: t.status === 'Complete' || t.done || false
                })),
                slot: idx
            });
        });
        
        console.log('[Tentacle] Final tentacleTasks:', tentacleTasks.length, tentacleTasks.map(t => ({ name: t.activityName, taskCount: t.tasks.length })));
    } else {
        console.log('[Tentacle] No activities found - planData structure:', Object.keys(planData || {}));
    }
}

function initTentacleWidget() {
    console.log('[Tentacle] initTentacleWidget called - tentacleTasks:', tentacleTasks);
    
    const canvas = document.getElementById('tentacleCanvas');
    if (!canvas) {
        console.log('[Tentacle] Canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Responsive sizing based on container
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement || document.body;
    
    // Use offsetWidth/offsetHeight for more reliable measurements during initial layout
    // getBoundingClientRect() can return 0 if layout hasn't been calculated yet
    let containerWidth = container.offsetWidth || container.getBoundingClientRect().width;
    
    // Calculate display size (max 600px, fit to container with padding)
    const PADDING = 40;  // Padding to prevent edge clipping
    let displayW = Math.max(300, Math.min(containerWidth - PADDING, 600));
    let displayH = displayW;  // Keep square
    
    // Set canvas buffer size (device pixels) and CSS size (display pixels)
    let W = displayW * dpr;
    let H = displayH * dpr;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    ctx.scale(dpr, dpr);
    
    // Logical coordinates (used in drawing) - keep full canvas space for consistent coordinate system
    const logicalW = displayW;
    const logicalH = displayH;
    const CX = logicalW / 2;
    const CY = logicalH / 2;
    
    // Scale all dimensions based on canvas size (reference: 500px)
    const scale = logicalW / 500;
    const HUB_R = 54 * scale;
    const BUBBLE_OFFSET = 15 * scale;
    const BUBBLE_W = 110 * scale;
    const BUBBLE_H = 55 * scale;
    
    // Calculate ARM_LEN adaptively to prevent clipping
    // Add safety margin (25px) to ensure bubbles don't exceed rendereable bounds
    const SAFETY_MARGIN = 55;
    const maxArmReach = (logicalW / 2) - BUBBLE_OFFSET - (BUBBLE_W / 2) - SAFETY_MARGIN;
    const ARM_LEN = Math.max(80 * scale, maxArmReach);
    
    function bezier(p0, p1, p2, p3, t) {
        const u = 1 - t;
        return {
            x: u**3*p0.x + 3*u**2*t*p1.x + 3*u*t**2*p2.x + t**3*p3.x,
            y: u**3*p0.y + 3*u**2*t*p1.y + 3*u*t**2*p2.y + t**3*p3.y,
        };
    }
    
    function getArm(i, ph) {
        const a = (i / TENTACLE_NUM) * Math.PI * 2 - Math.PI / 2;
        const task = tentacleTasks.find(t => t.slot === i);
        const busy = task && !task.done;
        const w1 = Math.sin(ph + i * 1.1) * (busy ? 7 : 22);
        const w2 = Math.cos(ph * 0.7 + i) * (busy ? 5 : 16);
        const p0 = { x: CX + Math.cos(a) * HUB_R, y: CY + Math.sin(a) * HUB_R };
        const p1 = {
            x: p0.x + Math.cos(a) * ARM_LEN * 0.33 + Math.cos(a + Math.PI/2) * w1,
            y: p0.y + Math.sin(a) * ARM_LEN * 0.33 + Math.sin(a + Math.PI/2) * w1,
        };
        const p2 = {
            x: p0.x + Math.cos(a) * ARM_LEN * 0.66 + Math.cos(a + Math.PI/2) * w2,
            y: p0.y + Math.sin(a) * ARM_LEN * 0.66 + Math.sin(a + Math.PI/2) * w2,
        };
        const p3 = {
            x: p0.x + Math.cos(a) * ARM_LEN + Math.cos(a + Math.PI/2) * w1 * 0.4,
            y: p0.y + Math.sin(a) * ARM_LEN + Math.sin(a + Math.PI/2) * w1 * 0.4,
        };
        return { p0, p1, p2, p3, a, task };
    }
    
    function draw() {
        ctx.clearRect(0, 0, logicalW, logicalH);
        
        // Hub glow
        const hg = ctx.createRadialGradient(CX, CY, 30, CX, CY, 80);
        hg.addColorStop(0, 'rgba(56,189,248,0.12)');
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(CX, CY, 80, 0, Math.PI*2);
        ctx.fill();
        
        const full = tentacleTasks.filter(t => !t.done).length >= TENTACLE_NUM;
        
        // Draw arms
        for (let i = 0; i < TENTACLE_NUM; i++) {
            const { p0, p1, p2, p3, a, task } = getArm(i, tentaclePhase);
            const done = task && task.done;
            const active = task && !task.done;
            const color = done ? '#4ade80' : active ? '#38bdf8' : '#475569';
            const glow = done ? '#4ade8044' : active ? '#38bdf844' : 'transparent';
            
            // Arm glow
            ctx.save();
            ctx.strokeStyle = glow;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            ctx.stroke();
            ctx.restore();
            
            // Arm body
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            ctx.stroke();
            ctx.restore();
            
            // Segment rings
            [0.2, 0.4, 0.6, 0.8].forEach((t, si) => {
                const pt = bezier(p0, p1, p2, p3, t);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 4.5 - si*0.5, 0, Math.PI*2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
            
            // Claw
            const clawA = Math.atan2(p3.y - p2.y, p3.x - p2.x);
            const spread = active ? 0.18 : 0.44;
            [-1, 1].forEach(side => {
                const cx2 = p3.x + Math.cos(clawA + side * spread) * 20;
                const cy2 = p3.y + Math.sin(clawA + side * spread) * 20;
                ctx.beginPath();
                ctx.moveTo(p3.x, p3.y);
                ctx.lineTo(cx2, cy2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
            });
            
            // Task bubble with activity and task list
            if (task) {
                const bx = p3.x + Math.cos(a) * BUBBLE_OFFSET;
                const by = p3.y + Math.sin(a) * BUBBLE_OFFSET;
                
                // Check if all tasks are done for activity coloring
                const allTasksDone = task.tasks && task.tasks.length > 0 && task.tasks.every(t => t.done);
                
                // Scale bubble based on number of tasks
                const taskCount = task.tasks ? task.tasks.length : 0;
                const bh = Math.max(BUBBLE_H, (BUBBLE_H + 14 * scale * Math.max(0, taskCount - 1)));
                const bw = BUBBLE_W;
                const bxOff = bx - bw / 2;
                const byOff = by - bh / 2;
                
                // Bubble bg (green if all tasks done)
                ctx.save();
                if (allTasksDone) {
                    ctx.fillStyle = 'rgba(20,83,45,0.93)';
                    ctx.strokeStyle = '#4ade80';
                } else {
                    ctx.fillStyle = 'rgba(12,26,52,0.93)';
                    ctx.strokeStyle = '#38bdf8';
                }
                ctx.lineWidth = 1.5;
                roundRect(ctx, bxOff, byOff, bw, bh, 9);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                
                // Activity name (header)
                ctx.save();
                ctx.fillStyle = allTasksDone ? '#bbf7d0' : '#e0f2fe';
                const headerFontSize = Math.max(8, 10 * scale);
                ctx.font = `bold ${headerFontSize}px Segoe UI`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                let actName = task.activityName || 'Activity';
                if (actName.length > 12 * scale) actName = actName.slice(0, Math.max(8, Math.floor(12 * scale))) + '…';
                ctx.fillText(actName, bx, byOff + 4);
                ctx.restore();
                
                // Task list
                if (taskCount > 0) {
                    ctx.save();
                    const taskFontSize = Math.max(7, 9 * scale);
                    ctx.font = `${taskFontSize}px Segoe UI`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    
                    const lineHeight = 12 * scale;
                    const maxTaskNameLen = 14;
                    
                    task.tasks.forEach((t, idx) => {
                        const y = byOff + 18 * scale + idx * lineHeight;
                        
                        // Task name
                        ctx.fillStyle = allTasksDone ? '#bbf7d0' : (t.done ? '#4ade80' : '#e0f2fe');
                        let taskName = t.name;
                        if (taskName.length > maxTaskNameLen) taskName = taskName.slice(0, maxTaskNameLen - 1) + '…';
                        ctx.fillText(taskName, bxOff + 6, y);
                        
                        // Store button positions for click detection
                        if (!task._taskButtons) task._taskButtons = [];
                        const btnX = bxOff + bw - 18;
                        const btnY = y - 5;
                        task._taskButtons[idx] = {
                            x: btnX,
                            y: btnY,
                            w: 14,
                            h: 10,
                            taskId: t.id,
                            taskName: t.name,
                            done: t.done
                        };
                        
                        // Draw task button
                        ctx.save();
                        // Button background
                        ctx.fillStyle = t.done ? '#4ade8055' : '#38bdf855';
                        ctx.fillRect(btnX, btnY, 14, 10);
                        
                        // Button border
                        ctx.strokeStyle = t.done ? '#4ade80' : '#38bdf8';
                        ctx.lineWidth = 0.8;
                        ctx.strokeRect(btnX, btnY, 14, 10);
                        
                        // Button icon
                        ctx.fillStyle = t.done ? '#4ade80' : '#38bdf8';
                        ctx.font = `bold ${Math.max(6, 8 * scale)}px Segoe UI`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(t.done ? '✓' : '×', btnX + 7, btnY + 5);
                        ctx.restore();
                    });
                    ctx.restore();
                }
                
                task._bx = bxOff;
                task._by = byOff;
                task._bw = bw;
                task._bh = bh;
                task._bx_center = bx;
                task._allTasksDone = allTasksDone;
            } else {
                const pt = p3;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 6, 0, Math.PI*2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        
        // Hub body
        ctx.beginPath();
        ctx.arc(CX, CY, HUB_R, 0, Math.PI*2);
        ctx.fillStyle = '#0c1a2e';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(CX, CY, 32, 0, Math.PI*2);
        ctx.fillStyle = '#071020';
        ctx.fill();
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        const pulse = 14 + Math.sin(tentaclePhase * 2) * 3;
        ctx.beginPath();
        ctx.arc(CX, CY, pulse, 0, Math.PI*2);
        ctx.fillStyle = full ? '#7f1d1d' : '#0f2d4a';
        ctx.fill();
        ctx.strokeStyle = full ? '#f87171' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.font = '18px Segoe UI';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = full ? '#fca5a5' : '#7dd3fc';
        ctx.fillText(full ? '!' : '⚙', CX, CY + 1);
    }
    
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
    
    function updateStats() {
        // Count individual tasks across all activities
        let totalTasks = 0;
        let doneTasks = 0;
        
        for (const activity of tentacleTasks) {
            if (activity.tasks) {
                totalTasks += activity.tasks.length;
                doneTasks += activity.tasks.filter(t => t.done).length;
            }
        }
        
        const activeTasks = totalTasks - doneTasks;
        const activeEl = document.getElementById('activeCount');
        const doneEl = document.getElementById('doneCount');
        const freeEl = document.getElementById('freeCount');
        if (activeEl) activeEl.textContent = activeTasks;
        if (doneEl) doneEl.textContent = doneTasks;
        if (freeEl) freeEl.textContent = Math.max(0, TENTACLE_NUM - tentacleTasks.filter(a => a.tasks && a.tasks.length > 0).length);
    }
    
    canvas.addEventListener('click', async (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = logicalW / rect.width, scaleY = logicalH / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        
        for (const activity of tentacleTasks) {
            if (!activity._bx) continue;
            
            // Check if click in bubble area
            if (mx >= activity._bx && mx <= activity._bx + activity._bw && my >= activity._by && my <= activity._by + activity._bh) {
                // Check if click on a task button
                if (activity._taskButtons) {
                    for (let i = 0; i < activity._taskButtons.length; i++) {
                        const btn = activity._taskButtons[i];
                        // Generous click area (±3 px tolerance)
                        if (mx >= btn.x - 3 && mx <= btn.x + btn.w + 3 && my >= btn.y - 2 && my <= btn.y + btn.h + 2) {
                            // Task button clicked - toggle done status in Firestore
                            try {
                                const basePath = itemType === 'legislation' ? 'feed' : 'projects';
                                const newStatus = btn.done ? 'Not Started' : 'Complete';
                                await updateDoc(doc(db, basePath, projectId, 'plan_tasks', btn.taskId), {
                                    status: newStatus,
                                    done: !btn.done
                                });
                                
                                // Update local state
                                activity.tasks[i].done = !btn.done;
                                console.log('[Tentacle] Marked task', btn.taskName, 'as', newStatus);
                            } catch (err) {
                                console.error('[Tentacle] Error updating task:', err);
                            }
                            return;
                        }
                    }
                }
            }
        }
    });
    
    function loop(ts) {
        tentaclePhase = ts * 0.001;
        draw();
        requestAnimationFrame(loop);
    }
    
    updateStats();
    requestAnimationFrame(loop);
    
    // Handle window resize to reinitialize canvas
    window.addEventListener('resize', () => {
        // Small delay to avoid rapid re-initialization
        clearTimeout(window.tentacleResizeTimer);
        window.tentacleResizeTimer = setTimeout(() => {
            initTentacleWidget();
        }, 300);
    });
}

// ─────────────────────────────────────────────────────────────────────
// UPDATES TAB
// ─────────────────────────────────────────────────────────────────────

let updatesData = {
    public: [],    // { id, title, body, link, createdAt, createdBy, createdByName, isPublic: true }
    internal: []   // { id, title, body, link, createdAt, createdBy, createdByName, isPublic: false }
};

// Store uploaded images temporarily
let tempImages = {
    public: null,
    internal: null,
    headerPicture: null
};

function toggleMediaForm(type) {
    const formId = type === 'public' ? 'publicMediaForm' : 'internalMediaForm';
    const form = document.getElementById(formId);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    }
}

function handleImageSelect(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show filename
    const nameEl = document.getElementById(`${type}ImageName`);
    if (nameEl) nameEl.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    
    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (event) => {
        tempImages[type] = event.target.result;
    };
    reader.readAsDataURL(file);
}

async function loadUpdatesData() {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        const snap = await getDocs(collection(db, basePath, projectId, 'updates'));
        const allUpdates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        updatesData.public = allUpdates.filter(u => u.isPublic === true);
        updatesData.internal = allUpdates.filter(u => u.isPublic === false);
        
        updatesData.public.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        updatesData.internal.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    } catch (err) {
        console.error('Error loading updates:', err);
    }
}

async function renderPublicUpdates() {
    const container = document.getElementById('publicUpdatesList');
    if (!container) return;
    
    if (!updatesData.public.length) {
        container.innerHTML = '<p class="placeholder-text">No public updates yet.</p>';
        return;
    }
    
    const html = updatesData.public.map(update => renderUpdateCard(update, true)).join('');
    container.innerHTML = html;
}

async function renderInternalUpdates() {
    const container = document.getElementById('internalUpdatesList');
    if (!container) return;
    
    if (!updatesData.internal.length) {
        container.innerHTML = '<p class="placeholder-text">No internal communications yet.</p>';
        return;
    }
    
    const html = updatesData.internal.map(update => renderUpdateCard(update, false)).join('');
    container.innerHTML = html;
}

function renderUpdateCard(update, isPublic) {
    const date = update.createdAt?.toDate?.() ? new Date(update.createdAt.toDate()).toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : 'Recent';
    
    const badge = isPublic ? '<span class="update-badge-public">📢 Public</span>' : '<span class="update-badge-internal">🔒 Internal</span>';
    
    // Build media HTML
    let mediaHtml = '';
    const media = update.media || {};
    
    if (media.image) {
        mediaHtml += `<div style="margin-top:8px;"><img src="${media.image}" style="max-width:100%; border-radius:4px; max-height:300px;"></div>`;
    }
    
    if (media.youtube) {
        const youtubeId = media.youtube.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (youtubeId) {
            mediaHtml += `<div style="margin-top:8px;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen style="border-radius:4px;"></iframe></div>`;
        }
    }
    
    if (media.video) {
        mediaHtml += `<div style="margin-top:8px;"><video width="100%" controls style="border-radius:4px; max-height:300px;"><source src="${media.video}"></video></div>`;
    }
    
    if (media.link) {
        const isValidUrl = /^https?:\/\//.test(media.link);
        const displayUrl = media.link.replace(/^https?:\/\//, '').substring(0, 50);
        mediaHtml += isValidUrl 
            ? `<div style="margin-top:8px;"><a href="${media.link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-size:12px;">🔗 ${displayUrl}</a></div>`
            : `<div style="margin-top:8px; color:#3b82f6; font-size:12px;">🔗 ${media.link}</div>`;
    }
    
    // Project banner for public updates
    let projectBanner = '';
    if (isPublic && update.projectName) {
        projectBanner = `<div style="margin-bottom:8px; padding:6px 8px; background:#e0e7ff; border-radius:4px; font-size:11px; color:#1e40af; font-weight:600;">📌 ${update.projectName}</div>`;
    }
    
    return `
        <div class="update-item" style="border-left-color: ${isPublic ? '#3b82f6' : '#f59f00'};">
            ${projectBanner}
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:6px;">
                <h4 style="margin:0; font-size:13px; color:#222;">${update.title}</h4>
                <button class="file-action-btn delete" onclick="deleteUpdate('${update.id}', ${isPublic})" style="padding:2px 6px;">Delete</button>
            </div>
            <p style="margin:6px 0; font-size:13px; color:#444; line-height:1.5;">${update.body.replace(/\n/g, '<br>')}</p>
            ${mediaHtml}
            <div style="margin-top:8px; font-size:11px; color:#999;">
                ${badge}
                <span style="margin-left:8px;">By ${update.createdByName || 'Unknown'}</span>
                <span style="margin-left:8px;">${date}</span>
            </div>
        </div>
    `;
}

async function handleAddPublicUpdate() {
    const title = document.getElementById('newPublicUpdateTitle')?.value?.trim();
    const body = document.getElementById('newPublicUpdateBody')?.value?.trim();
    const youtubeUrl = document.getElementById('newPublicUpdateYoutube')?.value?.trim();
    const videoUrl = document.getElementById('newPublicUpdateVideo')?.value?.trim();
    const link = document.getElementById('newPublicUpdateLink')?.value?.trim();
    const imageData = tempImages.public;
    
    if (!title || !body) {
        alert('Enter both title and update text');
        return;
    }
    
    if (!auth.currentUser) {
        alert('You must be logged in to post updates');
        return;
    }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    try {
        // Get user name and current project info
        const userSnap = await getDoc(doc(db, basePath, projectId, 'team', auth.currentUser.uid));
        const userName = userSnap.data()?.name || auth.currentUser.displayName || 'Anonymous';
        
        const projectSnap = await getDoc(doc(db, basePath, projectId));
        const projectName = projectSnap.data()?.title || 'Unknown Project';
        
        // Build media object
        const media = {};
        if (imageData) media.image = imageData;
        if (youtubeUrl) media.youtube = youtubeUrl;
        if (videoUrl) media.video = videoUrl;
        if (link) media.link = link;
        
        const updateData = {
            title: title,
            body: body,
            media: Object.keys(media).length > 0 ? media : null,
            isPublic: true,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid,
            createdByName: userName,
            projectId: projectId,
            projectName: projectName
        };
        
        // Add to project's updates collection
        const updateRef = await addDoc(collection(db, basePath, projectId, 'updates'), updateData);
        
        // Also create a feed post so it appears in timeline with project banner
        await addDoc(collection(db, 'feed'), {
            type: 'project-update',
            projectId: projectId,
            projectName: projectName,
            updateId: updateRef.id,
            title: title,
            content: body,
            media: Object.keys(media).length > 0 ? media : null,
            authorId: auth.currentUser.uid,
            authorName: userName,
            createdAt: serverTimestamp(),
            votes: 0
        });
        
        // Clear inputs
        document.getElementById('newPublicUpdateTitle').value = '';
        document.getElementById('newPublicUpdateBody').value = '';
        document.getElementById('newPublicUpdateImage').value = '';
        document.getElementById('newPublicUpdateYoutube').value = '';
        document.getElementById('newPublicUpdateVideo').value = '';
        document.getElementById('newPublicUpdateLink').value = '';
        document.getElementById('publicImageName').textContent = '';
        tempImages.public = null;
        const publicMediaForm = document.getElementById('publicMediaForm');
        if (publicMediaForm) publicMediaForm.style.display = 'none';
        
        await loadUpdatesData();
        await renderPublicUpdates();
        alert('✓ Update posted to the public feed!');
    } catch (err) {
        console.error('Error posting update:', err);
        alert('Error posting update: ' + err.message);
    }
}

async function handleAddInternalUpdate() {
    const title = document.getElementById('newInternalUpdateTitle')?.value?.trim();
    const body = document.getElementById('newInternalUpdateBody')?.value?.trim();
    const youtubeUrl = document.getElementById('newInternalUpdateYoutube')?.value?.trim();
    const videoUrl = document.getElementById('newInternalUpdateVideo')?.value?.trim();
    const link = document.getElementById('newInternalUpdateLink')?.value?.trim();
    const imageData = tempImages.internal;
    
    if (!title || !body) {
        alert('Enter both title and communication text');
        return;
    }
    
    if (!auth.currentUser) {
        alert('You must be logged in to post communications');
        return;
    }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    try {
        // Get user name from team collection
        const userSnap = await getDoc(doc(db, basePath, projectId, 'team', auth.currentUser.uid));
        const userName = userSnap.data()?.name || auth.currentUser.displayName || 'Anonymous';
        
        // Build media object
        const media = {};
        if (imageData) media.image = imageData;
        if (youtubeUrl) media.youtube = youtubeUrl;
        if (videoUrl) media.video = videoUrl;
        if (link) media.link = link;
        
        // Add ONLY to project's updates collection (NOT to feed)
        // This keeps it private to team members only
        await addDoc(collection(db, basePath, projectId, 'updates'), {
            title: title,
            body: body,
            media: Object.keys(media).length > 0 ? media : null,
            isPublic: false,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid,
            createdByName: userName
        });
        
        // Clear inputs
        document.getElementById('newInternalUpdateTitle').value = '';
        document.getElementById('newInternalUpdateBody').value = '';
        document.getElementById('newInternalUpdateImage').value = '';
        document.getElementById('newInternalUpdateYoutube').value = '';
        document.getElementById('newInternalUpdateVideo').value = '';
        document.getElementById('newInternalUpdateLink').value = '';
        document.getElementById('internalImageName').textContent = '';
        tempImages.internal = null;
        const internalMediaForm = document.getElementById('internalMediaForm');
        if (internalMediaForm) internalMediaForm.style.display = 'none';
        
        await loadUpdatesData();
        await renderInternalUpdates();
        alert('✓ Internal communication posted!');
    } catch (err) {
        console.error('Error posting communication:', err);
        alert('Error posting communication: ' + err.message);
    }
}

async function deleteUpdate(updateId, isPublic) {
    if (!confirm('Delete this update?')) return;
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    try {
        await deleteDoc(doc(db, basePath, projectId, 'updates', updateId));
        await loadUpdatesData();
        if (isPublic) {
            await renderPublicUpdates();
        } else {
            await renderInternalUpdates();
        }
    } catch (err) {
        alert('Error deleting update: ' + err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────
// FILES TAB
// ─────────────────────────────────────────────────────────────────────

async function loadFilesData() {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    try {
        const snap = await getDocs(collection(db, basePath, projectId, 'files'));
        filesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderFileTree();
        
        // Setup drag-and-drop
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragenter', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-active');
            });
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            uploadArea.addEventListener('dragleave', (e) => {
                if (e.target === uploadArea) {
                    uploadArea.classList.remove('drag-active');
                }
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-active');
                handleDropFiles(e);
            });
        }
    } catch (err) {
        console.error('Error loading files:', err);
    }
}

async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await uploadFiles(files, currentFilePath);
    e.target.value = '';  // Reset input
}

function handleDropFiles(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) uploadFiles(files, currentFilePath);
}

async function uploadFiles(files, folderPath) {
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const progressEl = document.getElementById('uploadProgress');
    const statusEl = document.getElementById('uploadStatus');
    const barEl = document.getElementById('uploadProgressBar');
    
    if (!progressEl) {
        console.error('Upload progress UI not found');
        return;
    }
    
    // Check authentication
    if (!auth.currentUser) {
        alert('You must be logged in to upload files.');
        return;
    }
    
    progressEl.style.display = 'block';
    
    let completed = 0;
    const total = files.length;
    let hasError = false;
    const errorMessages = [];

    for (const file of files) {
        try {
            console.log(`Uploading: ${file.name} (${file.size} bytes, type: ${file.type})`);
            const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
            
            // Save metadata to Firestore directly (no Cloud Storage for now)
            // This avoids Storage security rule issues
            const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addDoc(collection(db, basePath, projectId, 'files'), {
                id: fileId,
                name: file.name,
                path: filePath,
                parentPath: folderPath,
                type: file.type || 'application/octet-stream',
                size: file.size,
                url: `projects/${projectId}/files/${filePath}`,
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser.uid
            });
            
            console.log(`✓ Uploaded: ${file.name}`);
            completed++;
            const pct = Math.round((completed / total) * 100);
            if (statusEl) statusEl.textContent = `${pct}%`;
            if (barEl) barEl.style.width = `${pct}%`;
        } catch (err) {
            console.error(`✗ Error uploading ${file.name}:`, err);
            hasError = true;
            errorMessages.push(`${file.name}: ${err.message}`);
        }
    }
    
    try {
        progressEl.style.display = 'none';
    } catch (e) {
        // Silent catch
    }
    
    // Reload files
    try {
        await loadFilesData();
    } catch (err) {
        console.error('Error reloading files:', err);
    }
    
    // Show final status
    if (hasError && completed > 0) {
        alert(`Uploaded ${completed}/${total} files.\n\nErrors:\n${errorMessages.join('\n')}`);
    } else if (hasError) {
        alert(`Failed to upload files:\n${errorMessages.join('\n')}`);
    } else {
        alert(`✓ Successfully uploaded ${total} file(s)!`);
    }
}

function renderFileTree() {
    const treeEl = document.getElementById('fileTree');
    if (!treeEl) return;

    // Get items in current folder only
    const items = filesData.filter(f => f.parentPath === currentFilePath);
    
    // Update breadcrumb navigation
    const breadcrumbEl = document.getElementById('breadcrumbPath');
    const uploadAreaLabel = document.getElementById('uploadAreaLabel');
    if (breadcrumbEl) {
        if (currentFilePath) {
            const parts = currentFilePath.split('/').filter(p => p);
            breadcrumbEl.innerHTML = ' / ' + parts.map((p, i) => {
                const path = parts.slice(0, i + 1).join('/');
                return `<button class="breadcrumb-btn" onclick="navigateToFolder('${path}')">${p}</button>`;
            }).join(' / ') + ` <button class="breadcrumb-btn" onclick="navigateToFolder('')" style="opacity:0.6;">✕</button>`;
        } else {
            breadcrumbEl.innerHTML = '';
        }
    }
    
    // Update upload area label
    if (uploadAreaLabel) {
        if (currentFilePath) {
            uploadAreaLabel.textContent = `Uploading to: ${currentFilePath}`;
            uploadAreaLabel.style.display = 'block';
        } else {
            uploadAreaLabel.style.display = 'none';
        }
    }
    
    if (!items.length) {
        treeEl.innerHTML = '<p class="placeholder-text">This folder is empty.</p>';
        return;
    }
    
    // Separate folders and files
    const folders = items.filter(f => f.isFolder || f.type === 'folder');
    const files = items.filter(f => !f.isFolder && f.type !== 'folder');
    
    // Render folders first, then files
    let html = '';
    folders.forEach(folder => {
        html += renderFolderRow(folder);
    });
    files.forEach(file => {
        html += renderFileRow(file);
    });
    
    treeEl.innerHTML = html;
}

function renderFolderRow(folder) {
    return `
        <div class="file-item folder-row">
            <span class="file-item-icon">📁</span>
            <span class="file-item-name" onclick="navigateToFolder('${folder.path}')" style="cursor:pointer; flex:1; color:#3b82f6; font-weight:500;">${folder.name}</span>
            <div class="file-item-actions">
                <button class="file-action-btn" onclick="navigateToFolder('${folder.path}')">Open</button>
                <button class="file-action-btn delete" onclick="deleteFileOrFolder('${folder.path}', true)">Delete</button>
            </div>
        </div>
    `;
}

function renderFileRow(file) {
    const sizeStr = file.size ? formatFileSize(file.size) : '';
    return `
        <div class="file-item file-row">
            <span class="file-item-icon">${getFileIcon(file.name)}</span>
            <span class="file-item-name">${file.name}</span>
            <span class="file-item-size">${sizeStr}</span>
            <div class="file-item-actions">
                <button class="file-action-btn" onclick="downloadFile('${file.url}', '${file.name}')">Download</button>
                <button class="file-action-btn delete" onclick="deleteFileOrFolder('${file.path}', false)">Delete</button>
            </div>
        </div>
    `;
}

function toggleFileFolder(toggleEl) {
    // Removed - no longer needed with folder navigation model
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📄',
        'xls': '📊', 'xlsx': '📊', 'csv': '📊',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
        'zip': '📦', 'rar': '📦', '7z': '📦',
        'mp3': '🎵', 'mp4': '🎬', 'mov': '🎬', 'avi': '🎬'
    };
    return icons[ext] || '📎';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function navigateToFolder(path) {
    currentFilePath = path;
    renderFileTree();
}

async function createNewFolder() {
    const nameInput = document.getElementById('newFolderName');
    const folderName = nameInput?.value?.trim();
    
    if (!folderName) {
        alert('Enter a folder name');
        return;
    }
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    const folderPath = currentFilePath ? `${currentFilePath}/${folderName}` : folderName;
    
    try {
        // Create a placeholder file to establish the folder
        const folderId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await addDoc(collection(db, basePath, projectId, 'files'), {
            id: folderId,
            name: folderName,
            path: folderPath,
            parentPath: currentFilePath,
            type: 'folder',
            size: 0,
            isFolder: true,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid
        });
        
        nameInput.value = '';
        await loadFilesData();
    } catch (err) {
        alert('Error creating folder: ' + err.message);
    }
}

async function deleteFileOrFolder(path, isFolder) {
    if (!confirm(`Delete ${isFolder ? 'folder and its contents' : 'file'}? This action cannot be undone.`)) return;
    
    const basePath = itemType === 'legislation' ? 'feed' : 'projects';
    
    try {
        // Get all files/folders to delete
        const allSnap = await getDocs(collection(db, basePath, projectId, 'files'));
        const toDelete = allSnap.docs.filter(doc => {
            const item = doc.data();
            // Delete exact match or if folder, delete everything under it
            return item.path === path || (isFolder && item.path && item.path.startsWith(path + '/'));
        });
        
        // Delete all matched documents
        for (const doc of toDelete) {
            await deleteDoc(doc.ref);
        }
        
        await loadFilesData();
    } catch (err) {
        console.error('Error deleting:', err);
        alert('Error deleting: ' + err.message);
    }
}

async function downloadFile(url, filename) {
    // Note: This is a placeholder. Actual download would require signed URLs or Cloud Functions
    alert('Download feature coming soon. File: ' + filename);
}

window.loadFilesData        = loadFilesData;
window.handleFileSelect      = handleFileSelect;
window.handleDropFiles       = handleDropFiles;
window.renderFileTree        = renderFileTree;
window.uploadFiles           = uploadFiles;
window.navigateToFolder      = navigateToFolder;
window.createNewFolder       = createNewFolder;
window.deleteFileOrFolder    = deleteFileOrFolder;
window.downloadFile          = downloadFile;
window.toggleFileFolder      = toggleFileFolder;
window.getFileIcon           = getFileIcon;
window.formatFileSize        = formatFileSize;
window.loadUpdatesData       = loadUpdatesData;
window.renderPublicUpdates   = renderPublicUpdates;
window.renderInternalUpdates = renderInternalUpdates;
window.handleAddPublicUpdate = handleAddPublicUpdate;
window.handleAddInternalUpdate = handleAddInternalUpdate;
window.deleteUpdate          = deleteUpdate;
window.toggleMediaForm       = toggleMediaForm;
window.handleImageSelect     = handleImageSelect;
window.loadChangeLog         = loadChangeLog;
window.saveThreshold        = saveThreshold;
window.openTeamModal        = openTeamModal;
window.closeTeamModal       = closeTeamModal;
window.searchUsers          = searchUsers;
window.selectUser           = selectUser;
window.showExternalForm     = showExternalForm;
window.confirmAddTeamMember = confirmAddTeamMember;
window.removeTeamMember     = removeTeamMember;
window.openJoinProjectForm  = openJoinProjectForm;
window.handleFollowProject  = handleFollowProject;
window.openAddTaskModal     = openAddTaskModal;
window.closeTaskModal       = closeTaskModal;
window.confirmAddTask       = confirmAddTask;
window.startAddActivity     = startAddActivity;
window.cancelAddActivity    = cancelAddActivity;
window.confirmAddActivity   = confirmAddActivity;
window.populateActivityDropdown = populateActivityDropdown;
window.populateTeamDropdown = populateTeamDropdown;
window.autoCalculateDates   = autoCalculateDates;
window.toggleActivity       = toggleActivity;
window.openAddTaskModalForActivity = openAddTaskModalForActivity;
window.editTask             = editTask;
window.viewTask             = viewTask;
window.toggleTaskCostFields = toggleTaskCostFields;
window.renderPlanOverview   = renderPlanOverview;
window.renderPlanTasks      = renderPlanTasks;
window.renderGanttChart     = renderGanttChart;
window.renderFundBids       = renderFundBids;
window.switchToTasksTab     = switchToTasksTab;
window.initializePlanTab    = initializePlanTab;
window.propagateDependencies = propagateDependencies;
window.startAddSubActivity  = startAddSubActivity;
window.toggleTask           = toggleTask;
window.deleteTask           = deleteTask;
window.deleteActivity       = deleteActivity;
window.toggleTaskActivity   = toggleTaskActivity;
window.confirmDonate        = confirmDonate;
window.openBidModal         = openBidModal;
window.closeBidModal        = closeBidModal;
window.confirmPlaceBid      = confirmPlaceBid;
window.toggleBidTask        = toggleBidTask;
window.renderBidsForTask    = renderBidsForTask;
window.handleBidVote        = handleBidVote;
window.awardBid             = awardBid;

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProject);
} else {
    loadProject();
}