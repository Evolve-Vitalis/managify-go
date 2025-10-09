import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api";




export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const hasCalledRef = useRef(false); 
  const token = searchParams.get("token");

  console.log("Token from URL:", token);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }


    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    api.get(`/users/verify-email`, { params: { token } })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified! You can now log in.");
      })
      .catch((error) => {
        setStatus("error");
        console.log(error);
        setMessage(
          error.response?.data?.message || "Verification failed."
        );
      });
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Email Verification</h1>
        {status === "loading" && <p className="mb-4 text-center">Verifying your email...</p>}
        {status !== "loading" && (
          <p className={`mb-4 text-center ${status === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}