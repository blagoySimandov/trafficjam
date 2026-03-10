import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { simulationApi } from "../api/trafficjam-be";

export interface AuthState {
  user: User | null;
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        try {
          const backendUser = await simulationApi.syncUser(user.email);
          setState({
            user,
            role: backendUser.role,
            isAdmin: backendUser.role === "admin",
            loading: false,
          });
        } catch (error) {
          console.error("Failed to sync user:", error);
          setState({ user, role: null, isAdmin: false, loading: false });
        }
      } else {
        setState({ user: null, role: null, isAdmin: false, loading: false });
      }
    });
  }, []);

  return state;
}
