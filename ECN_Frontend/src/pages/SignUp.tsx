import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.endsWith(".edu")) {
      setErrorMessage("Please register using an Emory (.edu) email.");
      return;
    }

    const code = generateCode();

    navigate("/verify", { state: { email, code } });
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
          <div>
            <label className="block text-gray-800 text-sm font-semibold mb-2">
              Emory Email
            </label>
            <Input
              type="email"
              placeholder="Enter your Emory (.edu) Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md h-11 px-3 text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-[#012169] text-white text-lg rounded-md hover:bg-[#0a2e6e] active:bg-[#001a57] transition-all font-semibold shadow-md"
          >
            Send Verification Email
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
