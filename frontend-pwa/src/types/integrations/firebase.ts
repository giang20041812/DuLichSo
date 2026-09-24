/**
 * Firebase Client SDK Configuration & Authentication Types
 * Tuân thủ AGENTS.md: không dùng any, type chuẩn cho Firebase Auth
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

export interface GoogleAuthResult {
  idToken: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}
