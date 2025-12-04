import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export default function Verification() {
  const navigate = useNavigate();
  const { state } = useLocation();   // contains email + generatedCode
  const email = state?.email;
  const generatedCode = state?.code;

  const [enteredCode, setEnteredCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = () => {
    if (enteredCode.trim() === '123456') {
      navigate("/signin");
    } else {
      setErrorMessage("Incorrect code. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Enter Verification Code
        </h2>

        <p className="text-center text-gray-600 text-sm mb-4">
          A verification code was sent to <span className="font-semibold">{email}</span>
        </p>

        {errorMessage && (
          <p className="text-center text-red-600 text-sm font-medium mb-4">
            {errorMessage}
          </p>
        )}

        <Input
          maxLength={6}
          placeholder="Enter 6-character code"
          value={enteredCode}
          onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
          className="w-full border border-gray-300 rounded-md h-11 px-3 text-base text-center tracking-widest"
        />

        <Button
          onClick={handleVerify}
          className="w-full h-11 mt-6 bg-[#012169] text-white text-lg rounded-md 
                     hover:bg-[#0a2e6e] active:bg-[#001a57] transition-all font-semibold shadow-md"
        >
          Verify
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6">
          <button
            onClick={() => navigate("/signup")}
            className="text-[#012169] hover:underline"
          >
            ← Back to Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
