import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

interface SignInProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SignIn({ setIsLoggedIn }: SignInProps) {
  const navigate = useNavigate();
  const [networkID, setNetworkID] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Dummy login
    if (networkID === "testuser" && password === "1234") {
      setIsLoggedIn(true);
      navigate("/myclubs");
    } else {
      setErrorMessage("Sign in with NetID");
      setNetworkID("");
      setPassword("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-100 px-4">
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
              Network ID
            </label>
            <Input
              id="networkID"
              type="text"
              placeholder="Enter your NetID"
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
            className="w-full h-11 bg-[#012169] text-white text-lg rounded-md hover:bg-[#0a2e6e] active:bg-[#001a57] transition-all font-semibold shadow-md"
          >
            Log In
          </Button>
        </form>

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
