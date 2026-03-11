import { auth } from './firebase.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    onAuthStateChanged,
    updateProfile,
    signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { db } from './firebase.js';
import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function register(email, password, username) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });
    
    await setDoc(doc(db, 'users', result.user.uid), {
        username: username,
        email: email,
        bio: '',
        joinedAt: new Date().toISOString(),
        emailVerified: false,
        emailVerificationSentAt: new Date()
    });
    
    // Send email verification through Cloud Function
    try {
        console.log('[Auth] Sending verification email to:', email);
        const response = await fetch('https://us-central1-cloud-beacon-55a40.cloudfunctions.net/sendEmailVerification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                username: username
            })
        });
        
        if (!response.ok) {
            console.warn('[Auth] Verification email failed:', response.statusText);
        } else {
            const result = await response.json();
            console.log('[Auth] ✅ Verification email sent:', result);
        }
    } catch (error) {
        console.error('[Auth] Error sending verification email:', error);
        // Don't throw - allow signup to complete even if email fails
    }
}

export async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified (for new accounts registered after this update)
    const userProfile = await getProfile(result.user.uid);
    if (userProfile && userProfile.emailVerified === false) {
        const confirmed = window.confirm('Your email has not been verified yet. Check your inbox for the verification email. Continue anyway?');
        if (!confirmed) {
            await signOut(auth);
            throw new Error('Email verification required');
        }
    }
}

export async function loginWithCustomToken(customToken) {
    const result = await signInWithCustomToken(auth, customToken);
    return result;
}

export async function loginAsGuest() {
    await signInAnonymously(auth);
}

export async function logout() {
    await signOut(auth);
}

export function watchAuthState(callback) {
    onAuthStateChanged(auth, callback);
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

export async function updateProfileCustomization(customization) {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), customization, { merge: true });
}