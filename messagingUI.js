/**
 * Messaging UI - Modal and Notification Popups for Messaging System
 * Handles split-view modal for conversations and bottom notification popups
 */

const MessagingUI = {
    currentConversationId: null,
    currentRecipientId: null,
    messageListeners: {},
    isSending: false,
    
    /**
     * Initialize messaging UI
     */
    init() {
        this.setupModalHTML();
        this.setupNotificationHTML();
        this.attachEventListeners();
        this.watchForMessages();
        // Load and display unread message badge immediately
        this.updateUnreadMessagesBadge();
    },
    
    /**
     * Create modal HTML structure
     */
    setupModalHTML() {
        if (document.getElementById('messagingModal')) return;
        
        const modalHTML = `
            <div id="messagingModal" class="modal" style="display:none; z-index: 1000;">
                <div class="modal-content" style="width: 90%; max-width: 900px; height: 80vh; display: flex; flex-direction: column; background: #1a1a1a; border: 1px solid #333; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #333; background: #1a1a1a;">
                        <h2 style="margin: 0; font-size: 20px; color: #fff;">Messages</h2>
                        <div style="display: flex; gap: 10px;">
                            <button id="newMessageBtn" onclick="MessagingUI.showNewMessagePanel()" style="background: var(--color-primary); color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: bold;">+ New</button>
                            <button class="modal-close" onclick="MessagingUI.closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #fff;">✕</button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 0; flex: 1; overflow: hidden;">
                        <!-- Empty Left Panel -->
                        <div style="width: 5%; background: #1a1a1a; border-right: 1px solid #333;"></div>
                        
                        <!-- Conversations View (Right Panel) -->
                        <div id="messagePanel" style="width: 95%; display: flex; flex-direction: column; background: #1a1a1a;">
                            <!-- Conversation List View -->
                            <div id="conversationListView" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                                <div style="padding: 15px; border-bottom: 1px solid #333;">
                                    <input 
                                        id="conversationSearch" 
                                        type="text" 
                                        placeholder="Search conversations..." 
                                        style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff; font-size: 14px;">
                                </div>
                                <div id="conversationsContainer" style="flex: 1; overflow-y: auto;"></div>
                            </div>
                            
                            <!-- Message Thread View -->
                            <div id="messageThreadView" style="display: none; flex: 1; flex-direction: column; height: 100%;">
                                <div style="padding: 12px 15px; border-bottom: 1px solid #333; background: #1a1a1a; display: flex; align-items: center; gap: 10px;">
                                    <button 
                                        type="button"
                                        onclick="MessagingUI.backToConversationList()" 
                                        style="background: none; border: none; color: var(--color-primary); cursor: pointer; font-size: 18px; padding: 5px 10px;">← Back</button>
                                    <div id="messageHeader" style="flex: 1; color: #fff; font-weight: bold;"></div>
                                </div>
                                
                                <div id="messagesDisplay" style="flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; background: #1a1a1a;"></div>
                                
                                <div style="padding: 15px; border-top: 1px solid #333; background: #1a1a1a; display: flex; gap: 10px;">
                                    <input 
                                        id="messageInput" 
                                        type="text" 
                                        placeholder="Type a message..." 
                                        style="flex: 1; padding: 10px; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff; font-size: 14px;" 
                                        onkeypress="if(event.key==='Enter') MessagingUI.sendMessageFromInput()">
                                    <button 
                                        type="button"
                                        onclick="MessagingUI.sendMessageFromInput()" 
                                        style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: opacity 0.2s;" 
                                        onmouseover="this.style.opacity='0.8'" 
                                        onmouseout="this.style.opacity='1'">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    /**
     * Create notification popup HTML
     */
    setupNotificationHTML() {
        if (document.getElementById('messagingNotificationContainer')) return;
        
        const notifHTML = `
            <div id="messagingNotificationContainer" style="position: fixed; bottom: 20px; right: 20px; z-index: 999; display: none; max-width: 350px;">
                <div id="messagingNotification" style="background: var(--color-background); border: 1px solid var(--color-primary); border-radius: 8px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                        <div style="flex: 1; min-width: 0;">
                            <div id="notificationSender" style="font-weight: bold; color: var(--color-text); margin-bottom: 5px; word-break: break-word;"></div>
                            <div id="notificationPreview" style="color: var(--color-text-muted); font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                        </div>
                        <button 
                            onclick="MessagingUI.closeNotification(event)" 
                            style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text-muted); padding: 0; flex-shrink: 0;">✕</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', notifHTML);
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const searchInput = document.getElementById('conversationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterConversations(e.target.value));
        }
        
        const notif = document.getElementById('messagingNotification');
        if (notif) {
            notif.addEventListener('click', () => {
                this.closeNotification();
                this.openModal();
                this.selectConversation(this.lastMessageConversationId);
            });
        }
    },
    
    /**
     * Open messaging modal
     */
    async openModal() {
        const modal = document.getElementById('messagingModal');
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '1000';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        if (content) {
            content.style.background = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim() || '#1a1a1a';
            content.style.opacity = '1';
        }
        
        await this.loadConversations();
        // Update badge after loading conversations
        this.updateUnreadMessagesBadge();
    },
    
    /**
     * Count and update unread messages badge
     */
    async updateUnreadMessagesBadge() {
        try {
            const conversations = await MessagingSystem.getConversations();
            const unreadCount = conversations.filter(conv => 
                conv.lastMessageSenderId && conv.lastMessageSenderId !== window.currentUserId
            ).length;
            
            if (typeof NotificationsUI !== 'undefined') {
                NotificationsUI.updateMessagesBadge(unreadCount);
            }
        } catch (err) {
            console.error('[MessagingUI] Error updating unread badge:', err);
        }
    },
    
    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('messagingModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentConversationId = null;
        this.currentRecipientId = null;
        document.getElementById('messageInput').value = '';
    },
    
    /**
     * Format timestamp for message display
     */
    formatMessageTime(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'now';
            if (minutes < 60) return `${minutes}m`;
            if (hours < 24) return `${hours}h`;
            if (days < 7) return `${days}d`;
            
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return '';
        }
    },
    
    /**
     * Fuzzy search helper - matches approximate patterns
     */
    fuzzyMatch(str, pattern) {
        const patternLower = pattern.toLowerCase();
        const strLower = str.toLowerCase();
        
        // Exact match
        if (strLower.includes(patternLower)) return true;
        
        // Check if starts with pattern
        if (strLower.startsWith(patternLower)) return true;
        
        // Fuzzy character matching
        let patternIdx = 0;
        for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
            if (strLower[i] === patternLower[patternIdx]) {
                patternIdx++;
            }
        }
        return patternIdx === patternLower.length;
    },
    
    /**
     * Show new message panel with follower selection
     */
    async showNewMessagePanel() {
        try {
            const { db } = await import('./firebase.js');
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            if (!window.currentUserId) return;
            
            if (!window.FollowSystem) {
                alert('Follow system not loaded yet');
                return;
            }
            
            // Get current user's followers and following using FollowSystem
            const followers = await window.FollowSystem.getFollowers(window.currentUserId);
            const following = await window.FollowSystem.getFollowing(window.currentUserId);
            
            // Build a map of user ID to user object and extract IDs
            const userMap = {};
            const canMessageUserIds = [];
            
            for (const follower of followers) {
                if (!follower || !follower.id) continue;
                userMap[follower.id] = follower;
                canMessageUserIds.push(follower.id);
            }
            
            for (const followedUser of following) {
                if (!followedUser || !followedUser.id) continue;
                if (!userMap[followedUser.id]) {
                    userMap[followedUser.id] = followedUser;
                    canMessageUserIds.push(followedUser.id);
                }
            }
            
            if (canMessageUserIds.length === 0) {
                alert('No followers or following to message yet');
                return;
            }
            
            // Build HTML for follower selection with proper styling
            let html = '<div style="padding: 15px; background: var(--color-cardBackground); border-radius: 8px;">';
            html += '<h3 style="margin: 0 0 15px 0; color: var(--color-fontPrimary); font-size: 16px; font-weight: 600;">Start New Conversation</h3>';
            html += '<input id="newMsgSearch" type="text" placeholder="Search users..." style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-pageBackground); color: var(--color-fontPrimary); margin-bottom: 15px; font-size: 14px; box-sizing: border-box;">';
            html += '<div id="newMsgUserList" style="max-height: 400px; overflow-y: auto; margin-bottom: 15px;"></div>';
            html += '<button onclick="MessagingUI.cancelNewMessage()" style="width: 100%; padding: 10px; background: var(--color-buttonSecondary); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-fontPrimary); cursor: pointer; font-weight: 600; font-size: 13px;">Cancel</button>';
            html += '</div>';
            
            const listEl = document.getElementById('conversationsContainer');
            listEl.innerHTML = html;
            
            // Load users - uses the userMap built above
            const self = this;
            async function loadUsers(userIds) {
                let userHtml = '';
                for (const userId of userIds) {
                    try {
                        // Use cached user data from userMap instead of fetching from DB
                        const user = userMap[userId];
                        if (user) {
                            const username = user.displayName || user.username || 'Unknown';
                            const avatar = user.photoURL || '';
                            const avatarText = username[0].toUpperCase();
                            userHtml += `
                                <div onclick="MessagingUI.startNewConversation('${userId}')" style="padding: 12px; margin: 8px 0; background: var(--color-pageBackground); border-radius: 6px; cursor: pointer; display: flex; gap: 12px; align-items: center; transition: background 0.2s; border: 1px solid transparent;" onmouseover="this.style.background='var(--color-background)'" onmouseout="this.style.background='var(--color-pageBackground)'">
                                    <img src="${avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22%3E%3Ccircle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23666%22/%3E%3C/svg%3E'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
                                    <span style="color: var(--color-fontPrimary); font-weight: 500; word-break: break-word;">${username}</span>
                                </div>
                            `;
                        }
                    } catch (err) {
                        console.error('Error loading user:', err);
                    }
                }
                return userHtml;
            }
            
            const usersHtml = await loadUsers(canMessageUserIds);
            document.getElementById('newMsgUserList').innerHTML = usersHtml || '<p style="color: var(--color-fontSecondary); text-align: center; padding: 20px;">No users to display</p>';
            
            // Add search functionality with fuzzy matching
            document.getElementById('newMsgSearch').addEventListener('input', async (e) => {
                const search = e.target.value.toLowerCase().trim();
                if (search.length === 0) {
                    document.getElementById('newMsgUserList').innerHTML = await loadUsers(canMessageUserIds);
                    return;
                }
                
                // Filter users by name with fuzzy matching using cached userMap data
                const filtered = [];
                for (const userId of canMessageUserIds) {
                    const user = userMap[userId];
                    if (user) {
                        const username = (user.displayName || user.username || '');
                        // Use fuzzy matching on the username
                        if (self.fuzzyMatch(username, search)) {
                            filtered.push(userId);
                        }
                    }
                }
                
                document.getElementById('newMsgUserList').innerHTML = await loadUsers(filtered) || '<p style="color: var(--color-fontSecondary); text-align: center; padding: 20px;">No users found matching "' + search + '"</p>';
            });
        } catch (err) {
            console.error('[MessagingUI] Error showing new message panel:', err);
            alert('Error loading followers');
        }
    },
    
    /**
     * Start new conversation with selected user
     */
    async startNewConversation(userId) {
        try {
            const conversationId = MessagingSystem.getConversationId(window.currentUserId, userId);
            
            // Check if conversation already exists
            const conversations = await MessagingSystem.getConversations();
            const existing = conversations.find(c => c.id === conversationId);
            
            if (existing) {
                // Load existing conversation
                await this.selectConversation(conversationId);
            } else {
                // Show empty conversation
                this.currentConversationId = conversationId;
                this.currentRecipientId = userId;
                
                const { db } = await import('./firebase.js');
                const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                const userDoc = await getDoc(doc(db, 'users', userId));
                const userData = userDoc.data() || {};
                
                // Update header
                document.getElementById('messageHeader').textContent = userData.displayName || userData.username || 'Unknown';
                
                // Clear messages
                document.getElementById('messagesDisplay').innerHTML = '';
                
                // Show message thread view, hide conversation list
                document.getElementById('conversationListView').style.display = 'none';
                document.getElementById('messageThreadView').style.display = 'flex';
                
                // Focus input
                document.getElementById('messageInput').value = '';
                document.getElementById('messageInput').focus();
            }
            
            // Reload conversation list
            await this.loadConversations();
        } catch (err) {
            console.error('[MessagingUI] Error starting conversation:', err);
            alert('Error starting conversation');
        }
    },
    
    /**
     * Cancel new message
     */
    async cancelNewMessage() {
        await this.loadConversations();
    },
    
    /**
     * Go back to conversation list
     */
    async backToConversationList() {
        document.getElementById('conversationListView').style.display = 'flex';
        document.getElementById('messageThreadView').style.display = 'none';
        this.currentConversationId = null;
        this.currentRecipientId = null;
        await this.loadConversations();
    },
    
    /**
     * Load and display conversations
     */
    async loadConversations() {
        const conversations = await MessagingSystem.getConversations();
        this.displayConversations(conversations);
    },
    
    /**
     * Display conversations in left panel
     */
    displayConversations(conversations) {
        const container = document.getElementById('conversationsContainer');
        if (!container) return;
        
        if (conversations.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-muted);">No conversations yet</div>';
            return;
        }
        
        container.innerHTML = conversations.map(conv => {
            const otherUserId = MessagingSystem.getOtherUserId(conv);
            const otherUserName = conv.participantNames?.[otherUserId] || 'Unknown';
            const otherUserAvatar = conv.participantAvatars?.[otherUserId] || '';
            const isUnread = (conv.lastMessageSenderId !== window.currentUserId); // Simple unread indicator
            
            return `
                <div 
                    onclick="MessagingUI.selectConversation('${conv.id}')"
                    style="
                        padding: 12px 15px;
                        border-bottom: 1px solid var(--color-border);
                        cursor: pointer;
                        transition: background 0.2s;
                        ${MessagingUI.currentConversationId === conv.id ? 'background: var(--color-background-hover);' : ''}
                    "
                    onmouseover="this.style.background = 'var(--color-background-hover)'"
                    onmouseout="this.style.background = '${MessagingUI.currentConversationId === conv.id ? 'var(--color-background-hover);' : 'transparent;'}'"
                >
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <img 
                            src="${otherUserAvatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22%3E%3Ccircle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23999%22/%3E%3C/svg%3E'}" 
                            style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: bold; color: var(--color-text);">${otherUserName}</div>
                            <div style="font-size: 0.85em; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${conv.lastMessage || 'No messages yet'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Select and view a conversation
     */
    async selectConversation(conversationId) {
        if (!conversationId) return;
        
        this.currentConversationId = conversationId;
        this.currentRecipientId = null;
        
        // Load messages
        const messages = await MessagingSystem.getMessages(conversationId);
        const conversations = await MessagingSystem.getConversations();
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (!conversation) return;
        
        const otherUserId = MessagingSystem.getOtherUserId(conversation);
        const otherUserName = conversation.participantNames?.[otherUserId] || 'Unknown';
        const otherUserAvatar = conversation.participantAvatars?.[otherUserId] || '';
        
        // Update message header
        document.getElementById('messageHeader').textContent = otherUserName;
        
        // Display messages with phone-style chat bubbles and timestamps
        const messagesDisplay = document.getElementById('messagesDisplay');
        messagesDisplay.innerHTML = messages.map(msg => {
            const isOwn = msg.senderId === window.currentUserId;
            const timeStr = this.formatMessageTime(msg.timestamp);
            return `
                <div style="display: flex; justify-content: ${isOwn ? 'flex-end' : 'flex-start'}; align-items: flex-end; gap: 8px; margin-bottom: 12px;">
                    <div style="display: flex; flex-direction: column; align-items: ${isOwn ? 'flex-end' : 'flex-start'}; max-width: 75%;">
                        <div style="
                            padding: 12px 15px;
                            border-radius: ${isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
                            background: ${isOwn ? 'var(--color-primary)' : '#444'};
                            color: #fff;
                            word-wrap: break-word;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                            font-size: 14px;
                            line-height: 1.4;
                        ">
                            ${msg.text}
                        </div>
                        <div style="font-size: 12px; color: #999; margin-top: 4px; padding: 0 8px;">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        setTimeout(() => {
            messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
        }, 100);
        
        // Show message thread view, hide conversation list
        document.getElementById('conversationListView').style.display = 'none';
        document.getElementById('messageThreadView').style.display = 'flex';
        
        // Clear input and focus
        document.getElementById('messageInput').value = '';
        document.getElementById('messageInput').focus();
        
        // Mark as read
        await MessagingSystem.markConversationAsRead(conversationId);
    },
    
    /**
     * Send message from input field
     */
    async sendMessageFromInput() {
        const input = document.getElementById('messageInput');
        const sendBtn = document.querySelector('button[onclick="MessagingUI.sendMessageFromInput()"]');
        const text = input.value.trim();
        
        if (!text || !this.currentConversationId || this.isSending) return;
        
        // Disable send button and input to prevent double-sends
        this.isSending = true;
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
            sendBtn.style.cursor = 'not-allowed';
        }
        input.disabled = true;
        
        try {
            // Get recipient ID (use current recipient if set, otherwise look it up)
            let recipientId = this.currentRecipientId;
            
            if (!recipientId) {
                const conversations = await MessagingSystem.getConversations();
                const conversation = conversations.find(c => c.id === this.currentConversationId);
                if (!conversation) return;
                recipientId = MessagingSystem.getOtherUserId(conversation);
            }
            
            // Add message optimistically to display immediately (prevents lag delay)
            const messagesDisplay = document.getElementById('messagesDisplay');
            const optimisticMsg = `
                <div style="display: flex; justify-content: flex-end; align-items: flex-end; gap: 8px; margin-bottom: 12px;">
                    <div style="display: flex; flex-direction: column; align-items: flex-end; max-width: 75%;">
                        <div style="
                            padding: 12px 15px;
                            border-radius: 18px 18px 4px 18px;
                            background: var(--color-primary);
                            color: #fff;
                            word-wrap: break-word;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                            font-size: 14px;
                            line-height: 1.4;
                        ">
                            ${text}
                        </div>
                        <div style="font-size: 12px; color: #999; margin-top: 4px; padding: 0 8px;">now</div>
                    </div>
                </div>
            `;
            messagesDisplay.innerHTML += optimisticMsg;
            
            // Scroll to bottom to show new message
            setTimeout(() => {
                messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
            }, 50);
            
            // Clear input field
            input.value = '';
            input.focus();
            
            // Send message in background
            const success = await MessagingSystem.sendMessage(recipientId, text);
            
            if (success) {
                // Reload full conversation to sync with server
                await this.selectConversation(this.currentConversationId);
            }
        } finally {
            // Re-enable send button and input
            this.isSending = false;
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
                sendBtn.style.cursor = 'pointer';
            }
            input.disabled = false;
        }
    },
    
    /**
     * Filter conversations by search
     */
    async filterConversations(searchTerm) {
        const conversations = await MessagingSystem.getConversations();
        
        const filtered = searchTerm.trim() 
            ? conversations.filter(conv => {
                const otherUserId = MessagingSystem.getOtherUserId(conv);
                const otherUserName = conv.participantNames?.[otherUserId] || '';
                const lastMessage = conv.lastMessage || '';
                return otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
            })
            : conversations;
        
        this.displayConversations(filtered);
    },
    
    /**
     * Show notification popup for received message
     */
    showNotification(senderName, senderAvatar, messagePreview, conversationId) {
        this.lastMessageConversationId = conversationId;
        
        const container = document.getElementById('messagingNotificationContainer');
        if (!container) return;
        
        document.getElementById('notificationSender').textContent = senderName;
        document.getElementById('notificationPreview').textContent = messagePreview;
        
        container.style.display = 'block';
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (container.style.display === 'block') {
                this.closeNotification();
            }
        }, 8000);
    },
    
    /**
     * Close notification
     */
    closeNotification(event) {
        if (event) event.preventDefault();
        const container = document.getElementById('messagingNotificationContainer');
        if (container) {
            container.style.display = 'none';
        }
    },
    
    /**
     * Watch for incoming messages
     */
    watchForMessages() {
        const watchInterval = setInterval(async () => {
            if (!window.currentUserId) return;
            
            try {
                const { db } = await import('./firebase.js');
                const { collection, onSnapshot } = 
                    await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                const conversations = await MessagingSystem.getConversations();
                
                // Update unread messages badge
                this.updateUnreadMessagesBadge();
                
                conversations.forEach(conv => {
                    if (!this.messageListeners[conv.id]) {
                        const unsubscribe = onSnapshot(
                            collection(db, 'users', window.currentUserId, 'conversations', conv.id, 'messages'),
                            (snapshot) => {
                                snapshot.docChanges().forEach((change) => {
                                    if (change.type === 'added' && change.doc.data().senderId !== window.currentUserId) {
                                        const msgData = change.doc.data();
                                        const otherUserId = MessagingSystem.getOtherUserId(conv);
                                        const otherUserAvatar = conv.participantAvatars?.[otherUserId] || '';
                                        
                                        // Update unread badge when new message received
                                        this.updateUnreadMessagesBadge();
                                        
                                        // Only show notification if modal not already showing this conversation
                                        if (document.getElementById('messagingModal').style.display === 'none' ||
                                            this.currentConversationId !== conv.id) {
                                            this.showNotification(
                                                msgData.senderName,
                                                otherUserAvatar,
                                                msgData.text.substring(0, 50),
                                                conv.id
                                            );
                                        }
                                    }
                                });
                            }
                        );
                        
                        this.messageListeners[conv.id] = unsubscribe;
                    }
                });
            } catch (err) {
                console.error('[MessagingUI] Error watching messages:', err);
            }
        }, 5000);
    },
    
    /**
     * Load unread message count and update badge immediately
     */
    async updateUnreadMessagesBadge() {
        try {
            if (typeof MessagingSystem !== 'undefined' && MessagingSystem.getUnreadCount) {
                const unreadCount = await MessagingSystem.getUnreadCount();
                if (typeof NotificationsUI !== 'undefined' && NotificationsUI.updateMessagesBadge) {
                    NotificationsUI.updateMessagesBadge(unreadCount);
                }
            }
        } catch (error) {
            console.error('Error updating unread messages badge:', error);
            if (typeof NotificationsUI !== 'undefined' && NotificationsUI.updateMessagesBadge) {
                NotificationsUI.updateMessagesBadge(0);
            }
        }
    }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagingUI;
}
