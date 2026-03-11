/**
 * Messaging System - User-to-User Private Messaging
 * Handles conversations, message sending/receiving, and notifications
 */

const MessagingSystem = {
    // Track current active conversation
    activeConversationId: null,
    
    /**
     * Check if user can message another user
     * (Can message if mutual followers OR if target user follows them)
     */
    async canMessage(targetUserId) {
        if (!window.currentUserId || !targetUserId) return false;
        if (targetUserId === window.currentUserId) return false;
        
        try {
            const { db } = await import('./firebase.js');
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const currentUserDoc = await getDoc(doc(db, 'users', window.currentUserId));
            const currentUserData = currentUserDoc.data() || {};
            
            // Can message if current user follows target OR target follows current user
            const currentFollows = (currentUserData.following || []).includes(targetUserId);
            
            const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
            const targetUserData = targetUserDoc.data() || {};
            const targetFollowsCurrent = (targetUserData.following || []).includes(window.currentUserId);
            
            return currentFollows || targetFollowsCurrent;
        } catch (err) {
            console.error('[Messaging] Error checking message permissions:', err);
            return false;
        }
    },
    
    /**
     * Generate conversation ID (consistent across both users)
     */
    getConversationId(userId1, userId2) {
        return [userId1, userId2].sort().join('_');
    },
    
    /**
     * Send a message
     */
    async sendMessage(recipientId, messageText) {
        if (!window.currentUserId || !recipientId || !messageText.trim()) {
            console.error('[Messaging] Missing required fields for sending message');
            return null;
        }
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, addDoc, setDoc, doc, getDoc, serverTimestamp, updateDoc } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const conversationId = this.getConversationId(window.currentUserId, recipientId);
            
            // Get current user data for sender info
            const senderDoc = await getDoc(doc(db, 'users', window.currentUserId));
            const senderData = senderDoc.data() || {};
            const senderName = senderData.displayName || senderData.username || 'Unknown User';
            const senderPhotoURL = senderData.photoURL || '';
            
            // Get recipient data for conversation metadata
            const recipientDoc = await getDoc(doc(db, 'users', recipientId));
            const recipientData = recipientDoc.data() || {};
            const recipientName = recipientData.displayName || recipientData.username || 'Unknown User';
            const recipientPhotoURL = recipientData.photoURL || '';
            
            const now = serverTimestamp();
            
            // Create message in subcollection
            const messageRef = await addDoc(
                collection(db, 'users', window.currentUserId, 'conversations', conversationId, 'messages'),
                {
                    senderId: window.currentUserId,
                    senderName: senderName,
                    senderPhotoURL: senderPhotoURL,
                    text: messageText,
                    timestamp: now,
                    read: false
                }
            );
            
            // Also store in recipient's collection
            await addDoc(
                collection(db, 'users', recipientId, 'conversations', conversationId, 'messages'),
                {
                    senderId: window.currentUserId,
                    senderName: senderName,
                    senderPhotoURL: senderPhotoURL,
                    text: messageText,
                    timestamp: now,
                    read: false
                }
            );
            
            // Update or create conversation metadata for sender
            await setDoc(
                doc(db, 'users', window.currentUserId, 'conversations', conversationId),
                {
                    participantIds: [window.currentUserId, recipientId],
                    participantNames: {
                        [window.currentUserId]: senderName,
                        [recipientId]: recipientName
                    },
                    participantAvatars: {
                        [window.currentUserId]: senderPhotoURL,
                        [recipientId]: recipientPhotoURL
                    },
                    lastMessage: messageText,
                    lastMessageTime: now,
                    lastMessageSenderId: window.currentUserId,
                    updatedAt: now,
                    createdAt: serverTimestamp()
                },
                { merge: true }
            );
            
            // Update or create conversation metadata for recipient
            await setDoc(
                doc(db, 'users', recipientId, 'conversations', conversationId),
                {
                    participantIds: [window.currentUserId, recipientId],
                    participantNames: {
                        [window.currentUserId]: senderName,
                        [recipientId]: recipientName
                    },
                    participantAvatars: {
                        [window.currentUserId]: senderPhotoURL,
                        [recipientId]: recipientPhotoURL
                    },
                    lastMessage: messageText,
                    lastMessageTime: now,
                    lastMessageSenderId: window.currentUserId,
                    updatedAt: now,
                    createdAt: serverTimestamp()
                },
                { merge: true }
            );
            
            // Send notification for new message
            if (typeof window.NotificationsUI !== 'undefined') {
              window.NotificationsUI.addNotification('u2u_messages', {
                conversationId: conversationId,
                userId: window.currentUserId,
                message: `${senderName} sent you a message`
              }, recipientId);
            }
            
            console.log('[Messaging] Message sent to', recipientId);
            return messageRef.id;
        } catch (err) {
            console.error('[Messaging] Error sending message:', err);
            return null;
        }
    },
    
    /**
     * Get all conversations for current user
     */
    async getConversations() {
        if (!window.currentUserId) return [];
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, getDocs, query, orderBy } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const conversationsSnap = await getDocs(
                query(
                    collection(db, 'users', window.currentUserId, 'conversations'),
                    orderBy('updatedAt', 'desc')
                )
            );
            
            const conversations = [];
            conversationsSnap.forEach(doc => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return conversations;
        } catch (err) {
            console.error('[Messaging] Error getting conversations:', err);
            return [];
        }
    },
    
    /**
     * Get messages in a specific conversation
     */
    async getMessages(conversationId) {
        if (!window.currentUserId || !conversationId) return [];
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, getDocs, query, orderBy } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const messagesSnap = await getDocs(
                query(
                    collection(db, 'users', window.currentUserId, 'conversations', conversationId, 'messages'),
                    orderBy('timestamp', 'asc')
                )
            );
            
            const messages = [];
            messagesSnap.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return messages;
        } catch (err) {
            console.error('[Messaging] Error getting messages:', err);
            return [];
        }
    },
    
    /**
     * Mark messages as read in a conversation
     */
    async markConversationAsRead(conversationId) {
        if (!window.currentUserId || !conversationId) return;
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, getDocs, doc, updateDoc, query, where } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const messagesSnap = await getDocs(
                query(
                    collection(db, 'users', window.currentUserId, 'conversations', conversationId, 'messages'),
                    where('read', '==', false)
                )
            );
            
            messagesSnap.forEach(msgDoc => {
                updateDoc(msgDoc.ref, { read: true });
            });
        } catch (err) {
            console.error('[Messaging] Error marking messages as read:', err);
        }
    },
    
    /**
     * Get other user's info from conversation
     */
    getOtherUserId(conversationData) {
        if (!conversationData.participantIds) return null;
        return conversationData.participantIds.find(id => id !== window.currentUserId);
    },
    
    /**
     * Get unread message count
     */
    async getUnreadCount() {
        if (!window.currentUserId) return 0;
        
        try {
            const { db } = await import('./firebase.js');
            const { collection, getDocs, query, where } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const conversations = await this.getConversations();
            let unreadCount = 0;
            
            for (const conv of conversations) {
                try {
                    const messagesSnap = await getDocs(
                        query(
                            collection(db, 'users', window.currentUserId, 'conversations', conv.id, 'messages'),
                            where('read', '==', false)
                        )
                    );
                    // Only count messages from other users (senderId != currentUserId)
                    messagesSnap.forEach(doc => {
                        if (doc.data().senderId !== window.currentUserId) {
                            unreadCount++;
                        }
                    });
                } catch (convErr) {
                    console.log('[Messaging] Could not load messages for conversation:', conv.id, convErr);
                }
            }
            
            return unreadCount;
        } catch (err) {
            console.error('[Messaging] Error getting unread count:', err);
            return 0;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagingSystem;
}
