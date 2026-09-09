import { useState } from "react";
import { useLocation } from "wouter";
import { setAdminToken } from "../../lib/adminAuth";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { password };
      if (username.trim()) body.username = username.trim();

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Incorrect credentials. Please try again.");
        return;
      }
      const { token } = await res.json();
      setAdminToken(token);
      navigate("/admin/dashboard");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-3">Catwork Cafe</p>
          <h1 className="text-3xl font-['Playfair_Display'] text-[#FDFBF7]">Admin Dashboard</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#FDFBF7]/50 text-xs tracking-widest uppercase mb-2">
              Username <span className="normal-case text-[#FDFBF7]/30">(leave blank for master login)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. staff1"
              autoComplete="username"
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 text-[#FDFBF7] placeholder-white/20 focus:outline-none focus:border-[#D4A373] transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-[#FDFBF7]/50 text-xs tracking-widest uppercase mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 text-[#FDFBF7] placeholder-white/20 focus:outline-none focus:border-[#D4A373] transition-colors text-sm"
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-[#FDFBF7]/20 text-xs">
          Not linked from the public site
        </p>
      </div>
    </div>
  );
}
