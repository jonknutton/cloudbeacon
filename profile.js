import { db, auth } from './firebase.js';
import { getProfile, updateBio, updateProfileCustomization } from './auth.js';
import { watchAuthState } from './auth.js';
import './follows.js';
import {
    collection, query, where, orderBy, getDocs,
    doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Expose auth globally for settings.js access
window.auth = auth;

const params = new URLSearchParams(window.location.search);
const uid = params.get('uid');
let currentProfile = null;

// Skills organized by category (shared with projectpage.js)
const SKILLS_BY_CATEGORY = {
    'Software & Development': ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'DevOps', 'Linux', 'Windows Server', 'Bash', 'SQL', 'MongoDB', 'PostgreSQL', 'REST APIs', 'GraphQL', 'Cybersecurity', 'Penetration Testing', 'Machine Learning', 'AI'],
    'Design & Creative': ['UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'Graphic Design', 'Web Design', 'Mobile Design', 'Animation', 'Motion Graphics', 'Video Editing', 'Premiere Pro', 'After Effects', 'Final Cut Pro', 'DaVinci Resolve', 'Color Grading', 'Photography', 'Photo Retouching', 'Branding', 'Logo Design', '3D Design', 'Blender'],
    'Business & Management': ['Project Management', 'Agile', 'Scrum', 'Kanban', 'Change Management', 'Strategic Planning', 'Business Analysis', 'Market Research', 'Product Management', 'Stakeholder Management', 'Risk Management', 'Compliance', 'Supply Chain', 'Operations Management'],
    'Trades & Construction': ['Carpentry', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Masonry', 'Welding', 'Painting', 'Drywall', 'Tile Work', 'Flooring', 'Framing', 'Finishing', 'Demolition', 'Excavation', 'Heavy Equipment', 'Concrete Work', 'General Contracting'],
    'Manufacturing & Engineering': ['CAD', 'AutoCAD', 'SolidWorks', 'CATIA', '3D Modeling', 'CNC Programming', 'Machining', 'Quality Control', 'Technical Drawing', 'Mechanical Engineering', 'Manufacturing Engineering', 'Process Improvement', 'Production Planning'],
    'Finance & Accounting': ['Bookkeeping', 'Tax Preparation', 'Financial Analysis', 'Auditing', 'QuickBooks', 'Excel', 'Accounting Software', 'Payroll Processing', 'Budget Planning', 'Cost Analysis', 'Financial Reporting', 'Accounts Payable', 'Accounts Receivable', 'Payroll Administration', 'Tax Planning', 'Investment Analysis', 'Treasury Management'],
    'Sales & Customer Service': ['Sales', 'B2B Sales', 'B2C Sales', 'Sales Management', 'Customer Service', 'Customer Support', 'Technical Support', 'Telemarketing', 'Lead Generation', 'CRM', 'Salesforce', 'Negotiation', 'Client Relationship', 'Account Management', 'Retention Management', 'Complaint Resolution', 'Service Recovery'],
    'Writing & Content': ['Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing', 'Article Writing', 'SEO Writing', 'Journalism', 'Editing', 'Proofreading', 'Scriptwriting', 'Screenwriting', 'Ghostwriting', 'Documentation', 'Translation', 'Localization', 'Content Marketing', 'Social Media Content'],
    'Teaching & Training': ['K-12 Teaching', 'Higher Education', 'Corporate Training', 'Online Teaching', 'Curriculum Development', 'Lesson Planning', 'Student Assessment', 'English Teaching', 'Math Teaching', 'Science Teaching', 'Language Teaching', 'Technical Training', 'Professional Development', 'Mentoring', 'Coaching'],
    'Marketing & Communications': ['Digital Marketing', 'Social Media Marketing', 'Email Marketing', 'Content Marketing', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'LinkedIn Marketing', 'Brand Strategy', 'Public Relations', 'Communications', 'Event Marketing', 'Influencer Marketing'],
    'Healthcare & Wellness': ['Nursing', 'Medical Assistant', 'Physical Therapy', 'Occupational Therapy', 'Counseling', 'Psychology', 'Nutrition', 'Fitness Training', 'Massage Therapy', 'Acupuncture', 'Mental Health Support', 'Healthcare Administration', 'Medical Coding', 'Pharmacy', 'Dentistry'],
    'Legal & Compliance': ['Contract Law', 'Corporate Law', 'Employment Law', 'Intellectual Property', 'Regulatory Compliance', 'Legal Research', 'Document Review', 'Paralegal Services', 'Legal Writing', 'Compliance Auditing', 'Policy Development', 'Risk Assessment'],
    'Logistics & Operations': ['Supply Chain Management', 'Warehousing', 'Inventory Management', 'Logistics Planning', 'Distribution', 'Procurement', 'Vendor Management', 'Quality Assurance', 'Process Optimization', 'Systems Management', 'Operations Planning', 'Route Planning'],
    'Data & Analytics': ['Data Analysis', 'Business Intelligence', 'Data Visualization', 'Tableau', 'Power BI', 'Google Analytics', 'SQL', 'R Programming', 'Python Data Science', 'Statistics', 'Data Science', 'Data Engineering', 'Big Data', 'Predictive Analytics', 'Data Mining'],
    'Hospitality & Service': ['Hotel Management', 'Restaurant Management', 'Event Planning', 'Catering', 'Bartending', 'Sommelier', 'Front Desk Operations', 'Housekeeping', 'Concierge Service'],
    'Agriculture & Environment': ['Farming', 'Crop Management', 'Livestock Management', 'Soil Analysis', 'Irrigation', 'Pest Management', 'Environmental Consulting', 'Sustainability', 'Water Management', 'Forest Management', 'Organic Farming'],
    'Transportation & Logistics': ['Truck Driving', 'Commercial Driving', 'Fleet Management', 'Route Optimization', 'Cargo Handling', 'Transportation Coordination', 'Vehicle Maintenance', 'Logistics Coordination'],
    'Miscellaneous Services': ['Handyperson', 'IKEA Assembly', 'Furniture Repair', 'Appliance Repair', 'Locksmith', 'Home Cleaning', 'Yard Work', 'Pet Sitting', 'Dog Walking', 'Babysitting', 'Virtual Assistant', 'Data Entry', 'Transcription', 'Research Assistant']
};

// HTML escaping utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Safe embed domains
const SAFE_EMBED_DOMAINS = [
    'youtube.com',
    'youtu.be',
    'spotify.com',
    'soundcloud.com',
    'vimeo.com',
    'twitch.tv',
    'codepen.io'
];

// Validate and convert URLs to safe embed URLs
function sanitizeEmbedURL(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        if (!SAFE_EMBED_DOMAINS.some(d => domain.includes(d))) {
            return null;
        }

        // YouTube
        if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
            const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
            return {
                type: 'youtube',
                url: `https://www.youtube.com/embed/${videoId}`,
                videoId
            };
        }

        // Vimeo
        if (domain.includes('vimeo.com')) {
            const videoId = urlObj.pathname.split('/').pop();
            return {
                type: 'vimeo',
                url: `https://player.vimeo.com/video/${videoId}`,
                videoId
            };
        }

        // Spotify
        if (domain.includes('spotify.com')) {
            const uriMatch = url.match(/\/([a-zA-Z0-9]+)(\?|$)/);
            if (uriMatch) {
                return {
                    type: 'spotify',
                    url: url.replace('open.spotify.com', 'open.spotify.com/embed'),
                    videoId: uriMatch[1]
                };
            }
        }

        // Soundcloud
        if (domain.includes('soundcloud.com')) {
            return {
                type: 'soundcloud',
                url: url,
                videoId: urlObj.pathname
            };
        }

        // Twitch
        if (domain.includes('twitch.tv')) {
            const channel = urlObj.pathname.split('/').filter(Boolean)[0];
            return {
                type: 'twitch',
                url: `https://twitch.tv/embed/${channel}/chat?parent=localhost`,
                videoId: channel
            };
        }

        // Codepen
        if (domain.includes('codepen.io')) {
            return {
                type: 'codepen',
                url: url,
                videoId: urlObj.pathname
            };
        }

        return null;
    } catch (err) {
        return null;
    }
}

