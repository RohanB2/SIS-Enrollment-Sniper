"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.setItem("sniper_auth", "authenticated");
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.message || "Invalid password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="full-page">
      {!showLogin ? (
        <div className="glass-panel" style={{ maxWidth: "600px" }}>
          <h1>SIS Course Sniper</h1>
          <p style={{ marginBottom: "2rem" }}>
            Automated enrollment tracking for UVA SIS. Get notified immediately via Discord or Email when a spot opens up in your desired classes.
          </p>
          <button className="btn" onClick={() => setShowLogin(true)}>
            Manage Courses
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ width: "400px" }}>
          <h2>Enter Master Password</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="glass-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: "1rem", marginTop: error ? "0" : "1.5rem" }}>
              <button type="submit" className="btn" style={{ flex: 1 }}>
                Login
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowLogin(false)}>
                Back
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
