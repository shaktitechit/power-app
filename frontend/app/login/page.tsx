"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useLoginMutation } from "@/store/slices/userApiSlice";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { toastHandler } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await toastHandler({
        action: async () => {
          const res = await login({ email, password }).unwrap();

          // store user in redux
          dispatch(setCredentials(res));
        },
        loading: "Signing in...",
        success: "Login successful",
      });

      // redirect after success
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Shakti Powers</h1>
          <p className="text-gray-400 mt-2">Sign in to continue</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            {/* Email */}
            <div>
              <label className="block text-sm mb-2">Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-green-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-2">Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-green-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-green-700 text-black font-semibold hover:bg-green-600 transition"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 Power Audit System
        </p>
      </div>
    </div>
  );
}
