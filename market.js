import { db, auth } from './firebase.js';
import { watchAuthState } from './auth.js';
import {
    collection, getDocs, query, where, orderBy, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Global data
let allTasks = [];
let allProjects = {};
let filteredTasks = [];

// Initialize
watchAuthState(async user => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update menu button with user initial
    const menuBtnAvatar = document.getElementById('menuBtnAvatar');
    if (menuBtnAvatar && user.displayName) {
        menuBtnAvatar.textContent = user.displayName.charAt(0).toUpperCase();
    } else if (menuBtnAvatar && user.email) {
        menuBtnAvatar.textContent = user.email.charAt(0).toUpperCase();
    }
    
    await loadMarketplace();
});

/**
 * Load all tasks marked as "tender/unknown" from active projects
 */
async function loadMarketplace() {
    const loadingState = document.getElementById('loadingState');
    const listings = document.getElementById('marketListings');
    const noResults = document.getElementById('noResults');
    
    try {
        // Get all projects (will filter archived status in memory to avoid composite index)
        const projectsQuery = query(
            collection(db, 'projects'),
            orderBy('createdAt', 'desc')
        );
        const projectsDocs = await getDocs(projectsQuery);
        
        // Filter out archived projects
        const activeProjects = projectsDocs.docs.filter(doc => !doc.data().archived);
        
        // For each active project, get tasks marked as tender
        allTasks = [];
        allProjects = {};
        
        for (const projectDoc of activeProjects) {
            const projectId = projectDoc.id;
            const projectData = projectDoc.data();
            
            // Cache project data
            allProjects[projectId] = {
                id: projectId,
                title: projectData.title,
                ownerName: projectData.ownerName,
                category: projectData.category,
                description: projectData.description,
                createdAt: projectData.createdAt
            };
            
            // Get tasks for this project where tendered = true
            const tasksQuery = query(
                collection(db, 'projects', projectId, 'plan_tasks'),
                where('tendered', '==', true)
            );
            
            const tasksDocs = await getDocs(tasksQuery);
            
            for (const taskDoc of tasksDocs.docs) {
                const taskData = taskDoc.data();
                allTasks.push({
                    id: taskDoc.id,
                    projectId: projectId,
                    projectTitle: projectData.title,
                    projectOwner: projectData.ownerName,
                    ...taskData
                });
            }
        }
        
        // Set initial filtered list
        filteredTasks = [...allTasks];
        
        // Update stats
        updateStats();
        
        // Render listings
        renderListings();
        
        // Show/hide UI
        loadingState.style.display = 'none';
        if (filteredTasks.length === 0) {
            listings.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            listings.style.display = 'flex';
            noResults.style.display = 'none';
        }
        
    } catch (err) {
        console.error('Error loading marketplace:', err);
        loadingState.innerHTML = '<div style="color: red;">Error loading marketplace</div>';
    }
}

/**
 * Update marketplace statistics
 */
function updateStats() {
    const taskCount = document.getElementById('taskCount');
    const projectCount = document.getElementById('projectCount');
    const totalBudget = document.getElementById('totalBudget');
    
    taskCount.textContent = filteredTasks.length;
    
    const uniqueProjects = new Set(filteredTasks.map(t => t.projectId)).size;
    projectCount.textContent = uniqueProjects;
    
    // Calculate total budget (sum of costAmount where known)
    const totalBudgetAmount = filteredTasks.reduce((sum, task) => {
        return sum + (task.costAmount || 0);
    }, 0);
    
    if (totalBudgetAmount > 0) {
        totalBudget.textContent = '£' + totalBudgetAmount.toLocaleString();
    } else {
        totalBudget.textContent = '—';
    }
}

/**
 * Apply filters
 */
