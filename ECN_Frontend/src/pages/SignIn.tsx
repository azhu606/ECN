import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://127.0.0.1:5000";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        throw new Error(data?.error || "Invalid email or password");
      }

      // data should be { id, name }
      login(data);
      localStorage.setItem("ecn_user", JSON.stringify(data));

      navigate("/myclubs");
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMessage(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Sign in to Club Nexus
        </h2>

        {errorMessage && (
          <p className="text-center text-red-600 text-sm mb-4">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Email
            </label>
            <Input
              type="text"
              placeholder="Enter your Emory Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#012169] text-white"
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-2">
          <button onClick={() => navigate("/signup")} className="underline">
            No Account? Register for account here:
          </button>
        </p>

        <p className="text-center text-sm text-gray-500 mt-6">
          <button onClick={() => navigate("/")} className="text-[#012169] hover:underline">
            ← Back to homepage
          </button>
        </p>
      </div>
    </div>
  );
}
