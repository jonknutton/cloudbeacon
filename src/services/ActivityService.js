/**
 * ActivityService.js
 * Handles user activity logging to Firestore
 * Enables fast profile loading by denormalizing user activity
 * 
 * Activities recorded:
 * - post_created: User created a post
 * - voted_on_post: User voted on a post/comment
 * - project_created: User created a project
 * - voted_on_project: User voted on a project
 * - comment_created: User created a comment
 */

import { db, auth } from '../../firebase.js';
import { collection, addDoc, serverTimestamp } from '../core/firebase-sdk.js';

/**
 * Log a user activity to their activity feed
 * @param {string} activityType - Type of activity (post_created, voted_on_post, etc)
 * @param {object} data - Activity data with contentId, contentType, etc
 * @returns {Promise<void>}
 */
export async function logActivity(activityType, data) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn('[ActivityService] No user logged in, skipping activity log');
            return;
        }

        // Validate required fields
        if (!activityType || !data.contentId || !data.contentType) {
            console.warn('[ActivityService] Missing required fields:', { activityType, contentId: data.contentId, contentType: data.contentType });
            return;
        }

        const activityRef = collection(db, 'users', user.uid, 'activities');
        
        const activityDoc = {
            type: activityType,
            contentId: data.contentId,
            contentType: data.contentType,
            timestamp: serverTimestamp(),
            metadata: data.metadata || {}
        };

        await addDoc(activityRef, activityDoc);
        console.log('[ActivityService] Logged activity:', activityType, 'for content:', data.contentId);
    } catch (error) {
        // Don't break main flow if activity logging fails
        console.error('[ActivityService] Error logging activity:', error);
    }
}

/**
 * Log a post creation
 * @param {string} postId - ID of the created post
 * @param {object} postData - Post data with title, description, type
 */
export async function logPostCreated(postId, postData) {
    await logActivity('post_created', {
        contentId: postId,
        contentType: postData.type || 'post',
        metadata: {
            contentTitle: postData.title || postData.content?.substring(0, 100) || 'Post',
            contentAuthor: auth.currentUser?.uid,
            summary: postData.description || postData.content?.substring(0, 100)
        }
    });
}

/**
 * Log a vote on a post
 * @param {string} postId - ID of the post being voted on
 * @param {string} voteType - 'up' or 'down'
 * @param {object} postData - Post data with title, type, etc
 */
export async function logVoteOnPost(postId, voteType, postData) {
    await logActivity('voted_on_post', {
        contentId: postId,
        contentType: postData.type || 'post',
        metadata: {
            contentTitle: postData.title || postData.content?.substring(0, 100) || 'Post',
            contentAuthor: postData.authorId,
            voteType: voteType,
            summary: `Voted ${voteType} on "${postData.title || 'post'}"`
        }
    });
}

/**
 * Log a vote on a project
 * @param {string} projectId - ID of the project being voted on
 * @param {string} voteType - 'up' or 'down'
 * @param {object} projectData - Project data with title, etc
 */
export async function logVoteOnProject(projectId, voteType, projectData) {
    await logActivity('voted_on_project', {
        contentId: projectId,
        contentType: 'project',
        metadata: {
            contentTitle: projectData.title,
            contentAuthor: projectData.authorId,
            voteType: voteType,
            summary: `Voted ${voteType} on project "${projectData.title}"`
        }
    });
}

/**
 * Log a project creation
 * @param {string} projectId - ID of the created project
 * @param {object} projectData - Project data with title, category, etc
 */
export async function logProjectCreated(projectId, projectData) {
    await logActivity('project_created', {
        contentId: projectId,
        contentType: 'project',
        metadata: {
            contentTitle: projectData.title,
            contentAuthor: auth.currentUser?.uid,
            category: projectData.category,
            summary: projectData.description?.substring(0, 100)
        }
    });
}

/**
 * Log a comment creation
 * @param {string} commentId - ID of the comment
 * @param {string} postId - ID of the post being commented on
 * @param {string} commentContent - Comment text
 * @param {object} postData - Post data with title, etc
 */
export async function logCommentCreated(commentId, postId, commentContent, postData) {
    await logActivity('comment_created', {
        contentId: commentId,
        contentType: 'comment',
        metadata: {
            parentPostId: postId,
            parentPostTitle: postData.title || postData.content?.substring(0, 100) || 'Post',
            contentAuthor: auth.currentUser?.uid,
            summary: commentContent.substring(0, 100)
        }
    });
}

export default {
    logActivity,
    logPostCreated,
    logVoteOnPost,
    logVoteOnProject,
    logProjectCreated,
    logCommentCreated
};
