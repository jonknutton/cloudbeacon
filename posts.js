import { db, auth } from './firebase.js';
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
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


export async function createPost(content, imageData = null, videoEmbed = null, originalAuthorId = null) {
    const user = auth.currentUser;
    if (!user) return;

    const postData = {
        type: 'post',
        content: content,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Guest',
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

    await addDoc(collection(db, 'feed'), postData);
    
    // Send repost notification if this is a repost
    if (originalAuthorId && originalAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
        window.NotificationsUI.addNotification('post_reposts', {
            postId: null, // Will be filled by notification system
            userId: user.uid,
            message: `Someone reposted your post`
        }, originalAuthorId);
    }
}

export async function getPosts() {
    const q = query(
        collection(db, 'feed'), 
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}
export async function voteOnPost(feedId, voteType) {
    const user = auth.currentUser;
    if (!user) return;

    const voteRef = doc(db, 'feed', feedId, 'votes', user.uid);
    const existingVote = await getDoc(voteRef);
    const feedDoc = await getDoc(doc(db, 'feed', feedId));

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
    
    // Send notification to post author
    if (feedDoc.exists()) {
        const postAuthorId = feedDoc.data().authorId;
        if (postAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
            window.NotificationsUI.addNotification('post_votes_comments', {
                postId: feedId,
                userId: user.uid,
                message: `${user.displayName || user.email} voted on your post`
            }, postAuthorId);
        }
    }
}

export async function addComment(postId, content) {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'feed', postId, 'comments'), {
        content: content,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Guest',
        createdAt: serverTimestamp()
    });
    
    // Send notification to post author
    const feedDoc = await getDoc(doc(db, 'feed', postId));
    if (feedDoc.exists()) {
        const postAuthorId = feedDoc.data().authorId;
        if (postAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
            window.NotificationsUI.addNotification('post_votes_comments', {
                postId: postId,
                userId: user.uid,
                message: `${user.displayName || user.email} commented on your post`
            }, postAuthorId);
        }
    }
}


export async function getComments(postId) {
    const q = query(
        collection(db, 'feed', postId, 'comments'),
        orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export async function deletePost(postId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await deleteDoc(doc(db, 'feed', postId));
    } catch (err) {
        console.error('Error deleting post:', err);
        throw err;
    }
}

export async function editPost(postId, content) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await updateDoc(doc(db, 'feed', postId), {
            content: content,
            editedAt: serverTimestamp()
        });
    } catch (err) {
        console.error('Error editing post:', err);
        throw err;
    }
}