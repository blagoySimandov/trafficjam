import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";
import { simulationApi } from "../api/trafficjam-be";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  if (user.email) {
    const backendUser = await simulationApi.syncUser(user.email);
    return { ...result, isAdmin: backendUser.role === "admin", role: backendUser.role };
  }
  return result;
}

export async function createAccountWithCredentials(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  if (user.email) {
    const backendUser = await simulationApi.syncUser(user.email);
    return { ...result, isAdmin: backendUser.role === "admin", role: backendUser.role };
  }
  return result;
}

export async function signInWithCredentials(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  if (user.email) {
    const backendUser = await simulationApi.syncUser(user.email);
    return { ...result, isAdmin: backendUser.role === "admin", role: backendUser.role };
  }
  return result;
}

/**
 * Idempotent function: creates an account if it doesn't exist,
 * otherwise signs in with the provided credentials.
 * Synchronizes user with backend and returns role info.
 */
export async function ensureUserAccount(email: string, password: string) {
  try {
    return await createAccountWithCredentials(email, password);
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      return signInWithCredentials(email, password);
    }
    throw error;
  }
}
