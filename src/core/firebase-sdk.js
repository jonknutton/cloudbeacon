/**
 * Firebase SDK Centralization Module
 * 
 * SINGLE SOURCE OF TRUTH for all Firebase SDK imports across the application.
 * 
 * PURPOSE:
 * - Centralize Firebase version management (one place to upgrade)
 * - Prevent duplicate CDN imports
 * - Enable tree-shaking and bundle optimization
 * - Simplify debugging of Firebase-related issues
 * 
 * USAGE:
 * Instead of importing directly from CDN in each file:
 *   import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
 * 
 * Import from this module:
 *   import { collection, getDocs } from './firebase-sdk.js';
 * 
 * ADOPTION GUIDE FOR OTHER DEVELOPERS:
 * 1. Copy this file to your project root (or /lib folder)
 * 2. Only update the version string below if upgrading Firebase
 * 3. Add new Firebase services as needed (see examples)
 * 4. Update all files to import from here instead of CDN URLs
 * 
 * VERSIONING:
 * Current Firebase SDK version: 10.7.1
 * Last updated: February 25, 2026
 * 
 * @module firebase-sdk
 */

/**
 * Firebase Firestore API
 * Core database operations: collections, documents, queries, real-time listeners
 * 
 * EXPORTED FUNCTIONS:
 * - collection(db, path): Get reference to a collection
 * - addDoc(ref, data): Add a new document with auto-generated ID
 * - getDocs(query): Fetch multiple documents matching query
 * - getDoc(docRef): Fetch single document
 * - setDoc(docRef, data, options): Write data to specific document ID
 * - updateDoc(docRef, updates): Update specific fields in document
 * - deleteDoc(docRef): Delete a document
 * - query(collRef, ...constraints): Build complex queries with where, orderBy, limit
 * - where(field, operator, value): Query constraint for filtering
 * - orderBy(field, direction): Query constraint for sorting
 * - limit(n): Query constraint to limit results
 * - increment(n): Atomic counter increment (use in updateDoc)
 * - serverTimestamp(): Server-side timestamp for createdAt, updatedAt fields
 * - doc(db, path): Get reference to specific document
 */
export {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    doc,
    onSnapshot,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Firebase Cloud Storage API
 * File storage operations: uploading, downloading, listing files
 * 
 * EXPORTED FUNCTIONS:
 * - getStorage(): Get reference to storage bucket
 * - ref(storage, path): Get reference to a file/folder
 * - uploadBytes(fileRef, data): Upload file data
 * - uploadBytesResumable(fileRef, data): Upload with progress tracking
 * - getBytes(fileRef, maxSize): Download file data
 * - getDownloadURL(fileRef): Get public download URL for file
 * - listAll(dirRef): List all files/folders in directory
 * - deleteObject(fileRef): Delete a file
 */
export {
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getBytes,
    getDownloadURL,
    listAll,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/**
 * Firebase Authentication API
 * User login, registration, password reset, email verification
 * 
 * NOTE: This module is designed for Firestore/Storage APIs.
 * Authentication imports are centralized in auth.js due to different initialization needs.
 * 
 * See auth.js for:
 * - createUserWithEmailAndPassword()
 * - signInWithEmailAndPassword()
 * - signOut()
 * - sendPasswordResetEmail()
 * - auth state management
 */

/**
 * UPGRADE INSTRUCTIONS
 * 
 * When Firebase SDK releases a new version:
 * 
 * 1. Update the version number in the CDN URLs:
 *    FROM: https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js
 *    TO:   https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js
 * 
 * 2. Update this comment:
 *    Current Firebase SDK version: [new version]
 *    Last updated: [date]
 * 
 * 3. Test thoroughly - all imports in these files will automatically use new version:
 *    - projectpage.js
 *    - profile.js
 *    - projects.js
 *    - posts.js
 *    - app.js
 *    - And any other files that import from './firebase-sdk.js'
 * 
 * 4. No need to update CDN URLs in multiple places!
 * 
 * BENEFITS OF CENTRALIZATION:
 * ✓ Single upgrade point
 * ✓ Version consistency guaranteed
 * ✓ Easier to debug version-related issues
 * ✓ All unused functions can be removed here to reduce bundle size
 * ✓ Clear documentation of what Firebase APIs are in use
 */

/**
 * COMMON PATTERNS
 * 
 * Reading data:
 *   import { collection, getDocs, query, where } from './firebase-sdk.js';
 *   import { db } from './firebase.js';
 *   
 *   const q = query(collection(db, 'posts'), where('published', '==', true));
 *   const snap = await getDocs(q);
 *   const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 * 
 * Writing data:
 *   import { collection, addDoc, serverTimestamp } from './firebase-sdk.js';
 *   import { db, auth } from './firebase.js';
 *   
 *   await addDoc(collection(db, 'posts'), {
 *     title: 'Hello',
 *     author: auth.currentUser.uid,
 *     createdAt: serverTimestamp()
 *   });
 * 
 * Uploading files:
 *   import { getStorage, ref, uploadBytes, getDownloadURL } from './firebase-sdk.js';
 *   
 *   const storage = getStorage();
 *   const fileRef = ref(storage, 'uploads/myfile.jpg');
 *   await uploadBytes(fileRef, fileData);
 *   const url = await getDownloadURL(fileRef);
 */