async function loadProfile() {
        // Hide edit buttons until user data is loaded
        const usernameEditBtn = document.getElementById('usernameEditBtn');
        const editStatContainer = document.getElementById('editStatContainer');
        if (usernameEditBtn) usernameEditBtn.style.display = 'none';
        if (editStatContainer) editStatContainer.style.display = 'none';

    if (!uid) { document.getElementById('profileUsername').textContent = 'Profile not found'; return; }

    const profile = await getProfile(uid);
    if (!profile) { document.getElementById('profileUsername').textContent = 'Profile not found'; return; }

    currentProfile = profile;
    document.title = `${profile.username} — Cloud Beacon`;
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'No bio yet.';
    document.getElementById('profileJoined').textContent = 'Joined ' + new Date(profile.joinedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    document.getElementById('bioInput').value = profile.bio || '';
    document.getElementById('bioInputModal').value = profile.bio || '';

    // Load custom CSS
    if (profile.customCSS) {
        document.getElementById('customProfileCSS').textContent = profile.customCSS;
        document.getElementById('customCSSInput').value = profile.customCSS;
    }

    // Load embeds
    if (profile.embeds && profile.embeds.length > 0) {
        displayEmbeds(profile.embeds);
    }

    // Avatar initial
    const avatar = document.getElementById('profileAvatar');
    if (profile.photoURL) {
        avatar.style.backgroundImage = `url(${profile.photoURL})`;
        avatar.style.backgroundSize = 'cover';
        avatar.textContent = '';
    } else {
        avatar.textContent = profile.username[0].toUpperCase();
    }

    // Show votes tab only for profile owner (owner-only private data)
    const votesStatContainer = document.getElementById('votesStatContainer');
    const isOwner = auth.currentUser && auth.currentUser.uid === uid;
    if (votesStatContainer) {
        votesStatContainer.style.display = isOwner ? 'flex' : 'none';
    }

    // Show work tab for profile owner (shows their bids and awarded jobs)
    const workStatContainer = document.getElementById('workStatContainer');
    if (workStatContainer) {
        workStatContainer.style.display = isOwner ? 'flex' : 'none';
    }

    // Show edit buttons AFTER profile loads if user is owner
    if (isOwner) {
        if (usernameEditBtn) usernameEditBtn.style.display = 'inline-block';
        if (editStatContainer) editStatContainer.style.display = 'flex';
    }

    // Display user skills
    displayProfileSkills();

    // Load work data early if owner (to populate work count)
    if (isOwner) {
        loadWork();
    }

    // Handle follow button visibility
    const followBtn = document.getElementById('followBtn');
    const messageBtn = document.getElementById('messageBtn');
    const followersStatContainer = document.getElementById('followersStatContainer');
    const followingStatContainer = document.getElementById('followingStatContainer');
    
    if (followBtn && followersStatContainer && followingStatContainer) {
        if (isOwner) {
            // Hide follow button and show stats for own profile
            followBtn.style.display = 'none';
            if (messageBtn) messageBtn.style.display = 'none';
            followersStatContainer.style.display = 'flex';
            followingStatContainer.style.display = 'flex';
        } else {
            // Show follow button and stats for other profiles
            followBtn.style.display = 'inline-block';
            followersStatContainer.style.display = 'flex';
            followingStatContainer.style.display = 'flex';
            
            // Check if user can message this person
            if (messageBtn && typeof MessagingSystem !== 'undefined') {
                MessagingSystem.canMessage(uid).then(canMsg => {
                    if (canMsg) {
                        messageBtn.style.display = 'inline-block';
                    } else {
                        messageBtn.style.display = 'none';
                    }
                }).catch(err => {
                    console.error('[MessagingSystem] Error checking message permission:', err);
                });
            } else if (messageBtn) {
                // Fallback: Show button anyway if MessagingSystem not loaded yet
                messageBtn.style.display = 'inline-block';
            }
        }
    }

    // Load following counts
    if (window.FollowSystem) {
        loadFollowingCounts();
    }

    loadActivity();
    loadProjects();
    if (isOwner) loadVotes();
    
    // Signal that content is loaded once profile data is rendered
    if (typeof LoadingManager !== 'undefined') {
        setTimeout(() => {
            LoadingManager.setContentReady();
        }, 100);
    }
}

function displayEmbeds(embeds) {
    const section = document.getElementById('profileMediaSection');
    const container = document.getElementById('profileMedia');
    
    if (!embeds || embeds.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = embeds.map((embed, idx) => {
        if (embed.type === 'youtube') {
            return `
                <div class="profile-media-item">
                    <iframe width="100%" height="300px" src="${embed.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>`;
        } else if (embed.type === 'vimeo') {
            return `
                <div class="profile-media-item">
                    <iframe src="${embed.url}" width="100%" height="300px" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
                </div>`;
        } else if (embed.type === 'spotify') {
            return `
                <div class="profile-media-item">
                    <iframe src="${embed.url}" width="100%" height="380px" frameborder="0" allowtransparency="true" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                </div>`;
        } else if (embed.type === 'soundcloud') {
            return `
                <div class="profile-media-item">
                    <iframe width="100%" height="166px" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(embed.url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
                </div>`;
        }
        return '';
    }).join('');
}

async function loadActivity() {
    // Load activity: posts and all comments (VOTES go only to votes tab)
    try {
        console.log('Loading activity for user:', uid);
        
        // Helper function - same as feed formatting
        function timeAgo(date) {
            if (!date) return '';
            const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
            if (seconds < 60) return `${seconds}s`;
            const mins = Math.floor(seconds / 60);
            if (mins < 60) return `${mins}m`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `${hours}h`;
            const days = Math.floor(hours / 24);
            return `${days}d`;
        }

        // 1. Load posts authored by user (from feed)
        const feedSnap = await getDocs(collection(db, 'feed'));
        const posts = feedSnap.docs
            .filter(d => d.data().authorId === uid)
            .map(d => ({ 
                id: d.id, 
                ...d.data(), 
                activityType: 'post',
                source: 'feed'
            }));
        console.log('Posts found:', posts.length);

        // 2. Load comments on feed posts authored by user
        const feedComments = [];
        for (const feedDoc of feedSnap.docs) {
            const commentsSnap = await getDocs(collection(db, 'feed', feedDoc.id, 'comments'));
            for (const commentDoc of commentsSnap.docs) {
                const commentData = commentDoc.data();
                if (commentData.authorId === uid) {
                    feedComments.push({
                        id: commentDoc.id,
                        postId: feedDoc.id,
                        postContent: feedDoc.data().content || feedDoc.data().title || 'Untitled',
                        ...commentData,
                        createdAt: commentData.createdAt,
                        activityType: 'comment',
                        source: 'feed-comment'
                    });
                }
            }
        }
        console.log('Feed comments found:', feedComments.length);

        // 3. Load project comments/chat authored by user
        const projectComments = [];
        const projectsQuery = await getDocs(collection(db, 'projects'));
        
        for (const pDoc of projectsQuery.docs) {
            const projectData = pDoc.data();
            
            // Get all chat messages in this project
            const chatSnap = await getDocs(collection(db, 'projects', pDoc.id, 'chat'));
            for (const chatDoc of chatSnap.docs) {
                const chatData = chatDoc.data();
                if (chatData.authorId === uid) {
                    projectComments.push({
                        id: chatDoc.id,
                        projectId: pDoc.id,
                        projectTitle: projectData.title,
                        projectCategory: projectData.category,
                        content: chatData.content,
                        createdAt: chatData.createdAt,
                        activityType: 'comment',
                        source: 'project-chat'
                    });
                }
            }
        }
        
        console.log('Project comments found:', projectComments.length);

        // Combine all activities and sort by date (NO VOTES in activity feed)
        const allActivities = [
            ...posts,
            ...feedComments,
            ...projectComments
        ].sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        console.log('Total activities:', allActivities.length);

        // Update stats - posts from feed only
        document.getElementById('statPosts').textContent = posts.length;

        // Render activity
        const container = document.getElementById('profileActivity');
        if (!allActivities.length) {
            container.innerHTML = '<p class="profile-empty">No activity yet.</p>';
            return;
        }

        container.innerHTML = allActivities.map(item => {
            const createdAtDate = item.createdAt ? new Date(item.createdAt.seconds * 1000) : null;
            const date = createdAtDate ? timeAgo(createdAtDate) : 'Unknown';
            // Use current profile username if this is the viewed user's activity
            const displayName = (item.authorId === uid && currentProfile) ? currentProfile.username : (item.authorName || 'Guest');
            const initials = (displayName.split(' ').map(s=>s[0]).join('').slice(0,2)).toUpperCase();
            const photoURL = (item.authorId === uid && currentProfile && currentProfile.photoURL) ? currentProfile.photoURL : item.photoURL || null;
            const avatarHtml = photoURL 
                ? `<div class="avatar" style="background-image:url('${photoURL}'); background-size:cover;"></div>`
                : `<div class="avatar">${initials}</div>`;
            
            if (item.activityType === 'post') {
                return `
                    <div class="post" style="margin-bottom:16px;">
                        <div class="post-header">
                            ${avatarHtml}
                            <div class="post-meta">
                                <div class="author"><a href="profile.html?uid=${item.authorId}">${displayName}</a></div>
                                <div class="time">${date}</div>
                            </div>
                        </div>
                        <p style="margin:6px 0;">${item.content}</p>
                    </div>`;
            } else if (item.activityType === 'comment') {
                if (item.source === 'feed-comment') {
                    return `
                        <div class="post" style="margin-bottom:16px;opacity:0.85;">
                            <div class="post-header">
                                ${avatarHtml}
                                <div class="post-meta">
                                    <div class="author"><a href="profile.html?uid=${item.authorId}">${displayName}</a> <span style="color:#999;font-size:12px;">commented</span></div>
                                    <div class="time">${date}</div>
                                </div>
                            </div>
                            <p style="margin:6px 0;color:#666;font-size:13px;"><em>"${item.postContent.substring(0, 60)}${item.postContent.length > 60 ? '...' : ''}"</em></p>
                            <p style="margin:6px 0;padding-left:12px;border-left:3px solid #ddd;">${item.content}</p>
                        </div>`;
                } else {
                    // Project comment
                    const catColors = { Physical: '#f59f00', Inventive: '#3b82f6', Community: '#ec4899', legislative: '#0ca678' };
                    const color = catColors[item.projectCategory] || '#5c7cfa';
                    return `
                        <div class="post" style="margin-bottom:16px;opacity:0.85;">
                            <div class="post-header">
                                ${avatarHtml}
                                <div class="post-meta">
                                    <div class="author"><a href="profile.html?uid=${item.authorId}">${displayName}</a> <span style="color:#999;font-size:12px;">commented on</span> <a href="project.html?id=${item.projectId}" style="color:${color};">${item.projectTitle}</a></div>
                                    <div class="time">${date}</div>
                                </div>
                            </div>
                            <p style="margin:6px 0;padding-left:12px;border-left:3px solid ${color};">${item.content}</p>
                        </div>`;
                }
            }
            return '';
        }).join('');

    } catch (err) {
        console.error('Error loading activity:', err);
        document.getElementById('profileActivity').innerHTML = '<p class="profile-empty">Error loading activity.</p>';
    }
}

async function loadProjects() {
    // Load projects the user is a member of (from back-references)
    const snap = await getDocs(collection(db, 'users', uid, 'projects'));
    const projectRefs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    document.getElementById('statProjects').textContent = projectRefs.length;

    const container = document.getElementById('profileProjects');
    if (!projectRefs.length) { container.innerHTML = '<p class="profile-empty">No projects yet.</p>'; return; }

    // Fetch each project's details
    const projects = await Promise.all(projectRefs.map(async ref => {
        try {
            const basePath = ref.type === 'legislation' ? 'feed' : 'projects';
            const pSnap = await getDoc(doc(db, basePath, ref.projectId || ref.id));
            return pSnap.exists() ? { ...pSnap.data(), id: pSnap.id, memberRole: ref.role, type: ref.type } : null;
        } catch { return null; }
    }));

    const valid = projects.filter(Boolean);
    const catColors = { Physical: '#f59f00', Inventive: '#3b82f6', Community: '#ec4899', legislative: '#0ca678' };
    const catIcons  = { Physical: '🏗️', Inventive: '💡', Community: '🤝', legislative: '🏛️' };

    container.innerHTML = valid.map(p => {
        const cat = (p.category || p._category || 'project').toLowerCase();
        const color = catColors[p.category] || catColors[cat] || '#5c7cfa';
        const icon  = catIcons[p.category]  || catIcons[cat]  || '📁';
        const href  = p.type === 'legislation'
            ? `project.html?id=${p.id}&type=legislation`
            : `project.html?id=${p.id}`;
        return `
            <div class="profile-project-card">
                <div class="profile-project-tab" style="background:${color}">${icon} ${p.category || 'Project'}</div>
                <div class="profile-project-body">
                    <a href="${href}" class="profile-project-title">${p.title}</a>
                    <span class="profile-project-role">${p.memberRole || 'Member'}</span>
                </div>
            </div>`;
    }).join('');
}

async function loadVotes() {
    try {
        // Security check: Only allow viewing own votes (owner-only private data)
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
            document.getElementById('profileVotes').innerHTML = '<p class="profile-empty">You can only view your own votes.</p>';
            return;
        }

        const allVotes = [];
        const projectsQuery = await getDocs(collection(db, 'projects'));
        
        for (const pDoc of projectsQuery.docs) {
            const voteSnap = await getDoc(doc(db, 'projects', pDoc.id, 'votes', uid));
            if (voteSnap.exists() && voteSnap.data().type) {
                allVotes.push({
                    projectId: pDoc.id,
                    projectTitle: pDoc.data().title,
                    projectCategory: pDoc.data().category,
                    voteType: voteSnap.data().type,
                    timestamp: voteSnap.data().timestamp || { seconds: Math.floor(Date.now() / 1000) }
                });
            }
        }

        // Sort by most recent
        allVotes.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

        // Update votes count
        document.getElementById('statVotes').textContent = allVotes.length;

        const container = document.getElementById('profileVotes');
        if (!allVotes.length) {
            container.innerHTML = '<p class="profile-empty">No votes yet.</p>';
            return;
        }

        const catColors = { Physical: '#f59f00', Inventive: '#3b82f6', Community: '#ec4899', legislative: '#0ca678' };
        const color = (cat) => catColors[cat] || '#5c7cfa';

        container.innerHTML = allVotes.map(vote => {
            const date = new Date(vote.timestamp.seconds * 1000).toLocaleDateString('en-GB');
            const time = new Date(vote.timestamp.seconds * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const voteEmoji = vote.voteType === 'up' ? '👍' : '👎';
            const voteText = vote.voteType === 'up' ? 'Approved' : 'Opposed';
            const catColor = color(vote.projectCategory);
            
            return `
                <div class="vote-item">
                    <div class="vote-icon" style="background:${vote.voteType === 'up' ? '#d4edda' : '#f8d7da'};color:${vote.voteType === 'up' ? '#155724' : '#721c24'};">
                        ${voteEmoji}
                    </div>
                    <div class="vote-details">
                        <div style="font-weight:600;color:#333;">${voteText}</div>
                        <a href="project.html?id=${vote.projectId}" style="color:${catColor};text-decoration:none;font-size:13px;margin-top:2px;display:inline-block;">${vote.projectTitle}</a>
                        <div style="font-size:11px;color:#999;margin-top:4px;">${date} at ${time}</div>
                    </div>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('Error loading votes:', err);
        document.getElementById('profileVotes').innerHTML = '<p class="profile-empty">Error loading votes.</p>';
    }
}

async function loadWork() {
    try {
        // Load user's bids from all projects
        const bids = [];
        const currentUserEmail = auth.currentUser?.email;
        
        console.log('loadWork() - Current user email:', currentUserEmail);
        
        const projectsQuery = await getDocs(collection(db, 'projects'));
        console.log(`Found ${projectsQuery.docs.length} total projects`);
        
        for (const pDoc of projectsQuery.docs) {
            const projectId = pDoc.id;
            const projectData = pDoc.data();
            
            console.log(`Checking project: ${projectId}`);
            
            // Get all tasks in the project
            const tasksQuery = await getDocs(collection(db, 'projects', projectId, 'plan_tasks'));
            console.log(`  -> Found ${tasksQuery.docs.length} tasks in this project`);
            
            for (const tDoc of tasksQuery.docs) {
                const taskId = tDoc.id;
                const taskData = tDoc.data();
                
                // Get bids for this task
                const bidsQuery = await getDocs(collection(db, 'projects', projectId, 'plan_tasks', taskId, 'bids'));
                
                console.log(`    Task ${taskId} in project ${projectId} has ${bidsQuery.docs.length} bids`);
                
                for (const bDoc of bidsQuery.docs) {
                    const bidData = bDoc.data();
                    console.log(`      Bid ${bDoc.id} - bidderEmail: "${bidData.bidderEmail}" vs current: "${currentUserEmail}"`);
                    
                    // Check if this bid is from the current user (email match)
                    if (bidData.bidderEmail === currentUserEmail) {
                        console.log('      ✓ Bid matches current user, adding to results');
                        bids.push({
                            projectId: projectId,
                            projectTitle: projectData.title,
                            projectCategory: projectData.category,
                            taskId: taskId,
                            taskName: taskData.name || 'Unnamed Task',
                            bidAmount: bidData.amount,
                            bidderName: bidData.bidderName,
                            bidDescription: bidData.notes || '',
                            bidDate: bidData.createdAt || { seconds: Math.floor(Date.now() / 1000) },
                            bidId: bDoc.id
                        });
                    }
                }
            }
        }
        
        console.log('All bids found:', bids.length);
        
        // Sort by most recent
        bids.sort((a, b) => b.bidDate.seconds - a.bidDate.seconds);
        
        // Update work count
        const workCount = bids.length;
        document.getElementById('statWork').textContent = workCount;
        
        const container = document.getElementById('profileWork');
        if (!bids.length) {
            container.innerHTML = '<p class="profile-empty">No bids yet.</p>';
            return;
        }
        
        container.innerHTML = bids.map(bid => {
            const date = new Date(bid.bidDate.seconds * 1000).toLocaleDateString('en-GB');
            const statusColor = '#3b82f6';
            
            return `
                <div class="activity-item" style="border-left:3px solid ${statusColor};">
                    <div style="flex:1;">
                        <div style="font-weight:600;color:#fff;">
                            Bid on <a href="project.html?id=${bid.projectId}" style="color:#3b82f6;text-decoration:none;">${escapeHtml(bid.projectTitle)}</a>
                        </div>
                        <div style="font-size:13px;color:#bbb;margin-top:4px;">
                            Task: <strong>${escapeHtml(bid.taskName)}</strong>
                        </div>
                        <div style="font-size:12px;color:#999;margin-top:4px;">
                            by ${escapeHtml(bid.bidderName)}
                        </div>
                        ${bid.bidDescription ? `<div style="font-size:12px;color:#999;margin-top:4px;">Note: ${escapeHtml(bid.bidDescription)}</div>` : ''}
                        <div style="font-size:11px;color:#666;margin-top:6px;">
                            ${date} • £${bid.bidAmount ? bid.bidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                        </div>
                    </div>
                </div>`;
        }).join('');
        
    } catch (err) {
        console.error('Error loading work:', err);
        document.getElementById('profileWork').innerHTML = '<p class="profile-empty">Error loading work history.</p>';
    }
}

function switchProfileTab(tab) {
    document.querySelectorAll('.profile-tab').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.tab === tab));
    document.querySelectorAll('.profile-tab-panel').forEach(panel =>
        panel.classList.toggle('active', panel.id === `profile-panel-${tab}`));
    
    // Load votes when switching to votes tab
    if (tab === 'votes') {
        loadVotes();
    }
    
    // Load work when switching to work tab
    if (tab === 'work') {
        loadWork();
    }
}

function toggleBioEdit() {
    const section = document.getElementById('editBioSection');
    const bioEl   = document.getElementById('profileBio');
    const isOpen  = section.style.display !== 'none';
    section.style.display = isOpen ? 'none' : 'block';
    bioEl.style.display   = isOpen ? 'block' : 'none';
}

function toggleCustomizationEdit() {
    const section = document.getElementById('customizationSection');
    const isOpen = section.style.display !== 'none';
    section.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        loadEmbedsList();
    }
}

function switchCustomizationTab(tab) {
    document.querySelectorAll('.customization-tab').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.tab === tab));
    document.querySelectorAll('.customization-tab-panel').forEach(panel =>
        panel.classList.toggle('active', panel.id === `customization-${tab}`));
}

async function loadEmbedsList() {
    const embedsList = document.getElementById('embedsList');
    if (!currentProfile || !currentProfile.embeds || currentProfile.embeds.length === 0) {
        embedsList.innerHTML = '<p style="font-size:12px;color:#999;text-align:center;">No embeds yet</p>';
        return;
    }

    embedsList.innerHTML = currentProfile.embeds.map((embed, idx) => `
        <div style="padding:12px;border:1px solid #eee;border-radius:4px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="font-size:13px;font-weight:600;color:#333;">${embed.type.toUpperCase()}</div>
                <div style="font-size:11px;color:#999;margin-top:2px;">${embed.url.substring(0, 60)}...</div>
            </div>
            <button onclick="window.removeEmbed(${idx})" class="cancel-btn" style="padding:4px 8px;font-size:12px;">Remove</button>
        </div>
    `).join('');
}

function addEmbed() {
    const url = document.getElementById('embedURLInput').value.trim();
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    const embed = sanitizeEmbedURL(url);
    if (!embed) {
        alert('Sorry, this URL is not supported. Try YouTube, Spotify, SoundCloud, Vimeo, Twitch, or Codepen.');
        return;
    }

    if (!currentProfile.embeds) {
        currentProfile.embeds = [];
    }

    currentProfile.embeds.push(embed);
    document.getElementById('embedURLInput').value = '';
    loadEmbedsList();
    
    // Auto-save to database
    saveMediaToDatabase();
}

async function removeEmbed(idx) {
    if (currentProfile.embeds) {
        currentProfile.embeds.splice(idx, 1);
        loadEmbedsList();
        
        // Auto-save to database
        saveMediaToDatabase();
    }
}

async function saveMediaToDatabase() {
    try {
        const updates = {
            embeds: currentProfile.embeds || []
        };
        await updateProfileCustomization(updates);
        // Update live display
        displayEmbeds(currentProfile.embeds);
    } catch (err) {
        console.error('Error saving media:', err);
        alert('Error saving media to profile');
    }
}

async function saveCustomization() {
    try {
        const customCSS = document.getElementById('customCSSInput').value.trim();
        
        // Simple validation - just check it's not too long (prevent abuse)
        if (customCSS.length > 5000) {
            alert('CSS is too long (max 5000 characters)');
            return;
        }

        // Update the live CSS
        document.getElementById('customProfileCSS').textContent = customCSS;

        // Save to database
        const updates = {
            customCSS: customCSS,
            embeds: currentProfile.embeds || []
        };

        await updateProfileCustomization(updates);
        toggleCustomizationEdit();
        alert('Profile customization saved!');
    } catch (err) {
        console.error('Error saving customization:', err);
        alert('Error saving customization');
    }
}

async function handleBioUpdate() {
    const bio = document.getElementById('bioInput').value.trim();
    await updateBio(bio);
    document.getElementById('profileBio').textContent = bio || 'No bio yet.';
    toggleBioEdit();
}

async function handleBioUpdateFromModal() {
    const bio = document.getElementById('bioInputModal').value.trim();
    await updateBio(bio);
    document.getElementById('profileBio').textContent = bio || 'No bio yet.';
    document.getElementById('bioInput').value = bio;
    document.getElementById('editModal').style.display = 'none';
}

async function handleUsernameUpdateFromModal() {
    const usernameInput = document.getElementById('usernameInputModal');
    const newUsername = usernameInput.value.trim();
    if (!newUsername) { alert('Username cannot be empty'); return; }
    if (!(auth.currentUser && auth.currentUser.uid === uid)) return;
    
    try {
        await updateProfileCustomization({ username: newUsername });
        currentProfile.username = newUsername;
        document.getElementById('profileUsername').textContent = newUsername;
        document.getElementById('editModal').style.display = 'none';
        alert('Username updated!');
    } catch (error) {
        console.error('Error updating username:', error);
        alert('Error updating username');
    }
}

function openEditModal() {
    const usernameInput = document.getElementById('usernameInputModal');
    const bioInput = document.getElementById('bioInputModal');
    if (usernameInput && currentProfile) {
        usernameInput.value = currentProfile.username || '';
    }
    if (bioInput && currentProfile) {
        bioInput.value = currentProfile.bio || '';
    }
    
    // Populate skills dropdown and select user's existing skills
    populateProfileSkillsDropdown();
    selectUserSkills();
    
    document.getElementById('editModal').style.display = 'flex';
}

function populateProfileSkillsDropdown() {
    const select = document.getElementById('profileSkillsInput');
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '';
    
    // Create optgroups for each category
    Object.entries(SKILLS_BY_CATEGORY).forEach(([category, skills]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        skills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill;
            option.textContent = skill;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    });
    
    // Add event listener to update tags when selection changes
    select.onchange = updateProfileSelectedSkillsTags;
}

function selectUserSkills() {
    const select = document.getElementById('profileSkillsInput');
    if (!select) return;
    
    // Clear all selections first
    Array.from(select.options).forEach(opt => opt.selected = false);
    
    // Select the skills that match the user's skills
    if (currentProfile && currentProfile.skills && Array.isArray(currentProfile.skills)) {
        currentProfile.skills.forEach(skill => {
            const option = Array.from(select.options).find(opt => opt.value === skill);
            if (option) option.selected = true;
        });
    }
    
    // Update the visual tags
    updateProfileSelectedSkillsTags();
}

function updateProfileSelectedSkillsTags() {
    const select = document.getElementById('profileSkillsInput');
    const tagsDiv = document.getElementById('profileSelectedSkillsTags');
    if (!select || !tagsDiv) return;
    
    // Get selected values
    const selectedSkills = Array.from(select.selectedOptions).map(option => option.value);
    
    // Create tags for each selected skill
    tagsDiv.innerHTML = selectedSkills.map(skill => 
        `<span style="background:#e8f5ff;color:#0066cc;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px;">
            ${escapeHtml(skill)}
            <button type="button" onclick="removeProfileSkillTag('${skill}')" style="background:none;border:none;color:#0066cc;cursor:pointer;font-weight:bold;padding:0;font-size:12px;">✕</button>
        </span>`
    ).join('');
}

function removeProfileSkillTag(skill) {
    const select = document.getElementById('profileSkillsInput');
    if (!select) return;
    
    // Deselect the option
    Array.from(select.options).forEach(option => {
        if (option.value === skill) {
            option.selected = false;
        }
    });
    
    updateProfileSelectedSkillsTags();
}

async function handleSkillsUpdateFromModal() {
    // Get selected skills
    const select = document.getElementById('profileSkillsInput');
    if (!select) return;
    
    const skills = Array.from(select.selectedOptions).map(opt => opt.value);
    
    try {
        // Update user profile with skills
        await updateProfileCustomization({ skills: skills });
        currentProfile.skills = skills;
        
        // Display skills on profile
        displayProfileSkills();
        
        document.getElementById('editModal').style.display = 'none';
        alert('Skills updated!');
    } catch (error) {
        console.error('Error updating skills:', error);
        alert('Error updating skills');
    }
}

function displayProfileSkills() {
    if (!currentProfile || !currentProfile.skills || currentProfile.skills.length === 0) {
        const skillsSection = document.getElementById('profileSkillsSection');
        if (skillsSection) skillsSection.style.display = 'none';
        return;
    }
    
    // Create or update the skills section
    let skillsSection = document.getElementById('profileSkillsSection');
    if (!skillsSection) {
        // Create the section if it doesn't exist
        skillsSection = document.createElement('div');
        skillsSection.id = 'profileSkillsSection';
        skillsSection.style.padding = '16px';
        skillsSection.style.marginTop = '16px';
        skillsSection.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        
        const profileStats = document.querySelector('.profile-stats');
        profileStats.parentElement.insertBefore(skillsSection, profileStats.nextElementSibling);
    }
    
    skillsSection.style.display = 'block';
    skillsSection.innerHTML = `
        <h3 style="margin:0 0 12px 0; font-size:14px; color:#999;">Skills</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${currentProfile.skills.map(skill => 
                `<span style="background:#1a472a;color:#4ade80;padding:6px 12px;border-radius:16px;font-size:12px;font-weight:500;">
                    ${escapeHtml(skill)}
                </span>`
            ).join('')}
        </div>
    `;
}

function openCustomizationModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('customizationSection').style.display = 'block';
}

// ============================================
// FOLLOWING SYSTEM FUNCTIONS
// ============================================

async function loadFollowingCounts() {
    try {
        if (!window.FollowSystem) return;
        
        const followerCount = await window.FollowSystem.getFollowerCount(uid);
        const followingCount = await window.FollowSystem.getFollowingCount(uid);
        
        document.getElementById('followersCount').textContent = followerCount;
        document.getElementById('followingCount').textContent = followingCount;
    } catch (error) {
        console.error('Error loading following counts:', error);
    }
}

window.handleFollowClick = async function() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please sign in to follow users');
            return;
        }

        if (currentUser.uid === uid) {
            alert('You cannot follow your own profile');
            return;
        }

        const followBtn = document.getElementById('followBtn');
        followBtn.disabled = true;

        if (!window.FollowSystem) {
            alert('Follow system not loaded');
            return;
        }

        // Toggle follow state
        const isNowFollowing = await window.FollowSystem.toggleFollow(currentUser.uid, uid);
        
        // Update button text
        followBtn.textContent = isNowFollowing ? 'Following' : 'Follow';
        followBtn.style.background = isNowFollowing ? '#666' : '#3b82f6';
        
        // Reload counts
        await loadFollowingCounts();
        
        followBtn.disabled = false;
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Error updating follow status');
        document.getElementById('followBtn').disabled = false;
    }
};

window.openMessageWindow = async function() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please sign in to message users');
            return;
        }

        if (currentUser.uid === uid) {
            alert('You cannot message yourself');
            return;
        }

        // Check if they can message
        if (typeof MessagingSystem !== 'undefined') {
            const canMsg = await MessagingSystem.canMessage(uid);
            if (!canMsg) {
                alert('You can only message followers or people who follow you');
                return;
            }
        }

        // Open messaging modal and find/select the conversation
        if (typeof MessagingUI !== 'undefined') {
            MessagingUI.openModal();
            
            // After modal opens, load conversations and find the one with this user
            setTimeout(async () => {
                const conversations = await MessagingSystem.getConversations();
                const existingConv = conversations.find(c => {
                    const other = MessagingSystem.getOtherUserId(c);
                    return other === uid;
                });
                
                if (existingConv) {
                    MessagingUI.selectConversation(existingConv.id);
                } else {
                    // Create a new conversation by loading and showing placeholder
                    MessagingUI.currentConversationId = MessagingSystem.getConversationId(currentUser.uid, uid);
                    const newConvData = {
                        id: MessagingUI.currentConversationId,
                        participantIds: [currentUser.uid, uid],
                        participantNames: {},
                        participantAvatars: {},
                        lastMessage: '',
                        updatedAt: new Date()
                    };
                    
                    // Get recipient user data
                    const { db } = await import('./firebase.js');
                    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                    const recipientDoc = await getDoc(doc(db, 'users', uid));
                    const recipientData = recipientDoc.data() || {};
                    
                    newConvData.participantNames = {
                        [currentUser.uid]: currentUser.displayName || 'You',
                        [uid]: recipientData.username || 'Unknown'
                    };
                    newConvData.participantAvatars = {
                        [currentUser.uid]: window.currentUserAvatar || '',
                        [uid]: recipientData.photoURL || ''
                    };
                    
                    await MessagingUI.selectConversation(MessagingUI.currentConversationId);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error opening message window:', error);
        alert('Error opening message window');
    }
};

window.openFollowersModal = async function() {
    try {
        const modal = document.getElementById('followersModal');
        const list = document.getElementById('followersList');
        
        if (!window.FollowSystem) {
            list.innerHTML = '<p style="color:#999; text-align:center;">Follow system not loaded</p>';
            modal.style.display = 'flex';
            return;
        }

        list.innerHTML = '<p style="color:#999; text-align:center;">Loading...</p>';
        modal.style.display = 'flex';

        // Force refresh followers list
        const followers = await window.FollowSystem.getFollowers(uid);
        const currentUser = auth.currentUser;

        if (!followers || followers.length === 0) {
            list.innerHTML = '<p style="color:#999; text-align:center;">No followers yet</p>';
            return;
        }

        // Render follower list
        let html = '';
        for (const follower of followers) {
            if (!follower || !follower.id) continue;
            
            const isMutual = currentUser 
                ? await window.FollowSystem.isMutualFollow(currentUser.uid, follower.id)
                : false;

            const isFollowingThisUser = currentUser
                ? await window.FollowSystem.isFollowing(currentUser.uid, follower.id)
                : false;

            const username = follower.displayName || follower.username || 'User';
            const avatarText = username ? username[0].toUpperCase() : '?';
            const photoURL = follower.photoURL || null;
            const avatarHtml = photoURL 
                ? `<div class="follow-user-avatar" style="background-image:url('${photoURL}'); background-size:cover;"></div>`
                : `<div class="follow-user-avatar">${avatarText}</div>`;
            const followButtonClass = isFollowingThisUser ? 'modal-follow-btn-following' : 'modal-follow-btn';
            const followButtonText = isFollowingThisUser ? 'Following' : 'Follow';

            html += `
                <div class="follow-user-item">
                    <div class="follow-user-info">
                        ${avatarHtml}
                        <div class="follow-user-details">
                            <div class="follow-user-name">
                                <a href="profile.html?uid=${follower.id}">${username}</a>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${currentUser && currentUser.uid !== follower.id ? `<button class="modal-follow-btn ${followButtonClass}" onclick="window.handleModalFollowClick('${follower.id}', this)">${followButtonText}</button>` : ''}
                        ${currentUser && currentUser.uid !== follower.id ? `<button id="msgBtn-${follower.id}" class="modal-message-btn" onclick="window.handleModalMessageClick('${follower.id}')" style="display:none; padding:6px 12px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">💬 Message</button>` : ''}
                    </div>
                </div>
            `;
        }

        list.innerHTML = html || '<p style="color:#999; text-align:center;">No followers yet</p>';
        
        // Check message permissions for each follower
        if (typeof MessagingSystem !== 'undefined' && currentUser) {
            followers.forEach(follower => {
                if (currentUser.uid !== follower.id) {
                    const msgBtn = document.getElementById(`msgBtn-${follower.id}`);
                    if (msgBtn) {
                        MessagingSystem.canMessage(follower.id).then(canMsg => {
                            if (canMsg) {
                                msgBtn.style.display = 'inline-block';
                            }
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading followers modal:', error);
        document.getElementById('followersList').innerHTML = '<p style="color:#999; text-align:center;">Error loading followers</p>';
    }
};
window.openFollowingModal = async function() {
    try {
        const modal = document.getElementById('followingModal');
        const list = document.getElementById('followingList');
        
        if (!window.FollowSystem) {
            list.innerHTML = '<p style="color:#999; text-align:center;">Follow system not loaded</p>';
            modal.style.display = 'flex';
            return;
        }

        list.innerHTML = '<p style="color:#999; text-align:center;">Loading...</p>';
        modal.style.display = 'flex';

        // Force refresh following list
        const following = await window.FollowSystem.getFollowing(uid);
        const currentUser = auth.currentUser;

        if (!following || following.length === 0) {
            list.innerHTML = '<p style="color:#999; text-align:center;">Not following anyone yet</p>';
            return;
        }

        // Render following list
        let html = '';
        for (const followedUser of following) {
            if (!followedUser || !followedUser.id) continue;
            
            const isMutual = currentUser 
                ? await window.FollowSystem.isMutualFollow(currentUser.uid, followedUser.id)
                : false;

            const isFollowingThisUser = currentUser
                ? await window.FollowSystem.isFollowing(currentUser.uid, followedUser.id)
                : false;

            const username = followedUser.displayName || followedUser.username || 'User';
            const avatarText = username ? username[0].toUpperCase() : '?';
            const photoURL = followedUser.photoURL || null;
            const avatarHtml = photoURL 
                ? `<div class="follow-user-avatar" style="background-image:url('${photoURL}'); background-size:cover;"></div>`
                : `<div class="follow-user-avatar">${avatarText}</div>`;
            const followButtonClass = isFollowingThisUser ? 'modal-follow-btn-following' : 'modal-follow-btn';
            const followButtonText = isFollowingThisUser ? 'Following' : 'Follow';

            html += `
                <div class="follow-user-item">
                    <div class="follow-user-info">
                        ${avatarHtml}
                        <div class="follow-user-details">
                            <div class="follow-user-name">
                                <a href="profile.html?uid=${followedUser.id}">${username}</a>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${currentUser && currentUser.uid !== followedUser.id ? `<button class="modal-follow-btn ${followButtonClass}" onclick="window.handleModalFollowClick('${followedUser.id}', this)">${followButtonText}</button>` : ''}
                        ${currentUser && currentUser.uid !== followedUser.id ? `<button id="msgBtn-${followedUser.id}" class="modal-message-btn" onclick="window.handleModalMessageClick('${followedUser.id}')" style="display:none; padding:6px 12px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">💬 Message</button>` : ''}
                    </div>
                </div>
            `;
        }

        list.innerHTML = html || '<p style="color:#999; text-align:center;">Not following anyone yet</p>';
        
        // Check message permissions for each following user
        if (typeof MessagingSystem !== 'undefined' && currentUser) {
            following.forEach(followedUser => {
                if (currentUser.uid !== followedUser.id) {
                    const msgBtn = document.getElementById(`msgBtn-${followedUser.id}`);
                    if (msgBtn) {
                        MessagingSystem.canMessage(followedUser.id).then(canMsg => {
                            if (canMsg) {
                                msgBtn.style.display = 'inline-block';
                            }
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading following modal:', error);
        document.getElementById('followingList').innerHTML = '<p style="color:#999; text-align:center;">Error loading following</p>';
    }
};

// Handle follow/unfollow in modals
window.handleModalFollowClick = async function(targetUserId, buttonElement) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please sign in first');
            return;
        }

        // Toggle follow
        const newFollowState = await window.FollowSystem.toggleFollow(currentUser.uid, targetUserId);
        
        // Update button appearance
        if (newFollowState) {
            buttonElement.textContent = 'Following';
            buttonElement.classList.add('modal-follow-btn-following');
        } else {
            buttonElement.textContent = 'Follow';
            buttonElement.classList.remove('modal-follow-btn-following');
        }
    } catch (error) {
        console.error('Error toggling follow in modal:', error);
        alert('Error updating follow status');
    }
};

window.handleModalMessageClick = async function(targetUserId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please sign in first');
            return;
        }

        if (currentUser.uid === targetUserId) {
            alert('You cannot message yourself');
            return;
        }

        // Check if they can message
        if (typeof MessagingSystem !== 'undefined') {
            const canMsg = await MessagingSystem.canMessage(targetUserId);
            if (!canMsg) {
                alert('You can only message followers or people who follow you');
                return;
            }
        }

        // Close the followers/following modals
        const followersModal = document.getElementById('followersModal');
        const followingModal = document.getElementById('followingModal');
        if (followersModal) followersModal.style.display = 'none';
        if (followingModal) followingModal.style.display = 'none';

        // Open messaging modal and load conversation with this user
        if (typeof MessagingUI !== 'undefined') {
            MessagingUI.openModal();
            
            // After modal opens, find or create the conversation
            setTimeout(async () => {
                const conversations = await MessagingSystem.getConversations();
                const existingConv = conversations.find(c => {
                    const other = MessagingSystem.getOtherUserId(c);
                    return other === targetUserId;
                });
                
                if (existingConv) {
                    MessagingUI.selectConversation(existingConv.id);
                } else {
                    // Create a new conversation entry
                    const convId = MessagingSystem.getConversationId(currentUser.uid, targetUserId);
                    const { db } = await import('./firebase.js');
                    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                    
                    const targetDoc = await getDoc(doc(db, 'users', targetUserId));
                    const targetData = targetDoc.data() || {};
                    
                    const newConvData = {
                        id: convId,
                        participantIds: [currentUser.uid, targetUserId],
                        participantNames: {
                            [currentUser.uid]: currentUser.displayName || 'You',
                            [targetUserId]: targetData.displayName || targetData.username || 'Unknown'
                        },
                        participantAvatars: {
                            [currentUser.uid]: currentUser.photoURL || '',
                            [targetUserId]: targetData.photoURL || ''
                        },
                        lastMessage: '',
                        updatedAt: new Date()
                    };
                    
                    MessagingUI.currentConversationId = convId;
                    await MessagingUI.selectConversation(convId);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error opening message from modal:', error);
        alert('Error opening message');
    }
};

// Close modals when clicking outside them
document.addEventListener('click', function(event) {
    const followersModal = document.getElementById('followersModal');
    const followingModal = document.getElementById('followingModal');
    
    if (event.target === followersModal) {
        followersModal.style.display = 'none';
    }
    if (event.target === followingModal) {
        followingModal.style.display = 'none';
    }
});

watchAuthState(function(user) {
    // Load user color settings
    if (user) {
        ColorPalette.setUserId(user.uid);
    } else {
        ColorPalette.clearUserId();
    }
    
    // Signal that palette is ready once color settings are loaded
    if (typeof LoadingManager !== 'undefined') {
        LoadingManager.setPaletteReady();
    }
    
    // Initialize messaging UI
    if (typeof MessagingUI !== 'undefined' && user) {
        MessagingUI.init();
    }
    
    if (user && user.uid === uid) {
        const editStatContainer = document.getElementById('editStatContainer');
        const usernameEditBtn = document.getElementById('usernameEditBtn');
        if (editStatContainer) editStatContainer.style.display = 'flex';
        if (usernameEditBtn) usernameEditBtn.style.display = 'inline-block';
    } else if (user && user.uid !== uid && window.FollowSystem) {
        // Update follow button state for other users' profiles
        updateFollowButtonState(user.uid, uid);
    }
});

async function updateFollowButtonState(currentUserId, targetUserId) {
    try {
        const followBtn = document.getElementById('followBtn');
        if (!followBtn) return;

        const isFollowing = await window.FollowSystem.isFollowing(currentUserId, targetUserId);
        followBtn.textContent = isFollowing ? 'Following' : 'Follow';
        followBtn.style.background = isFollowing ? '#666' : '#3b82f6';
    } catch (error) {
        console.error('Error updating follow button state:', error);
    }
}

window.switchProfileTab = switchProfileTab;
window.triggerAvatarUpload = async function() {
    if (!(auth.currentUser && auth.currentUser.uid === uid)) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 750KB limit for images
        const maxSize = 750 * 1024;
        if (file.size > maxSize) {
            alert(`Image must be smaller than 750KB. Current size: ${(file.size / 1024).toFixed(2)}KB`);
            return;
        }
        
        // Show upload progress
        const progressDiv = document.getElementById('avatarUploadProgress');
        if (progressDiv) progressDiv.style.display = 'block';
        
        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async function(event) {
                const base64Data = event.target.result.split(',')[1]; // Remove data:image/... prefix
                
                // Store in Firestore using updateProfileCustomization
                const photoURL = `data:${file.type};base64,${base64Data}`;
                await updateProfileCustomization({ photoURL });
                
                // Update profile
                currentProfile.photoURL = photoURL;
                const avatar = document.getElementById('profileAvatar');
                avatar.style.backgroundImage = `url(${photoURL})`;
                avatar.style.backgroundSize = 'cover';
                avatar.textContent = '';
                
                // Hide progress
                if (progressDiv) progressDiv.style.display = 'none';
                alert('Avatar updated!');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            if (progressDiv) progressDiv.style.display = 'none';
            alert('Error uploading avatar: ' + error.message);
        }
    };
    input.click();
};

window.toggleUsernameEdit = function() {
    if (!(auth.currentUser && auth.currentUser.uid === uid)) return;
    const usernameEl = document.getElementById('profileUsername');
    const editBtn = document.getElementById('usernameEditBtn');
    if (!usernameEl) return;
    if (document.getElementById('usernameEditInput')) return;
    const current = usernameEl.textContent;
    const input = document.createElement('input');
    input.id = 'usernameEditInput';
    input.type = 'text';
    input.value = current;
    input.style.fontSize = '22px';
    input.style.fontWeight = '700';
    input.style.marginRight = '8px';
    input.style.padding = '2px 8px';
    input.style.borderRadius = '6px';
    input.style.border = '1.5px solid #3b82f6';
    input.style.background = '#fff';
    input.style.color = '#222';
    input.style.width = '180px';
    input.onkeydown = function(e) {
        if (e.key === 'Enter') {
            window.saveUsernameEdit();
        } else if (e.key === 'Escape') {
            window.cancelUsernameEdit();
        }
    };
    usernameEl.style.display = 'none';
    editBtn.style.display = 'none';
    usernameEl.parentNode.insertBefore(input, usernameEl);
    input.focus();
    // Add save/cancel buttons
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'save-btn';
    saveBtn.onclick = window.saveUsernameEdit;
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.onclick = window.cancelUsernameEdit;
    input.parentNode.appendChild(saveBtn);
    input.parentNode.appendChild(cancelBtn);
};

window.saveUsernameEdit = async function() {
    const input = document.getElementById('usernameEditInput');
    if (!input) return;
    const newName = input.value.trim();
    if (!newName) { alert('Username cannot be empty'); return; }
    await updateProfileCustomization({ username: newName });
    // Update both currentProfile and DOM
    currentProfile.username = newName;
    document.getElementById('profileUsername').textContent = newName;
    document.getElementById('profileUsername').style.display = 'block';
    document.getElementById('usernameEditBtn').style.display = 'inline-block';
    input.nextSibling.remove(); // remove save btn
    input.nextSibling.remove(); // remove cancel btn
    input.remove();
    // Reload activity to show new username in all posts/comments
    loadActivity();
    alert('Username updated!');
};

window.cancelUsernameEdit = function() {
    const input = document.getElementById('usernameEditInput');
    if (!input) return;
    document.getElementById('profileUsername').style.display = 'block';
    document.getElementById('usernameEditBtn').style.display = 'inline-block';
    input.nextSibling.remove(); // remove save btn
    input.nextSibling.remove(); // remove cancel btn
    input.remove();
};
window.toggleBioEdit    = toggleBioEdit;
window.handleBioUpdate  = handleBioUpdate;
window.handleBioUpdateFromModal = handleBioUpdateFromModal;
window.handleUsernameUpdateFromModal = handleUsernameUpdateFromModal;
window.handleSkillsUpdateFromModal = handleSkillsUpdateFromModal;
window.removeProfileSkillTag = removeProfileSkillTag;
window.openEditModal = openEditModal;
window.openCustomizationModal = openCustomizationModal;
window.toggleCustomizationEdit = toggleCustomizationEdit;
window.switchCustomizationTab = switchCustomizationTab;
window.addEmbed = addEmbed;
window.removeEmbed = removeEmbed;
window.saveCustomization = saveCustomization;

loadProfile();