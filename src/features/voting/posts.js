import { db, auth } from '../../../firebase.js';
import { 
    collection,
    addDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    doc,
    deleteDoc,
    updateDoc,
    increment,
    setDoc,
    getDoc
} from '../../core/firebase-sdk.js';
import { handleError } from '../../core/error-handler.js';
import { getDisplayName } from '../../utils/helpers.js';
import { logPostCreated, logVoteOnPost, logCommentCreated } from '../../services/ActivityService.js';


export async function createPost(content, imageData = null, videoEmbed = null, originalAuthorId = null) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const postData = {
            type: 'post',
            content: content,
            authorId: user.uid,
            authorName: getDisplayName(user),
            createdAt: serverTimestamp(),
            votes: 0
        };
        
        // Track if this is a repost
        if (originalAuthorId && originalAuthorId !== user.uid) {
            postData.originalAuthorId = originalAuthorId;
        }

        // Add media if provided
        if (imageData || videoEmbed) {
            postData.media = {};
            if (imageData) postData.media.image = imageData;
            if (videoEmbed) {
                // Try to extract YouTube video ID from standard YouTube URLs
                const youtubeIdMatch = videoEmbed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                if (youtubeIdMatch) {
                    // Valid embeddable YouTube video
                    postData.media.youtube = youtubeIdMatch[1];
                } else {
                    // Not a valid embeddable YouTube link (e.g., Shorts, invalid URL, etc)
                    // Store as a link instead so users can click it
                    postData.media.link = videoEmbed;
                }
            }
        }

        const docRef = await addDoc(collection(db, 'feed'), postData);
        
        // Log activity
        try {
            await logPostCreated(docRef.id, postData);
        } catch (logErr) {
            console.warn('[Posts] Activity logging failed, but post created:', logErr);
        }
        
        // Send repost notification if this is a repost
        if (originalAuthorId && originalAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
            window.NotificationsUI.addNotification('post_reposts', {
                postId: null, // Will be filled by notification system
                userId: user.uid,
                message: `Someone reposted your post`
            }, originalAuthorId);
        }
    } catch (err) {
        handleError(err, 'creating post', { 
            notify: true,
            context: { userId: auth.currentUser?.uid }
        });
    }
}

export async function getPosts() {
    try {
        const q = query(
            collection(db, 'feed'), 
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        handleError(err, 'loading feed', {
            notify: false, // Silent - user sees empty feed
            fallback: []
        });
        return [];
    }
}
export async function voteOnPost(feedId, voteType) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const voteRef = doc(db, 'feed', feedId, 'votes', user.uid);
        const existingVote = await getDoc(voteRef);
        const feedDoc = await getDoc(doc(db, 'feed', feedId));

        // Track if this is a NEW vote (for activity logging)
        const isNewVote = !existingVote.exists() || existingVote.data().type === null;

        if (existingVote.exists()) {
            const previousVote = existingVote.data().type;
            
            if (previousVote === null) {
                await setDoc(voteRef, { type: voteType });
                const change = voteType === 'up' ? 1 : -1;
                await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
            } else if (previousVote === voteType) {
                await setDoc(voteRef, { type: null });
                const change = voteType === 'up' ? -1 : 1;
                await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
            } else {
                await setDoc(voteRef, { type: voteType });
                const change = voteType === 'up' ? 2 : -2;
                await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
            }
        } else {
            await setDoc(voteRef, { type: voteType });
            const change = voteType === 'up' ? 1 : -1;
            await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
        }
        
        // Log activity (only if new vote, not vote changes)
        if (isNewVote) {
            try {
                const postData = feedDoc.data();
                await logVoteOnPost(feedId, voteType, postData);
            } catch (logErr) {
                console.warn('[Posts] Activity logging failed, but vote recorded:', logErr);
            }
        }
        
        // Send notification to post author
        if (feedDoc.exists()) {
            const postAuthorId = feedDoc.data().authorId;
            if (postAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
                window.NotificationsUI.addNotification('post_votes_comments', {
                    postId: feedId,
                    userId: user.uid,
                    message: `${getDisplayName(user)} voted on your post`
                }, postAuthorId);
            }
        }
    } catch (err) {
        handleError(err, 'voting on post', {
            notify: true,
            context: { feedId, voteType }
        });
    }
}

export async function addComment(postId, content) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const commentRef = await addDoc(collection(db, 'feed', postId, 'comments'), {
            content: content,
            authorId: user.uid,
            authorName: getDisplayName(user),
            createdAt: serverTimestamp()
        });
        
        // Log activity
        const feedDoc = await getDoc(doc(db, 'feed', postId));
        if (feedDoc.exists()) {
            try {
                const postData = feedDoc.data();
                await logCommentCreated(commentRef.id, postId, content, postData);
            } catch (logErr) {
                console.warn('[Posts] Activity logging failed, but comment created:', logErr);
            }
            
            // Send notification to post author
            const postAuthorId = feedDoc.data().authorId;
            if (postAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
                window.NotificationsUI.addNotification('post_votes_comments', {
                    postId: postId,
                    userId: user.uid,
                    message: `${getDisplayName(user)} commented on your post`
                }, postAuthorId);
            }
        }
    } catch (err) {
        handleError(err, 'adding comment', {
            notify: true,
            context: { postId }
        });
    }
}


export async function getComments(postId) {
    try {
        const q = query(
            collection(db, 'feed', postId, 'comments'),
            orderBy('createdAt', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        handleError(err, 'loading comments', {
            notify: false,
            fallback: []
        });
        return [];
    }
}

export async function deletePost(postId) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await deleteDoc(doc(db, 'feed', postId));
    } catch (err) {
        handleError(err, 'deleting post', {
            notify: true,
            context: { postId }
        });
        throw err;
    }
}

export async function editPost(postId, content) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await updateDoc(doc(db, 'feed', postId), {
            content: content,
            editedAt: serverTimestamp()
        });
    } catch (err) {
        handleError(err, 'editing post', {
            notify: true,
            context: { postId }
        });
        throw err;
    }
}