"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Sign up failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold text-white text-center">Create account</h1>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#6366F1] hover:bg-[#5053e1] text-white py-2 rounded-xl text-sm font-bold transition-all"
        >
          Sign Up
        </button>

        <p className="text-xs text-gray-500 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
