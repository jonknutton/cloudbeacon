/**
 * Follow System Module
 * Manages user follow/unfollow relationships and queries
 */

import { db } from './firebase.js';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDocs,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FollowSystem = {
  basePath: 'testApp',

  /**
   * Toggle follow status between two users
   * @param {string} currentUserId - ID of user doing the following
   * @param {string} targetUserId - ID of user being followed
   * @returns {Promise<boolean>} - New follow state (true = now following, false = now unfollowed)
   */
  async toggleFollow(currentUserId, targetUserId) {
    try {
      if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
        console.error('Invalid user IDs');
        return false;
      }

      const isFollowing = await this.isFollowing(currentUserId, targetUserId);

      if (isFollowing) {
        // Unfollow: remove from currentUser's following list
        const followingRef = doc(db, this.basePath, currentUserId, 'following', targetUserId);
        await deleteDoc(followingRef);

        // Remove from targetUser's followers list
        const followerRef = doc(db, this.basePath, targetUserId, 'followers', currentUserId);
        await deleteDoc(followerRef);

        return false; // Now unfollowed
      } else {
        // Follow: add to currentUser's following list
        const followingRef = doc(db, this.basePath, currentUserId, 'following', targetUserId);
        await setDoc(followingRef, { followedAt: serverTimestamp() });

        // Add to targetUser's followers list
        const followerRef = doc(db, this.basePath, targetUserId, 'followers', currentUserId);
        await setDoc(followerRef, { followedAt: serverTimestamp() });
        
        // Send notification to target user
        if (typeof window.NotificationsUI !== 'undefined') {
          window.NotificationsUI.addNotification('user_follows_you', {
            userId: currentUserId,
            message: `Someone started following you`
          }, targetUserId);
        }

        return true; // Now following
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  },

  /**
   * Check if currentUser is following targetUser
   * @param {string} currentUserId - ID of user checking
   * @param {string} targetUserId - ID of user to check against
   * @returns {Promise<boolean>}
   */
  async isFollowing(currentUserId, targetUserId) {
    try {
      if (!currentUserId || !targetUserId) {
        return false;
      }

      const followingRef = doc(db, this.basePath, currentUserId, 'following', targetUserId);
      const docSnap = await getDoc(followingRef);

      return docSnap.exists();
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },

  /**
   * Get list of users following a target user
   * @param {string} userId - ID of user to get followers for
   * @returns {Promise<Array>} - Array of follower user data
   */
  async getFollowers(userId) {
    try {
      if (!userId) {
        return [];
      }

      const followersRef = collection(db, this.basePath, userId, 'followers');
      const q = query(followersRef, orderBy('followedAt', 'desc'));
      const snapshot = await getDocs(q);

      const followers = [];
      for (const docSnap of snapshot.docs) {
        const followerData = await this.getUserData(docSnap.id);
        if (followerData) {
          followers.push(followerData);
        }
      }

      return followers;
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },

  /**
   * Get list of users that a user is following
   * @param {string} userId - ID of user to get following list for
   * @returns {Promise<Array>} - Array of followed user data
   */
  async getFollowing(userId) {
    try {
      if (!userId) {
        return [];
      }

      const followingRef = collection(db, this.basePath, userId, 'following');
      const q = query(followingRef, orderBy('followedAt', 'desc'));
      const snapshot = await getDocs(q);

      const following = [];
      for (const docSnap of snapshot.docs) {
        const userData = await this.getUserData(docSnap.id);
        if (userData) {
          following.push(userData);
        }
      }

      return following;
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  },

  /**
   * Check if two users follow each other (mutual follow)
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<boolean>} - True if mutual follow exists
   */
  async isMutualFollow(userId1, userId2) {
    try {
      if (!userId1 || !userId2) {
        return false;
      }

      const followsEachOther = await Promise.all([
        this.isFollowing(userId1, userId2),
        this.isFollowing(userId2, userId1),
      ]);

      return followsEachOther[0] && followsEachOther[1];
    } catch (error) {
      console.error('Error checking mutual follow:', error);
      return false;
    }
  },

  /**
   * Get follower count for a user
   * @param {string} userId - ID of user
   * @returns {Promise<number>} - Number of followers
   */
  async getFollowerCount(userId) {
    try {
      if (!userId) {
        return 0;
      }

      const followersRef = collection(db, this.basePath, userId, 'followers');
      const snapshot = await getDocs(followersRef);

      return snapshot.size;
    } catch (error) {
      console.error('Error fetching follower count:', error);
      return 0;
    }
  },

  /**
   * Get following count for a user
   * @param {string} userId - ID of user
   * @returns {Promise<number>} - Number of users being followed
   */
  async getFollowingCount(userId) {
    try {
      if (!userId) {
        return 0;
      }

      const followingRef = collection(db, this.basePath, userId, 'following');
      const snapshot = await getDocs(followingRef);

      return snapshot.size;
    } catch (error) {
      console.error('Error fetching following count:', error);
      return 0;
    }
  },

  /**
   * Get a user's profile data
   * @param {string} userId - ID of user
   * @returns {Promise<Object|null>} - User data object or null
   */
  async getUserData(userId) {
    try {
      if (!userId) {
        return null;
      }

      // Try to get from users collection first (primary location)
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      }

      // Fallback: if user doc doesn't exist, return minimal user object
      // This can happen if the user hasn't fully completed profile setup
      return {
        id: userId,
        username: `User ${userId.substring(0, 6)}`,
        displayName: `User ${userId.substring(0, 6)}`,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Return minimal fallback on error
      return {
        id: userId,
        username: 'User',
        displayName: 'User',
      };
    }
  },
};

// Expose to window for global access
window.FollowSystem = FollowSystem;

export default FollowSystem;
