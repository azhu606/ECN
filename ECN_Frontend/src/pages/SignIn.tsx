import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

interface SignInProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export default function SignIn({ setIsLoggedIn }: SignInProps) {
  const navigate = useNavigate();
  const [networkID, setNetworkID] = useState(""); // email
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!networkID || !password) {
      setErrorMessage("Please enter your Emory (.edu) email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // important: lets browser store the auth cookie
        body: JSON.stringify({
          email: networkID.trim(),
          password: password,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg =
          (data && data.error) ||
          "Sign in failed. Please check your email and password.";
        setErrorMessage(msg);
        setPassword("");
        return;
      }

      // Expecting: { user: { id, name, email, ... } }
      const user = data.user;
      if (!user || !user.id) {
        setErrorMessage("Unexpected response from server: missing user ID.");
        return;
      }

      // ✅ Persist auth info across refresh (frontend side)
      localStorage.setItem("ecnUserId", user.id as string);
      localStorage.setItem("ecnIsLoggedIn", "true");

      // ✅ Update app state
      setIsLoggedIn(true);

      // ✅ Navigate to My Clubs (or wherever)
      navigate("/myclubs");
    } catch (err) {
      console.error("Login error", err);
      setErrorMessage("Network error signing in. Please try again.");
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
          <p className="text-center text-red-600 text-sm font-medium mb-4">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="networkID"
              className="block text-gray-800 text-sm font-semibold mb-2"
            >
              Email
            </label>
            <Input
              id="networkID"
              type="email"
              placeholder="Enter your Emory (.edu) Email"
              value={networkID}
              onChange={(e) => setNetworkID(e.target.value)}
              className="w-full border border-gray-300 rounded-md h-11 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-gray-800 text-sm font-semibold mb-2"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md h-11 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#012169] text-white text-lg rounded-md hover:bg-[#0a2e6e] active:bg-[#001a57] transition-all font-semibold shadow-md disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        {/* SIGN-UP LINK */}
        <p className="text-center text-sm text-gray-500 mt-2">
          <button
            onClick={() => navigate("/signup")}
            className="underline text-gray-700 hover:underline"
          >
            No Account? Register for account here:
          </button>
        </p>

        <p className="text-center text-sm text-gray-500 mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-[#012169] hover:underline"
          >
            ← Back to homepage
          </button>
        </p>
      </div>
    </div>
  );
}
