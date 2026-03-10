"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Sentinel Calculator
      </h1>
      <p className="text-gray-600 mb-6">
        A full-stack calculator with JWT authentication, real-time updates via SignalR, and server-side validation.
      </p>

      {isAuthenticated ? (
        <Link
          href="/my-calculations"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
        >
          Go to My Calculations
        </Link>
      ) : (
        <Link
          href="/login"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
        >
          Sign In to Get Started
        </Link>
      )}
    </main>
  );
}
