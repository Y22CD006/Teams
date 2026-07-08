"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function UpdateProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setEmail(data.user.email || "");
            setName(data.user.name || "");
            setPhoneNumber(data.user.phoneNumber || "");
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      window.location.href = "/login";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold text-white text-center">Complete Your Profile</h1>
        <p className="text-gray-400 text-sm text-center">Please provide your full name and phone number to continue.</p>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-1 opacity-60">
          <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Email (Read-only)</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-[#1F2937] text-gray-400 text-sm rounded-xl px-3 py-2 border border-[#374151] cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            required
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full bg-[#1F2937] text-white text-sm rounded-xl px-3 py-2 border border-[#374151] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            required
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#6366F1] hover:bg-[#5053e1] disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? "Saving..." : "Continue to Teams"}
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            Sign Out instead
          </button>
        </div>
      </form>
    </div>
  );
}