function applyFilters() {
    const skillFilter = document.getElementById('skillFilter').value.toLowerCase();
    const projectFilter = document.getElementById('projectFilter').value.toLowerCase();
    
    filteredTasks = allTasks.filter(task => {
        const matchesSkill = !skillFilter || 
            (task.requiredSkills && task.requiredSkills.some(s => s.toLowerCase().includes(skillFilter)));
        
        const matchesProject = !projectFilter || 
            task.projectTitle.toLowerCase().includes(projectFilter);
        
        return matchesSkill && matchesProject;
    });
    
    updateStats();
    renderListings();
    
    const listings = document.getElementById('marketListings');
    const noResults = document.getElementById('noResults');
    
    if (filteredTasks.length === 0) {
        listings.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        listings.style.display = 'flex';
        noResults.style.display = 'none';
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('skillFilter').value = '';
    document.getElementById('projectFilter').value = '';
    
    filteredTasks = [...allTasks];
    updateStats();
    renderListings();
    
    const listings = document.getElementById('marketListings');
    const noResults = document.getElementById('noResults');
    
    if (filteredTasks.length === 0) {
        listings.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        listings.style.display = 'flex';
        noResults.style.display = 'none';
    }
}

/**
 * Render all task listings
 */
function renderListings() {
    const container = document.getElementById('marketListings');
    if (!container) return;
    
    container.innerHTML = filteredTasks.map(task => renderTaskCard(task)).join('');
}

/**
 * Render a single task card
 */
function renderTaskCard(task) {
    const startDate = task.startDate ? new Date(task.startDate).toLocaleDateString('en-GB') : '—';
    const finishDate = task.finishDate ? new Date(task.finishDate).toLocaleDateString('en-GB') : '—';
    const daysAgo = task.createdAt ? getDaysAgo(task.createdAt) : '—';
    
    const skillTags = (task.requiredSkills || [])
        .map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
        .join('');
    
    const budgetDisplay = task.costAmount ? `£${task.costAmount.toLocaleString()}` : 'TBD';
    
    return `
        <div class="work-card" onclick="viewTaskDetail('${task.projectId}', '${task.id}')">
            <div class="work-card-header">
                <h3 class="work-card-title">${escapeHtml(task.name)}</h3>
                <span class="work-card-project">${escapeHtml(task.projectTitle)}</span>
            </div>
            
            <div class="work-card-meta">
                <div class="meta-item">
                    ⏱️ Duration: ${task.duration || '—'} days
                </div>
                <div class="meta-item">
                    📅 ${startDate} to ${finishDate}
                </div>
                <div class="meta-item">
                    ⏰ Posted ${daysAgo}
                </div>
            </div>
            
            ${task.description ? `
                <div class="work-card-description">
                    ${escapeHtml(task.description)}
                </div>
            ` : ''}
            
            ${skillTags ? `
                <div class="work-card-skills">
                    ${skillTags}
                </div>
            ` : ''}
            
            <div class="work-card-footer">
                <div class="work-card-budget">
                    Budget: ${budgetDisplay}
                </div>
                <div class="work-card-footer-buttons">
                    <button class="view-details-btn" onclick="event.stopPropagation(); viewTaskDetail('${task.projectId}', '${task.id}')">
                        View Project
                    </button>
                    <button class="bid-btn" onclick="event.stopPropagation(); openBidModalForMarket('${task.projectId}', '${task.id}', '${escapeHtml(task.name)}')">
                        Bid
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get relative time (e.g., "2 days ago")
 */
function getDaysAgo(timestamp) {
    if (!timestamp) return '—';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * View task detail in project page
 */
function viewTaskDetail(projectId, taskId) {
    window.location.href = `project.html?id=${projectId}&tab=plan&task=${taskId}`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Toggle floating menu open/closed
 */
function toggleFloatingMenu() {
    const menuList = document.getElementById('menuList');
    if (menuList) {
        menuList.style.display = menuList.style.display === 'block' ? 'none' : 'block';
    }
}

// Close menu when clicking outside
document.addEventListener('click', event => {
    const menu = document.getElementById('floatingMenu');
    const menuBtn = document.getElementById('menuBtn');
    if (menu && !menu.contains(event.target) && !menuBtn.contains(event.target)) {
        const menuList = document.getElementById('menuList');
        if (menuList) menuList.style.display = 'none';
    }
});

/**
 * Open bid modal for a task on the market page
 */
function openBidModalForMarket(projectId, taskId, taskName) {
    const modal = document.getElementById('bidModal');
    if (!modal) return;
    
    // Clear form
    document.getElementById('bidForm').reset();
    
    // Populate task info
    document.getElementById('bidTaskTitle').textContent = taskName;
    document.getElementById('bidTaskProcurement').textContent = `Project ID: ${projectId} • Task ID: ${taskId}`;
    
    // Auto-populate bidderEmail with current user's auth email
    if (auth.currentUser?.email) {
        document.getElementById('bidderEmail').value = auth.currentUser.email;
    }
    
    // Store IDs for submission
    modal.dataset.projectId = projectId;
    modal.dataset.taskId = taskId;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => document.getElementById('bidAmount').focus(), 50);
}

/**
 * Close bid modal
 */
function closeBidModal(event) {
    // If called from clicking outside modal, check target
    if (event && event.target.id !== 'bidModal') return;
    
    const modal = document.getElementById('bidModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('bidForm').reset();
    }
}

/**
 * Submit bid from market page
 */
async function submitBidFromMarket(event) {
    event.preventDefault();
    console.log('submitBidFromMarket() called');
    
    const modal = document.getElementById('bidModal');
    const projectId = modal.dataset.projectId;
    const taskId = modal.dataset.taskId;
    
    console.log('Modal dataset:', { projectId, taskId });
    
    // Get form values
    const amount = parseFloat(document.getElementById('bidAmount').value);
    const bidderName = document.getElementById('bidderName').value.trim();
    const bidderCompany = document.getElementById('bidderCompany').value.trim();
    const bidderEmail = document.getElementById('bidderEmail').value.trim();
    const bidderLink = document.getElementById('bidderLink').value.trim();
    const notes = document.getElementById('bidNotes').value.trim();
    
    console.log('Form values:', { amount, bidderName, bidderCompany, bidderEmail, bidderLink, notes });
    
    // Validate
    if (!amount || amount <= 0) {
        alert('Please enter a valid bid amount');
        return;
    }
    if (!bidderName) {
        alert('Please enter your name or organisation');
        return;
    }
    if (!bidderEmail) {
        alert('Please enter your email address');
        return;
    }
    
    try {
        // Get current user
        const user = auth.currentUser;
        console.log('Current user:', user?.email);
        if (!user) {
            alert('You must be logged in to place a bid');
            return;
        }
        
        // Submit bid to Firestore
        console.log('Submitting bid to path:', `projects/${projectId}/plan_tasks/${taskId}/bids`);
        
        const bidData = {
            amount: amount,
            bidderName: bidderName,
            bidderCompany: bidderCompany || null,
            bidderEmail: bidderEmail,
            bidderLink: bidderLink || null,
            notes: notes || null,
            createdAt: serverTimestamp(),
            bidderUserId: user.uid  // Store user ID for bid_accepted notification
        };
        
        const docRef = await addDoc(collection(db, 'projects', projectId, 'plan_tasks', taskId, 'bids'), bidData);
        
        console.log('✓ Bid saved successfully with ID:', docRef.id);
        
        // Send bid notification to project owner
        try {
            const { getProject } = await import('./projects.js');
            const project = await getProject(projectId);
            if (project && typeof window.NotificationsUI !== 'undefined') {
              const projectOwnerId = project.ownerId;
              if (projectOwnerId && projectOwnerId !== user.uid) {
                window.NotificationsUI.addNotification('project_bids', {
                  projectId: projectId,
                  taskId: taskId,
                  userId: user.uid,
                  message: `${bidderName} submitted a bid of $${amount}`
                }, projectOwnerId);
              }
            }
        } catch (notifErr) {
            console.error('Error sending bid notification:', notifErr);
        }
        
        alert('Bid submitted successfully! The project owner will review your bid.');
        closeBidModal();
        
    } catch (error) {
        console.error('✗ Error submitting bid:', error);
        alert('Error submitting bid: ' + error.message);
    }
}

// Export functions to window
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.viewTaskDetail = viewTaskDetail;
window.toggleFloatingMenu = toggleFloatingMenu;
window.openBidModalForMarket = openBidModalForMarket;
window.closeBidModal = closeBidModal;
window.submitBidFromMarket = submitBidFromMarket;
