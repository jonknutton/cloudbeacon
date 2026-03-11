import { db, auth } from '../../../firebase.js';
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
    updateDoc,
    where
} from '../../core/firebase-sdk.js';
import { handleError } from '../../core/error-handler.js';
import { getDisplayName } from '../../utils/helpers.js';

export async function createProject(title, category, overview, isPublic, headerImageData = null, isProposal = false) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const project = await addDoc(collection(db, 'projects'), {
            title,
            category,
            description: overview,
            isPublic,
            isProposal: isProposal,
            ownerId: user.uid,
            ownerName: getDisplayName(user),
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
            authorName: getDisplayName(user),
            createdAt: serverTimestamp(),
            votes: 0,
            headerPictureUrl: headerImageData || null,
            isProposal: isProposal
        });

        // Add the creator to the team as a sponsor
        await setDoc(doc(db, 'projects', project.id, 'team', user.uid), {
            uid: user.uid,
            username: getDisplayName(user),
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
    } catch (err) {
        handleError(err, 'creating project', {
            notify: true,
            context: { title, category }
        });
        return null;
    }
}

export async function getProject(projectId) {
    try {
        const snapshot = await getDoc(doc(db, 'projects', projectId));
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (err) {
        handleError(err, 'fetching project', {
            notify: false,
            fallback: null,
            context: { projectId }
        });
        return null;
    }
}

// Fetch a single feed item by its feed doc ID (used for legislation)
export async function getFeedItem(feedId) {
    try {
        const snapshot = await getDoc(doc(db, 'feed', feedId));
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (err) {
        handleError(err, 'fetching feed item', {
            notify: false,
            fallback: null,
            context: { feedId }
        });
        return null;
    }
}

export async function voteOnProject(projectId, feedId, voteType) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Check if project is archived
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists() && projectDoc.data().archived) {
            handleError(new Error('Project is archived'), 'voting on project', { notify: true });
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
    } catch (err) {
        handleError(err, 'voting on project', {
            notify: true,
            context: { projectId, feedId, voteType }
        });
    }
}

// Vote directly on a feed item (used for legislation)
export async function voteOnFeedItem(feedId, voteType) {
    try {
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
    } catch (err) {
        handleError(err, 'voting on feed item', {
            notify: true,
            context: { feedId, voteType }
        });
    }
}

export async function getFeed() {
    try {
        const q = query(
            collection(db, 'feed'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        handleError(err, 'fetching feed', {
            notify: false,
            fallback: [],
            context: {}
        });
        return [];
    }
}

/**
 * Find a project by title (used to link bills to projects)
 */
export async function findProjectByTitle(title) {
    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('title', '==', title));
        const snapshot = await getDocs(q);
        
        if (snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error finding project by title:', error);
        return null;
    }
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