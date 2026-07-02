"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState({ term: "", courses: [] });
  const [loading, setLoading] = useState(true);
  
  const [newClassNumber, setNewClassNumber] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newTime, setNewTime] = useState("");
  const [notifyType, setNotifyType] = useState("discord");
  const [notifyTarget, setNotifyTarget] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/courses");
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    // Simple client-side auth check
    const auth = localStorage.getItem("sniper_auth");
    if (auth !== "authenticated") {
      router.push("/");
    } else {
      fetchData();
    }
  }, [router]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          classNumber: newClassNumber, 
          title: newTitle,
          notes: newNotes,
          time: newTime,
          notifyType,
          notifyTarget
        }),
      });

      const json = await res.json();
      
      if (res.ok) {
        setData({ ...data, courses: json.courses });
        setNewClassNumber("");
        setNewTitle("");
        setNewNotes("");
        setNewTime("");
        setNotifyTarget("");
      } else {
        setError(json.error || "Failed to add course");
      }
    } catch (err) {
      setError("An error occurred");
    }
  };

  const handleRemoveCourse = async (classNumber) => {
    try {
      const res = await fetch(`/api/courses?classNumber=${classNumber}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        const json = await res.json();
        setData({ ...data, courses: json.courses });
      }
    } catch (err) {
      console.error("Failed to remove course", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sniper_auth");
    router.push("/");
  };

  if (loading) return <div className="full-page"><div className="glass-panel">Loading tracker...</div></div>;

  return (
    <div className="container">
      <div className="dashboard-header animate-in">
        <div>
          <h1>Sniper Dashboard</h1>
          <p>Active Term: <strong style={{ color: "white" }}>{data.term}</strong></p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="glass-panel animate-in delay-1" style={{ marginBottom: "4rem" }}>
        <h2>Track a New Class</h2>
        <form onSubmit={handleAddCourse} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="form-group">
            <label>Class Number (5 digits)</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. 17020" 
              value={newClassNumber}
              onChange={(e) => setNewClassNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Title of Class</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. Intro to CS" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Optional Notes</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. Need this for major" 
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Time (Optional)</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. 1-1:50 MWTHF" 
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Notification Method</label>
            <select 
              className="glass-input" 
              value={notifyType}
              onChange={(e) => setNotifyType(e.target.value)}
            >
              <option value="discord">Discord Webhook</option>
              <option value="email">Email Address</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target (Webhook URL or Email)</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder={notifyType === 'discord' ? "https://discord.com/api/webhooks/..." : "friend@example.com"} 
              value={notifyTarget}
              onChange={(e) => setNotifyTarget(e.target.value)}
              required
            />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "1rem" }}>
            <button type="submit" className="btn">Add to Tracker</button>
            {error && <span style={{ color: "var(--danger)", fontWeight: 500 }}>{error}</span>}
          </div>
        </form>
      </div>

      <div className="animate-in delay-2">
        <h2 style={{ marginBottom: "2rem" }}>Currently Tracking ({data.courses.length})</h2>
        <div className="course-grid">
          {data.courses.map((c, i) => (
            <div key={i} className="glass-panel course-card">
              <div className="course-header" style={{ alignItems: "flex-start" }}>
                <div className="course-badge">#{c.classNumber}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div className="course-comment">{c.title || "Untitled Course"}</div>
                  {c.time && <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>{c.time}</div>}
                  {c.notes && <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>{c.notes}</div>}
                </div>
              </div>
              
              <div style={{ flexGrow: 1, display: "flex", alignItems: "flex-end", margin: "1rem 0" }}>
                <div className="course-target-pill">
                  <span className="pill-icon" style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600 }}>
                    {c.notifyType === 'discord' ? 'Discord:' : 'Email:'}
                  </span>
                  <span>{c.notifyTarget}</span>
                </div>
              </div>

              <button className="btn btn-danger" style={{ width: "100%" }} onClick={() => handleRemoveCourse(c.classNumber)}>
                Stop Tracking
              </button>
            </div>
          ))}
          {data.courses.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No classes being tracked</h3>
              <p>Add your first class above to start sniping!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
