import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AccessLog } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: Required database mapping */
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Error diagnostic helper as specified in guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'mock-id',
      email: auth.currentUser?.email || 'mock-email@example.com',
      emailVerified: auth.currentUser?.emailVerified || true,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Payload: ', JSON.stringify(errInfo));
  // To avoid breaking layout, we throw but we log cleanly.
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection as mandated by the Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

// Write audit logs safely
export async function createAuditLog(log: Omit<AccessLog, 'id' | 'timestamp'>) {
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const completeLog: AccessLog = {
    ...log,
    id: logId,
    timestamp: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'logs', logId);
    await setDoc(docRef, completeLog);
  } catch (error) {
    // If permission fails or offline, fall back to writing to local storage
    console.warn("Could not write Firestore log (offline/demo bypass active). Storing locally.");
    const localLogs = JSON.parse(localStorage.getItem('vidi_vault_local_logs') || '[]');
    localLogs.unshift(completeLog);
    localStorage.setItem('vidi_vault_local_logs', JSON.stringify(localLogs.slice(0, 100)));
  }
}
