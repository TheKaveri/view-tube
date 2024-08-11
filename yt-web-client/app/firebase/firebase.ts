// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { 
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User
 } from "firebase/auth";

 import { getFunctions } from "firebase/functions";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAEEHDC8vxL1K4aXliP0GI4gBHl7KBiFvA",
  authDomain: "view-tube-7a2f1.firebaseapp.com",
  projectId: "view-tube-7a2f1",
  appId: "1:746211879909:web:54623f78927afe644edd0c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export const functions = getFunctions();

/**
 * Signs the user in with a Google popup.
 * @returns A promise that resolves with the user's credentials.
 */
export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
    // can also use new GithubAuthProvider()
}

/**
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */
export function signOut() {
    return auth.signOut();
}

/**
 * Trigger a callback when user auth state changes.
 * @returns A function to unsubscribe callback.
 */
export function onAuthStateChangeHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
    // The helper function sets up a listener to trigger a callback
    // function whenever the authentication state of the user changes
    // State changes include things like signing in, signing out, changes
    // in user information.

    // The function returns an unsubscribe function to stop the listener
    // from listening to further authentication state changes.
}