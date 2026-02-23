/**
 * Notifications System
 * Handles user notifications and notification preferences
 */

const NotificationsUI = {
    currentUserId: null,
    notificationFilters: {
        u2u_messages: true,
        post_votes_comments: true,
        post_reposts: true,
        project_votes: true,
        project_comments: true,
        project_reposts: true,
        project_bids: true,
        bid_accepted: true,
        user_follows_you: true,
        project_follows_you: true,
        join_project_request: true,
        project_role_change: true,
        emailOnFollower: true,
        emailOnMessage: true
    },
    userNotifications: [],
    unreadCount: 0,
    
    /**
     * Initialize notifications system
     */
    init(userId) {
        this.currentUserId = userId;
        this.setupModalHTML();
        this.loadNotificationPreferences();
        this.attachEventListeners();
        // Load and display unread notification badge immediately
        this.loadUnreadCount();
    },
    
    /**
     * Create notifications modal HTML structure
     */
    setupModalHTML() {
        if (document.getElementById('notificationsModal')) {
            console.log('Notifications modal already exists');
            return;
        }
        
        console.log('Creating notifications modal HTML');
        
        const modalHTML = `
            <!-- Main Notifications Modal -->
            <div id="notificationsModal" class="modal" style="display:none; z-index: 1000;">
                <div class="modal-content" style="width: 90%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; background: #1a1a1a; border: 1px solid #333; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); overflow: hidden;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #333; background: #1a1a1a;">
                        <h2 style="margin: 0; font-size: 20px; color: #fff;">Notifications</h2>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="NotificationsUI.clearAllNotifications()" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 600;">🗑️ Clear</button>
                            <button onclick="NotificationsUI.openPreferencesModal()" style="background: var(--color-primary, #3b82f6); color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 600;">⚙️ Settings</button>
                            <button class="modal-close" onclick="NotificationsUI.closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #fff;">✕</button>
                        </div>
                    </div>
                    
                    <!-- Notifications List Panel -->
                    <div id="notificationsListContainer" style="flex: 1; overflow-y: auto; padding: 20px; text-align: center;">
                        <div style="color: #888; padding: 40px 20px;">Loading notifications...</div>
                    </div>
                </div>
            </div>
            
            <!-- Preferences Modal -->
            <div id="notificationsPreferencesModal" class="modal" style="display:none; z-index: 1001;">
                <div class="modal-content" style="width: 90%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; background: #1a1a1a; border: 1px solid #333; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); overflow: hidden;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #333; background: #1a1a1a;">
                        <h2 style="margin: 0; font-size: 20px; color: #fff;">Notification Preferences</h2>
                        <button class="modal-close" onclick="NotificationsUI.closePreferencesModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #fff;">✕</button>
                    </div>
                    
                    <div style="flex: 1; overflow-y: auto; padding: 20px;">
                                
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <!-- U2U Messages -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-u2u" class="notification-checkbox" data-type="u2u_messages" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">💬 U2U Messages</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">New private messages</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Post Votes/Comments -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-post" class="notification-checkbox" data-type="post_votes_comments" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">📝 Post Activity</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">Votes and comments on your posts</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Project Votes -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-proj-votes" class="notification-checkbox" data-type="project_votes" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">👍 Project Votes</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">Votes on your projects (team members)</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Project Comments -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-proj-comments" class="notification-checkbox" data-type="project_comments" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">💬 Project Comments</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">Comments on your projects (team members)</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Project Bids -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-bids" class="notification-checkbox" data-type="project_bids" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">🤝 Project Bids</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">New bids on your projects (managers/sponsors)</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Bid Accepted -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-bid-accepted" class="notification-checkbox" data-type="bid_accepted" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">✅ Bid Accepted</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">Your bids have been accepted</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Post Reposts -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-post-reposts" class="notification-checkbox" data-type="post_reposts" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">🔄 Post Reposts</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">When someone reposts your posts</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Project Reposts -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-proj-reposts" class="notification-checkbox" data-type="project_reposts" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">🔄 Project Reposts</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">When someone reposts your projects</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Project Follows -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-proj-follows" class="notification-checkbox" data-type="project_follows_you" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">👁️ Project Follows</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">When someone follows your project</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Join Project Requests -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-join-requests" class="notification-checkbox" data-type="join_project_request" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">🙋 Join Project Requests</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">New requests to join your projects</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Project Role Changes -->
                                    <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                        <input type="checkbox" id="notif-role-change" class="notification-checkbox" data-type="project_role_change" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        <div style="flex: 1;">
                                            <div style="color: #fff; font-size: 14px; font-weight: 600;">🔑 Project Role Changes</div>
                                            <div style="color: #888; font-size: 12px; margin-top: 2px;">When your role changes in a project</div>
                                        </div>
                                    </label>
                                    
                                    <!-- Email Notifications Section -->
                                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #444;">
                                        <div style="color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 12px;">📧 Email Notifications</div>
                                        
                                        <!-- Email on New Follower -->
                                        <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                            <input type="checkbox" id="notif-email-follower" class="notification-checkbox" data-type="emailOnFollower" checked style="width: 18px; height: 18px; cursor: pointer;">
                                            <div style="flex: 1;">
                                                <div style="color: #fff; font-size: 14px; font-weight: 600;">👥 New Follower</div>
                                                <div style="color: #888; font-size: 12px; margin-top: 2px;">Receive email when someone follows you</div>
                                            </div>
                                        </label>
                                        
                                        <!-- Email on New Message -->
                                        <label class="notification-preference" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                                            <input type="checkbox" id="notif-email-message" class="notification-checkbox" data-type="emailOnMessage" checked style="width: 18px; height: 18px; cursor: pointer;">
                                            <div style="flex: 1;">
                                                <div style="color: #fff; font-size: 14px; font-weight: 600;">💌 New Message</div>
                                                <div style="color: #888; font-size: 12px; margin-top: 2px;">Receive email when you get a new message</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                
                        </div>
                    </div>
                    
                    <div style="padding: 15px 20px; border-top: 1px solid #333; background: #1a1a1a;">
                        <button onclick="NotificationsUI.savePreferences()" style="width: 100%; padding: 12px; background: var(--color-primary, #3b82f6); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">Save Preferences</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    /**
     * Open the notifications modal
     */
    openModal() {
        console.log('openModal called');
        const modal = document.getElementById('notificationsModal');
        if (modal) {
            console.log('Modal found, showing');
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            console.log('Calling loadNotifications');
            this.loadNotifications();
        } else {
            console.error('Notifications modal element not found!');
        }
    },
    
    /**
     * Close the notifications modal
     */
    closeModal() {
        const modal = document.getElementById('notificationsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * Open the preferences modal
     */
    openPreferencesModal() {
        const modal = document.getElementById('notificationsPreferencesModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }
    },
    
    /**
     * Close the preferences modal
     */
    closePreferencesModal() {
        const modal = document.getElementById('notificationsPreferencesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * Load user notification preferences from Firestore
     */
    async loadNotificationPreferences() {
        if (!this.currentUserId) return;
        
        try {
            const { db } = await import('./firebase.js');
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDocRef = doc(db, 'users', this.currentUserId);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists() && userDoc.data().notificationPreferences) {
                this.notificationFilters = {
                    ...this.notificationFilters,
                    ...userDoc.data().notificationPreferences
                };
                this.updatePreferenceCheckboxes();
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        }
    },
    
    /**
     * Update preference checkboxes based on loaded settings
     */
    updatePreferenceCheckboxes() {
        Object.keys(this.notificationFilters).forEach(key => {
            const checkbox = document.querySelector(`[data-type="${key}"]`);
            if (checkbox) {
                checkbox.checked = this.notificationFilters[key];
            }
        });
    },
    
    /**
     * Load notifications to display
     */
    async loadNotifications() {
        const container = document.getElementById('notificationsListContainer');
        if (!container) {
            console.error('Notifications container not found!');
            return;
        }
        
        console.log('Loading notifications for user:', this.currentUserId);
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Load user's notifications from Firestore
            const q = query(
                collection(db, 'notifications'),
                where('recipientId', '==', this.currentUserId)
            );
            console.log('Querying notifications for recipientId:', this.currentUserId);
            
            const snapshot = await getDocs(q);
            console.log('Query returned', snapshot.docs.length, 'notifications');
            
            this.userNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Notification data:', data);
                return {
                    id: doc.id,
                    ...data
                };
            });
            
            // Sort by timestamp (in case orderBy fails)
            this.userNotifications.sort((a, b) => {
                const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
                const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
                return bTime - aTime;
            });
            
            // Filter out read notifications (only show unread)
            const unreadNotifications = this.userNotifications.filter(n => !n.read);
            
            // Update the unread count for badge display
            this.unreadCount = unreadNotifications.length;
            this.updateNotificationBadges();
            
            // If no unread notifications, show "You're all caught up"
            if (unreadNotifications.length === 0) {
                console.log('No unread notifications found');
                container.innerHTML = `
                    <div style="color: #aaa; padding: 40px 20px; font-size: 16px;">
                        You're all caught up!
                    </div>
                `;
                return;
            }
            
            // Display actual notifications
            let html = '';
            unreadNotifications.forEach(notif => {
                const typeLabels = {
                    u2u_messages: '💬 New Message',
                    post_votes_comments: '📝 Post Activity',
                    post_reposts: '🔄 Post Reposted',
                    project_votes: '👍 Project Vote',
                    project_comments: '💬 Project Comment',
                    project_reposts: '🔄 Project Reposted',
                    project_bids: '🤝 New Bid',
                    bid_accepted: '✅ Bid Accepted',
                    user_follows_you: '👥 New Follower',
                    project_follows_you: '👁️ Project Followed',
                    join_project_request: '🙋 Join Request',
                    project_role_change: '🔑 Role Changed'
                };
                
                const label = typeLabels[notif.type] || notif.type;
                let timeStr = 'Just now';
                try {
                    const timestamp = notif.timestamp?.toDate ? notif.timestamp.toDate() : new Date(notif.timestamp);
                    timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    console.error('Error formatting timestamp:', e);
                }
                
                // Build link based on notification type
                let link = '#';
                if (notif.type === 'user_follows_you' && notif.data?.userId) {
                    link = `profile.html?uid=${notif.data.userId}`;
                } else if (notif.data?.projectId) {
                    link = `project.html?id=${notif.data.projectId}`;
                } else if (notif.data?.postId) {
                    link = `#post/${notif.data.postId}`;
                } else if (notif.data?.userId) {
                    link = `profile.html?uid=${notif.data.userId}`;
                }
                
                html += `
                    <div onclick="NotificationsUI.handleNotificationClick('${notif.id}', '${link}')" style="background: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 12px; margin-bottom: 10px; text-align: left; cursor: pointer; transition: all 0.2s;">
                        <div style="color: #fff; font-weight: 600; font-size: 14px;">${label}</div>
                        <div style="color: #aaa; font-size: 13px; margin-top: 4px;">${notif.data?.message || notif.message || ''}</div>
                        <div style="color: #888; font-size: 12px; margin-top: 4px;">${timeStr}</div>
                    </div>
                `;
            });
            
            console.log('Rendering', html.length, 'bytes of HTML');
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading notifications:', error);
            console.error('Error details:', error.message, error.code);
            const container = document.getElementById('notificationsListContainer');
            if (container) {
                container.innerHTML = `<div style="color: #aaa; padding: 40px 20px; font-size: 16px;">Error loading notifications: ${error.message}</div>`;
            }
        }
    },
    
    /**
     * Save notification preferences to Firestore
     */
    async savePreferences() {
        if (!this.currentUserId) return;
        
        try {
            // Update preferences from checkboxes
            const checkboxes = document.querySelectorAll('.notification-checkbox');
            checkboxes.forEach(checkbox => {
                this.notificationFilters[checkbox.dataset.type] = checkbox.checked;
            });
            
            const { db } = await import('./firebase.js');
            const { doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDocRef = doc(db, 'users', this.currentUserId);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                await setDoc(userDocRef, {
                    notificationPreferences: this.notificationFilters
                }, { merge: true });
                
                alert('Notification preferences saved!');
                this.closePreferencesModal();
            }
        } catch (error) {
            console.error('Error saving notification preferences:', error);
            alert('Failed to save preferences');
        }
    },
    
    /**
     * Attach event listeners to checkboxes
     */
    attachEventListeners() {
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('notification-checkbox')) {
                this.notificationFilters[e.target.dataset.type] = e.target.checked;
            }
        });
    },
    
    /**
     * Add a new notification to the system
     * Called when events occur (messages, votes, comments, bids)
     */
    async addNotification(type, data = {}, recipientId = null) {
        const targetUserId = recipientId || this.currentUserId;
        
        console.log('addNotification called:', { type, data, recipientId, targetUserId, currentUserId: this.currentUserId });
        
        // Check if user has this notification type enabled
        if (!this.notificationFilters[type]) {
            console.log('Notification type disabled:', type);
            return;
        }
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, addDoc, serverTimestamp, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const notification = {
                type: type,
                recipientId: targetUserId,
                senderId: this.currentUserId,
                message: data.message || '',
                data: {
                    postId: data.postId || null,
                    projectId: data.projectId || null,
                    userId: data.userId || null,
                    taskId: data.taskId || null,
                    conversationId: data.conversationId || null,
                    ...data
                },
                timestamp: serverTimestamp(),
                read: false
            };
            
            console.log('Saving notification to Firestore:', notification);
            
            // Save to Firestore
            const docRef = await addDoc(collection(db, 'notifications'), notification);
            console.log('Notification saved with ID:', docRef.id);
            
            // Send email if applicable
            await this.sendEmailNotification(type, targetUserId, data);
            
            // If this is the current user's notification, add to local list and update badge
            if (targetUserId === this.currentUserId) {
                this.userNotifications.unshift(notification);
                this.unreadCount++;
                this.updateNotificationBadges();
                console.log('Updated local notification list');
            }
        } catch (error) {
            console.error('Error adding notification:', error);
            console.error('Error details:', error.message);
        }
    },
    
    /**
     * Send email notification based on preferences
     */
    async sendEmailNotification(type, recipientId, data) {
        try {
            // Determine if we should send an email for this notification type
            let shouldEmail = false;
            let emailType = '';
            
            if (type === 'user_follows_you' && this.notificationFilters.emailOnFollower) {
                shouldEmail = true;
                emailType = 'follower';
            } else if (type === 'u2u_messages' && this.notificationFilters.emailOnMessage) {
                shouldEmail = true;
                emailType = 'message';
            }
            
            if (!shouldEmail) {
                console.log('[Email] Email disabled for type:', type);
                return;
            }
            
            // Get recipient user info for email
            const { db } = await import('./firebase.js');
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDocRef = doc(db, 'users', recipientId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (!userDocSnap.exists()) {
                console.log('[Email] User not found for email:', recipientId);
                return;
            }
            
            const userData = userDocSnap.data();
            const recipientEmail = userData.email;
            const recipientName = userData.displayName || userData.username || 'User';
            
            if (!recipientEmail) {
                console.log('[Email] No email found for user:', recipientId);
                return;
            }
            
            // Get sender info
            const senderDocRef = doc(db, 'users', this.currentUserId);
            const senderDocSnap = await getDoc(senderDocRef);
            const senderData = senderDocSnap.exists() ? senderDocSnap.data() : {};
            const senderName = senderData.displayName || senderData.username || 'Someone';
            
            console.log('[Email] Sending', emailType, 'email to', recipientEmail);
            
            // Call Cloud Function to send email
            const functionUrl = 'https://us-central1-cloud-beacon-55a40.cloudfunctions.net/sendNotificationEmail';
            console.log('[Email] Calling endpoint:', functionUrl);
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientEmail: recipientEmail,
                    recipientName: recipientName,
                    senderName: senderName,
                    emailType: emailType,
                    data: data
                })
            });
            
            const responseData = await response.json();
            
            if (response.ok) {
                console.log(`✅ Email sent to ${recipientEmail} for ${emailType}:`, responseData);
            } else {
                console.error('[Email] Failed to send email:', response.status, responseData);
            }
        } catch (error) {
            console.error('[Email] Error sending email notification:', error);
            console.error('[Email] Error details:', error.message, error.stack);
            // Don't throw - let notification continue even if email fails
        }
    },
    
    /**
     * Handle notification click - mark as read and navigate
     */
    async handleNotificationClick(notificationId, link) {
        console.log('handleNotificationClick:', { notificationId, link });
        try {
            const { db } = await import('./firebase.js');
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Mark notification as read in Firestore
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
            console.log('Marked notification as read:', notificationId);
            
            // Update local notification
            const notif = this.userNotifications.find(n => n.id === notificationId);
            if (notif) {
                notif.read = true;
            }
            
            // Remove from display and update badge
            this.loadNotifications();
            // Refresh badge count after marking as read
            this.loadUnreadCount();
            
            // Navigate to link
            if (link && link !== '#' && !link.startsWith('profile.html') && !link.startsWith('project.html')) {
                // Hash-based navigation (posts, etc)
                window.location.hash = link;
                this.closeModal();
            } else if (link && (link.startsWith('profile.html') || link.startsWith('project.html'))) {
                // Page navigation (profiles, projects)
                console.log('Navigating to:', link);
                this.closeModal();
                setTimeout(() => {
                    window.location.href = link;
                }, 200);
            } else {
                // Just close for feed activity
                this.closeModal();
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    },
    
    /**
     * Delete a single notification
     */
    async deleteNotification(notificationId) {
        try {
            const { db } = await import('./firebase.js');
            const { deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await deleteDoc(doc(db, 'notifications', notificationId));
            
            // Remove from local list
            this.userNotifications = this.userNotifications.filter(n => n.id !== notificationId);
            this.loadNotifications();
            // Refresh badge count
            this.loadUnreadCount();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    },
    
    /**
     * Clear all notifications for current user
     */
    async clearAllNotifications() {
        if (!confirm('Clear all notifications? This cannot be undone.')) return;
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, query, where, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'notifications'),
                where('recipientId', '==', this.currentUserId)
            );
            const snapshot = await getDocs(q);
            
            // Delete all notifications
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            
            this.userNotifications = [];
            this.unreadCount = 0;
            this.updateNotificationBadges();
            this.loadNotifications();
        } catch (error) {
            console.error('Error clearing notifications:', error);
            alert('Failed to clear notifications');
        }
    },
    
    /**
     * Update notification badge counters in menu
     */
    updateNotificationBadges() {
        const badge = document.getElementById('notificationsNotificationBadge');
        const menuBadge = document.getElementById('menuBtnNotificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        if (menuBadge) {
            if (this.unreadCount > 0) {
                menuBadge.textContent = this.unreadCount;
                menuBadge.style.display = 'flex';
            } else {
                menuBadge.style.display = 'none';
            }
        }
    },
    
    /**
     * Load unread notification count and update badge immediately
     */
    async loadUnreadCount() {
        try {
            const { db } = await import('./firebase.js');
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'notifications'),
                where('recipientId', '==', this.currentUserId)
            );
            
            const snapshot = await getDocs(q);
            // Count unread notifications in JavaScript instead of using != operator in query
            this.unreadCount = snapshot.docs.filter(doc => !doc.data().read).length;
            this.updateNotificationBadges();
        } catch (error) {
            console.error('Error loading unread notification count:', error);
            this.unreadCount = 0;
        }
    },
    
    /**
     * Update messages badge counter
     */
    updateMessagesBadge(count) {
        const badge = document.getElementById('messagesNotificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
};

// Expose to window for access from HTML
window.NotificationsUI = NotificationsUI;
console.log('NotificationsUI loaded:', typeof window.NotificationsUI);
