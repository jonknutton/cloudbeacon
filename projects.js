import { db, auth } from './firebase.js';
import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    doc,
    orderBy,
    query,
    serverTimestamp,
    increment,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function createProject(title, category, overview, isPublic, headerImageData = null, isProposal = false) {
    const user = auth.currentUser;
    if (!user) return;

    const project = await addDoc(collection(db, 'projects'), {
        title,
        category,
        description: overview,
        isPublic,
        isProposal: isProposal,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Guest',
        createdAt: serverTimestamp(),
        votes: 0,
        type: 'project',
        status: 'Active',
        headerPictureUrl: headerImageData || null
    });

    await addDoc(collection(db, 'feed'), {
        type: 'project',
        projectId: project.id,
        title,
        category,
        description: overview,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Guest',
        createdAt: serverTimestamp(),
        votes: 0,
        headerPictureUrl: headerImageData || null,
        isProposal: isProposal
    });

    // Add the creator to the team as a sponsor
    await setDoc(doc(db, 'projects', project.id, 'team', user.uid), {
        uid: user.uid,
        username: user.displayName || user.email || 'Guest',
        email: user.email,
        role: 'Sponsor',
        external: false,
        addedAt: serverTimestamp()
    });

    // Back-reference on their user doc
    await setDoc(doc(db, 'users', user.uid, 'projects', project.id), {
        projectId: project.id,
        title,
        type: 'project',
        role: 'Sponsor',
        addedAt: serverTimestamp()
    });

    return project.id;
}

export async function getProject(projectId) {
    const snapshot = await getDoc(doc(db, 'projects', projectId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

// Fetch a single feed item by its feed doc ID (used for legislation)
export async function getFeedItem(feedId) {
    const snapshot = await getDoc(doc(db, 'feed', feedId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function voteOnProject(projectId, feedId, voteType) {
    const user = auth.currentUser;
    if (!user) return;

    // Check if project is archived
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (projectDoc.exists() && projectDoc.data().archived) {
        alert('Cannot vote on archived projects.');
        return;
    }

    const project = projectDoc.data();
    const projectOwnerId = project?.ownerId;
    const isNewVote = !await getDoc(doc(db, 'projects', projectId, 'votes', user.uid)).then(d => d.exists());

    const voteRef = doc(db, 'projects', projectId, 'votes', user.uid);
    const existingVote = await getDoc(voteRef);

    if (existingVote.exists()) {
        const previousVote = existingVote.data().type;

        if (previousVote === null) {
            await setDoc(voteRef, { type: voteType });
            const change = voteType === 'up' ? 1 : -1;
            await updateDoc(doc(db, 'projects', projectId), { votes: increment(change) });
            if (feedId) await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
            
            // Send notification on new vote
            if (projectOwnerId && projectOwnerId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
              window.NotificationsUI.addNotification('project_votes', {
                projectId: projectId,
                userId: user.uid,
                message: `Someone voted on your project`
              }, projectOwnerId);
            }
        } else if (previousVote === voteType) {
            await setDoc(voteRef, { type: null });
            const change = voteType === 'up' ? -1 : 1;
            await updateDoc(doc(db, 'projects', projectId), { votes: increment(change) });
            if (feedId) await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
        } else {
            await setDoc(voteRef, { type: voteType });
            const change = voteType === 'up' ? 2 : -2;
            await updateDoc(doc(db, 'projects', projectId), { votes: increment(change) });
            if (feedId) await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
        }
    } else {
        await setDoc(voteRef, { type: voteType });
        const change = voteType === 'up' ? 1 : -1;
        await updateDoc(doc(db, 'projects', projectId), { votes: increment(change) });
        if (feedId) await updateDoc(doc(db, 'feed', feedId), { votes: increment(change) });
        
        // Send notification on first vote
        if (projectOwnerId && projectOwnerId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
          window.NotificationsUI.addNotification('project_votes', {
            projectId: projectId,
            userId: user.uid,
            message: `Someone voted on your project`
          }, projectOwnerId);
        }
    }
}

// Vote directly on a feed item (used for legislation)
export async function voteOnFeedItem(feedId, voteType) {
    const user = auth.currentUser;
    if (!user) return;

    const feedItemDoc = await getDoc(doc(db, 'feed', feedId));
    const feedItem = feedItemDoc.data();
    const feedAuthorId = feedItem?.authorId;

    const voteRef = doc(db, 'feed', feedId, 'votes', user.uid);
    const existingVote = await getDoc(voteRef);

    if (existingVote.exists()) {
        const previousVote = existingVote.data().type;

        if (previousVote === null) {
            await setDoc(voteRef, { type: voteType });
            await updateDoc(doc(db, 'feed', feedId), { votes: increment(voteType === 'up' ? 1 : -1) });
            
            // Send notification on new vote
            if (feedAuthorId && feedAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
              window.NotificationsUI.addNotification('project_votes', {
                projectId: feedId,
                userId: user.uid,
                message: `Someone voted on your content`
              }, feedAuthorId);
            }
        } else if (previousVote === voteType) {
            await setDoc(voteRef, { type: null });
            await updateDoc(doc(db, 'feed', feedId), { votes: increment(voteType === 'up' ? -1 : 1) });
        } else {
            await setDoc(voteRef, { type: voteType });
            await updateDoc(doc(db, 'feed', feedId), { votes: increment(voteType === 'up' ? 2 : -2) });
        }
    } else {
        await setDoc(voteRef, { type: voteType });
        await updateDoc(doc(db, 'feed', feedId), { votes: increment(voteType === 'up' ? 1 : -1) });
        
        // Send notification on first vote
        if (feedAuthorId && feedAuthorId !== user.uid && typeof window.NotificationsUI !== 'undefined') {
          window.NotificationsUI.addNotification('project_votes', {
            projectId: feedId,
            userId: user.uid,
            message: `Someone voted on your content`
          }, feedAuthorId);
        }
    }
}

export async function getFeed() {
    const q = query(
        collection(db, 'feed'),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getProfile(uid) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? snapshot.data() : null;
}

export async function updateBio(bio) {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { bio: bio }, { merge: true });
}