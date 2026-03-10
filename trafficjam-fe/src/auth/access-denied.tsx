import { ShieldAlert, LogOut } from "lucide-react";
import { signOut } from "./index";
import styles from "./login-screen.module.css";

export function AccessDenied({ email }: { email: string | null }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <ShieldAlert size={64} color="#f87171" />
        </div>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.subtitle} style={{ marginBottom: "1rem" }}>
          Your account (<strong>{email}</strong>) does not have administrative privileges.
        </p>
        <p className={styles.subtitle} style={{ fontSize: "0.875rem", marginBottom: "2rem" }}>
          Please contact an administrator if you believe this is an error.
        </p>
        
        <button 
          className={styles.googleButton} 
          onClick={() => signOut()}
          style={{ backgroundColor: "#334155", color: "#f8fafc" }}
        >
          <LogOut size={18} />
          <span>Sign out and try another account</span>
        </button>
      </div>
    </div>
  );
}
