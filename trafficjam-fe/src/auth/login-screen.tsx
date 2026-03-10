import { useState } from "react";
import { signInWithGoogle } from "./index";
import styles from "./login-screen.module.css";

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to sign in with Google");
      }
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>TrafficJam</h1>
        <p className={styles.subtitle}>Sign in to start simulating</p>

        <button
          className={styles.googleButton}
          onClick={handleLogin}
          disabled={loading}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
