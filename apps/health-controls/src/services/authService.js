import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import { auth } from '../lib/firebase';

// Operator ID mapped to a Firebase email alias.
// This is an identifier, not a password.
const OPERATOR_USER_ID = 'el_project';
const OPERATOR_EMAIL = 'el_project@autopack.example.com';

/**
 * Sign in the operator using Firebase Authentication.
 *
 * The password is entered by the operator and verified by Firebase.
 * It is never stored in this file.
 */
export async function login(userId, password) {
  const normalizedUserId = userId.trim().toLowerCase();

  if (normalizedUserId !== OPERATOR_USER_ID || !password) {
    throw new Error('Invalid User ID or Password.');
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    OPERATOR_EMAIL,
    password
  );

  return credential.user;
}

/**
 * Sign out the currently authenticated operator.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Listen for Firebase authentication state changes.
 * Returns an unsubscribe function.
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}