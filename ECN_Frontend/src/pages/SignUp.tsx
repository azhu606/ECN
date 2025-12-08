import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!email.endsWith(".edu")) {
      setErrorMessage("Please register using an Emory (.edu) email.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage("Please enter and confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        // Try to read error message from backend if provided
        let msg = "Failed to create account. Please try again.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore JSON parse errors, keep default message
        }
        setErrorMessage(msg);
        setIsSubmitting(false);
        return;
      }

      // Registration success — go back to Sign In
      navigate("/signin", { state: { registeredEmail: email } });
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to connect to the server. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Create Account
        </h2>

        {errorMessage && (
          <p className="text-center text-red-600 text-sm font-medium mb-4">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* NAME FIELD */}
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md h-11 px-3 text-base"
            />
          </div>

          {/* EMAIL FIELD */}
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Emory Email
            </label>
            <Input
              type="email"
              placeholder="Enter your Emory (.edu) Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD FIELD */}
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Create Password
            </label>
            <Input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md h-11 px-3 text-base"
            />
          </div>

          {/* CONFIRM PASSWORD FIELD */}
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md h-11 px-3 text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#012169] text-white text-lg rounded-md hover:bg-[#0a2e6e] active:bg-[#001a57] transition-all font-semibold shadow-md disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <button
            onClick={() => navigate("/signin")}
            className="text-[#012169] hover:underline"
          >
            ← Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
