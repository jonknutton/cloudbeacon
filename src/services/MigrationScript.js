/**
 * MigrationScript.js
 * One-time backfill to populate activities collection from existing posts/votes
 * 
 * Usage: In browser console, run:
 *   const script = await import('./src/services/MigrationScript.js');
 *   await script.backfillActivities();
 * 
 * Or in Node.js/Firebase CLI context:
 *   node backfill.js
 */

import { db, auth } from '../../firebase.js';
import { 
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    doc,
    getDoc,
    deleteDoc
} from '../core/firebase-sdk.js';

/**
 * Backfill activities collection from existing post data
 * Runs once to populate activities for all existing posts/votes/comments
 */
export async function backfillActivities() {
    console.log('[Migration] Starting activities backfill...');
    
    if (!auth.currentUser) {
        console.error('[Migration] Must be logged in to backfill (requires reading user-specific data)');
        return { error: 'Not logged in' };
    }

    const stats = {
        postsProcessed: 0,
        postsBackfilled: 0,
        votesProcessed: 0,
        votesBackfilled: 0,
        commentsProcessed: 0,
        commentsBackfilled: 0,
        errors: []
    };

    try {
        // 1. Backfill post_created activities
        console.log('[Migration] Step 1: Processing posts...');
        const postsSnap = await getDocs(collection(db, 'feed'));
        
        for (const postDoc of postsSnap.docs) {
            try {
                const post = postDoc.data();
                stats.postsProcessed++;
                
                if (!post.authorId) {
                    console.warn('[Migration] Post missing authorId:', postDoc.id);
                    continue;
                }

                // Check if activity already exists (to avoid duplicates)
                const existingActivity = await getDocs(
                    query(
                        collection(db, 'users', post.authorId, 'activities'),
                        where('contentId', '==', postDoc.id),
                        where('type', '==', 'post_created')
                    )
                );

                if (existingActivity.size === 0) {
                    // Create activity record
                    await addDoc(collection(db, 'users', post.authorId, 'activities'), {
                        type: 'post_created',
                        contentId: postDoc.id,
                        contentType: post.type || 'post',
                        timestamp: post.createdAt || serverTimestamp(),
                        metadata: {
                            contentTitle: post.title || post.content?.substring(0, 100) || 'Post',
                            contentAuthor: post.authorId,
                            summary: post.description || post.content?.substring(0, 100) || 'Posted'
                        }
                    });
                    stats.postsBackfilled++;
                    console.log(`[Migration] ✓ Post activity created: ${postDoc.id}`);
                }
            } catch (err) {
                console.error('[Migration] Error processing post:', err);
                stats.errors.push({ type: 'post', id: postDoc.id, error: err.message });
            }
        }
        console.log(`[Migration] Posts: ${stats.postsBackfilled}/${stats.postsProcessed} activities created`);

        // 2. Backfill voted_on_post activities
        console.log('[Migration] Step 2: Processing votes...');
        for (const postDoc of postsSnap.docs) {
            try {
                const votesSnap = await getDocs(collection(db, 'feed', postDoc.id, 'votes'));
                const post = postDoc.data();
                
                for (const voteDoc of votesSnap.docs) {
                    try {
                        stats.votesProcessed++;
                        const vote = voteDoc.data();
                        
                        if (!vote.type || vote.type === null) continue; // Skip null/removed votes
                        
                        const userId = voteDoc.id; // Document ID is the user ID
                        
                        // Check if activity already exists
                        const existingActivity = await getDocs(
                            query(
                                collection(db, 'users', userId, 'activities'),
                                where('contentId', '==', postDoc.id),
                                where('type', '==', 'voted_on_post')
                            )
                        );

                        if (existingActivity.size === 0) {
                            await addDoc(collection(db, 'users', userId, 'activities'), {
                                type: 'voted_on_post',
                                contentId: postDoc.id,
                                contentType: post.type || 'post',
                                timestamp: vote.timestamp || serverTimestamp(),
                                metadata: {
                                    contentTitle: post.title || post.content?.substring(0, 100) || 'Post',
                                    contentAuthor: post.authorId,
                                    voteType: vote.type,
                                    summary: `Voted ${vote.type} on "${post.title || 'post'}"`
                                }
                            });
                            stats.votesBackfilled++;
                            console.log(`[Migration] ✓ Vote activity created: ${userId} → ${postDoc.id}`);
                        }
                    } catch (err) {
                        console.error('[Migration] Error processing vote:', err);
                        stats.errors.push({ type: 'vote', postId: postDoc.id, error: err.message });
                    }
                }
            } catch (err) {
                console.error('[Migration] Error reading votes for post:', err);
            }
        }
        console.log(`[Migration] Votes: ${stats.votesBackfilled}/${stats.votesProcessed} activities created`);

        // 3. Backfill comment_created activities
        console.log('[Migration] Step 3: Processing comments...');
        for (const postDoc of postsSnap.docs) {
            try {
                const commentsSnap = await getDocs(collection(db, 'feed', postDoc.id, 'comments'));
                const post = postDoc.data();
                
                for (const commentDoc of commentsSnap.docs) {
                    try {
                        stats.commentsProcessed++;
                        const comment = commentDoc.data();
                        
                        if (!comment.authorId) continue;
                        
                        // Check if activity already exists
                        const existingActivity = await getDocs(
                            query(
                                collection(db, 'users', comment.authorId, 'activities'),
                                where('contentId', '==', commentDoc.id),
                                where('type', '==', 'comment_created')
                            )
                        );

                        if (existingActivity.size === 0) {
                            await addDoc(collection(db, 'users', comment.authorId, 'activities'), {
                                type: 'comment_created',
                                contentId: commentDoc.id,
                                contentType: 'comment',
                                timestamp: comment.createdAt || serverTimestamp(),
                                metadata: {
                                    parentPostId: postDoc.id,
                                    parentPostTitle: post.title || post.content?.substring(0, 100) || 'Post',
                                    contentAuthor: comment.authorId,
                                    summary: comment.content?.substring(0, 100) || 'Commented'
                                }
                            });
                            stats.commentsBackfilled++;
                            console.log(`[Migration] ✓ Comment activity created: ${comment.authorId} → ${postDoc.id}`);
                        }
                    } catch (err) {
                        console.error('[Migration] Error processing comment:', err);
                        stats.errors.push({ type: 'comment', postId: postDoc.id, error: err.message });
                    }
                }
            } catch (err) {
                console.error('[Migration] Error reading comments for post:', err);
            }
        }
        console.log(`[Migration] Comments: ${stats.commentsBackfilled}/${stats.commentsProcessed} activities created`);

        // 4. Backfill bid_created activities
        console.log('[Migration] Step 4: Processing bids...');
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const bidStats = { processed: 0, backfilled: 0 };
        
        for (const projectDoc of projectsSnap.docs) {
            try {
                const projectId = projectDoc.id;
                const tasksSnap = await getDocs(collection(db, 'projects', projectId, 'plan_tasks'));
                
                for (const taskDoc of tasksSnap.docs) {
                    try {
                        const taskId = taskDoc.id;
                        const taskData = taskDoc.data();
                        const bidsSnap = await getDocs(collection(db, 'projects', projectId, 'plan_tasks', taskId, 'bids'));
                        
                        for (const bidDoc of bidsSnap.docs) {
                            try {
                                bidStats.processed++;
                                const bid = bidDoc.data();
                                
                                if (!bid.bidderEmail) continue; // Skip invalid bids
                                
                                // Get user ID from email (search users collection)
                                const usersSnap = await getDocs(
                                    query(collection(db, 'users'), where('email', '==', bid.bidderEmail))
                                );
                                
                                if (usersSnap.empty) {
                                    console.warn('[Migration] No user found for email:', bid.bidderEmail);
                                    continue;
                                }
                                
                                const userId = usersSnap.docs[0].id;
                                
                                // Check if activity already exists
                                const existingActivity = await getDocs(
                                    query(
                                        collection(db, 'users', userId, 'activities'),
                                        where('contentId', '==', bidDoc.id),
                                        where('type', '==', 'bid_created')
                                    )
                                );

                                if (existingActivity.size === 0) {
                                    const bidAmount = bid.amount || 0;
                                    const taskName = taskData.name || 'Unnamed';
                                    
                                    await addDoc(collection(db, 'users', userId, 'activities'), {
                                        type: 'bid_created',
                                        contentId: bidDoc.id,
                                        contentType: 'bid',
                                        timestamp: bid.createdAt || serverTimestamp(),
                                        metadata: {
                                            projectId: projectId || '',
                                            projectTitle: projectDoc.data()?.title || 'Project',
                                            taskId: taskId || '',
                                            taskName: taskName,
                                            bidAmount: bidAmount,
                                            bidderName: bid.bidderName || 'Unknown',
                                            summary: `Bid £${bidAmount} on task "${taskName}"`
                                        }
                                    });
                                    bidStats.backfilled++;
                                    console.log(`[Migration] ✓ Bid activity created: ${userId} → ${bidDoc.id}`);
                                }
                            } catch (err) {
                                console.error('[Migration] Error processing bid:', err);
                                stats.errors.push({ type: 'bid', bidId: bidDoc.id, error: err.message });
                            }
                        }
                    } catch (err) {
                        console.error('[Migration] Error reading bids for task:', err);
                    }
                }
            } catch (err) {
                console.error('[Migration] Error reading tasks for project:', err);
            }
        }
        console.log(`[Migration] Bids: ${bidStats.backfilled}/${bidStats.processed} activities created`);

        console.log('[Migration] ✅ Backfill complete!');
        console.log('[Migration] Summary:', stats);
        console.log('[Migration] Bid Summary:', bidStats);
        
        return { ...stats, bids: bidStats };

    } catch (err) {
        console.error('[Migration] Fatal error:', err);
        stats.errors.push({ type: 'fatal', error: err.message });
        return stats;
    }
}

/**
 * Clear all activities (use with caution - for cleanup/retesting)
 */
export async function clearActivities(userId) {
    console.warn('[Migration] ⚠️ About to clear activities for user:', userId);
    
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Can only clear own activities');
    }

    const activitiesRef = collection(db, 'users', userId, 'activities');
    const snap = await getDocs(activitiesRef);
    
    let deleted = 0;
    for (const doc of snap.docs) {
        await deleteDoc(doc.ref);
        deleted++;
    }
    
    console.log('[Migration] Deleted', deleted, 'activity records');
    return deleted;
}

export default {
    backfillActivities,
    clearActivities
};
